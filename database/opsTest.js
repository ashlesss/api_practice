// Deprecated, Only for reference

// //cSpell:disable
// const knex = require('knex')
// const config = require('../knexfile')
// const db = knex(config.development)
// const fs = require("fs-extra")
// const axios = require('axios')
// const path = require('node:path');
// const { isDuplicate } = require('./query')
// const md = require('./metadata')
// // const { scWorkAllData, scGetMetadata } = require('../scraper/dlsite')

// async function test_add() {
//     const rootFolder = '/mnt/hgfs/test/2/'
//     const folders = fs.readdirSync(rootFolder);
//     let errorList = []

//     for ( const folder of folders ) {
//         if (folder.match(/RJ\d{8}/)) {
//             let gb_rjcode = folder.match(/RJ\d{8}/)[0]
//             await md.getWorksData(gb_rjcode).then(res => {
//                 console.log(res);
//             })
//             .catch(err => {
//                 console.log(err);
//             })
//         }
//         else if (folder.match(/RJ\d{6}/)) {
//             let gb_rjcode = folder.match(/RJ\d{6}/)[0]
//             await md.getWorksData(gb_rjcode).then(res => {
//                 if (res !== 'added') {
//                     errorList.push({RJcode: gb_rjcode, errMsg: res})
//                     // console.log(err);
//                 }
//                 console.log(res);
//             })
//             .catch(err => {
//                 errorList.push({RJcode: gb_rjcode, errMsg: err.message})
//                 console.log(err);
//             })
//         }
//         else {
//             continue;
//         }
//     }

//     if (errorList.length > 0) {
//         return {
//             workCount: await db('ys').count({count: 'rj_code'}),
//             errorList: errorList
//         }
//     }
//     return await db('ys').count({count: 'rj_code'})
// }

// async function test1() {
//     console.log(await test_add());
// }

// test1()