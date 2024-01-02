const { config } = require('./config')
const socket = require('socket.io')
const child_process = require('child_process')
const { verifyToken } = require('./auth/utils')


/**
 * 
 * @param {object} server Http or Https server
 */
const initSocket = (server) => {
    const io = socket(server)
    io.on("connection", socket => {
        console.log('[socket.io] Socket connection initiated');
        if (config.auth) {
            console.log('[socket.io] Attemping verify the connection');
            if (socket.handshake.query && socket.handshake.query.jwt) {
                const isAuth = verifyToken(socket.handshake.query.jwt)
                switch (isAuth.status) {
                    case 'authorized':
                        console.log('[socket.io] Connect verified');
                        socketOperations(socket)
                        break
                    case 'unauthorized':
                        socket.emit('unauthorized', isAuth.message)
                        setTimeout(() => socket.disconnect(), 3000);
                        console.log('[socket.io] Unauthorized connection to socket');
                        break
                    case 'error':
                        socket.emit('error', isAuth.message)
                        setTimeout(() => socket.disconnect(), 3000);
                        console.log('[socket.io] Invalid token provided by connection');
                        break
                    default:
                        socket.emit('unKnownError', 'It looks like you\'ve found a bug')
                        setTimeout(() => socket.disconnect(), 3000);
                        console.log('[socket.io] Verifing token error');
                }
            }
            else {
                socket.emit('no_token', 'No token provided')
                setTimeout(() => socket.disconnect(), 3000);
                console.log('[socket.io] No token received from connect. Socket closed');
            }
        }
        else {
            console.log('[socket.io] Authorization is not enabled');
            socketOperations(socket)
        }
    })
}

/**
 * 
 * @param {object} socket Socket object
 */
const socketOperations = socket => {
    socket.emit('connected', 'Socket connected')
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

    socket.on("update", res => {
        if (res === 'START_UPDATE_TRACKS') {
            tracksUpdater = child_process.fork('./database/updateTracks.js')
            tracksUpdater.on('message', msg => {
                if (msg.status) {
                    socket.emit('update_tracks_completed', msg.message)
                }
                else {
                    socket.emit('progress', msg)
                }
            })
        }
    })
}

module.exports = {
    initSocket
}