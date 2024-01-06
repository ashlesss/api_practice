const { db } = require('./metadata')

const addUser = user => db.transaction(trx => 
    trx('t_user').insert(user)
    .catch(err => {
        return err
    })
)

module.exports = {
    addUser
}