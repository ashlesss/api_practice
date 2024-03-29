const jwt = require('jsonwebtoken');
const { config } = require('../config')

/**
 * 
 * @param {string} user 
 * @returns Signed JWT token
 */
const signToken = user => {
    const secret = config.JWTsecret
    const expiration = config.JWTexpiration
    
    const payload = {
        user: user.username,
        group: user.group,
        iss: config.issue,
        aud: config.audience
    }
    return jwt.sign(payload, secret, {expiresIn: expiration})
}

/**
 * 
 * @param {object} req Request body.
 * @param {object} res Response body.
 * @param {boolean} isAuth Is authentication enable?
 */
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
                        name: decodedToken.user,
                        group: decodedToken.group
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
                        name: decodedToken.user,
                        group: decodedToken.group
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

/**
 * Verify given token and return token information
 * 
 * Use for websocket ONLY.
 * 
 * @param {String} token 
 * @returns token information
 */
const verifyToken = (token) => {
    const secret = config.JWTsecret
    return jwt.verify(token, secret, (err, decodedToken) => {
        if (err) {
            return {
                status: 'error',
                message: 'Invalid token'
            }
        }
        else {
            if (decodedToken.user === 'admin') {
                decodedToken.status = 'authorized'
                return decodedToken
            }
            else {
                return {
                    status: 'unauthorized',
                    message: 'Only admin has permission to connect to socket'
                }
            }
        }
    })
}

module.exports = {
    signToken,
    getTokenInfo,
    verifyToken
}