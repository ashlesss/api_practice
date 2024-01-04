// const test = () => {
//     let a = "葉月ゆう 大山チロル $circle:大山チロル$ $circle:大山チロル$"
//     const result = a.match(/[^\s]+(?<=\$)(.*?)(?=\$)/g)
//     console.log(result);
// }

// test()
const { getWorks, randomOrder, getWorkByKeyword } = require('./query')

// getWorks(1, 'rate_average_2dp', 'desc', 0)
// .then(res => {
//     console.log(res);
// })

// console.log(work);

// console.log(randomOrder('something'))

// const allTerms = [
//     'Oneesan',
//     '/',
//     'Older Girl',
//     '/',
//     'Older',
//     'Sister',
//     'B-bishop',
//     '秋山はるる'
// ]

// const terms = 'Oneesan / Older Girl / Older Sister B-bishop $sell:1000$'
// const terms = 'Dirty Talk Collar / Chain / Restraints'

// getWorkByKeyword(terms, 'alt_rj_code', 'desc', 0)
// .then(res => {
//     console.log(res);
//     process.exit(0)
// })