const express = require('express');
const router = express.Router();

router.get('/logout', (req, res) => {
    req.logout();
    req.flash('success_logout', 'Successfully logged out')
    res.redirect(require('../config/url').paths.index);
});

module.exports = router;
