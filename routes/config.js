const express = require('express');
const router = express.Router();
const { config, setConfig } = require('../config')
const v8 = require('node:v8'); 

// Endpoint /api/config/

/**
 * 
 * @param {object} targetConfig Target config object.
 * @param {string} option "read" only read the config file.
 * @returns Modified config object
 */
function filterConfig(targetConfig, option = 'read') {
    const currentConfig = config
    const configClone = v8.deserialize(v8.serialize(targetConfig));
    delete configClone.JWTsecret
    if (option === 'write') {
        delete configClone.production
        if (process.env.NODE_ENV === 'production' || currentConfig.production) {
            delete configClone.auth
        }
    }
    return configClone
}

router.put('/admin', (req, res) => {
    if (!config.auth || req.decodedToken.group === 'admin') {
        try {
            setConfig(filterConfig(req.body.config, 'write'))
            res.status(200).json({ info: 'Config file saved successful.'})
        }
        catch (err) {
            res.status(500).json({ error: 'Saved failed', errInfo: err})
        }
    }
    else {
        res.status(403).json({ error: 'Only admin is allow to modify config file.'})
    }
})

router.get('/admin', (req, res) => {
    if (!config.auth || req.decodedToken.group === 'admin') {
        try {
            res.status(200).send({
                config: filterConfig(config, 'read')
            })
        }
        catch (err) {
            res.status(400).json({
                error: 'Get config file error',
                errInfo: err
            })
        }
    }
    else {
        res.status(403).json({
            error: 'Only admin is allow to modify config file.'
        })
    }
})

module.exports = router