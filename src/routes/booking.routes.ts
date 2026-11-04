import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware.js";

import {
    createBooking,
    updateBookingStatus,
    getBookings,
    getBookingById,
    getMyBookings,
    cancelBooking,
} from "../controllers/booking.controller.js";

const router = Router();

router.get("/", authMiddleware, getBookings);
router.get("/my-bookings", authMiddleware, getMyBookings);
router.get("/:id", authMiddleware, getBookingById);
router.post("/", authMiddleware, createBooking);
router.put("/:id", authMiddleware, updateBookingStatus);
router.patch("/:id/cancel", authMiddleware, cancelBooking);

export default router;