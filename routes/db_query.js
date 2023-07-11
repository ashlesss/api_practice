const express = require('express');
const ysdb = require('../database/query');
const router = express.Router();
const { query } = require('express-validator');
const { validate } = require('./utils/validateRequest')

// Endpoint /api/query/

router.get('/rc', 
    query('page').optional({nullable: true}).isInt(),
    (req, res) => {
        if (!validate(req, res)) return
        
        const currentPage = req.query.page || 1
        ysdb.getWorks(currentPage).then(ysdb => {
            if (ysdb.message && ysdb.message === 'no more page') {
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

// // Test function for isDuplicate()
// router.get('/dup/:id', (req, res) => {
//     ysdb.isDuplicate(req.params.id).then( ysdb => {
//         res.status(200).send(ysdb);
//         // console.log(ysdb.work[0].work_title);
//     })
//     .catch( error => {
//         res.status(500).send("message: error on get isDup")
//     })
// })

// router.get('/find/:id', (req, res) => {
//     ysdb.helper(req.params.id).then( ysdb => {
//         res.status(200).send(ysdb)
//     })
//     .catch( error => {
//         res.status(500).json({ message: "Error on helper()"})
//     })
// });

module.exports = router;