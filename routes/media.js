const express = require('express');
const router = express.Router();
const { db } = require('../database/metadata')
const { config } = require('../config')
const { getWorkTrack, toTree, joinFragments } = require('../filesystem/utils')
const path = require('node:path');
const jschardet = require("jschardet")
const fs = require("fs-extra")

// Endpoint /api/media

router.get('/stream/:id/:hashIndex', (req, res) => {
    db('ys')
    .select('userset_rootdir', 'work_dir')
    .where({rj_code: req.params.id})
    .first()
    .then(work => {
        const rootFolder = config.rootFolders.find(rootFolder => rootFolder.name === work.userset_rootdir);
        // console.log(path.join(rootFolder.path, work.work_dir));
        if (rootFolder) {
            getWorkTrack(req.params.id, path.join(rootFolder.path, work.work_dir))
            .then(tracks => {
                const track = tracks[req.params.hashIndex]

                const fileName = path.join(rootFolder.path, work.work_dir, 
                    track.fileDirName || '', track.fileName);
                
                const extName = path.extname(fileName);
                if (extName === '.txt' || extName === '.lrc' || extName === '.ass' || extName === '.srt' || extName === '.vtt') {
                    const fileBuffer = fs.readFileSync(fileName);
                    const charsetMatch = jschardet.detect(fileBuffer).encoding;
                    if (charsetMatch) {
                        res.set('Content-Type', `text/plain; charset=${charsetMatch}`)
                    }
                }
                if (extName === '.flac') {
                    // iOS not support audio/x-flac
                    res.set('Content-Type', `audio/flac`);
                }
                // Offload from express, 302 redirect to a virtual directory in a reverse proxy like Nginx
                // Only redirect media files, not including text files and lrcs because we need charset detection
                // so that the browser properly renders them
                if (config.offloadMedia && extName !== '.txt' && extName !== '.lrc' && extName !== '.ass' && extName !== '.srt' && extName !== '.vtt') {
                // Path controlled by config.offloadMedia and config.offloadStreamPath
                // By default: /media/stream/VoiceWork/RJ123456/subdirs/track.mp3
                // If the folder is deeper: /media/stream/VoiceWork/second/RJ123456/subdirs/track.mp3
                const baseUrl = config.offloadStreamPath;
                let offloadUrl = joinFragments(baseUrl, rootFolder.name, 
                    work.work_dir, track.fileDirName || '', track.fileName);

                // Check if current process is running on Windows platform
                if (process.platform === 'win32') {
                    offloadUrl = offloadUrl.replace(/\\/g, '/');
                }

                // console.log(offloadUrl);
                res.redirect(offloadUrl);
                } else {
                // By default, serve file through express
                res.sendFile(fileName);
                }
            })
            .catch(err => {
                res.status(500).json(err)
            })
        }
        else {
            res.status(500).send({error: `Failed to find folder: ` 
            + `"${work.userset_rootdir}", restart the server or rescan.`});
        }
    })
    .catch(err => {
        console.error(err)
        res.status(500).json({ error: 'Check server log for more info'})
    })
})

router.get('/download/:id/:hashindex', (req, res) => {
    db('ys')
    .select('userset_rootdir', 'work_dir')
    .where({rj_code: req.params.id})
    .first()
    .then(work => {
        const rootFolder = config.rootFolders.find(rootFolder => 
            rootFolder.name === work.userset_rootdir);
        
        if (rootFolder) {
            getWorkTrack(req.params.id, path.join(rootFolder.path, work.work_dir))
            .then(tracks => {
                const track = tracks[req.params.hashindex];

                if (config.offloadMedia) {
                    // Path controlled by config.offloadMedia and config.offloadDownloadPath
                    // By default: /media/download/VoiceWork/RJ123456/subdirs/track.mp3
                    // If the folder is deeper: /media/download/VoiceWork/second/RJ123456/subdirs/track.mp3
                    const baseUrl = config.offloadDownloadPath;
                    let offloadUrl = joinFragments(baseUrl, rootFolder.name, 
                        work.work_dir, track.fileDirName || '', track.fileName);
                    
                    if (process.platform === 'win32') {
                        offloadUrl = offloadUrl.replace(/\\/g, '/');
                    }

                    // Note: you should set 'Content-Disposition: attachment' header in your reverse proxy for the download virtual directory
                    // By default the directory is /media/download
                    res.redirect(offloadUrl);
                } 
                else {
                    // By default, serve file through express
                    const rootFolderPath = rootFolder.path
                    const fileName = work.work_dir
                    const trackPath = track.fileDirName || ''
                    const filePath = path.join(rootFolderPath, fileName, trackPath, track.fileName)
                    if (req.headers['x-requested-with'] === 'XMLHttpRequest') {
                        res.sendFile(filePath)
                    }
                    else {
                        res.download(filePath);
                    }
                    
                }
            })
            .catch(err => {
                res.status(500).json(err)
            })
        }
        else {
            res.status(500).send({error: `Failed to find folder: ` 
                + `"${work.userset_rootdir}", restart the server or rescan.`});
        }
    })
    .catch(err => {
        res.status(500).send({error: 'Querying database failed, ' 
            + 'Check your input values or restart server or rescan.',
            errorMsg: err
        })
    })
})

module.exports = router