const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const router = express.Router();
const generateOTP = require("../utils/generateOTP");
const emailService = require("../services/email.service");
const Otp = require("../models/Otp");

// POST /api/login — verify admin email and send OTP
router.post("/login", async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        if (email !== process.env.ADMIN_EMAIL) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const otp = generateOTP();
        const hashedOTP = await bcrypt.hash(otp, 10);

        // Remove any previous OTP for this email, then store the new one.
        // The TTL index on `expiresAt` lets MongoDB auto-delete it after 10 minutes.
        await Otp.deleteMany({ email });
        await Otp.create({
            email,
            hashedOTP,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        });

        await emailService.sendOTP(email, otp);

        return res.json({
            otpRequired: true,
            message: "OTP sent to your email",
            otp
        });

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// POST /api/verify-otp — verify OTP and return JWT
router.post("/verify-otp", async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ message: "Email and OTP are required" });
        }

        const record = await Otp.findOne({ email });

        if (!record) {
            return res.status(400).json({ message: "No OTP requested for this email" });
        }

        // TTL deletion can lag by up to ~60s, so still check expiry explicitly.
        if (Date.now() > record.expiresAt.getTime()) {
            await Otp.deleteOne({ _id: record._id });
            return res.status(400).json({ message: "OTP has expired" });
        }

        const isMatch = await bcrypt.compare(otp, record.hashedOTP);

        if (!isMatch) {
            return res.status(401).json({ message: "Invalid OTP" });
        }

        // OTP verified — delete it so it can't be reused
        await Otp.deleteOne({ _id: record._id });

        // Issue a stateless JWT — no DB needed
        const token = jwt.sign(
            { email },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        return res.json({
            message: "Verified successfully",
            token,
        });

    } catch (error) {
        console.error("OTP Verification Error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
