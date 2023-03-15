import express from "express";
import AstController from "@controllers/Ast/AstController";
import { Validator } from "@middlewares/Validator";
import AstRules from "@rules/ast";

const router = express.Router();
const astController = new AstController();
const validator = new Validator();

router.post(
    "/dsl/normalize",
    AstRules.getScriptValidator(),
    validator.validateRequest,
    astController.getIdentifierDataFromScript
);

router.post(
    "/dsl/denormalize",
    AstRules.getMultipleScriptValidator(),
    validator.validateRequest,
    astController.getIdentifierDataFromMultipleScripts
);

export default router;