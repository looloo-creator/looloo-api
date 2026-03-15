import express from "express";
import { userController } from "../controllers/userController";

const router = express.Router();

router.post("/create", userController.create.bind(userController));
router.post("/login", userController.login.bind(userController));
router.post("/refresh", userController.refresh.bind(userController));
router.post("/social-login", userController.socialLogin.bind(userController));
router.get("/verifyemail/:token", userController.verifyemail.bind(userController));
router.post("/send-verification-link", userController.sendLink.bind(userController));

export default router;
