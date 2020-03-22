const PORT = process.env.PORT || 5000;

const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const flash = require('connect-flash');
const session = require('express-session');
const knex = require('knex')( require('./config/keys').MySQLDetails );
const passport = require('passport');

const app = express();

// Passport config
require('./config/passport')(passport);

// EJS
app.use(expressLayouts);
app.set('view engine', 'ejs');

// POST parsing
app.use(express.urlencoded({ extended: false }));

// Express session middleware
app.use(session({
    secret: require('./config/keys').SESSION_SECRET.key,
    resave: true,
    saveUninitialized: true,
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Connect flash
app.use(flash());

// Global vars
app.use((req, res, next) => {
    res.locals.reg_success_email = req.flash('reg_success_email');
    res.locals.reg_error_msg = req.flash('reg_error_msg');
    res.locals.reg_fail_activation = req.flash('reg_fail_activation');
    res.locals.reg_success_activation = req.flash('reg_success_activation');
    res.locals.reg_already_registered = req.flash('reg_already_registered');
    res.locals.already_logged_in = req.flash('already_logged_in');
    res.locals.error = req.flash('error');
    res.locals.fail_auth = req.flash('fail_auth');
    res.locals.success_logout = req.flash('success_logout');
    res.locals.pass_reset_sent = req.flash('pass_reset_sent');
    res.locals.reset_fail = req.flash('reset_fail');
    res.locals.reg_fail_closed = req.flash('reg_fail_closed');
    next();
});

// Routes
app.use('/', require('./routes/index'));
app.use('/', require('./routes/activate'));
app.use('/', require('./routes/register'));
app.use('/', require('./routes/login'));
app.use('/', require('./routes/logout'));
app.use('/', require('./routes/play'));
app.use('/', require('./routes/recover'));
app.use('/', require('./routes/reset'));

// Assets
app.use(express.static('public'));

// 404
app.use(function (req, res, next) {
    res.status(404).send("Sorry can't find that!")
});

// MySQL Test
knex.raw('select 1+1 as result').catch(err => {
    console.log("Could not connect to MySQL. Closing program...");
    console.dir(err);
    process.exit(1);
});

// Begin listening for http requests
app.listen(PORT, console.log(`Listening on port ${PORT}`));
