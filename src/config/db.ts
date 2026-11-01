
import "dotenv/config";
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

if (!uri || uri === "your_mongodb_connection_string") {
    throw new Error("MONGODB_URI is not configured!");
}

const client = new MongoClient(uri);

let db: ReturnType<MongoClient["db"]> | null = null;

const connectDB = async () => {
    try {
        if (db) {
            return db;
        }

        await client.connect();

        db = client.db("studiospace");

        console.log("MongoDB connected successfully!");

        return db;
    } catch (error) {
        console.error("MongoDB connection failed:", error);
        process.exit(1);
    }
};

export default connectDB;