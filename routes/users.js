const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify JWT token
const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ message: 'No token, authorization denied' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password');
        
        if (!user) {
            return res.status(401).json({ message: 'Token is not valid' });
        }

        req.user = user;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

// @route   GET /api/users/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
    try {
        res.json(req.user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', [
    auth,
    body('name').optional().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('phone').optional().isMobilePhone().withMessage('Please enter a valid phone number'),
    body('location').optional().isLength({ min: 2 }).withMessage('Location must be at least 2 characters')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, phone, location, farmName, farmSize, crops, addresses } = req.body;
        const updateFields = {};

        if (name) updateFields.name = name;
        if (phone) updateFields.phone = phone;
        if (location) updateFields.location = location;

        // Farmer-specific fields
        if (req.user.userType === 'farmer') {
            if (farmName) updateFields.farmName = farmName;
            if (farmSize) updateFields.farmSize = farmSize;
            if (crops) updateFields.crops = crops;
        }

        // Consumer-specific fields
        if (req.user.userType === 'consumer' && addresses) {
            updateFields.addresses = addresses;
        }

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: updateFields },
            { new: true, runValidators: true }
        ).select('-password');

        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/users/farmers
// @desc    Get all farmers (public profiles)
// @access  Public
router.get('/farmers', async (req, res) => {
    try {
        const farmers = await User.find({ userType: 'farmer' })
            .select('name farmName location crops rating')
            .limit(20);
        res.json(farmers);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/users/farmers/:id
// @desc    Get farmer profile by ID
// @access  Public
router.get('/farmers/:id', async (req, res) => {
    try {
        const farmer = await User.findOne({ 
            _id: req.params.id, 
            userType: 'farmer' 
        }).select('-password');

        if (!farmer) {
            return res.status(404).json({ message: 'Farmer not found' });
        }

        res.json(farmer);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ message: 'Farmer not found' });
        }
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/users/profile
// @desc    Delete user account
// @access  Private
router.delete('/profile', auth, async (req, res) => {
    try {
        await User.findByIdAndRemove(req.user.id);
        res.json({ message: 'User account deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router; 