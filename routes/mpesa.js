const express = require("express");
const router = express.Router();
const axios = require("axios");
const moment = require("moment");

const Payment = require("../models/Payment");
const User = require("../models/User");
const auth = require("../middleware/auth");

// 🔐 Generate STK Password
const generateStkPassword = () => {
    const timestamp = moment().format("YYYYMMDDHHmmss");

    const password = Buffer.from(
        `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`
    ).toString("base64");

    return { password, timestamp };
};

// 🔑 Get Access Token
const getAccessToken = async () => {
    const auth = Buffer.from(
        `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
    ).toString("base64");

    const url =
        process.env.MPESA_ENV === "sandbox"
            ? "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"
            : "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";

    const response = await axios.get(url, {
        headers: {
            Authorization: `Basic ${auth}`,
        },
    });

    return response.data.access_token;
};



// 🚀 STK PUSH ROUTE
router.post("/pay", auth, async (req, res) => {
    try {
        const { amount, plan } = req.body;

        const user = await User.findById(req.user.id);

        if (!user.phone) {
            return res.status(400).json({ message: "User phone number is required." });
        }

        const phone = user.phone; // format: 2547XXXXXXXX

        // 1️⃣ Get token
        const accessToken = await getAccessToken();

        // 2️⃣ Generate password
        const { password, timestamp } = generateStkPassword();

        // 3️⃣ STK Push Request
        const url =
            process.env.MPESA_ENV === "sandbox"
                ? "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest"
                : "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest";

        const response = await axios.post(
            url,
            {
                BusinessShortCode: process.env.MPESA_SHORTCODE,
                Password: password,
                Timestamp: timestamp,
                TransactionType: "CustomerPayBillOnline",
                Amount: amount,
                PartyA: phone,
                PartyB: process.env.MPESA_SHORTCODE,
                PhoneNumber: phone,
                CallBackURL: `${process.env.BASE_URL}/api/mpesa/callback`,
                AccountReference: "NyumbaHub",
                TransactionDesc: `Payment for ${plan}`
            },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        // 4️⃣ Save payment (IMPORTANT: include CheckoutRequestID)
        const payment = new Payment({
            user: user._id,
            amount,
            plan,
            status: "pending",
            checkoutRequestID: response.data.CheckoutRequestID
        });

        await payment.save();

        res.json({
            message: "STK Push sent to phone 📲",
            checkoutRequestID: response.data.CheckoutRequestID
        });

    } catch (error) {
        console.error(error.response?.data || error.message);
        res.status(500).json({ message: "M-Pesa STK Push failed." });
    }
});



// 🔁 CALLBACK (VERY IMPORTANT)
router.post("/callback", async (req, res) => {
    try {
        const data = req.body.Body.stkCallback;

        const checkoutRequestID = data.CheckoutRequestID;
        const resultCode = data.ResultCode;

        const payment = await Payment.findOne({ checkoutRequestID });

        if (!payment) {
            return res.status(404).end();
        }

        if (resultCode === 0) {
            // ✅ SUCCESS
            payment.status = "completed";
            await payment.save();

            const user = await User.findById(payment.user);

            // update user plan
            user.plan = payment.plan;
            await user.save();

            console.log("✅ Payment successful");
        } else {
            // ❌ FAILED
            payment.status = "failed";
            await payment.save();

            console.log("❌ Payment failed");
        }

        res.status(200).end();

    } catch (error) {
        console.error(error);
        res.status(500).end();
    }
});



module.exports = router;