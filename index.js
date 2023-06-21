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
        res.status(200).send(ysdb)
    })
    .catch( error => {
        res.status(500).json({ message: "Error on getWorkInfo()"})
    })
});

// server.get('/api/find/:id', (req, res) => {
//     ysdb.helper(req.params.id).then( ysdb => {
//         res.status(200).send(ysdb)
//     })
//     .catch( error => {
//         res.status(500).json({ message: "Error on helper()"})
//     })
// });

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

// Test function for isDuplicate()
server.get('/api/dup/:id', (req, res) => {
    ysdb.isDuplicate(req.params.id).then( ysdb => {
        res.status(200).send(ysdb);
        // console.log(ysdb.work[0].work_title);
    })
    .catch( error => {
        res.status(500).send("message: error on get isDup")
    })
})

// Test function for getImage()
// server.get('/api/img', (req, res) => {
//     ysdb.getImage().then( ysdb => {
//         res.status(200).send(ysdb);
//         // console.log(ysdb.work[0].work_title);
//     })
//     .catch( error => {
//         res.status(500).send("message: error on get work image.")
//     })
// })

// Serving work's image
// http://localhost:4000/api/static/img/{imgName}
// Path in database: ./static/img/{imgName}
// TODO 
// Check the path? if not valid path return error or something?
server.use('/api/static', express.static('static'))

server.listen(PORT, () => {
    console.log(`\n server running on port ${PORT} \n`)
});