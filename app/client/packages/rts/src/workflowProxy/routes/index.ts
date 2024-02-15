import express from "express";
import { Validator } from "@middlewares/Validator";
import ExecuteController from "../controllers/ExecuteController";
import CommonController from "../controllers/CommonController";
import RunController from "../controllers/RunController";
import { AuthValidator } from "@workflowProxy/middleware/AuthValidator";

// Controllers
const validator = new Validator();
const authValidator = new AuthValidator();
const executeController = new ExecuteController();
const commonController = new CommonController();
const runController = new RunController();

const router = express.Router();

// Endpoints definition
const WORKFLOW_PROXY_API_BASE_URL = "/workflow-proxy";
const HEALTH_ENDPOINT = `${WORKFLOW_PROXY_API_BASE_URL}/health-check`;
export const EXECUTE_ENDPOINT = `${WORKFLOW_PROXY_API_BASE_URL}/execute-activity`;
export const ASSIGN_REQUEST_ENDPOINT = `${WORKFLOW_PROXY_API_BASE_URL}/approval-inbox`;
const EXECUTE_RUN = `${WORKFLOW_PROXY_API_BASE_URL}/trigger`;

// Health check for the workflow service (temporal)
router.get(
  HEALTH_ENDPOINT,
  validator.validateRequest,
  commonController.checkStatusOfTemporal,
);

// Execute workflow activity
router.post(
  EXECUTE_ENDPOINT,
  validator.validateRequest,
  authValidator.validateRequest,
  executeController.executeAppsmithSpecificActivity,
);

// Create inbox request
router.post(
  ASSIGN_REQUEST_ENDPOINT,
  validator.validateRequest,
  authValidator.validateRequest,
  executeController.executeInboxCreationRequest,
);

// Resolve inbox request
router.put(
  ASSIGN_REQUEST_ENDPOINT,
  validator.validateRequest,
  runController.executeInboxResolutionRequest,
);

// Trigger workflow run from webhook
router.post(
  EXECUTE_RUN,
  validator.validateRequest,
  authValidator.validateRequest,
  runController.runWorkflow,
);

export default router;
