const express = require('express');
const dbquery = require('../routes/db_query');
const dbops = require('../routes/db_ops');

const server = express();

server.use(express.json())

server.use('/api/query', dbquery);

server.use('/api/ops', dbops);

// Serving work's image
// http://localhost:4000/api/static/img/{imgName}
// Path in database: ./static/img/{imgName}
// TODO 
// Check the path? if not valid path return error or something?
server.use('/api/static', express.static('static'))

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

module.exports = server;