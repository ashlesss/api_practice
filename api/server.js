//cSpell:disable
const dbquery = require('../routes/db_query');
const media = require('../routes/media')
const auth = require('../auth/auth')
const { routeGuard } = require('../auth/guard')
const { config } = require('../config')
const configRoute = require('../routes/config')
const history = require('../routes/history')

module.exports = server => {
    if (config.auth) {
        server.get('/api/health', (req, res) => {
            res.status(200).send('OK')
        })
        server.use('/api/query', routeGuard, dbquery);
        server.use('/api/media', routeGuard, media);
        server.use('/api/config', routeGuard, configRoute)
        server.use('/api/auth', auth)
        server.use('/api/history', routeGuard, history)
    }
    else {
        server.get('/api/health', (req, res) => {
            res.status(200).send('OK')
        })
        server.use('/api/query', dbquery);
        server.use('/api/media', media);
        server.use('/api/config', configRoute)
        server.use('/api/auth', auth)
        
        if (process.env.NODE_ENV === 'development') {
            server.use('/api/history', history)
        }
        
    }
}