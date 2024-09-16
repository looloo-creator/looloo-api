const express = require('express');
const accountController = require('../controllers/accountController');
const router = express.Router();

router.post('/create', accountController.create);
router.post('/list', accountController.list);
router.post('/delete', accountController.delete);

module.exports = router;
