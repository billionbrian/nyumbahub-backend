const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    plan: {
        type: String,
        enum: ["per_listing", "monthly", "yearly"],
        required: true
    },
    status: {
        type: String,
        enum: ["pending", "completed", "failed"],
        default: "pending"
    }
}, { timestamps: true });

module.exports = mongoose.model("Payment", PaymentSchema);