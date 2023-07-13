import express from "express";
import JsEndpointExecuteController from "@controllers/jsEndpointExecute/JsEndpointExecuteController";
import { Validator } from "@middlewares/Validator";

const router = express.Router();
const JsEpExecuteController = new JsEndpointExecuteController();
const validator = new Validator();

router.get(
  "/js-endpoint-execute",
  validator.validateRequest,
  JsEpExecuteController.perfomJSEndpointExecute,
);

export default router;
