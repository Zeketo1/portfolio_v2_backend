const express = require("express");
const router = express.Router();
const Project = require("../models/Project");
const authMiddleware = require("../middleware/auth");

// GET /api/projects — public: list all projects (newest first)
router.get("/", async (req, res) => {
    try {
        const projects = await Project.find().sort({ createdAt: -1 });
        return res.json(projects);
    } catch (error) {
        console.error("List Projects Error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// GET /api/projects/:id — public: fetch a single project
router.get("/:id", async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        return res.json(project);
    } catch (error) {
        // Invalid ObjectId format throws a CastError
        if (error.name === "CastError") {
            return res.status(400).json({ message: "Invalid project id" });
        }
        console.error("Get Project Error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// POST /api/projects — protected: create a project
router.post("/", async (req, res) => {
    try {
        const { title, category, year, link, image } = req.body;

        const project = await Project.create({ title, category, year, link, image });

        return res.status(201).json(project);
    } catch (error) {
        // Mongoose schema validation (required fields, year format, etc.)
        if (error.name === "ValidationError") {
            const messages = Object.values(error.errors).map((e) => e.message);
            return res.status(400).json({ message: "Validation failed", errors: messages });
        }
        console.error("Create Project Error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// PUT /api/projects/:id — protected: update a project
router.put("/:id", async (req, res) => {
    try {
        const { title, category, year, link, image } = req.body;

        const project = await Project.findByIdAndUpdate(
            req.params.id,
            { title, category, year, link, image },
            { new: true, runValidators: true }
        );

        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        return res.json(project);
    } catch (error) {
        if (error.name === "CastError") {
            return res.status(400).json({ message: "Invalid project id" });
        }
        if (error.name === "ValidationError") {
            const messages = Object.values(error.errors).map((e) => e.message);
            return res.status(400).json({ message: "Validation failed", errors: messages });
        }
        console.error("Update Project Error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// DELETE /api/projects/:id — protected: delete a project
router.delete("/:id", async (req, res) => {
    try {
        const project = await Project.findByIdAndDelete(req.params.id);

        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        return res.json({ message: "Project deleted" });
    } catch (error) {
        if (error.name === "CastError") {
            return res.status(400).json({ message: "Invalid project id" });
        }
        console.error("Delete Project Error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
