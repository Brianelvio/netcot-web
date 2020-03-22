const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const knex = require('knex')( require('../config/keys').MySQLDetails );

module.exports = function(passport) {
    passport.use(
        new LocalStrategy({ usernameField: 'email' }, (email, password, done) => {
            knex('players')
                .limit(1)
                .where({ email: email })
                .then(function(result) {
                    

                    // Match user
                    if (result.length == 0) {
                        return done(null, false, { message: 'Email address is not registered' });
                    }

                    // Match password
                    const user = result[0];
                    bcrypt.compare(password, user.password, (err, isMatch) => {
                        if (err) throw err;
                        if (isMatch) {
                            // Check if email's activated   
                            if (user.email_activated == 0) {
                                return done(null, false, { message: 'Your account has not been activated. Check your email and follow the link to complete registration.' });
                            }
                            return done(null, user);
                       } else {
                           return done(null, false, { message: 'Incorrect password' });
                       }
                    });
                })
                .catch((err) => {console.dir(err)});
        })
    )

    passport.serializeUser((user, done) => {
        done(null, user.id);
    });
    
    passport.deserializeUser((id, done) => {
        knex('players')
            .limit(1)
            .where({ id: id })
            .then(function(result) {
                if (result.length == 0) {
                    done(null, null);
                } else {
                    const user = result[0];
                    done(null, user);
                }
            })
            .catch((err) => {console.dir(err)});
    });
}
