const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const auth = require("../middleware/auth");
const Payment = require("../models/Payment");
const User = require("../models/User");

router.post("/pay-per-listing", auth, async (req, res) => {
    try {
        // Create payment record (pending)
        const payment = new Payment({
            user: req.user.id,
            amount: 500,
            plan: "per_listing"
        });

        await payment.save();

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency: "usd",
                        product_data: {
                            name: "Property Listing Fee"
                        },
                        unit_amount: 500
                    },
                    quantity: 1
                }
            ],
            mode: "payment",
            success_url: `http://localhost:3000/success?paymentId=${payment._id}`,
            cancel_url: `http://localhost:3000/cancel`
        });

        res.json({ url: session.url });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Payment failed." });
    }
});


router.post("/confirm/:paymentId", async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.paymentId);
        if (!payment) return res.status(404).json({ message: "Payment not found" });

        payment.status = "completed";
        await payment.save();

        // Update user plan
        await User.findByIdAndUpdate(payment.user, {
            plan: payment.plan
        });

        res.json({ message: "Payment confirmed and plan updated." });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error confirming payment." });
    }
});

module.exports = router;