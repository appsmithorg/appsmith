import DSLController from "@controllers/Dsl/DslController";
import { Validator } from "@middlewares/Validator";
import express from "express";

const router = express.Router();
const dslController = new DSLController();
const validator = new Validator();

router.get(
  "/version",
  validator.validateRequest,
  dslController.getLatestDSLVersion,
);

router.post("/migrate", validator.validateRequest, dslController.migrateDSL);

export default router;
