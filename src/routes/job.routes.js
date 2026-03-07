import express from "express";

import {
  applyJob,
  getApplications,
  getSingleApplication,
  deleteApplication,
  updateApplicationStatus,
  createJob,
  getAllJobs,
  updateJob,
  deleteJob,
  getApplicationsByUser,
} from "../controllers/job.controller.js";


import { authMiddleware } from "../middlewares/auth.middleware.js";
import { uploadResume } from "../middlewares/upload.middleware.js";

const router = express.Router();


router.post("/create-job",authMiddleware, createJob);
router.get("/get-job-list", getAllJobs);
router.put("/update-job/:id/status", updateJob);
router.get("/delete-job/:id/delete", deleteJob);
// router.delete("/applications/:id", deleteApplication);

router.post("/apply", uploadResume.single("resume"), applyJob);
router.get("/job-applications", getApplications);
router.patch("/job-applications/:id/status", updateApplicationStatus);
router.get("/job-applications/:id", getSingleApplication);
router.delete("/job-applications/:id", deleteApplication);
router.get("/my-applications", getApplicationsByUser);

export default router;