const express = require('express');
const router = express.Router();
const { db } = require('../database/metadata');
const { check } = require('express-validator');
const { addUser } = require('../database/users')
const { validate } = require('../routes/utils/validateRequest')
const { signToken, getTokenInfo } = require('./utils');
const config = require('../config.json')

router.post('/register', [
    check('username', 'Username contains illegal characters or is out of length(5-15 characters).')
        .matches(/^[a-zA-Z0-9_-]{5,15}$/),
    check('password', 'Password must contain at least one lowercase letter, one number, and be between 5-20 characters in length.')
        .matches(/^(?=.*[a-z])(?=.*\d)[a-zA-Z\d]{5,20}$/)
], (req, res) => {
    if (!validate(req, res)) return 

    addUser(req.body)
    .then(result => {
        if (result.errno) {
            if (result.errno === 19) {
                res.status(422).json({
                    info: 'Username already taken.'
                })
            }
            else {
                console.log(result);
                res.status(500).json({
                    error: 'Registing caused error, try again later.'
                })
            }
            
        }
        else {
            res.status(200).json(`${result} created successfully.`)
        }
    })
})

router.post('/me', [
    check('username', 'Username must be at lease 5 characters.')
        .isLength({ min: 5}),
    check('password', 'Password must be at lease 5 characters.')
        .isLength({ min: 5})
],
(req, res) => {
    if (!validate(req, res)) return 

    const username = req.body.username
    const password = req.body.password

    db('t_user')
        .where({ username })
        .andWhere({ password })
        .first()
        .then(user => {
            if (!user) {
                res.status(401).json({ error: 'Wrong username or password.'})
            }
            else {
                const token = signToken(user.username)
                res.send({ token })
                // res.status(200).json({ info: 'login approved.'})
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
                    name: "admin"
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