//cSpell:disable
const md = require('./metadata')

// md.updateAllWorksDuration()

// md.insertMediaDuration('RJ164850', '123.mp3', 1234, '12345')
// .then(res => {
//     console.log(res);
// })


// md.getWorksData('RJ343788', '/mnt/hgfs/test/2/')
// .then(res => {
//     // console.log(res);
//     if (res === 'added') {
//         console.log('success');
//     }
//     else {
//         console.log(`errlog: ${res}`);
//     }
    
// })
// .catch(err => {
//     console.log(`getWorkData failed: ${err}`);
// })

// const list = ['RJ343788', 'RJ01018106']

// const promises = list.map(rjcode => {
//     md.getWorksData(rjcode, "/something", '/root')
//     .then(result => {
//         console.log(result);
//     })
// })

// Promise.all(promises)

// md.updateSaledata('RJ343788')
// .then(res =>{ 
//     if (res === 'updated') {
//         console.log(res);
//     }
//     else {
//         console.log(`Update failed: ${res}`);
//     }
// })

// saledata = {
//     dl_count: '5400',
//     rate_count: 2119,
//     rate_count_detail: '[{"review_point":1,"count":5,"ratio":0},{"review_point":2,"count":14,"ratio":0},{"review_point":3,"count":70,"ratio":3},{"review_point":4,"count":214,"ratio":10},{"review_point":5,"count":1816,"ratio":85}]',
//     rate_average_2dp: 4.8
// }

// md.updateWorkSaledata('RJ400984', saledata)
// .then(res => {
//     console.log(res);
// })

// md.updateWorkDir('RJ01018106', '/path_changed')