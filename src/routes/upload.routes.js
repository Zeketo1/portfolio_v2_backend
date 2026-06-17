const express = require("express");
const multer = require("multer");
const router = express.Router();
const cloudinary = require("../config/cloudinary");

// Keep the uploaded file in memory as a Buffer (no temp files on disk),
// then stream it straight to Cloudinary.
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 5 MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image/")) {
            cb(null, true);
        } else {
            cb(new Error("Only image files are allowed"));
        }
    },
});

// Uploads a Buffer to Cloudinary and resolves with the upload result.
const uploadBufferToCloudinary = (buffer) =>
    new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: "portfolio/projects" },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );
        stream.end(buffer);
    });

// POST /api/upload — accepts a single image file (field name: "file"),
// uploads it to Cloudinary, and returns the hosted image URL.
router.post("/", upload.single("file"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No image file provided" });
        }

        const result = await uploadBufferToCloudinary(req.file.buffer);

        return res.status(201).json({
            url: result.secure_url,
            publicId: result.public_id,
        });
    } catch (error) {
        console.error("Image Upload Error:", error);
        return res.status(500).json({ message: "Image upload failed" });
    }
});

// Handles multer errors with specific, diagnostic messages so the cause is clear.
router.use((err, req, res, next) => {
    if (!err) return next();

    // multer throws a MulterError with a `.code` we can map to a precise reason.
    if (err instanceof multer.MulterError) {
        const reasons = {
            LIMIT_UNEXPECTED_FILE: `Wrong form field name. The server expects the file under the field "file", but received it under "${err.field}". Fix the frontend to use formData.append("file", file).`,
            LIMIT_FILE_SIZE: "File too large. Maximum allowed size is 10 MB.",
            LIMIT_FILE_COUNT: "Too many files. Only one image can be uploaded at a time.",
            LIMIT_PART_COUNT: "Too many parts in the upload request.",
        };

        const message = reasons[err.code] || `Upload error: ${err.message}`;
        console.error(`Multer error [${err.code}] on field "${err.field}":`, err.message);
        return res.status(400).json({ message, code: err.code, field: err.field });
    }

    // Non-multer errors here come from fileFilter (e.g. "Only image files are allowed").
    console.error("Upload rejected:", err.message);
    return res.status(400).json({ message: err.message });
});

module.exports = router;
