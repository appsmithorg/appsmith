import express from "express";
import CanvasWidgetNormalizer from "@controllers/gitWidgetDSLNormalizer/CanvasWidgetNormalizer";

const router = express.Router();
const canvasWidgetNormalizer = new CanvasWidgetNormalizer();

router.post(
    "/dsl/normalize",
    canvasWidgetNormalizer.normalize
);

export default router;