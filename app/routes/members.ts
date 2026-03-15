import express from "express";
import { memberController } from "../controllers/memberController";

const router = express.Router();

router.post("/create", memberController.create.bind(memberController));
router.post("/list", memberController.list.bind(memberController));
router.post("/delete", memberController.delete.bind(memberController));

export default router;
