//cSpell:disable
const dbquery = require('../routes/db_query');
const dbops = require('../routes/db_ops');
const media = require('../routes/media')

module.exports = server => {
    server.use('/api/query', dbquery);
    server.use('/api/ops', dbops);
    server.use('/api/media', media)
}