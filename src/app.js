const express = require("express");
const app = express();
const authRoutes = require("./routes/authRoutes");
const videoRoutes = require("./routes/videoRoutes");
require("dotenv").config();
const cookieParser = require("cookie-parser");

app.use(express.json());
app.use(cookieParser());
app.use("/api/videos", videoRoutes);
app.use("/api/auth", authRoutes);

module.exports = app;
