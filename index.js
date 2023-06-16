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

server.get('/api/find/:id', (req, res) => {
    ysdb.getWorkInfo(req.params.id).then( ysdb => {
        if (ysdb) {
            const message = {
                work: ysdb,
                message: "found"
            }
            res.status(200).send(message);
        }
        else {
            const message = {
                rj_code: req.params.id,
                message: "notfound"
            };
            res.status(404).send(message)
        }
    })
    .catch( error => {
        res.status(500).json({ message: "Error on getWorkInfo()"})
    })
});

server.get('/api/tag/:id', (req, res) => {
    ysdb.getWorkTag(req.params.id).then( ysdb => {
        res.status(200).send(ysdb);
    })
    .catch( error => {
        res.status(500).send("message: error on meta")
    })
})

// GET /api/record?rjcode=RJ123456
server.get('/api/record', (req, res) => {
    ysdb.getFullRecord(req.query.rjcode).then( ysdb => {
        res.status(200).send(ysdb);
        // console.log(ysdb.work[0].work_title);
    })
    .catch( error => {
        res.status(500).send("message: error on get work all record")
    })
})

server.listen(PORT, () => {
    console.log(`\n server running on port ${PORT} \n`)
});