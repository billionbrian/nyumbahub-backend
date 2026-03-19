const express = require("express");
const router = express.Router();
const Property = require("../models/Property");
const auth = require("../middleware/auth"); // JWT middleware
const User = require("../models/User");

// ==============================
// POST new property (Landlord only)
// ==============================
router.post("/", auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (user.role !== "landlord") {
            return res.status(403).json({ message: "Only landlords can post properties." });
        }

        // Optional: Check subscription / plan
        if (user.plan === "none") {
            return res.status(403).json({ message: "You must subscribe or pay per listing to post properties." });
        }

        const { title, description, price, images, available } = req.body;

        if (!title || !description || !price || !images) {
            return res.status(400).json({ message: "All fields are required." });
        }

        const newProperty = new Property({
            landlord: user._id,
            title,
            description,
            price,
            images,
            available: available !== undefined ? available : true,
            validated: false // auto validation flag
        });

        await newProperty.save();
        res.status(201).json(newProperty);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error posting property." });
    }
});

// ==============================
// GET all properties of logged-in landlord
// ==============================
router.get("/my-properties", auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (user.role !== "landlord") {
            return res.status(403).json({ message: "Only landlords can access their properties." });
        }

        const properties = await Property.find({ landlord: user._id });
        res.json(properties);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error fetching properties." });
    }
});

// ==============================
// GET a single property (increment view analytics)
// ==============================
router.get("/:id", async (req, res) => {
    try {
        const property = await Property.findById(req.params.id);
        if (!property) return res.status(404).json({ message: "Property not found." });

        // Increment views
        property.analytics.views += 1;
        await property.save();

        res.json(property);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error fetching property." });
    }
});

// ==============================
// Add rating to property
// ==============================
router.post("/:id/rate", auth, async (req, res) => {
    try {
        const { stars } = req.body;
        if (!stars || stars < 1 || stars > 5) {
            return res.status(400).json({ message: "Stars must be between 1 and 5." });
        }

        const property = await Property.findById(req.params.id);
        if (!property) return res.status(404).json({ message: "Property not found." });

        // Update or add tenant rating
        const existingRatingIndex = property.ratings.findIndex(r => r.tenant.toString() === req.user.id);
        if (existingRatingIndex !== -1) {
            property.ratings[existingRatingIndex].stars = stars;
        } else {
            property.ratings.push({ tenant: req.user.id, stars });
        }

        // Recalculate average rating
        property.rating = property.ratings.reduce((sum, r) => sum + r.stars, 0) / property.ratings.length;

        await property.save();
        res.json(property);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error rating property." });
    }
});

module.exports = router;