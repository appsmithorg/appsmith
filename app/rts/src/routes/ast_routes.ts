import express from "express";
import AstController from "@controllers/Ast/AstController";
import { Validator } from "@middlewares/Validator";
import AstRules from "@rules/ast";

const router = express.Router();
const astController = new AstController();
const validator = new Validator();

router.post(
  "/single-script-data",
  AstRules.getScriptValidator(),
  validator.validateRequest,
  astController.getIdentifierDataFromScript
);

router.post(
  "/multiple-script-data",
  AstRules.getMultipleScriptValidator(),
  validator.validateRequest,
  astController.getIdentifierDataFromMultipleScripts
);

export default router;
