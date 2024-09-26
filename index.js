// import express from "express";
// import dotenv from "dotenv";
// import mongoose from "mongoose";
// import cors from "cors";

// // Import Routes
// import classRoutes from "./routes/classRoutes.js";
// import adminRoutes from "./routes/adminRoutes.js";
// import attendanceRoutes from "./routes/attendanceRoutes.js";



// // Load Environment Variables
// dotenv.config();

// // Initialize Express
// const app = express();

// // Middleware
// app.use(cors());
// app.use(express.json());

// // Routes
// app.use("/class", classRoutes);
// app.use("/admin", adminRoutes);
// app.use("/attendance", attendanceRoutes);

// // Database Connection
// mongoose
//   .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
//   .then(() => console.log("Connected to MongoDB"))
//   .catch((err) => console.log(err));

// // Start Server
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
// });


import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import classRoutes from './routes/classRoutes.js'; // Import your routes
import adminRoutes from './routes/adminRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/class', classRoutes);
app.use('/admin', adminRoutes);
app.use('/attendance', attendanceRoutes);

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Connected to Database'))
    .catch(err => console.log(err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
