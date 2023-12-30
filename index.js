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
const { config } = require('./config')
const { initApp } = require('./database/init');
require('dotenv').config()
const morgan = require('morgan')
const fs = require("fs-extra")
const path = require('node:path');

// Init database and config file
initApp()

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

if (process.env.NODE_ENV === 'development') {
    if (fs.existsSync(path.join(__dirname, 'access.log'))) {
        fs.unlinkSync(path.join(__dirname, 'access.log'))
    }
    const accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' });

    morgan.token('date', function() {
        var p = new Date().toString().replace(/[A-Z]{3}\+/,'+').split(/ /);
        return( p[2]+'/'+p[1]+'/'+p[3]+':'+p[4]+' '+p[5] );
    });

    morgan.token('real-ip', (req) => {
        return req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    })
    server.use(morgan(':real-ip - :date[clf] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"', { stream: accessLogStream }))
}


// Expose api
api(server)

// Static assets
// http://localhost:4000/api/static/img/{imgName}
server.use('/api/static', express.static('static'))

http.listen(PORT, () => {
    console.log(`\n httpServer running on port ${PORT} \n`)
});
