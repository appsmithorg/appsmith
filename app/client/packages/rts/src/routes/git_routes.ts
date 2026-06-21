import express from "express";
import { body } from "express-validator";
import GitController from "@controllers/git";
import { Validator } from "@middlewares/Validator";
import { requireInternalAuth } from "@middlewares/AuthMiddleware";

const router = express.Router();
const gitController = new GitController();
const validator = new Validator();

router.post(
  "/reset",
  body("repoPath").isString().notEmpty().withMessage("repoPath is required and must be a string"),
  requireInternalAuth,
  validator.validateRequest,
  gitController.reset,
);

export default router;
