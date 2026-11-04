import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const authMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const token = req.cookies?.token;

    if (!token) {
        res.status(401).json({
            success: false,
            message: "Authentication required. Please log in.",
        });
        return;
    }

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
        res.status(500).json({
            success: false,
            message: "JWT_SECRET is not configured.",
        });
        return;
    }

    try {
        const decoded = jwt.verify(token, jwtSecret);

        if (
            typeof decoded === "string" ||
            typeof decoded.userId !== "string" ||
            typeof decoded.email !== "string"
        ) {
            res.status(401).json({
                success: false,
                message: "Invalid authentication token.",
            });
            return;
        }

        req.user = {
            userId: decoded.userId,
            email: decoded.email,
        };

        next();
    } catch {
        res.status(401).json({
            success: false,
            message: "Invalid or expired token. Please log in again.",
        });
    }
};

export default authMiddleware;

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