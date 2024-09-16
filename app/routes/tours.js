const express = require('express');
const router = express.Router();
const tourController = require('../controllers/tourController');

router.post('/create', tourController.create);
router.get('/list', tourController.list);
router.post('/delete', tourController.delete);

module.exports = router;
