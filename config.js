const fs = require("fs-extra")
const path = require('node:path');
const crypto = require('node:crypto');

const configFolderDir = process.pkg 
    ? path.join(process.execPath, '..', 'config')
    : path.join(__dirname);

const configPath = path.join(configFolderDir, 'config.json')

let config = {}

const defaultConfig = {
    img_folder: process.pkg 
        ? path.join(process.execPath, '..', 'static', 'img') 
        : path.join(__dirname, 'static', 'img'),
    db_path: process.pkg 
        ? path.join(process.execPath, '..', 'database') : path.join(__dirname, 'appDatabase'),
    rootFolders: [],
    maxParallelism: 16,
    worksPerPage: 12,
    offloadMedia: false,
    offloadStreamPath: "/media/stream/",
    offloadDownloadPath: "/media/download/",
    scannerMaxRecursionDepth: 2,
    issue: "http://ashless.io",
    audience: "http://ashless.io/api",
    JWTsecret: crypto.randomBytes(32).toString('hex'),
    JWTexpiration: "1w",
    auth: process.env.NODE_ENV === 'production' ? true : false,
    production: process.env.NODE_ENV === 'production' ? true : false,
}

function initConfig(writeConfigToFile = !process.env.FREEZE_CONFIG_FILE) {
    config = Object.assign(config, defaultConfig);
    if (writeConfigToFile) {
        fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, "\t"));
    }
}

if (!fs.existsSync(configPath)) {
    initConfig()
}
else {
    config = JSON.parse(fs.readFileSync(configPath));
}

module.exports = {
    initConfig,
    config
}