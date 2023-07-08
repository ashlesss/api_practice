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
// const { scWorkAllData, scGetMetadata } = require('../scraper/dlsite')

// module.exports = {
//     add,
//     delAll,
    
// }

// // TODO 
// // Make rootFolder a dynamic value
// // Only read rjcode from the folder name 
// // Get work's name from API and write it to database

// /**
//  * Rate limiting the request 
//  * @param {Number} milliseconds 
//  */
// const sleep = (milliseconds) =>
//     new Promise((resolve) => setTimeout(resolve, milliseconds));

// async function add() {
//     // const rootFolder = '/mnt/hgfs/test/RJ400000/'
//     const rootFolder = '/mnt/hgfs/test/2/'
//     // const rootFolder = '/mnt/hgfs/RJ300000/'
//     const folders = fs.readdirSync(rootFolder);
//     let i = 0
//     let errorList = []
//     for ( const folder of folders ) {
//         if (folder.match(/RJ\d{8}/)) {
//             let gb_rjcode = folder.match(/RJ\d{8}/)[0]
//             if (! (await isDuplicate(gb_rjcode))) {
//                 await md.getWorksData(gb_rjcode).then(res => {
//                     if (res !== 'added') {
//                         errorList.push({RJcode: gb_rjcode, errMsg: res})
//                     }
//                     console.log(res);
//                 })
//                 .catch(err => {
//                     errorList.push({RJcode: gb_rjcode, errMsg: err.message})
//                     console.log(err);
//                 })

//                 i++;

//                 if ((i % 5) === 0) {
//                     console.log("Cooldown 2 sec for every 5 requests");
//                     await sleep(2000)
//                 }
//             }
//             else {
//                 continue
//             }
//         }
//         else if (folder.match(/RJ\d{6}/)) {
//             let gb_rjcode = folder.match(/RJ\d{6}/)[0]
//             if (!(await isDuplicate(gb_rjcode))) {
//                 await md.getWorksData(gb_rjcode).then(res => {
//                     if (res !== 'added') {
//                         errorList.push({RJcode: gb_rjcode, errMsg: res})
//                     }
//                     console.log(res);
//                 })
//                 .catch(err => {
//                     errorList.push({RJcode: gb_rjcode, errMsg: err.message})
//                     console.log(err);
//                 })

//                 i++

//                 if ((i % 5) === 0) {
//                     console.log("Cooldown 2 sec for every 5 requests");
//                     await sleep(2000)
//                 }
//             }
//             else {
//                 continue
//             }
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

// async function delAll() {
//     await db('ys').del().truncate();
//     await db('t_tag_id').del().truncate()
//     await db('t_tag').del().truncate()
//     await db('t_circle').del().truncate()
//     return db('ys')
// }