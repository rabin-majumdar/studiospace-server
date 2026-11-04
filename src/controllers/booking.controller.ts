import type { Request, Response } from "express";
import { ObjectId } from "mongodb";

import connectDB from "../config/db.js";

import type { Booking, BookingStatus } from "../types/booking.js";

const isValidBookingStatus = (status: unknown): status is BookingStatus => {
    return ["pending", "confirmed", "completed", "cancelled"].includes(status as string);
};

const isValidTime = (time: unknown): time is string => {
    if (typeof time !== "string") {
        return false;
    }

    return /^([01]\d|2[0-3]):([0-5]\d)$/.test(time);
};


const isValidDate = (date: unknown): date is string => {
    if (typeof date !== "string") {
        return false;
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

    if (!dateRegex.test(date)) {
        return false;
    }

    const parsedDate = new Date(`${date}T00:00:00.000Z`);

    if (Number.isNaN(parsedDate.getTime())) {
        return false;
    }

    return parsedDate.toISOString().slice(0, 10) === date;
};


export const createBooking = async (req: Request, res: Response) => {
    try {
        const { studioId, date, startTime, endTime } = req.body;
        const userId = req.user?.userId;

        // Validate required fields
        if (
            !studioId ||
            typeof userId !== "string" ||
            !userId.trim() ||
            !date ||
            !startTime ||
            !endTime
        ) {
            res.status(400).json({
                success: false,
                message: "All booking fields are required.",
            });
            return;
        }

        // Validate Studio ID
        if (typeof studioId !== "string" || !ObjectId.isValid(studioId)) {
            res.status(400).json({
                success: false,
                message: "Invalid studio ID.",
            });
            return;
        }

        // Validate booking date format
        if (!isValidDate(date)) {
            res.status(400).json({
                success: false,
                message: "Invalid date. Use YYYY-MM-DD format.",
            });
            return;
        }

        // Prevent booking for past dates
        const today = new Date().toISOString().slice(0, 10);

        if (date < today) {
            res.status(400).json({
                success: false,
                message: "Booking date cannot be in the past.",
            });
            return;
        }

        // Validate booking time format
        if (!isValidTime(startTime) || !isValidTime(endTime)) {
            res.status(400).json({
                success: false,
                message: "Invalid time format. Use HH:mm (24-hour format).",
            });
            return;
        }

        // Validate booking time range
        if (startTime >= endTime) {
            res.status(400).json({
                success: false,
                message: "End time must be later than start time.",
            });
            return;
        }

        const db = await connectDB();

        // Check if Studio exists
        const studio = await db.collection("studios").findOne({
            _id: new ObjectId(studioId),
        });

        if (!studio) {
            res.status(404).json({
                success: false,
                message: "Studio not found.",
            });
            return;
        }

        // Check for overlapping confirmed bookings
        const overlappingBooking = await db.collection<Booking>("bookings").findOne({
            studioId: new ObjectId(studioId),
            date,
            status: "confirmed",
            startTime: { $lt: endTime },
            endTime: { $gt: startTime },
        });

        if (overlappingBooking) {
            res.status(409).json({
                success: false,
                message: "This studio is already booked for the selected time.",
            });
            return;
        }
        const booking: Booking = {
            studioId: new ObjectId(studioId),
            userId,
            date,
            startTime,
            endTime,
            status: "pending",
            createdAt: new Date(),
        };

        const result = await db.collection<Booking>("bookings").insertOne(booking);

        res.status(201).json({
            success: true,
            message: "Booking created successfully!",
            insertedId: result.insertedId,
        });
    } catch (error) {
        console.error("Create booking error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to create booking.",
        });
    }
};

export const updateBookingStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const userId = req.user?.userId;

        if (!userId) {
            res.status(401).json({
                success: false,
                message: "Authentication required. Please log in.",
            });
            return;
        }

        // Validate Booking ID
        if (typeof id !== "string" || !ObjectId.isValid(id)) {
            res.status(400).json({
                success: false,
                message: "Invalid booking ID.",
            });
            return;
        }

        // Validate Booking Status
        if (!isValidBookingStatus(status)) {
            res.status(400).json({
                success: false,
                message: "Invalid booking status.",
            });
            return;
        }

        const bookingStatus: BookingStatus = status;

        const db = await connectDB();

        const booking = await db.collection<Booking>("bookings").findOne({
            _id: new ObjectId(id),
        });

        if (!booking) {
            res.status(404).json({
                success: false,
                message: "Booking not found.",
            });
            return;
        }

        // Find the studio
        const studio = await db.collection("studios").findOne({
            _id: booking.studioId,
        });

        if (!studio) {
            res.status(404).json({
                success: false,
                message: "Studio not found.",
            });
            return;
        }

        // Verify Studio Ownership
        if (studio.ownerEmail !== req.user?.email) {
            res.status(403).json({
                success: false,
                message: "You are not authorized to update this booking status.",
            });
            return;
        }

        if (
            booking.status === "completed" ||
            booking.status === "cancelled" ||
            (booking.status === "confirmed" && bookingStatus === "pending") ||
            (booking.status === "pending" && bookingStatus === "completed")
        ) {
            res.status(400).json({
                success: false,
                message: `Cannot change booking status from ${booking.status} to ${bookingStatus}.`,
            });
            return;
        }

        if (status === "confirmed") {
            // Validate existing booking time format
            if (!isValidTime(booking.startTime) || !isValidTime(booking.endTime)) {
                res.status(400).json({
                    success: false,
                    message: "Booking contains an invalid time format.",
                });
                return;
            }

            // Validate existing booking time range
            if (booking.startTime >= booking.endTime) {
                res.status(400).json({
                    success: false,
                    message: "Booking contains an invalid time range.",
                });
                return;
            }

            // Check for overlapping confirmed bookings
            const overlappingBooking = await db.collection<Booking>("bookings").findOne({
                _id: { $ne: new ObjectId(id) },
                studioId: booking.studioId,
                date: booking.date,
                status: "confirmed",
                startTime: { $lt: booking.endTime },
                endTime: { $gt: booking.startTime },
            });

            if (overlappingBooking) {
                res.status(409).json({
                    success: false,
                    message: "This studio is already booked for the selected time.",
                });
                return;
            }
        }

        const result = await db.collection<Booking>("bookings").updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    status: bookingStatus,
                    updatedAt: new Date(),
                },
            }
        );

        if (result.matchedCount === 0) {
            res.status(404).json({
                success: false,
                message: "Booking not found.",
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: "Booking status updated successfully!",
        });
    } catch (error) {
        console.error("Update booking status error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update booking status.",
        });
    }
};

export const getBookings = async (req: Request, res: Response) => {

    const userId = req.user?.userId;
    const userEmail = req.user?.email;

    if (!userId || !userEmail) {
        res.status(401).json({
            success: false,
            message: "Authentication required. Please log in.",
        });
        return;
    }

    try {
        const db = await connectDB();

        const ownedStudios = await db.collection("studios")
            .find({ ownerEmail: userEmail })
            .project({ _id: 1 })
            .toArray();

        const ownedStudioIds = ownedStudios.map((studio) => studio._id);

        const bookings = await db
            .collection<Booking>("bookings")
            .find({
                $or: [
                    { userId },
                    { studioId: { $in: ownedStudioIds } },
                ],
            })
            .toArray();

        res.status(200).json({
            success: true,
            message: "Bookings fetched successfully!",
            data: bookings,
        });
    } catch (error) {
        console.error("Get bookings error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch bookings.",
        });
    }
};


export const getBookingById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        if (typeof id !== "string" || !ObjectId.isValid(id)) {
            res.status(400).json({
                success: false,
                message: "Invalid booking ID.",
            });
            return;
        }

        const db = await connectDB();

        const booking = await db.collection<Booking>("bookings").findOne({
            _id: new ObjectId(id),
        });

        if (!booking) {
            res.status(404).json({
                success: false,
                message: "Booking not found.",
            });
            return;
        }

        const userId = req.user?.userId;

        if (!userId) {
            res.status(401).json({
                success: false,
                message: "Authentication required. Please log in.",
            });
            return;
        }

        // Find the studio
        const studio = await db.collection("studios").findOne({
            _id: booking.studioId,
        });

        if (!studio) {
            res.status(404).json({
                success: false,
                message: "Studio not found.",
            });
            return;
        }

        // Verify Booking Access
        if (
            booking.userId !== userId &&
            studio.ownerEmail !== req.user?.email
        ) {
            res.status(403).json({
                success: false,
                message: "You are not authorized to view this booking.",
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: "Booking fetched successfully!",
            data: booking,
        });
    } catch (error) {
        console.error("Get booking error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch booking.",
        });
    }
};

export const getMyBookings = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;

        if (!userId || typeof userId !== "string") {
            res.status(400).json({
                success: false,
                message: "User ID is required.",
            });
            return;
        }

        const db = await connectDB();

        const bookings = await db
            .collection<Booking>("bookings")
            .find({ userId })
            .toArray();

        res.status(200).json({
            success: true,
            message: "Your bookings fetched successfully!",
            data: bookings,
        });
    } catch (error) {
        console.error("Get my bookings error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch your bookings.",
        });
    }
};

export const cancelBooking = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;

        if (!userId) {
            res.status(401).json({
                success: false,
                message: "Authentication required. Please log in.",
            });
            return;
        }

        if (typeof id !== "string" || !ObjectId.isValid(id)) {
            res.status(400).json({
                success: false,
                message: "Invalid booking ID.",
            });
            return;
        }

        const db = await connectDB();

        const result = await db.collection<Booking>("bookings").updateOne(
            {
                _id: new ObjectId(id),
                userId,
                status: { $ne: "cancelled" },
            },
            {
                $set: {
                    status: "cancelled",
                    updatedAt: new Date(),
                },
            }
        );

        if (result.matchedCount === 0) {
            res.status(404).json({
                success: false,
                message: "Booking not found or already cancelled.",
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: "Booking cancelled successfully!",
        });
    } catch (error) {
        console.error("Cancel booking error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to cancel booking.",
        });
    }
};