const express = require('express');
const router = express.Router();
const request = require('request');
const bcrypt = require('bcryptjs');
const knex = require('knex')( require('../config/keys').MySQLDetails );

var registrationEnabled = false;

router.get('/register', (req, res) => {
    if (registrationEnabled) {
        if (req.user) {
            req.flash('reg_already_registered', 'Already logged in');
            res.redirect(require('../config/url').paths.index);
        } else {
            res.render('register')
        }
    } else {
        req.flash('reg_fail_closed', 'Registration closed');
        res.redirect(require('../config/url').paths.index);
    }
});

router.post('/register', (req, res) => {
    if (!req.body) {
        return res.send("Request missing body");
    }
    const body = req.body;
    const email = body.EMAIL;
    const password = body.PASSWORD;
    const passwordVerification = body.PASSWORD_VERIFICATION;
    const captcha = body['g-recaptcha-response'];
    let hashedPassword = '';

    let errors = [];

    // Check if any fields are null
    if (!email || !password || !passwordVerification || !captcha) {
        errors.push({ msg: 'Please fill in all fields' })
    }

    // Check that PASSWORD = PASSWORD_VERIFICATION
    if (body.PASSWORD !== body.PASSWORD_VERIFICATION) {
        errors.push({ msg: 'Passwords do not match' })
    }

    // Check email length
    if (email.length < 3) {
        errors.push({ msg: 'Email address must be longer'});
    } else if (email.length > 64) {
        errors.push({ msg: 'Please use a shorter email address' });
    } else {
        var emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        if (!emailRegex.test( email.toLowerCase() )) {
            errors.push({ msg: 'Invalid email format' });
        }
    }

    // Check password length
    if (password.length > 59) {
        errors.push({ msg: 'Please use a shorter password' });
    } else {
        var strongRegex = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})");
        // Check password strength
        if (!strongRegex.test(password)) {
            errors.push({ msg: 'Password must contain a lowercase, an uppercase, a numeric, and a special character, and must be at least 8 characters in length.'})
        }
    }

    const secretKey = require('../config/keys').CAPTCHA.secretKey;
    const verificationUrl = "https://www.google.com/recaptcha/api/siteverify?secret=" + secretKey + "&response=" + captcha + "&remoteip=" + req.connection.remoteAddress;
    var captchaPassed = null;
    // Hitting GET request to the URL, Google will respond with success or error scenario.
    request(verificationUrl,function(gError, gResponse, gBody) {
        gBody = JSON.parse(gBody);
        // Success will be true or false depending upon captcha validation.
        if(gBody.success !== undefined && !gBody.success) {
            captchaPassed = false;
            errors.push({ msg: "Invalid or expired CAPTCHA response" })
        }
        captchaPassed = true;
        
        if (errors.length > 0) {
            res.render('register', {
                errors,
                email
            });
        } else {
            // Passed CAPTCHA? Form ok? Continue here...
            registerUser();
        }
    });

    function registerUser() {
        bcrypt.genSalt(10, (err, salt) =>
            bcrypt.hash(password, salt, (err, hash) => {
                if (err) throw err;
                hashedPassword = hash;
        }));

        knex('players')
            .limit(1)
            .where('email', email.toLowerCase())
            .then(function(rows) {
                if (rows.length > 0) {
                    errors = [{ msg: "A user with that email address already exists." }];
                    res.render('register', {
                        errors,
                        email
                    });
                } else {
                    // generate email activation key
                    var crypto = require("crypto");
                    var emailKey = crypto.randomBytes(30).toString('hex');

                    knex('players')
                        .insert({
                            email: email.toLowerCase(),
                            password: hashedPassword,
                            email_activation_key: emailKey
                        })
                        .then( function(result) {
                            // START SENDMAIL
                            var nodemailer = require('nodemailer');
                            var transporter = nodemailer.createTransport({
                                host: 'smtp.zoho.com',
                                port: 465,
                                auth: require('../config/keys').MAILMAN_CREDS
                            });
                            var mailOptions = {
                                from: '"NETCOT Center" <mailman@netcotcenter.com>',
                                to: email,
                                subject: 'Activate your NETCOT account',
                                text: `Greetings from NETCOT Center!\n\nThanks for creating an account at NETCOT! We're excited for you to join our community. Click the link below to activate your account to complete your registration and start playing!\n\n${require('../config/url').paths.web_url}/activate?code=${emailKey}\n\nSee you in the game!\nNETCOT Center Staff`,
                                html: `<!doctype html><html><head><meta name="viewport" content="width=device-width"><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"><title>Activate Your NETCOT Account</title><style>img{border:none;-ms-interpolation-mode:bicubic;max-width:100%}body{background-color:#f6f6f6;font-family:sans-serif;-webkit-font-smoothing:antialiased;font-size:14px;line-height:1.4;margin:0;padding:0;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%}table{border-collapse:separate;mso-table-lspace:0;mso-table-rspace:0;width:100%}table td{font-family:sans-serif;font-size:14px;vertical-align:top}.body{background-color:#f6f6f6;width:100%}.container{display:block;margin:0 auto!important;max-width:580px;padding:10px;width:580px}.content{box-sizing:border-box;display:block;margin:0 auto;max-width:580px;padding:10px}.main{background:#fff;border-radius:3px;width:100%}.wrapper{box-sizing:border-box;padding:20px}.content-block{padding-bottom:10px;padding-top:10px}.footer{clear:both;margin-top:10px;text-align:center;width:100%}.footer a,.footer p,.footer span,.footer td{color:#999;font-size:12px;text-align:center}h1,h2,h3,h4{color:#000;font-family:sans-serif;font-weight:400;line-height:1.4;margin:0;margin-bottom:30px}h1{font-size:35px;font-weight:300;text-align:center;text-transform:capitalize}ol,p,ul{font-family:sans-serif;font-size:14px;font-weight:400;margin:0;margin-bottom:15px}ol li,p li,ul li{list-style-position:inside;margin-left:5px}a{color:#3498db;text-decoration:underline}.btn{box-sizing:border-box;width:100%}.btn>tbody>tr>td{padding-bottom:15px}.btn table{width:auto}.btn table td{background-color:#fff;border-radius:5px;text-align:center}.btn a{background-color:#fff;border:solid 1px #3498db;border-radius:5px;box-sizing:border-box;color:#3498db;cursor:pointer;display:inline-block;font-size:14px;font-weight:700;margin:0;padding:12px 25px;text-decoration:none;text-transform:capitalize}.btn-primary table td{background-color:#3498db}.btn-primary a{background-color:#3498db;border-color:#3498db;color:#fff}.last{margin-bottom:0}.first{margin-top:0}.align-center{text-align:center}.align-right{text-align:right}.align-left{text-align:left}.clear{clear:both}.mt0{margin-top:0}.mb0{margin-bottom:0}.preheader{color:transparent;display:none;height:0;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;visibility:hidden;width:0}.powered-by a{text-decoration:none}hr{border:0;border-bottom:1px solid #f6f6f6;margin:20px 0}@media only screen and (max-width:620px){table[class=body] h1{font-size:28px!important;margin-bottom:10px!important}table[class=body] a,table[class=body] ol,table[class=body] p,table[class=body] span,table[class=body] td,table[class=body] ul{font-size:16px!important}table[class=body] .article,table[class=body] .wrapper{padding:10px!important}table[class=body] .content{padding:0!important}table[class=body] .container{padding:0!important;width:100%!important}table[class=body] .main{border-left-width:0!important;border-radius:0!important;border-right-width:0!important}table[class=body] .btn table{width:100%!important}table[class=body] .btn a{width:100%!important}table[class=body] .img-responsive{height:auto!important;max-width:100%!important;width:auto!important}}@media all{.ExternalClass{width:100%}.ExternalClass,.ExternalClass div,.ExternalClass font,.ExternalClass p,.ExternalClass span,.ExternalClass td{line-height:100%}.apple-link a{color:inherit!important;font-family:inherit!important;font-size:inherit!important;font-weight:inherit!important;line-height:inherit!important;text-decoration:none!important}#MessageViewBody a{color:inherit;text-decoration:none;font-size:inherit;font-family:inherit;font-weight:inherit;line-height:inherit}.btn-primary table td:hover{background-color:#34495e!important}.btn-primary a:hover{background-color:#34495e!important;border-color:#34495e!important}}</style></head><body class=""><span class="preheader">Activate your account to start playing NETCOT!</span><table role="presentation" border="0" cellpadding="0" cellspacing="0" class="body"><tr><td>&nbsp;</td><td class="container"><div class="content"><!-- START CENTERED WHITE CONTAINER --><table role="presentation" class="main"><!-- START MAIN CONTENT AREA --><tr><td class="wrapper"><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td><h1>Greetings from NETCOT Center!</h1><p>Thanks for creating an account at NETCOT! We're excited for you to join our community. Click the link below to activate your account to complete your registration and start playing!</p><table role="presentation" border="0" cellpadding="0" cellspacing="0" class="btn btn-primary"><tbody><tr><td align="left"><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tbody><tr><td><a href="${require('../config/url').paths.web_url}/activate?code=${emailKey}" target="_blank">Activate Account</a></td></tr></tbody></table></td></tr></tbody></table><p>See you in the game!</p><p>NETCOT Center Staff</p></td></tr></table></td></tr><!-- END MAIN CONTENT AREA --></table><!-- END CENTERED WHITE CONTAINER --></div></td><td>&nbsp;</td></tr></table></body></html>`
                            };
                            transporter.sendMail(mailOptions, function(error, info){
                                if (error) {
                                    console.log(error);
                                } else {
                                    console.log('Email sent: ' + info.response);
                                }
                            });
                            // END SENDMAIL
                            req.flash('reg_success_email', email.toLowerCase());
                            res.redirect(require('../config/url').paths.index);
                        })
                        .catch((err) => {console.dir(err)});
                }
            })
            .catch((err) => {console.dir(err)});
    }
})

function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}

module.exports = router;
