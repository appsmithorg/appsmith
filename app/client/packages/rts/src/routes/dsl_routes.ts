import express from "express";
import { Validator } from "@middlewares/Validator";
import DSLController from "@controllers/DSL/DSLController";

const router = express.Router();
const dslController = new DSLController();
const validator = new Validator();

router.post(
  "/git/normalize",
  validator.validateRequest,
  dslController.getNormalizedDSLForGit,
);

router.post(
  "/git/denormalize",
  validator.validateRequest,
  dslController.getDenormalizedDSLForGit,
);

export default router;
