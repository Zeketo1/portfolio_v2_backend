const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const routes = require("./routes/auth.routes");
const projectRoutes = require("./routes/project.routes");
const uploadRoutes = require("./routes/upload.routes");

const app = express();
connectDB();

app.use(cors());
app.use(express.json());
app.use("/api/auth", routes);
app.use("/api/projects", projectRoutes);
app.use("/api/upload", uploadRoutes);

app.listen(3000, () => {
  console.log("Server running on port 3000");
});