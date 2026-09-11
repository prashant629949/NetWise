require("dotenv").config();
const express = require('express');
const path = require('path');
const connectDB = require('./database/db');
const authRoutes = require('./routes/auth-routes');
const homeRouter = require('./routes/home-routes');
const imageRouter= require('./routes/image-routes');
const postRoutes = require("./routes/post-routes");
const PORT = process.env.PORT || 3000;
const cors = require("cors");
const app = express();

app.use(cors());

app.use(express.static("public"));
app.use("/uploads",express.static("uploads"))

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/auth",homeRouter);
app.use("/api/image",imageRouter);
app.use("/api/post", postRoutes);


app.get("/", (req, res) => {
    res.sendFile(path.resolve(__dirname, "public", "login.html")); // login page by default
});

app.get("/signup", (req, res) => {
    res.sendFile(path.resolve(__dirname, "public", "signup.html")); // signup page
});

const startServer = async () => {
    await connectDB();
    app.listen(PORT, () => {
        console.log(`server is running on ${PORT}`);
    });
};

startServer();


