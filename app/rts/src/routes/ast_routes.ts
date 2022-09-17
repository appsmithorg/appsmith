import express from "express";
import AstController from "@controllers/Ast/AstController";
import { Validator } from "@middlewares/Validator";
import AstRules from "@rules/ast";

const router = express.Router();
const astController = new AstController();
const validator = new Validator();

router.post(
  "/single-script-info",
  AstRules.getScriptValidator(),
  validator.validateRequest,
  astController.getInfoFromScript
);

router.post(
  "/multiple-script-infos",
  AstRules.getMultipleScriptValidator(),
  validator.validateRequest,
  astController.getInfoFromMultipleScripts
);

export default router;
