import { Router } from "express";
import { getJob, getJobs, postJob, removeJob } from "../controllers/jobController.js";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", getJobs);
router.post("/", requireAuth, requireRole("recruiter"), postJob);
router.delete("/:id", requireAuth, requireRole("recruiter"), removeJob);
router.get("/:id", getJob);

export default router;
