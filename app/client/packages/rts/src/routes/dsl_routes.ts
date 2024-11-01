import DSLController from "@controllers/Dsl/DslController";
import { Validator } from "@middlewares/Validator";
import express from "express";
import type { Response, Request } from "express";

const router = express.Router();
const dslController = new DSLController();
const validator = new Validator();

router.get(
  "/version",
  validator.validateRequest,
  dslController.getLatestDSLVersion,
);

router.post(
  "/migrate",
  validator.validateRequest,
  async (req: Request, res: Response) =>
    await dslController.migrateDSL(req, res),
);

export default router;
