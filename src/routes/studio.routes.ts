import { Router } from "express";
import createStudio, { deleteStudio, getStudioById, getStudios, updateStudio } from "../controllers/studio.controller.js";

const router = Router();

router.get("/", getStudios);
router.get("/:id", getStudioById);
router.post("/", createStudio);
router.put("/:id", updateStudio);
router.delete("/:id", deleteStudio);

export default router;