/**
 * Check if process.send() available, if available send payload 
 * to parent. Otherwise, print payload to the console.
 * @param {*} payload Can be object.
 */
const prcSend = payload => {
    if (process.send) {
        process.send(payload)
    }
    else {
        console.log(payload);
    }
}

module.exports = { 
    prcSend
}