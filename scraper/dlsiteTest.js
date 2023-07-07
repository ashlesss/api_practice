//cSpell:disable
const dl = require('./dlsite')

const test = rjcode => {
    const list = ['RJ343788', 'RJ306144']

    // promises = []
    // list.map(rjcodes => {
    //     promises.push(
    //         dl.scGetSaledata(rjcodes)
    //     )
    // })

    // return Promise.all(promises)
    // .then(res => {
    //     console.log(res);
    // })
    dl.scGetSaledata('RJ343788')
    .then(res => {
        console.log(res);
    })
}

test()

// scWorkAllData('RJ343788').then(res => {
//     console.log(res);
// })

// scWorkAllData('RJ306114').then(res => {
//     console.log(res);
// })



// test1().then(res => {
//     console.log(res);
// })

// scWorkAllData('RJ305131').then(msg => {
//     console.log(msg.isCompleted);
// })

// console.log(scGetImg('RJ080256'));

// scGetImg('RJ343788').then(data => {
//     console.log(data);
// })
// .catch(err => {
//     console.log(`scGetImg error: ${err}`);
// })

// scGetMetadata('RJ343788').then(data => {
//     console.log(data);
// })
// .catch(err => {
//     console.log(`scGetMetadata error: ${err}`);
// })

// scGetSaledata('RJ343788').then(data => {
//     console.log(data);
// })
// .catch(err => {
//     console.log(`scGetSaledata error: ${err}`);
// })