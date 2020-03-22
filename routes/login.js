const express = require('express');
const router = express.Router();
const passport = require('passport');

// Login handler
router.post('/login', (req, res, next) => {
    if (req.user) {
        req.flash('already_logged_in', 'You are already logged in');
        res.redirect(require('../config/url').paths.index);
    }
    passport.authenticate('local', {
        successRedirect: require('../config/url').paths.index,
        failureRedirect: require('../config/url').paths.index,
        failureFlash: true
    })(req, res, next);
});

module.exports = router;
