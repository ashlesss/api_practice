//cSpell:disable
const dbquery = require('../routes/db_query');
const dbops = require('../routes/db_ops');

module.exports = server => {
    server.use('/api/query', dbquery);
    server.use('/api/ops', dbops);
}