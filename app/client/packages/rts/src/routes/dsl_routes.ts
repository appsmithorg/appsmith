import express from "express";
import DslController from "@controllers/dsl/DslController";

const router = express.Router();
const dslController = new DslController();

router.get("/version", dslController.getLatestDslVersion);

router.post("/migrate", dslController.migrateDsl);

export default router;
