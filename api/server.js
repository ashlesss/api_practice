//cSpell:disable
const dbquery = require('../routes/db_query');
const media = require('../routes/media')
const auth = require('../auth/auth')
const { routeGuard } = require('../auth/guard')
const { config } = require('../config')
const configRoute = require('../routes/config')

module.exports = server => {
    if (config.auth) {
        server.use('/api/query', routeGuard, dbquery);
        server.use('/api/media', routeGuard, media);
        server.use('/api/config', routeGuard, configRoute)
        server.use('/api/auth', auth)
    }
    else {
        server.use('/api/query', dbquery);
        server.use('/api/media', media);
        server.use('/api/config', configRoute)
        server.use('/api/auth', auth)
    }
}