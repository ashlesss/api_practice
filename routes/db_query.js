const express = require('express');
const ysdb = require('../database/query');
const router = express.Router();
const { query } = require('express-validator');
const { validate } = require('./utils/validateRequest')
const config = require('../config.json')
const { formatResult } = require('./utils/formatWorkResult')

// Endpoint /api/query/

router.get('/work/:id', (req, res) => {
    ysdb.getFullRecord(req.params.id)
    .then(result => {
        res.status(200).json(result)
    })
})

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

/**
 * Handle keyword search.
 */
router.get('/search/:keyword', 
    query('page').optional({values: null}).isInt(),
    query('order').optional({values: null}).isIn(['alt_rj_code', 
    'regist_date', 'dl_count', 'rate_count', 'official_price', 'nsfw']),
    query('sort').optional({values: null}).isIn(['asc', 'desc']),
    (req, res) => {
        if (!validate(req, res)) return 
        
        ysdb.getWorkByKeyword(req.params.keyword, req.query.order, req.query.sort)
        .then(result => {
            const page = Number(req.query.page) || 1
            const totalWorks = result.length
            const totalPage = Math.ceil(totalWorks / Number(config.worksPerPage));
            const offset = (page - 1) * config.worksPerPage

            pagedResult = result.slice(offset, (offset + config.worksPerPage))
            const formattedResult = formatResult(pagedResult)
            res.status(200).json({
                pagination: {
                    currentPage: page,
                    max_page: totalPage,
                    total_works: totalWorks
                },
                works: formattedResult
            })
        })
        .catch(err => {
            if (err.message) {
                const msg = {
                    error: err,
                    error_message: err.message
                }
                res.status(404).json(msg)
            }
            else {
                res.status(404).json(err)
            }
        })
})

module.exports = router;