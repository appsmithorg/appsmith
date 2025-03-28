import express from "express";
import GitController from "@controllers/git";
import { Validator } from "@middlewares/Validator";

const router = express.Router();
const gitController = new GitController();
const validator = new Validator();

router.post("/reset", validator.validateRequest, gitController.reset);

export default router;
