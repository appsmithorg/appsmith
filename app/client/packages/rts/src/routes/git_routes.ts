import express from "express";
import { body } from "express-validator";
import GitController from "@controllers/git";
import { Validator } from "@middlewares/Validator";

const router = express.Router();
const gitController = new GitController();
const validator = new Validator();

router.post(
  "/reset",
  body("repoPath").isString().notEmpty().withMessage("repoPath is required"),
  validator.validateRequest,
  gitController.reset,
);

export default router;
