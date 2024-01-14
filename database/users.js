const { db } = require('./metadata')
const bcrypt = require('bcrypt');

// const addUser = user => db.transaction(trx => 
//     trx('t_user').insert(user)
//     .catch(err => {
//         return err
//     })
// )

const addUser = user => db.transaction(function(trx) {
    const hashedPassword = bcrypt.hashSync(user.password, 12)
    user.password = hashedPassword

    return trx('t_user')
    .insert(user)
    .returning('username')
})
.catch(err => {
    if (err.constraint?.toString() === 't_user_username_unique') {
        return 'user_exists'
    }
    else {
        throw new Error(err)
    }
})

module.exports = {
    addUser
}