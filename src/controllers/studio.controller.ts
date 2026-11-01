import type { Request, Response } from "express";
import connectDB from "../config/db.js";
import { ObjectId } from "mongodb";

const createStudio = async (req: Request, res: Response) => {
    try {
        const { name, location, price } = req.body;

        if (
            typeof name !== "string" ||
            !name.trim() ||
            typeof location !== "string" ||
            !location.trim() ||
            price === undefined ||
            price === null
        ) {
            res.status(400).json({
                success: false,
                message: "Name, location, and price are required.",
            });
            return;
        }

        if (
            typeof price !== "number" ||
            !Number.isFinite(price) ||
            price <= 0
        ) {
            res.status(400).json({
                success: false,
                message: "Price must be a positive number.",
            });
            return;
        }

        const db = await connectDB();

        const result = await db.collection("studios").insertOne({
            name: name.trim(),
            location: location.trim(),
            price,
            createdAt: new Date(),
        });

        res.status(201).json({
            success: true,
            message: "Studio created successfully!",
            insertedId: result.insertedId,
        });
    } catch (error) {
        console.error("Create studio error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to create studio.",
        });
    }
};

export const getStudios = async (req: Request, res: Response) => {

    try {
        const db = await connectDB();

        const studios = await db.collection("studios").find().toArray();

        res.status(200).json({
            success: true,
            message: "Studios fetched successfully!",
            data: studios,
        });
    } catch (error) {
        console.error("Get studios error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch studios.",
        });
    }
};


export const getStudioById = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;

        if (typeof id !== "string" || !ObjectId.isValid(id)) {
            res.status(400).json({
                success: false,
                message: "Invalid studio ID.",
            });
            return;
        }

        const db = await connectDB();

        const studio = await db.collection("studios").findOne({
            _id: new ObjectId(id),
        });

        if (!studio) {
            res.status(404).json({
                success: false,
                message: "Studio not found.",
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: "Studio fetched successfully!",
            data: studio,
        });
    } catch (error) {
        console.error("Get studio by ID error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch studio.",
        });
    }
};


export const updateStudio = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        if (typeof id !== "string" || !ObjectId.isValid(id)) {
            res.status(400).json({
                success: false,
                message: "Invalid studio ID.",
            });
            return;
        }

        const { name, location, price } = req.body;

        if (
            typeof name !== "string" ||
            !name.trim() ||
            typeof location !== "string" ||
            !location.trim() ||
            price === undefined ||
            price === null
        ) {
            res.status(400).json({
                success: false,
                message: "Name, location, and price are required.",
            });
            return;
        }

        if (
            typeof price !== "number" ||
            !Number.isFinite(price) ||
            price <= 0
        ) {
            res.status(400).json({
                success: false,
                message: "Price must be a positive number.",
            });
            return;
        }

        const db = await connectDB();

        const result = await db.collection("studios").updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    name: name.trim(),
                    location: location.trim(),
                    price,
                    updatedAt: new Date(),
                },
            }
        );

        if (result.matchedCount === 0) {
            res.status(404).json({
                success: false,
                message: "Studio not found.",
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: "Studio updated successfully!",
        });
    } catch (error) {
        console.error("Update studio error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update studio.",
        });
    }
};

export const deleteStudio = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        if (typeof id !== "string" || !ObjectId.isValid(id)) {
            res.status(400).json({
                success: false,
                message: "Invalid studio ID.",
            });
            return;
        }

        const db = await connectDB();

        const result = await db.collection("studios").deleteOne({
            _id: new ObjectId(id),
        });

        if (result.deletedCount === 0) {
            res.status(404).json({
                success: false,
                message: "Studio not found.",
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: "Studio deleted successfully!",
        });
    } catch (error) {
        console.error("Delete studio error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to delete studio.",
        });
    }
};

export default createStudio;