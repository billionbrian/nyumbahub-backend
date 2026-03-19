const mongoose = require("mongoose");

// Property Schema
const PropertySchema = new mongoose.Schema({
    landlord: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User", 
        required: true 
    },
    title: { 
        type: String, 
        required: [true, "Property title is required"], 
        trim: true 
    },
    description: { 
        type: String, 
        required: [true, "Property description is required"], 
        trim: true 
    },
    price: { 
        type: Number, 
        required: [true, "Property price is required"], 
        min: [0, "Price cannot be negative"] 
    },
    available: { 
        type: Boolean, 
        default: true 
    },
    images: [{ 
        type: String, 
        trim: true 
    }],
    validated: { 
        type: Boolean, 
        default: false // automated validation flag
    },
    rating: { 
        type: Number, 
        default: 0, 
        min: 0, 
        max: 5 
    },
    ratings: [{
        tenant: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        stars: { type: Number, min: 0, max: 5 }
    }],
    analytics: {
        views: { type: Number, default: 0 },
        inquiries: { type: Number, default: 0 }
    }
}, { timestamps: true });

module.exports = mongoose.model("Property", PropertySchema);