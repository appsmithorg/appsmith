import express from "express";
import AstController from "../controllers/Ast/AstController";
import rules from "../middlewares/rules/AstRules";

const router = express.Router();
const astController = new AstController();

router.post("/api/v1/ast/get-ast", rules.getAst(), astController.getAST);

export default router;
