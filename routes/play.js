const express = require('express');
const router = express.Router();
const knex = require('knex')( require('../config/keys').MySQLDetails );

router.get('/play', (req, res) => {
    if (req.user) {
        const sessionToken = generateToken(64);
        console.log("setting cookie 'vmkr' to " + sessionToken);
        res.cookie('vmkr', sessionToken, {  });

        knex('players')
            .where({ id: req.user.id } )
            .limit(1)
            .update({ session_token: sessionToken })
            .catch((err) => { console.dir(err) })
            .then(function() {
                res.redirect(`${require('../config/url').paths.game_url}`);
            });
    } else {
        req.flash('fail_auth', 'Not logged in');
        res.redirect(require('../config/url').paths.index)
    }
});

function generateToken(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
       result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
 } 

module.exports = router;
