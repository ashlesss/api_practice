const express = require('express');
const ysdb = require('../database/query');
const router = express.Router();
const { query, param } = require('express-validator');
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
        ysdb.getFullRecord(req.params.id)
        .then(result => {
            if (result.message === 'workNotFound') {
                res.status(404).json(result)
            }
            else if (result.error) {
                res.status(404).json(result)
            }
            else {
                res.status(200).json(result)
            }
        })
    }
    else {
        if (id.length === 6 || id.length === 8) {
            const convertedId = `RJ${id}`
            console.log(convertedId);
            ysdb.getFullRecord(convertedId)
            .then(result => {
                if (result.message === 'workNotFound') {
                    res.status(404).json(result)
                }
                else if (result.error) {
                    res.status(404).json(result)
                }
                else {
                    res.status(200).json(result)
                }
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
        
        const order = req.query.order || 'alt_rj_code'
        const sort = req.query.sort || 'asc'
        ysdb.getWorkByKeyword(req.params.keyword, order, sort)
        .then(result => {
            // console.log(result);
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
            .catch(() => res.status(500).send({error: 'Failed to get track list, Check if the files are existed or rescan.'}))
        }
        else {
            res.status(500).send({error: `Folder not found: "${work.userset_rootdir}", Try restart server or rescan.`})
        }
    })
    .catch(err => {
        res.status(500).send({error: 'Querying database failed', message: err.message})
    })
})

module.exports = router;