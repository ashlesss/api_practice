const { db } = require('./metadata')

async function insertListenHistory(history, token) {
    await db('t_history')
    .insert({
        username: token.user,
        rj_code: history.rjcode,
        file_name: history.filename,
        start_at: history.startAt,
        listen_counts: 1
    })
}

async function updateListenHistory(history, token) {
    await db('t_history')
    .update({
        start_at: history.startAt,
    })
    .where({
        username: token.user,
        rj_code: history.rjcode,
        file_name: history.filename
    })
}

async function getListenHistory(rjcode, token) {
    return await db('t_history')
    .select('file_name', 'start_at')
    .where({
        rj_code: rjcode,
        username: token.user
    })
}

module.exports = {
    insertListenHistory,
    updateListenHistory,
    getListenHistory
}