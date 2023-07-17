const PORT = 4000;
const express = require('express');
const server = express();
const api = require('./api/server');
const cors = require('cors');
const http = require('http').createServer(server);
const io = require('socket.io')(http, {
    cors: {
        origin: '*'
    }
});
const child_process = require('child_process')

io.on("connection", socket => {
    console.log('Socket connection established');

    socket.emit('ON_SCAN_PAGE', 'Connection to server established.')

    socket.on("scan", res => {
        if (res === 'START_SCAN') {
            scanner = child_process.fork('./filesystem/scanner.js')
            scanner.on('message', msg => {
                if (msg.status) {
                    socket.emit('scan_completed', msg.message)
                }
                else {
                    socket.emit('progress', msg)
                }
            })
        }
        else {
            socket.emit('progress', 'Not scanning')
        }
    })
})


server.use(cors())
server.use(express.json())

// Expose api
api(server)

// Static assets
// http://localhost:4000/api/static/img/{imgName}
server.use('/api/static', express.static('static'))

http.listen(PORT, () => {
    console.log(`\n server running on port ${PORT} \n`)
});
