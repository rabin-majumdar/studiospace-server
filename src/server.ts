import express from "express";
import cors from "cors";
import dotenv from "dotenv";

const app = express();

app.use(
    cors({
        origin: process.env.CLIENT_URL,
    })
);

dotenv.config();
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Welcome to StudioSpace API!");
});

const PORT = Number(process.env.PORT) || 5000;

app.listen(PORT, () => {
    console.log(`StudioSpace server is running on port ${PORT}`);
});