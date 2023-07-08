
// console.log('In Child.js')
  
// // If the send method is available
// if(process.send) {
  
//     // Send Hello
//     process.send("Hello, this is child process.");
// }

const fs = require("fs-extra")
const md = require('../database/metadata')


/**
 * Rate limiting the request 
 * @param {Number} milliseconds 
 */
const sleep = (milliseconds) =>
    new Promise((resolve) => setTimeout(resolve, milliseconds));


    // {
    //     rjcode: 'RJ299999',
    //     rootFolder: '/mnt/hgfs/test/2/',
    //     name: 'RJ299999'
    // },
const getWorkList = rootFolders => {
    workList = []
    for (const rootFolder of rootFolders) {
        if (fs.statSync(rootFolder).isDirectory()) {
            const works = fs.readdirSync(rootFolder)
            for (let i = 0; i < works.length; i++) {
                (typeof getWorkFolderInfo(rootFolder, works[i]) === 'undefined') ? '' : workList.push(getWorkFolderInfo(rootFolder, works[i]))
            }
        }
        else {
            if (process.send) {
                process.send(`${rootFolder} is not a folder.`)
            }
            else {
                console.log(`${rootFolder} is not a folder.`);
            }
            // console.log(`${rootFolder} is not a folder.`);
            continue
        }
    }
    // process.send(workList)
    return workList
}

/**
 * This method can handle when the folder name isn't contain any 
 * RJ code.
 * @param {string} rootFolder 
 * @param {string} folderName 
 * @returns An object contains folder RJcode, root folder path and folder name
 */
const getWorkFolderInfo = (rootFolder, folderName) => {
    // console.log(folderName.match(/RJ\d*/));
    // const rjcodeLen = folderName.match(/RJ\d*/)[0].length
    // console.log(rjcodeLen);
    if (folderName.match(/RJ\d*/)) {
        const rjcodeLen = folderName.match(/RJ\d*/)[0].length
        if (rjcodeLen === 10 || rjcodeLen === 8) {
            const rjcode = folderName.match(/RJ\d*/)[0]
            // console.log(rjcode);
            if (rjcode.length === 10) {
                return {
                    rjcode: folderName.match(/RJ\d{8}/)[0],
                    rootFolder: rootFolder,
                    name: folderName
                }
            }
            else {
                return {
                    rjcode: folderName.match(/RJ\d{6}/)[0],
                    rootFolder: rootFolder,
                    name: folderName
                }
            }
        }
        else {
            console.log(`${folderName.match(/RJ\d*/)[0]} is invalid`);
        }
    }
    else {
        console.log(`${folderName} is invalid`);
    }
}

// {
//     rjcode: 'RJ299999',
//     rootFolder: '/mnt/hgfs/test/2/',
//     name: 'RJ299999'
// },
const uniqueList = workList => {
    let uniqueList = [];
    let dupList = [];
    for (let i = 0; i < workList.length; i++) {
        for (let j = i + 1; j < workList.length; j++) {
            if (workList[i].rjcode === workList[j].rjcode) {
                // dupList[workList[i].rjcode] = dupList[workList[i].rjcode] || []
                // dupList[workList[i].rjcode].push(JSON.stringify(workList[i]))
                dupList.push({
                    rjcode: workList[i].rjcode,
                    rootFolder: workList[i].rootFolder,
                    name: workList[i].name,
                })
                i++;
            }
        }
        uniqueList.push(workList[i])
    }
    return {
        uniqueList,
        dupList
    }
}

/**
 * Development phase it takes folder's paths as an object.
 * Production phase it will get folder's paths from config file.
 * @param {object} rootFolders 
 */
const performScan = rootFolders => {
    // return uniqueList(getWorkList(rootFolders))
    const checkListResult = uniqueList(getWorkList(rootFolders))
    const uniqueFolderList = checkListResult.uniqueList
    const dupFolderList = checkListResult.dupList
    // console.log(dupFolderList.length);
    let count = {
        added: 0,
        failed: 0
    }

    // if (dupFolderList.length !== 0) {
    //     console.log('object');
    // }

    const promises = uniqueFolderList.map(folder => 
        md.getWorksData(folder.rjcode, folder.rootFolder)
        .then(result => {
            if (result === 'added') {
                console.log(`${folder.rjcode} added successfully.`);
                count.added++
            }
            else {
                console.log(`${folder.rjcode} added failed with error msg: ${result}`);
                count.failed++
            }
        })
    )

    return Promise.all(promises).then(() => {
        console.log(`Scan completed: added : ${count.added}, `
        + `failed: ${count.failed}\nFound ${dupFolderList.length} of duplicate `
        + `work folders.`);

        process.exit(0)
    })

}

module.exports = {
    getWorkList,
    performScan,
    getWorkFolderInfo,
    uniqueList
}