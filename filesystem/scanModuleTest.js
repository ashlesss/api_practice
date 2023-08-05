const sc = require('./scanModule')

// const list = [
//     {
//         rjcode: 'RJ299999',
//         rootFolder: '/mnt/hgfs/test/2/',
//         name: 'RJ299999'
//     },
//     {
//         rjcode: 'RJ299999',
//         rootFolder: '/mnt/hgfs/test/2/',
//         name: 'RJ299999'
//     },
// ]
// const rootFolders = [ '/mnt/hgfs/test/1/']
// console.log(sc.uniqueList(sc.getWorkList(rootFolders)));
const rootFolder = [{
    "name": "src",
    "path": "/mnt/hgfs/test/1/"
}]
sc.getWorkList(rootFolder).then(res => {
    console.log(res);
})
// sc.getWorkList(rootFolder).then(res => {
//     // console.log(res);
// })
// sc.getWorkList(rootFolders)
// console.log(uniqueList(list));

// console.log(sc.getWorkList(rootFolders));

// console.log(sc.performScan(rootFolders));
// console.log(sc.getWorkFolderInfo("/mnt/hgfs/test/2/", "RJ3022289 あなたはどっち合法オナニー or 脱法オナニー「ルーインドオーガズム2・脱法オナニー編」〜ステイフィールドとルーインドオーガズムを嗜む音声〜"));