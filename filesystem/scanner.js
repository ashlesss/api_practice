const { performScan } = require('./scanModule')
const config = require('../config.json')

// const rootFolders = [ '/mnt/hgfs/test/1/', '/mnt/hgfs/test/2/']
// getWorkList(rootFolders)
performScan(config.rootFolders)