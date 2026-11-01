import { Router } from "express";

import {
    createBooking,
    updateBookingStatus,
    getBookings,
    getBookingById,
    getMyBookings,
    cancelBooking,
} from "../controllers/booking.controller.js";

const router = Router();

router.get("/", getBookings);
router.get("/user/:userId", getMyBookings);
router.get("/:id", getBookingById);
router.post("/", createBooking);
router.put("/:id", updateBookingStatus);
router.patch("/:id/cancel", cancelBooking);

export default router;