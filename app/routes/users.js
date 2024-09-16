const express = require('express');
const router = express.Router();
const userController = require("../controllers/userController");

router.post('/create', userController.create);
router.post('/login', userController.login);
router.post('/verify', userController.verify);
router.get('/verifyemail/:token', userController.verifyemail);

module.exports = router;
