const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    userType: {
        type: String,
        required: true,
        enum: ['farmer', 'consumer']
    },
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    phone: {
        type: String,
        required: true
    },
    location: {
        city: {
            type: String,
            required: true
        },
        state: {
            type: String,
            required: true
        },
        pincode: {
            type: String,
            required: true
        }
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    // Farmer-specific fields
    farmName: {
        type: String,
        required: function() { return this.userType === 'farmer'; }
    },
    farmSize: {
        type: Number,
        required: function() { return this.userType === 'farmer'; }
    },
    crops: {
        type: [String],
        required: function() { return this.userType === 'farmer'; }
    },
    // Common fields
    termsAccepted: {
        type: Boolean,
        required: true,
        default: false
    },
    newsletter: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Method to get user profile (without password)
userSchema.methods.getProfile = function() {
    const userObject = this.toObject();
    delete userObject.password;
    return userObject;
};

// Method to get public profile (for API responses)
userSchema.methods.getPublicProfile = function() {
    const userObject = this.toObject();
    delete userObject.password;
    return userObject;
};

module.exports = mongoose.model('User', userSchema); 