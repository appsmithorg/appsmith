import express from "express";
import AstController from "@controllers/Ast/AstController";
import { Validator } from "@middlewares/Validator";
import AstRules from "@rules/ast";

const router = express.Router();
const astController = new AstController();
const validator = new Validator();

router.post(
  "/single-script-identifiers",
  AstRules.getScriptValidator(),
  validator.validateRequest,
  astController.getDependentIdentifiers
);

router.post(
  "/multiple-script-identifiers",
  AstRules.getMultipleScriptValidator(),
  validator.validateRequest,
  astController.getMultipleDependentIdentifiers
);

export default router;
