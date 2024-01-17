const express = require('express');
const router = express.Router();
const { db } = require('../database/metadata')
const { config } = require('../config')
const { query, check, body, param } = require('express-validator');
const { validate } = require('./utils/validateRequest');
const {
    insertListenHistory, updateListenHistory,
    getListenHistory
} = require('../database/listenHistory')

const AUDIO_FILE = [
    '.mp3', '.ogg', '.opus', '.wav', '.aac', '.flac', 
    '.webm', '.m4a'
]
const VIDEO_FILE = [
    '.mp4'
]
const ALLOW_FILE = AUDIO_FILE.concat(VIDEO_FILE)

// Endpoint /api/history

router.post('/listening/', [
    check('rjcode', 'Illegal work code').matches(/RJ\d{6,8}/i),
    body('filename').custom(file => {
        const ext = file.slice(file.lastIndexOf('.'))
        if (!ALLOW_FILE.find(e => e === ext.toLowerCase())) {
            throw new Error('Illegal file name')
        }

        return true
    })
], 
async (req, res) => {

    if (!validate(req, res)) return
    // console.log(req.decodedToken);
    const { rjcode, filename, startAt } = req.body

    if (process.env.NODE_ENV) {
        req.decodedToken = {
            user: 'admin'
        }
    }

    try {
        if (req.decodedToken && rjcode && filename && startAt) {
            const result = await db('works_w_metadata_public')
            .select('rj_code')
            .where({
                rj_code: rjcode
            })
            .first()
    
            if (!result) {
                res.status(404).json({
                    status: 'work_not_found',
                    info: 'Current work not found'
                })
                return
            }

            // console.log(req.decodedToken);
            const hasHistory = await db('t_history')
            .select('rj_code')
            .where({
                rj_code: rjcode,
                username: req.decodedToken.user,
                file_name: filename
            })
            .first()

            if (hasHistory) {
                await updateListenHistory(req.body, req.decodedToken)
                res.status(200).json({
                    status: 'history_updated',
                    info: `${req.body.rjcode} history updated`
                })
            }
            else {
                await insertListenHistory(req.body, req.decodedToken)
                res.status(200).json({
                    status: 'history_created',
                    info: `${req.body.rjcode} history created`
                })
            }
            
        }
        else {
            res.status(422).json({
                status: 'fields_missing',
                info: `check below which fields are missing`,
                token: req.decodedToken ? 
                    (process.env.NODE_ENV === 'development' ? 'development' : 'ok') : 'missing',
                rjcode: rjcode ?? 'missing',
                filename: filename ?? 'missing',
                startAt: startAt ?? 'missing'
            })
        }
    }
    catch (err) {
        console.error(`[UPDATE LISTEN HISTORY] Updating/creating listen history error: `, err);
        res.status(500).json({
            status: 'history_error',
            info: 'Attemping to update/create listen history error'
        })
    }
    
})

router.get('/get/:id',
    param('id', 'Illegal work code').matches(/RJ\d{6,8}/i),
async (req, res) => {
    if (!validate(req, res)) return

    if (process.env.NODE_ENV) {
        req.decodedToken = {
            user: 'admin'
        }
    }

    try {
        if (req.decodedToken) {
            res.status(200).json(await getListenHistory(req.params.id, req.decodedToken))
        }
        else {
            res.status(422).json({
                status: 'fields_missing',
                info: `check below which fields are missing`,
                token: req.decodedToken ? 
                    (process.env.NODE_ENV === 'development' ? 'development' : 'ok') : 'missing',
                rjcode: req.params.id ?? 'missing'
            })
        }
    }
    catch (err) {
        console.error('[GET TRACK HISTORY] Get track history error', err);

        res.status(500).json({
            status: 'internal_error'
        })
    }
    
})

module.exports = router;