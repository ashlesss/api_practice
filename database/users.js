const { db } = require('./metadata')

const addUser = user => db.transaction(trx => 
    trx('t_user').insert(user)
    .returning('username')
    .then((username) => {
        return username[0].username
    })
    .catch(err => {
        return err
    })
)

module.exports = {
    addUser
}