require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");


// const authRoutes = require("./routes/authRoutes");
const homeRoutes = require("./routes/homeRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const itemRoutes = require("./routes/itemRoutes");
const deviceRoutes = require("./routes/deviceRoutes");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// app.use("/api/auth", authRoutes);
app.use("/api/homes", homeRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/devices", deviceRoutes);



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
