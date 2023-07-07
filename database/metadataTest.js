//cSpell:disable
const md = require('./metadata')

// md.getWorksData('RJ343788')
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

md.updateSaledata('RJ343788')
.then(res =>{ 
    if (res === 'updated') {
        console.log(res);
    }
    else {
        console.log(`Update failed: ${res}`);
    }
})

// saledata = {
//     dl_count: '5400',
//     rate_count: 2119,
//     rate_count_detail: '[{"review_point":1,"count":5,"ratio":0},{"review_point":2,"count":14,"ratio":0},{"review_point":3,"count":70,"ratio":3},{"review_point":4,"count":214,"ratio":10},{"review_point":5,"count":1816,"ratio":85}]',
//     rate_average_2dp: 4.8
// }

// md.updateWorkSaledata('RJ343788', saledata)
// .then(res => {
//     console.log(res);
// })