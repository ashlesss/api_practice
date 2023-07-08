const child_process = require('child_process')

scanner = child_process.fork('./scanner.js')
scanner.on('message', msg => {
    console.log('Message from child:', msg);
})