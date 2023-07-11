const express = require('express');
const ysdb = require('../database/query');
const router = express.Router();
const { query } = require('express-validator');
const { validate } = require('./utils/validateRequest')

// Endpoint /api/query/

/**
 * Request work lists with query values.
 * Query values are optional.
 * 'page, 'order', and 'sort' are sanitized.
 * Endpoint example /api/query/works?page=1&order=alt_rj_code&sort=asc
 * order = ['alt_rj_code', 'regist_date', 'dl_count', 'rate_count', 'official_price', 'nsfw']
 */
router.get('/works', 
    query('page').optional({values: null}).isInt(),
    query('order').optional({values: null}).isIn(['alt_rj_code', 
    'regist_date', 'dl_count', 'rate_count', 'official_price', 'nsfw']),
    query('sort').optional({values: null}).isIn(['asc', 'desc']),
    (req, res) => {
        if (!validate(req, res)) return
        
        const currentPage = req.query.page || 1
        const currentOrder = req.query.order || 'alt_rj_code'
        const currentSort = req.query.sort || 'desc'
        ysdb.getWorks(currentPage, currentOrder, currentSort).then(ysdb => {
            if (ysdb.message) {
                res.status(404).json(ysdb);
            }
            else {
                res.status(200).json(ysdb);
            }
        })
        .catch( error => {
            res.status(500).json({message: `cannot get rc with error message: ${error}`});
        });
});

router.get('/find/:id', (req, res) => {
    ysdb.getWorkInfo(req.params.id).then( ysdb => {
        res.status(200).send(ysdb)
    })
    .catch( error => {
        res.status(500).json({ message: "Error on getWorkInfo()"})
    })
});

router.get('/tag/:id', (req, res) => {
    ysdb.getWorkTag(req.params.id).then( ysdb => {
        res.status(200).send(ysdb);
    })
    .catch( error => {
        res.status(500).send("message: error on meta")
    })
})

// GET /api/query/record?rjcode=RJ123456
router.get('/record', (req, res) => {
    ysdb.getFullRecord(req.query.rjcode).then( ysdb => {
        res.status(200).send(ysdb);
        // console.log(ysdb.work[0].work_title);
    })
    .catch( error => {
        res.status(500).send("message: error on get work all record")
    })
})

module.exports = router;