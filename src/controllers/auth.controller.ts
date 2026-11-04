import type { Request, Response } from "express";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import connectDB from "../config/db.js";
import type { User } from "../types/user.js";

export const loginUser = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        // Check required fields
        if (!email || !password) {
            res.status(400).json({
                success: false,
                message: "Email and password are required.",
            });
            return;
        }

        // Validate input types
        if (
            typeof email !== "string" ||
            typeof password !== "string"
        ) {
            res.status(400).json({
                success: false,
                message: "Invalid input data.",
            });
            return;
        }

        // Validate empty values
        if (!email.trim() || !password.trim()) {
            res.status(400).json({
                success: false,
                message: "Email and password cannot be empty.",
            });
            return;
        }

        // Normalize email
        const normalizedEmail = email.trim().toLowerCase();

        // Connect to database
        const db = await connectDB();

        // Find user by email
        const user = await db.collection<User>("users").findOne({
            email: normalizedEmail,
        });

        // Check if user exists
        if (!user) {
            res.status(401).json({
                success: false,
                message: "Invalid email or password.",
            });
            return;
        }

        // Compare password
        const isPasswordValid = await bcrypt.compare(
            password,
            user.password
        );

        // Check password
        if (!isPasswordValid) {
            res.status(401).json({
                success: false,
                message: "Invalid email or password.",
            });
            return;
        }

        // Get JWT secret
        const jwtSecret = process.env.JWT_SECRET;

        if (!jwtSecret) {
            throw new Error("JWT_SECRET is not configured!");
        }

        // Generate JWT
        const token = jwt.sign(
            {
                userId: user._id?.toString(),
                email: user.email,
            },
            jwtSecret,
            {
                expiresIn: "7d",
            }
        );

        // Set JWT in HTTPOnly cookie
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        // Send login response
        res.status(200).json({
            success: true,
            message: "Login successful!",
            data: {
                userId: user._id,
                name: user.name,
                email: user.email,
            },
        });

    } catch (error) {
        console.error("Login error:", error);

        res.status(500).json({
            success: false,
            message: "Internal Server Error.",
        });
    }
};

export const registerUser = async (req: Request, res: Response) => {
    try {
        const { name, email, password } = req.body;

        // Check required fields
        if (!name || !email || !password) {
            res.status(400).json({
                success: false,
                message: "Name, email, and password are required.",
            });
            return;
        }

        // Validate input types
        if (
            typeof name !== "string" ||
            typeof email !== "string" ||
            typeof password !== "string"
        ) {
            res.status(400).json({
                success: false,
                message: "Invalid input data.",
            });
            return;
        }

        // Validate empty values
        if (!name.trim() || !email.trim() || !password.trim()) {
            res.status(400).json({
                success: false,
                message: "Fields cannot be empty.",
            });
            return;
        }

        // Normalize email
        const normalizedEmail = email.trim().toLowerCase();

        // Connect to database
        const db = await connectDB();

        // Check existing user
        const existingUser = await db.collection<User>("users").findOne({
            email: normalizedEmail,
        });

        if (existingUser) {
            res.status(409).json({
                success: false,
                message: "An account with this email already exists.",
            });
            return;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create new user
        const newUser: User = {
            _id: new ObjectId(),
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            createdAt: new Date(),
        };

        // Save user to database
        const result = await db.collection<User>("users").insertOne(newUser);

        // Send response
        res.status(201).json({
            success: true,
            message: "User registered successfully!",
            data: {
                userId: result.insertedId,
                name: newUser.name,
                email: newUser.email,
            },
        });

    } catch (error) {
        console.error("Register error:", error);

        res.status(500).json({
            success: false,
            message: "Internal Server Error.",
        });
    }
};

export const getMe = (req: Request, res: Response) => {
    res.status(200).json({
        success: true,
        message: "User information retrieved successfully.",
        data: {
            userId: req.user?.userId,
            email: req.user?.email,
        },
    });
};

export const logoutUser = (req: Request, res: Response) => {
    res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
    });

    res.status(200).json({
        success: true,
        message: "Logout successful!",
    });
};