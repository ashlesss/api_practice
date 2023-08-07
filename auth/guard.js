const jwt = require('jsonwebtoken');
const config = require('../config.json')

/**
 * This function will check for user's JWT token, if the token is valid,
 * then they can get access to other api backends. Otherwise, they will 
 * get denied.
 * @param {object} req Request body
 * @param {object} res Response body
 * @param {object} next Go to next route.
 */
function routeGuard(req, res, next) {
    const token = req.headers.authorization 
        && req.headers.authorization.split(' ')[1];
    const secret = config.JWTsecret

    if (token) {
        jwt.verify(token, secret, (err, decodedToken) => {
            if (err) {
                res.status(401).json({
                    error: 'invalid token'
                })
            }
            else {
                req.decodedToken = decodedToken
                next()
            }
        })
    }
    else if (req.query && req.query.token) {
        jwt.verify(req.query.token, secret, (err, decodedToken) => {
            if (err) {
                res.status(401).json({
                    error: 'invalid token'
                })
            }
            else {
                req.decodedToken = decodedToken
                next()
            }
        })
    }
    else {
        res.status(401).json({
            error: 'No token received'
        })
    }
}

module.exports = {
    routeGuard,
}