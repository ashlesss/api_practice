const jwt = require('jsonwebtoken');
const config = require('../config.json')

/**
 * 
 * @param {string} user 
 * @returns Signed JWT token
 */
const signToken = user => {
    const secret = config.JWTsecret
    const expiration = config.JWTexpiration
    
    const payload = {
        user: user,
        iss: config.issue,
        aud: config.audience
    }
    return jwt.sign(payload, secret, {expiresIn: expiration})
}

const getTokenInfo = (req, res, isAuth) => {
    const token = req.headers.authorization 
        && req.headers.authorization.split(' ')[1];
    const secret = config.JWTsecret 

    if (token) {
        jwt.verify(token, secret, (err, decodedToken) => {
            if (err) {
                res.status(401).json({
                    error: 'Invalid token',
                    auth: isAuth
                })
            }
            else {
                req.decodedToken = decodedToken
                res.status(200).json({
                    user: {
                        name: `${decodedToken.user}`,
                    },
                    auth: isAuth
                })
            }
        })
    }
    else if (req.query && req.query.token) {
        jwt.verify(req.query.token, secret, (err, decodedToken) => {
            if (err) {
                res.status(401).json({
                    error: 'Invalid token',
                    auth: isAuth
                })
            }
            else {
                req.decodedToken = decodedToken
                res.status(200).json({
                    user: {
                        name: `${decodedToken.user}`,
                    },
                    auth: isAuth
                })
            }
        })
    }
    else {
        res.status(401).json({
            error: 'No token received',
            auth: isAuth
        })
    }
}

module.exports = {
    signToken,
    getTokenInfo
}