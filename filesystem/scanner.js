const { getWorkList, performScan } = require('./scanModule')

const rootFolders = [ '/mnt/hgfs/test/1/', '/mnt/hgfs/test/2/']
// getWorkList(rootFolders)
performScan(rootFolders)