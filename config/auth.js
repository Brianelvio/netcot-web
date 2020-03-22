module.exports = {
    ensureAuthenticated: function(req, res, next) {
        if (req.isAuthenticated()) {
            return next();
        }
        req.flash('fail_auth', 'You are not logged in');
        res.redirect(require('../config/url').paths.index);
    }
}
