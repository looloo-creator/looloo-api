const express = require('express');
const router = express.Router();
const userController = require("../controllers/userController");

router.post('/create', userController.create);
router.post('/login', userController.login);
router.post('/refresh', userController.refresh);
router.post('/social-login', userController.socialLogin);
router.get('/verifyemail/:token', userController.verifyemail);
router.post('/send-verification-link', userController.sendLink);

module.exports = router;
