import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import createStudio, { deleteStudio, getStudioById, getStudios, updateStudio } from "../controllers/studio.controller.js";

const router = Router();

router.get("/", getStudios);
router.get("/:id", getStudioById);
router.post("/", authMiddleware, createStudio);
router.put("/:id", authMiddleware, updateStudio);
router.delete("/:id", authMiddleware, deleteStudio);

export default router;