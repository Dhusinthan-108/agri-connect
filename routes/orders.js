const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Order = require('../models/Order');
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

// @route   POST /api/orders
// @desc    Create a new order
// @access  Private
router.post('/', [
    auth,
    body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
    body('items.*.productId').notEmpty().withMessage('Product ID is required'),
    body('items.*.quantity').isNumeric({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('shippingAddress').notEmpty().withMessage('Shipping address is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { items, shippingAddress, paymentMethod, notes } = req.body;

        // Validate products and calculate totals
        let subtotal = 0;
        const orderItems = [];
        const farmers = new Set();

        for (const item of items) {
            const product = await Product.findById(item.productId);
            if (!product) {
                return res.status(404).json({ message: `Product ${item.productId} not found` });
            }

            if (product.inventory < item.quantity) {
                return res.status(400).json({ 
                    message: `Insufficient inventory for ${product.name}. Available: ${product.inventory}` 
                });
            }

            const itemTotal = product.price.amount * item.quantity;
            subtotal += itemTotal;
            farmers.add(product.farmer.toString());

            orderItems.push({
                product: item.productId,
                quantity: item.quantity,
                unit: product.price.unit,
                price: product.price.amount,
                total: itemTotal
            });

            // Update inventory
            await Product.findByIdAndUpdate(item.productId, {
                $inc: { inventory: -item.quantity }
            });
        }

        // Calculate totals
        const deliveryFee = 50; // Fixed delivery charge
        const tax = subtotal * 0.05; // 5% tax
        const total = subtotal + deliveryFee + tax;

        // Generate order number
        const orderNumber = 'ORD' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();

        // For now, create a single order with all items
        // In the future, we can implement multiple orders for different farmers
        const order = new Order({
            orderNumber: orderNumber,
            customer: req.user.id,
            farmer: Array.from(farmers)[0], // Use the first farmer
            items: orderItems,
            subtotal: subtotal,
            deliveryCharge: deliveryFee,
            total: total,
            deliveryAddress: {
                type: 'home',
                addressLine1: shippingAddress.address,
                city: shippingAddress.city,
                state: shippingAddress.state,
                pincode: shippingAddress.pincode
            },
            payment: {
                method: (paymentMethod || 'cod').toLowerCase()
            },
            notes: {
                customer: notes
            },
            status: 'pending'
        });

        await order.save();
        await order.populate([
            { path: 'customer', select: 'firstName lastName email phone' },
            { path: 'farmer', select: 'firstName lastName farmName phone' },
            { path: 'items.product', select: 'name price images' }
        ]);

        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            data: {
                order: order,
                orderNumber: orderNumber
            }
        });
    } catch (err) {
        console.error('Order creation error:', err.message);
        console.error('Error stack:', err.stack);
        res.status(500).json({ 
            message: 'Server Error', 
            error: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
});

// @route   GET /api/orders
// @desc    Get user's orders
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const { status, limit = 20, page = 1 } = req.query;
        const filter = {};

        if (req.user.userType === 'farmer') {
            filter.farmer = req.user.id;
        } else {
            filter.customer = req.user.id;
        }

        if (status) filter.status = status;

        const orders = await Order.find(filter)
            .populate([
                { path: 'customer', select: 'name email phone' },
                { path: 'farmer', select: 'name farmName phone' },
                { path: 'items.product', select: 'name price images' }
            ])
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));

        const total = await Order.countDocuments(filter);

        res.json({
            orders,
            pagination: {
                current: parseInt(page),
                total: Math.ceil(total / parseInt(limit)),
                hasNext: parseInt(page) * parseInt(limit) < total,
                hasPrev: parseInt(page) > 1
            }
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/orders/:id
// @desc    Get order by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate([
                { path: 'customer', select: 'name email phone' },
                { path: 'farmer', select: 'name farmName phone' },
                { path: 'items.product', select: 'name price images description' }
            ]);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Check if user is authorized to view this order
        if (order.customer.toString() !== req.user.id && order.farmer.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to view this order' });
        }

        res.json(order);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ message: 'Order not found' });
        }
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/orders/:id/status
// @desc    Update order status
// @access  Private (Farmer only)
router.put('/:id/status', [
    auth,
    body('status').isIn(['pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled'])
        .withMessage('Invalid status')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Check if user is the farmer for this order
        if (order.farmer.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to update this order' });
        }

        const { status, notes } = req.body;

        order.status = status;
        order.timeline.push({
            status,
            timestamp: new Date(),
            notes: notes || ''
        });

        await order.save();
        await order.populate([
            { path: 'customer', select: 'name email phone' },
            { path: 'farmer', select: 'name farmName phone' },
            { path: 'items.product', select: 'name price images' }
        ]);

        res.json(order);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ message: 'Order not found' });
        }
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/orders/:id/cancel
// @desc    Cancel an order
// @access  Private
router.post('/:id/cancel', auth, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Check if user is authorized to cancel this order
        if (order.customer.toString() !== req.user.id && order.farmer.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to cancel this order' });
        }

        // Check if order can be cancelled
        if (['delivered', 'cancelled'].includes(order.status)) {
            return res.status(400).json({ message: 'Order cannot be cancelled' });
        }

        order.status = 'cancelled';
        order.timeline.push({
            status: 'cancelled',
            timestamp: new Date(),
            notes: req.body.reason || 'Order cancelled by user'
        });

        // Restore inventory if cancelled by customer
        if (order.customer.toString() === req.user.id) {
            for (const item of order.items) {
                await Product.findByIdAndUpdate(item.product, {
                    $inc: { inventory: item.quantity }
                });
            }
        }

        await order.save();
        await order.populate([
            { path: 'customer', select: 'name email phone' },
            { path: 'farmer', select: 'name farmName phone' },
            { path: 'items.product', select: 'name price images' }
        ]);

        res.json(order);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ message: 'Order not found' });
        }
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/orders/:id/rate
// @desc    Rate an order
// @access  Private (Customer only)
router.post('/:id/rate', [
    auth,
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('review').optional().isLength({ max: 500 }).withMessage('Review must be less than 500 characters')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Check if user is the customer for this order
        if (order.customer.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to rate this order' });
        }

        // Check if order is delivered
        if (order.status !== 'delivered') {
            return res.status(400).json({ message: 'Can only rate delivered orders' });
        }

        const { rating, review } = req.body;

        order.rating = rating;
        order.review = review;
        order.ratedAt = new Date();

        await order.save();
        await order.populate([
            { path: 'customer', select: 'name email phone' },
            { path: 'farmer', select: 'name farmName phone' },
            { path: 'items.product', select: 'name price images' }
        ]);

        res.json(order);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ message: 'Order not found' });
        }
        res.status(500).send('Server Error');
    }
});

module.exports = router; 