import express from "express";
import type { Request, Response, NextFunction } from "express";
import GitController from "@controllers/git";
import { Validator } from "@middlewares/Validator";
import { StatusCodes } from "http-status-codes";

const router = express.Router();
const gitController = new GitController();
const validator = new Validator();

function requireInternalAuth(req: Request, res: Response, next: NextFunction) {
  const providedKey = req.headers["x-appsmith-internal-key"];
  const expectedKey = process.env.APPSMITH_INTERNAL_KEY;

  if (!expectedKey || !providedKey || providedKey !== expectedKey) {
    return res.status(StatusCodes.FORBIDDEN).json({ error: "Forbidden" });
  }

  next();
}

router.post(
  "/reset",
  requireInternalAuth,
  validator.validateRequest,
  gitController.reset,
);

export default router;
