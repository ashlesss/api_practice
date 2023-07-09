//cSpell:disable
const dl = require('./dlsite')

// const test = rjcode => {
//     const list = ['RJ343788', 'RJ306144']

//     // promises = []
//     // list.map(rjcodes => {
//     //     promises.push(
//     //         dl.scGetSaledata(rjcodes)
//     //     )
//     // })

//     // return Promise.all(promises)
//     // .then(res => {
//     //     console.log(res);
//     // })
//     dl.scGetSaledata('RJ343788')
//     .then(res => {
//         console.log(res);
//     })
// }

// test()
const list = ['RJ01018106', 'RJ01003143', 'RJ01019666', 'RJ01019849', 'RJ01023663', 'RJ01027644', 'RJ01029326', 'RJ01034675', 'RJ01034762', 'RJ01039429', 'RJ01042614', 'RJ01047019', 'RJ01047483', 'RJ01051302', 'RJ282973', 'RJ284318']
const promises = list.map(rj => {
    return dl.scWorkAllData(rj)
})

Promise.all(promises)
.then(res => {
    console.log(res);
})

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