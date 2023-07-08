const PORT = 4000;
const express = require('express');
const server = express()
const api = require('./api/server')
const cors = require('cors')
const http = require('http').createServer(server)
const io = require('socket.io')(http, {
    cors: {
        origin: '*'
    }
})

io.on("connection", socket => {
    console.log(socket.id);

    // const logs = [1, 2, 3, 4] 
    // socket.emit("something", 1234)
    socket.on("scan", res => {
        // console.log(res);
        if (res === 'START_SCAN') {
            socket.emit('progress', "Scanning")
            for (let i = 0; i < 10; i++) {
                socket.emit('progress', i)
            }
            socket.emit("failed", 'scan failed')
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
