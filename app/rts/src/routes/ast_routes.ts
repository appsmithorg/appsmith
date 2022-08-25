import express from "express";
import AstController from "../controllers/Ast/AstController";
import AstRules from "../middlewares/rules/ast";

const router = express.Router();
const astController = new AstController();

router.post(
  "/get-identifiers",
  AstRules.getScriptValidator(),
  astController.getDependentIdentifiers
);

export default router;
