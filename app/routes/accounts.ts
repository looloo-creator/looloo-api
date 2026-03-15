import express from "express";
import { accountController } from "../controllers/accountController";

const router = express.Router();

router.post("/create", accountController.upload);
router.post("/list", accountController.list.bind(accountController));
router.post("/delete", accountController.delete.bind(accountController));
router.get("/preview/:filename", accountController.preview);

export default router;
