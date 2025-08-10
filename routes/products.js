const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Product = require('../models/Product');
const User = require('../models/User');

// Middleware to verify JWT token
const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ message: 'No token, authorization denied' });
        }

        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) {
            return res.status(401).json({ message: 'Token is not valid' });
        }

        req.user = user;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

// @route   GET /api/products
// @desc    Get all products with filters
// @access  Public
router.get('/', async (req, res) => {
    try {
        const { category, location, minPrice, maxPrice, farmer, search } = req.query;
        const filter = {};

        if (category) filter.category = category;
        if (location) filter.location = { $regex: location, $options: 'i' };
        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = parseFloat(minPrice);
            if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
        }
        if (farmer) filter.farmer = farmer;
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const products = await Product.find(filter)
            .populate('farmer', 'name farmName location')
            .sort({ createdAt: -1 })
            .limit(50);

        res.json(products);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/products/:id
// @desc    Get product by ID
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('farmer', 'name farmName location phone');

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.json(product);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/products
// @desc    Create a new product
// @access  Private (Farmers only)
router.post('/', [
    auth,
    body('name').notEmpty().withMessage('Product name is required'),
    body('description').notEmpty().withMessage('Product description is required'),
    body('category').notEmpty().withMessage('Product category is required'),
    body('price').isNumeric().withMessage('Price must be a number'),
    body('unit').notEmpty().withMessage('Price unit is required'),
    body('inventory').isNumeric().withMessage('Inventory must be a number')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        // Check if user is a farmer
        if (req.user.userType !== 'farmer') {
            return res.status(403).json({ message: 'Only farmers can create products' });
        }

        const {
            name, description, category, price, unit, currency, inventory,
            images, specifications, location, deliveryOptions
        } = req.body;

        const product = new Product({
            name,
            description,
            category,
            farmer: req.user.id,
            price: {
                amount: price,
                unit,
                currency: currency || 'INR'
            },
            inventory,
            images: images || [],
            specifications: specifications || {},
            location: location || req.user.location,
            deliveryOptions: deliveryOptions || []
        });

        await product.save();
        await product.populate('farmer', 'name farmName location');

        res.status(201).json(product);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/products/:id
// @desc    Update a product
// @access  Private (Product owner only)
router.put('/:id', [
    auth,
    body('name').optional().notEmpty().withMessage('Product name cannot be empty'),
    body('price').optional().isNumeric().withMessage('Price must be a number'),
    body('inventory').optional().isNumeric().withMessage('Inventory must be a number')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Check if user owns the product
        if (product.farmer.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to update this product' });
        }

        const updateFields = {};
        const allowedFields = ['name', 'description', 'category', 'inventory', 'images', 'specifications', 'deliveryOptions'];

        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                updateFields[field] = req.body[field];
            }
        });

        // Handle price update separately
        if (req.body.price !== undefined) {
            updateFields['price.amount'] = req.body.price;
        }

        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            { $set: updateFields },
            { new: true, runValidators: true }
        ).populate('farmer', 'name farmName location');

        res.json(updatedProduct);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/products/:id
// @desc    Delete a product
// @access  Private (Product owner only)
router.delete('/:id', auth, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Check if user owns the product
        if (product.farmer.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to delete this product' });
        }

        await Product.findByIdAndRemove(req.params.id);
        res.json({ message: 'Product removed' });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/products/farmer/:farmerId
// @desc    Get products by farmer
// @access  Public
router.get('/farmer/:farmerId', async (req, res) => {
    try {
        const products = await Product.find({ farmer: req.params.farmerId })
            .populate('farmer', 'name farmName location')
            .sort({ createdAt: -1 });

        res.json(products);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ message: 'Farmer not found' });
        }
        res.status(500).send('Server Error');
    }
});

module.exports = router; 