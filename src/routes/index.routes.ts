import { Router } from "express";
import healthRoutes from "./health.routes.js";
import studioRoutes from "./studio.routes.js";

const router = Router();

router.use("/health", healthRoutes);
router.use("/studios", studioRoutes);

export default router;