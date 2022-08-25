import express from "express";
import AstController from "../controllers/Ast/AstController";
import AstRules from "../middlewares/rules/ast";

const router = express.Router();
const astController = new AstController();

router.post(
  "/single-script-identifiers",
  AstRules.getScriptValidator(),
  astController.getDependentIdentifiers
);

router.post(
  "/multiple-script-identifiers",
  AstRules.getMultipleScriptValidator(),
  astController.getMultipleDependentIdentifiers
);

export default router;
