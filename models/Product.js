const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        amount: {
            type: Number,
            required: true,
            min: 0
        },
        unit: {
            type: String,
            required: true,
            enum: ['kg', 'g', 'piece', 'dozen', 'bundle']
        },
        currency: {
            type: String,
            default: 'INR'
        }
    },
    category: {
        type: String,
        required: true,
        enum: ['Vegetables', 'Fruits', 'Grains', 'Dairy', 'Poultry', 'Other']
    },
    farmer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    location: {
        type: String,
        required: true
    },
    images: [{
        type: String,
        required: true
    }],
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    totalRatings: {
        type: Number,
        default: 0
    },
    inventory: {
        type: Number,
        required: true,
        min: 0
    },
    isAvailable: {
        type: Boolean,
        default: true
    },
    isOrganic: {
        type: Boolean,
        default: false
    },
    harvestDate: {
        type: Date
    },
    expiryDate: {
        type: Date
    },
    tags: [{
        type: String
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update timestamp on save
productSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Virtual for average rating
productSchema.virtual('averageRating').get(function() {
    return this.totalRatings > 0 ? (this.rating / this.totalRatings).toFixed(1) : 0;
});

// Method to get product details (without sensitive data)
productSchema.methods.getProductDetails = function() {
    const productObject = this.toObject();
    return productObject;
};

// Static method to find products by category
productSchema.statics.findByCategory = function(category) {
    return this.find({ 
        category: category, 
        isAvailable: true 
    }).populate('farmer', 'firstName lastName farmName');
};

// Static method to find products by location
productSchema.statics.findByLocation = function(location) {
    return this.find({ 
        location: new RegExp(location, 'i'), 
        isAvailable: true 
    }).populate('farmer', 'firstName lastName farmName');
};

module.exports = mongoose.model('Product', productSchema); 