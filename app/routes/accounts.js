const express = require('express');
const accountController = require('../controllers/accountController');
const router = express.Router();

router.post('/create', accountController.upload);
router.post('/list', accountController.list);
router.post('/delete', accountController.delete);
router.get('/preview/:filename', accountController.preview);

module.exports = router;
