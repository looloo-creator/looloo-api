const express = require('express');
const router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'One Pay CD integrated!' });
});
router.post('/', function(req, res, next) {
  res.json({ title: 'One Pay CD integrated' });
});

module.exports = router;
