const express = require('express');
const ysdb = require('../dbh');
const router = express.Router();

// Endpoint /api/ops/

router.get('/init', (req, res) => {
    ysdb.add().then(ysdb => {
        res.status(200).json(ysdb)
    })
    .catch( error => {
        res.status(500).json({message: "cannot add dev"});
    });
});

router.delete('/init', (req, res) => {
    ysdb.delAll().then(ysdb => {
        res.status(200).json(ysdb)
    })
    .catch( error => {
        res.status(500).json({ message: "Delete all failed"});
    })
})

module.exports = router;