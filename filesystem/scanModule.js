const md = require('../database/metadata')
const { config } = require('../config')
const promiseLimit = require('promise-limit')
const { prcSend, getFolderList } = require('./utils')

const invalid = []

/**
 * 
 * @param {object} rootFolders Array of root folder's paths.
 * @returns work list.
 */
async function getWorkList(rootFolders) {
    workList = []
    for (const urootFolder of rootFolders) {
        for await (const folder of getFolderList(urootFolder, '', 0)) {
            workList.push(folder)
        }
    }
    return workList
}

/**
 * This method can handle when the folder name isn't contain any 
 * RJ code.
 * @param {string} rootFolder 
 * @param {string} folderName 
 * @returns An object contains folder RJcode, root folder path and folder name
 */
const getWorkFolderInfo = (rootFolder, folderName, userSetRootDir) => {
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
                    name: folderName,
                    userSetRootDir: userSetRootDir
                }
            }
            else {
                return {
                    rjcode: folderName.match(/RJ\d{6}/)[0],
                    rootFolder: rootFolder,
                    name: folderName,
                    userSetRootDir: userSetRootDir
                }
            }
        }
        else {
            // console.log(`${folderName.match(/RJ\d*/)[0]} is invalid`);
            invalid.push({
                object: folderName.match(/RJ\d*/)[0],
                reason: `Invalid RJcode on folder name`
            })

        }
    }
    else {
        // console.log(`${folderName} is invalid`);
        invalid.push({
            object: folderName,
            reason: `Not a Work folder.`
        })
    }
}

// {
//     rjcode: 'RJ299999',
//     name: 'RJ299999' or if the folder in deeper dicectory 'secondFolder/RJ299999',
//     userSetRootDir: 'src'
// },
const uniqueList = workList => {
    let uniqueList = [];
    let dupList = [];
    for (let i = 0; i < workList.length; i++) {
        for (let j = i + 1; j < workList.length; j++) {
            if (workList[i].rjcode === workList[j].rjcode) {
                dupList.push({
                    rjcode: workList[i].rjcode,
                    // rootFolder: workList[i].rootFolder,
                    name: workList[i].name,
                    userSetRootDir: workList[i].userSetRootDir
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
 * 
 * @param {object} folder Array with format:
 * {
    rjcode: work's RJ code,
    rootFolder: root folder path,
    name: name of the folder
   },

 * Process folder and if the same record detected in the db, no matter if the work's path changes,
 * update that work's path.
 * @returns 'added' when work added to db successfully, 'existed' when work exists in db, 
   and Error message when failed.
 */
const processFolder = folder => md.db('ys')
.where({rj_code: folder.rjcode})
.count({count: '*'})
.first()
.then(res => {
    if (res.count === '0') {
        return md.getWorksData(folder.rjcode, folder.name, folder.userSetRootDir)
        .then(result => {
            if (result === 'added') {
                return 'added'
            }
            else {
                return result
            }
        })
    }
    else {
        // md.updateWorkDir(folder.rjcode, folder.name, folder.userSetRootDir)
        return 'existed'
    }
})

// Create limit for parallel requests
const limit = promiseLimit(config.maxParallelism)

/**
 * Create limitation on parallel requests.
 * @param {object} folder Array of works with format:
 * {
    rjcode: work's RJ code,
    rootFolder: root folder path,
    name: name of the folder
   },
 */
const limitedProcessFolder = folder => {
    return limit(() => processFolder(folder))
}

/**
 * Perform scan on designated root folders.
 * @param {object} rootFolders Array of root folders passed from config file
 */
const performScan = async rootFolders => {
    try {
        const checkListResult = uniqueList(await getWorkList(rootFolders))
        // const checkListResult = uniqueList(await getWorkList(rootFolders))
        const uniqueFolderList = checkListResult.uniqueList
        const dupFolderList = checkListResult.dupList
        let count = {
            added: 0,
            failed: 0,
            existed: 0
        }

        const promises = uniqueFolderList.map(folder => {
            return limitedProcessFolder(folder)
            .then(result => {
                if (result === 'added') {
                    prcSend(`${folder.rjcode} added successfully.`)
                    count.added++
                }
                else if (result === 'existed') {
                    prcSend(`${folder.rjcode} already existed. Work's path updated.`)
                    count.existed++
                }
                else {
                    prcSend(`${folder.rjcode} added failed with error msg: ${result}`)
                    count.failed++
                }
            })
        })

        return Promise.all(promises).then(() => {
            const msg = `Scan completed: added : ${count.added},\n`
            + `existed: ${count.existed}\n`
            + `failed: ${count.failed}\nFound ${dupFolderList.length} of duplicate `
            + `work folders.\n`
            + `Invalid incidents: ${JSON.stringify(invalid)}`

            prcSend({status: 'SCAN_COMPLETED', message: msg})

            process.exit(0)
        })
    } catch(err) {
        if (err.code === 'ENOENT') {
            prcSend(`Error code: "${err.code}", on path: "${err.path}". `
            + `Check the path if the path exists in your system or not.`)
        }
        else {
            prcSend('Performing scan error')
        }
        process.exit(1)
    }

}

module.exports = {
    getWorkList,
    performScan,
    getWorkFolderInfo,
    uniqueList
}
