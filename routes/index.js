const express = require('express');
const router = express.Router();

router.get(require('../config/url').paths.index, (req, res) => {
    res.render('index', { req: req, res: res })
});

module.exports = router;
