import { Router } from "express";
import healthRoutes from "./health.routes.js";
import studioRoutes from "./studio.routes.js";
import bookingRoutes from "./booking.routes.js";
import authRoutes from "./auth.routes.js";

const router = Router();

router.use("/health", healthRoutes);
router.use("/studios", studioRoutes);
router.use("/bookings", bookingRoutes);
router.use("/auth", authRoutes);

export default router;