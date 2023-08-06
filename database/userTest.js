const { addUser } = require('./users')

addUser({username: "ashless", password: "12345a"})
.then(res => {
    console.log(res);
})