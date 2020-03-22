const express = require('express');
const router = express.Router();

var knex = require('knex')( require('../config/keys').MySQLDetails );


router.get('/activate', (req, res) => {
    const code = req.query.code;

    if (typeof code == 'undefined') {
        req.flash('reg_fail_activation', "Missing Account Activation Data");
        res.redirect(require('../config/url').paths.index);
    } else {
        if (code.length != 60) {
            req.flash('reg_fail_activation', "Malformed Account Activation Data");
            res.redirect(require('../config/url').paths.index);
        } else {
            knex('players')
                .limit(1)
                .where({
                    email_activation_key: code
                })
                .then( function(result) {
                    if (result.length < 1) {
                        req.flash('reg_fail_activation', "Incorrect Account Activation Data");
                        res.redirect(require('../config/url').paths.index);
                    } else if (result.length == 1) {
                        const emailActivated = result[0].email_activated;
                        const id = result[0].id;
                        if (emailActivated == 1) {
                            req.flash('reg_success_activation', "Account Already Activated");
                            res.redirect(require('../config/url').paths.index);
                        } else if (emailActivated == 0) {
                            // Set player's email_activated boolean to true
                            knex('players')
                                .where({ id: id })
                                .update({ email_activated: 1 })
                                .then( function() {
                                    req.flash('reg_success_activation', "Account Activated");
                                    res.redirect(require('../config/url').paths.index);
                                })
                                .catch((err) => {console.dir(err)});
                        }
                    }
                })
                .catch((err) => {console.dir(err)});
        }
    }
});

module.exports = router;
