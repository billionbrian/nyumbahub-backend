const express = require("express");
const router = express.Router();
const Property = require("../models/Property");
const authMiddleware = require("../middleware/auth");

// Get all properties for this landlord
router.get("/my-properties", authMiddleware, async (req, res) => {
    if (req.user.role !== "landlord") return res.status(403).json({ message: "Access denied" });

    const properties = await Property.find({ landlord: req.user._id });
    res.json(properties);
});

// Increment view count for analytics
router.post("/view/:propertyId", async (req, res) => {
    const property = await Property.findById(req.params.propertyId);
    if (!property) return res.status(404).json({ message: "Property not found" });

    property.analytics.views += 1;
    await property.save();
    res.json({ views: property.analytics.views });
});

module.exports = router;