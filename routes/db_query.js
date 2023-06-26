const express = require('express');
const ysdb = require('../dbh');
const router = express.Router();

// Endpoint /api/query/

router.get('/rc', (req, res) => {
    ysdb.getWorks(req.query.page).then(ysdb => {
        res.status(200).json(ysdb)
    })
    .catch( error => {
        res.status(500).json({message: "cannot get rc"});
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