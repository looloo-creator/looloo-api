import express from "express";
import { tourController } from "../controllers/tourController";

const router = express.Router();

router.post("/create", tourController.create.bind(tourController));
router.get("/list", tourController.list.bind(tourController));
router.post("/list", tourController.list.bind(tourController));
router.post("/delete", tourController.delete.bind(tourController));

export default router;
