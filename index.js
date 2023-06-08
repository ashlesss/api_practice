const express = require('express');
// const fname = require('./filesystem/readfname');
const ysdb = require('./dbh');

const server = express();

server.use(express.json())
const PORT = 4000;

server.get('/api/init', (req, res) => {
    ysdb.add().then(ysdb => {
        res.status(200).json(ysdb)
    })
    .catch( error => {
        res.status(500).json({message: "cannot add dev"});
    });
});

server.delete('/api/init', (req, res) => {
    ysdb.delAll().then(ysdb => {
        res.status(200).json(ysdb)
    })
    .catch( error => {
        res.status(500).json({ message: "Delete all failed"});
    })
})

server.get('/api/rc', (req, res) => {
    ysdb.getRecord().then(ysdb => {
        res.status(200).json(ysdb)
    })
    .catch( error => {
        res.status(500).json({message: "cannot get rc"});
    });
});

// server.get('/api/sel/:id', (req, res) => {
//     ysdb.sel.then(ysdb => {
//         res.status(200).json(ysdb)
//     })
//     .catch( error => {
//         res.status(500).json({message: "cannot get rc"});
//     });
// });

server.listen(PORT, () => {
    console.log(`\n server running on port ${PORT} \n`)
});