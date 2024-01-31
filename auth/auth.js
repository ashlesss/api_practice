const express = require('express');
const router = express.Router();
const { db } = require('../database/metadata');
const { check } = require('express-validator');
const { addUser } = require('../database/users')
const { validate } = require('../routes/utils/validateRequest')
const { signToken, getTokenInfo } = require('./utils');
const { config } = require('../config')
const bcrypt = require('bcrypt');

// Endpoint /api/auth

if (config.openRegister) {
    router.post('/register', [
        check('username', 'Username contains illegal characters or is out of length(5-15 characters).')
            .matches(/^[a-zA-Z0-9_-]{5,15}$/),
        check('password', 'Password must contain at least one lowercase letter, one number, and be between 5-20 characters in length.')
            .matches(/^(?=.*[a-z])(?=.*\d)[a-zA-Z\d]{5,20}$/)
    ], (req, res) => {
        if (!validate(req, res)) return 
    
        addUser(req.body)
        .then(result => {
            if (result === 'user_exists') {
                res.status(422).json({
                    status: 'user_exists',
                    info: 'Username already taken.'
                })
            }
            else {
                console.log(
                    `[REGISTER USER] ${result[0].username} created successfully.`
                );
                res.status(200)
                .json({
                    status: 'create_success',
                    info: `${result[0].username} created successfully.`
                })
            }
        })
        .catch(err => {
            console.error(`[REGISTER USER] Registering user error: $${err}`);
            res.status(500).json({
                error: 'Registing caused error, try again later.'
            })
        })
    })
}
else {
    router.post('/register', (req, res) => {
        res.status(200).json({
            error: 'Register user is not open'
        })
    })
}


router.post('/me', [
    check('username', 'Username must be at lease 5 characters.')
        .isLength({ min: 5}),
    check('password', 'Password must be at lease 5 characters.')
        .isLength({ min: 5})
],
(req, res) => {
    if (!validate(req, res)) return 

    const username = req.body.username
    const plainPassword = req.body.password

    db('t_user')
        .where({ username })
        .first()
        .then(user => {
            if (!user) {
                res.status(401).json({ error: 'Wrong username or password.'})
            }
            else {
                if (bcrypt.compareSync(plainPassword, user.password)) {
                    const token = signToken(user)
                    res.send({ token })
                    // res.status(200).json({ info: 'login approved.'})
                }
                else {
                    res.status(401).json({
                        status: 'login_failed',
                        info: 'Wrong username or password'
                    })
                }
            }
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({ error: 'Server error.'})
        })
})

router.get('/me', (req, res) => {
    try {
        if(config.auth) {
            getTokenInfo(req, res, config.auth)
        }
        else {
            res.status(200).json({
                user: {
                    name: "admin",
                    group: 'admin'
                },
                auth: config.auth
            })
        }
        
    }
    catch(err) {
        console.log(err);
        res.status(500).json({
            error: 'Trying to get JWT token error.'
        })
    }
    
})

module.exports = router