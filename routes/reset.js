const express = require('express');
const router = express.Router();
const knex = require('knex')( require('../config/keys').MySQLDetails );

const HOURS_TIL_EXPIRATION = 24;

router.get('/reset', (req, res) => {
    const code = req.query.code;

    if (typeof code == 'undefined') {
        req.flash('reset_fail', "Password recovery failed, missing reset data.");
        res.redirect(require('../config/url').paths.index);
    } else {
        if (code.length != 60) {
            req.flash('reset_fail', "Password recovery failed, invalid code length.");
            res.redirect(require('../config/url').paths.index);
        } else {
            knex('players')
                .limit(1)
                .where({
                    pass_reset_key: code
                })
                .then( function(result) {
                    if (result.length < 1) {
                        req.flash('reset_fail', "Password recovery failed, invalid code.");
                        res.redirect(require('../config/url').paths.index);
                    } else if (result.length == 1) {
                        const user = result[0];
                        
                        // Check timestamp
                        const expiration = new Date(user.pass_reset_timestamp);
                        expiration.setHours(expiration.getHours() + HOURS_TIL_EXPIRATION);
                        const now = new Date();

                        if (now > expiration) {
                            req.flash('reset_fail', "Password recovery failed, expired code.");
                            res.redirect(require('../config/url').paths.index);
                        } else {
                            
                        }
                        
                        // TODO: when to render the page? if we need to render and we lose this state, how to transmit the code? do we need a new code?

                        // knex('players')
                        //     .where({ id: id })
                        //     .update({ email_activated: 1 })
                        //     .then( function() {
                        //         req.flash('reg_success_activation', "Account Activated");
                        //         res.redirect(require('../config/url').paths.index);
                        //     })
                        //     .catch((err) => {console.dir(err)});
                    }
                })
                .catch((err) => {console.dir(err)});
        }
    }
});

module.exports = router;
