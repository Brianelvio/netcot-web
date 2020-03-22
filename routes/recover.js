const express = require('express');
const router = express.Router();
const knex = require('knex')( require('../config/keys').MySQLDetails );

router.get('/recover', (req, res) => {
    res.render('recover', { req: req, res: res })
});

router.post('/recover', (req, res) => {
    if (!req.body) {
        return res.send("Request missing body");
    }
    const email = req.body.email.toLowerCase();

    if (typeof email !== 'undefined') {
        const resetToken = generateToken(60);
        knex('players')
            .update({
                pass_reset_timestamp: knex.fn.now(),
                pass_reset_key: resetToken
            })
            .limit(1)
            .where({ email: email })
            .catch((err) => { console.dir(err) })
            .then((result) => {
                if (result == 1) {
                    
                    // START SENDMAIL
                    var nodemailer = require('nodemailer');
                    var transporter = nodemailer.createTransport({
                        host: 'smtp.zoho.com',
                        port: 465,
                        auth: require('../config/keys').MAILMAN_CREDS
                    });
                    var mailOptions = {
                        from: '"NETCOT Center" <mailman@netcotcenter.com>',
                        to: 'jacobhaitsma@gmail.com',
                        subject: 'Reset your VMK password',
                        text: 'TODO! recover.js'
                    };
                    transporter.sendMail(mailOptions, function(error, info){
                        if (error) {
                            console.log(error);
                        } else {
                            console.log('Email sent: ' + info.response);
                        }
                    });
                    // END SENDMAIL

                    req.flash('pass_reset_sent', `A link to reset your password has been emailed to ${email}.`);
                    res.redirect(require('../config/url').paths.index);
                } else if(result == 0) { 
                    res.render('recover', { req: req, res: res, recover_email_error: email });
                }
            })
        // TODO: email resetToken
    }
})

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
