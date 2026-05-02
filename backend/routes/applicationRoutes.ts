import { Router } from "express";
import {
  apply,
  getApplications,
  messageCandidate,
  viewResume,
} from "../controllers/applicationController.js";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";
import { uploadResume } from "../middleware/uploadMiddleware.js";

const router = Router();

router.post("/apply", requireAuth, requireRole("candidate"), uploadResume.single("resume"), apply);
router.get("/applications", requireAuth, getApplications);
router.get("/applications/:applicationId/resume", requireAuth, viewResume);
router.post(
  "/applications/:applicationId/messages",
  requireAuth,
  requireRole("recruiter"),
  messageCandidate,
);

export default router;
