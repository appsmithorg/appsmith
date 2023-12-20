import express from "express";
import { Validator } from "@middlewares/Validator";
import ExecuteController from "../controllers/ExecuteController";
import CommonController from "../controllers/CommonController";
import RunController from "../controllers/RunController";

// Controllers
const validator = new Validator();
const executeController = new ExecuteController();
const commonController = new CommonController();
const runController = new RunController();

const router = express.Router();

// Endpoints definition
const WORKFLOW_PROXY_API_BASE_URL = "/workflowProxy";
const HEALTH_ENDPOINT = `${WORKFLOW_PROXY_API_BASE_URL}/healthCheck`;
const EXECUTE_ENDPOINT = `${WORKFLOW_PROXY_API_BASE_URL}/executeActivity`;
const INBOX_REQUEST_ENDPOINT = `${WORKFLOW_PROXY_API_BASE_URL}/approvalInbox`;
const EXECUTE_RUN = `${WORKFLOW_PROXY_API_BASE_URL}/:workflowId/run`;

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
  executeController.executeAppsmithSpecificActivity,
);

// Create inbox request
router.post(
  INBOX_REQUEST_ENDPOINT,
  validator.validateRequest,
  executeController.executeInboxCreationRequest,
);

// Resolve inbox request
router.put(
  INBOX_REQUEST_ENDPOINT,
  validator.validateRequest,
  runController.executeInboxResolutionRequest,
);

// Trigger workflow run from webhook
router.post(
  EXECUTE_RUN,
  // validator.validateRequest,
  runController.runWorkflow,
);

export default router;
