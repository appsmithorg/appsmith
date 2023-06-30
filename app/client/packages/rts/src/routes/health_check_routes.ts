import express from "express";
import HealthCheckController from "@controllers/healthCheck/HealthCheckController";
import { Validator } from "@middlewares/Validator";

const router = express.Router();
const healthCheckController = new HealthCheckController();
const validator = new Validator();

router.get(
  "/health-check",
  validator.validateRequest,
  healthCheckController.performHealthCheck,
);

export default router;
