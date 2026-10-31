import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import apiRoutes from "./routes/index.routes.js";
import notFound from "./middlewares/not-found.middleware.js";
import errorHandler from "./middlewares/error.middleware.js";

dotenv.config();
const app = express();

app.use(
    cors({
        origin: process.env.CLIENT_URL,
    })
);

app.use(express.json());
app.use("/api", apiRoutes);

app.get("/", (req, res) => {
    res.send("Welcome to StudioSpace API!");
});

app.use(notFound);
app.use(errorHandler);

const PORT = Number(process.env.PORT) || 5000;

const startServer = async () => {
    try {
        await connectDB();

        app.listen(PORT, () => {
            console.log(`StudioSpace server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
};

startServer();