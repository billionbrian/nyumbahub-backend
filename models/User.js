const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// =============================
// User Schema
// =============================
const UserSchema = new mongoose.Schema(
{
    name: {
        type: String,
        required: [true, "Name is required"],
        trim: true,
        minlength: 2
    },

    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, "Please use a valid email"]
    },

    phone: {
        type: String,
        required: [true, "Phone number is required"],
        match: [/^2547\d{8}$/, "Phone must be in format 2547XXXXXXXX"]
    },

    password: {
        type: String,
        required: [true, "Password is required"],
        minlength: 6
    },

    role: {
        type: String,
        enum: ["tenant", "landlord"],
        required: true
    },

    plan: {
        type: String,
        enum: ["none", "per_listing", "monthly", "yearly"],
        default: "none"
    }
},
{ timestamps: true }
);

// =============================
// Hash Password Before Saving
// =============================
UserSchema.pre("save", async function () {

    if (!this.isModified("password")) return;

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);

});

// =============================
// Compare Password Method
// =============================
UserSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", UserSchema);