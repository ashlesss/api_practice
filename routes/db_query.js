const express = require('express');
const ysdb = require('../database/query');
const router = express.Router();
const { query } = require('express-validator');
const { validate } = require('./utils/validateRequest')
const config = require('../config.json')
const { formatResult } = require('./utils/formatWorkResult')
const { getWorkTrack, toTree } = require('../filesystem/utils/getTracks')
const { db } = require('../database/metadata')
const path = require('node:path');

// Endpoint /api/query/

router.get('/work/:id', (req, res) => {
    const id = req.params.id
    if (isNaN(Number(id))) {
        db('works_w_metadata')
        .select('*')
        .where({rj_code: id})
        .then(work => {
            res.status(200).json(ysdb.getFullRecord(work[0]))
        })
        .catch(err => {
            res.status(404).json(err)
        })
    }
    else {
        if (id.length === 6 || id.length === 8) {
            const convertedId = `RJ${id}`
            // console.log(convertedId);
            db('works_w_metadata')
            .select('*')
            .where({rj_code: convertedId})
            .then(work => {
                res.status(200).json(ysdb.getFullRecord(work[0]))
            })
            .catch(err => {
                res.status(404).json(err)
            })
        }
        else {
            res.status(404).json({message: 'workNotFound'})
        }
    }
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
    'regist_date', 'dl_count', 'rate_count', 'official_price', 'nsfw', 
    'rate_average_2dp', 'random']),
    query('sort').optional({values: null}).isIn(['asc', 'desc']),
    query('subtitle').optional({values: null}).isInt(),
    (req, res) => {
        if (!validate(req, res)) return
        
        const currentPage = Number(req.query.page) || 1
        const currentOrder = req.query.order || 'alt_rj_code'
        const currentSort = req.query.sort || 'desc'
        const subtitle = Number(req.query.subtitle) || 0
        ysdb.getWorks(currentPage, currentOrder, currentSort, subtitle).then(ysdb => {
            res.status(200).json(ysdb);
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
    'regist_date', 'dl_count', 'rate_count', 'official_price', 'nsfw', 
    'rate_average_2dp', 'random']),
    query('sort').optional({values: null}).isIn(['asc', 'desc']),
    query('subtitle').optional({values: null}).isInt(),
    (req, res) => {
        if (!validate(req, res)) return 

        const order = req.query.order || 'alt_rj_code'
        const sort = req.query.sort || 'asc'
        const subtitle = Number(req.query.subtitle) || 0
        ysdb.getWorkByKeyword(req.params.keyword, order, sort, subtitle)
        .then(result => {
            if (typeof(result) !== 'undefined') {
                const page = Number(req.query.page) || 1
                const totalWorks = result.length
                const totalPage = Math.ceil(totalWorks / Number(config.worksPerPage));
                const offset = (page - 1) * config.worksPerPage

                pagedResult = result.slice(offset, (offset + config.worksPerPage))
                const formattedResult = formatResult(pagedResult)
                res.status(200).json({
                    pagination: {
                        current_page: page,
                        max_page: totalPage,
                        total_works: totalWorks
                    },
                    works: formattedResult
                })
            }
            else {
                res.status(404).json({error: 'Invalid keywords'})
            }
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

router.get('/tracks/:id', (req, res) => {
    // console.log(req.params.id);
    db('ys')
    .select('work_title', 'userset_rootdir', 'work_foldername')
    .where('rj_code', '=', req.params.id)
    .first()
    .then(work => {
        const rootFolder = config.rootFolders.find(rootFolder => rootFolder.name === work.userset_rootdir);
        if (rootFolder) {
            getWorkTrack(req.params.id, path.join(rootFolder.path, work.work_foldername))
            .then(tracks => {
                res.status(200).send(
                    toTree(tracks, work.work_title, work.work_foldername, rootFolder)
                )
            })
            .catch(() => res.status(500).send({error: 'Failed to get track list, Check if the files are existed on your device or rescan.'}))
        }
        else {
            res.status(500).send({error: `Folder not found: "${work.userset_rootdir}", Try restart server or rescan.`})
        }
    })
    .catch(err => {
        res.status(500).send({error: 'Querying database failed', message: err})
    })
})

module.exports = router;