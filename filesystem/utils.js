const fs = require("fs-extra")
const path = require('node:path'); 
const { config } = require('../config')
const recursiveReaddir = require('recursive-readdir')
const { orderBy } = require('natural-orderby');
const urljoin = require('url-join');
const mm = require('music-metadata');
const { WebVTTParser } = require('webvtt-parser');
const vttParser = require('subtitles-parser-vtt');
const subsrt = require('subsrt');
const lrcParser = require('lrc-parser')

async function* getFolderList(rootFolder, current = '', depth = 0 ) { 

    const folders = await fs.promises.readdir(path.join(rootFolder.path, current));
  
    for (const folder of folders) {
      const absolutePath = path.resolve(rootFolder.path, current, folder);
      const relativePath = path.join(current, folder);

      try {
        if ((await fs.promises.stat(absolutePath)).isDirectory()) {
            if (folder.match(/RJ(\d{6}|\d{8})/i)) { 
                // Found a work folder, don't go any deeper.
                yield {
                    rjcode: folder.match(/RJ(\d{6}|\d{8})/i)[0],
                    name: relativePath,
                    userSetRootDir: rootFolder.name,
        
                }
            } else if (depth + 1 < config.scannerMaxRecursionDepth) {
                // Found a folder that's not a work folder, go inside if allowed.
                yield* getFolderList(rootFolder, relativePath, depth + 1);
            }
          }
        } catch (err) {
            throw err
        }
    }
}

/**
 * 
 * @param {string} rjcode RJcode of the work.
 * @param {string} dir Absolute directory of requested work
 * @returns Work tracks array.
 */
const getWorkTrack = (rjcode, dir) => recursiveReaddir(dir)
    .then(files => {
        const filteredFiles = files.filter(file => {
            const ext = path.extname(file).toLowerCase()

            return (ext === '.mp3' || ext === '.ogg' || ext === '.opus' || ext === '.wav' || ext === '.aac'
            || ext === '.flac' || ext === '.webm' || ext === '.mp4'|| ext === '.m4a' 
            || ext === '.txt' || ext === '.lrc' || ext === '.srt' || ext === '.ass'
            || ext === '.pdf'
            || ext === '.jpg' || ext === '.jpeg' || ext === '.png' || ext === '.webp');
        })
        // console.log(filteredFiles);
        // console.log(files);


        const unSortedFilesPromises = filteredFiles.map(async file => {
            const shortFilePath = file.replace(path.join(dir, '/'), '');
            const dirName = path.dirname(shortFilePath);
            // console.log(shortFilePath);
            if (path.extname(file) === '.mp3'
            || path.extname(file) === '.wav'
            || path.extname(file) === '.ogg'
            || path.extname(file) === '.opus'
            || path.extname(file) === '.aac'
            || path.extname(file) === '.flac'
            || path.extname(file) === '.webm'
            || path.extname(file) === '.m4a') {
                const metadata = await mm.parseFile(file);
                const duration = metadata.format.duration
                return {
                    fileName: path.basename(file),
                    fileDirName: dirName === '.' ? null : dirName,
                    ext: path.extname(file),
                    duration: duration
                };
            }
            else if (path.extname(file) === '.lrc') {
                const lrcDuration = getLrcDuration(file)
                return {
                    fileName: path.basename(file),
                    fileDirName: dirName === '.' ? null : dirName,
                    ext: path.extname(file),
                    duration: lrcDuration
                }
            }
            else if (path.extname(file) === '.srt') {
                const srtDuration = getSrtDuration(file)
                return {
                    fileName: path.basename(file),
                    fileDirName: dirName === '.' ? null : dirName,
                    ext: path.extname(file),
                    duration: srtDuration
                }
            }
            else if (path.extname(file) === '.ass') {
                const assDuration = getAssDuration(file)
                return {
                    fileName: path.basename(file),
                    fileDirName: dirName === '.' ? null : dirName,
                    ext: path.extname(file),
                    duration: assDuration
                }
            }
            else if (path.extname(file) === '.vtt') {
                const vttDuration = getVttDuration(file)
                return {
                    fileName: path.basename(file),
                    fileDirName: dirName === '.' ? null : dirName,
                    ext: path.extname(file),
                    duration: vttDuration
                }
            }
            else {
                return {
                    fileName: path.basename(file),
                    fileDirName: dirName === '.' ? null : dirName,
                    ext: path.extname(file),
                };
            }
        })
    
        return Promise.all(unSortedFilesPromises)
        .then(unSortedFiles => {
            const sortedFiles = orderBy(
                unSortedFiles, [v => v.fileDirName, v => v.fileName, v => v.ext]
            )
    
            const sortedFilesHash = sortedFiles.map((sfile, index) => {
                if (sfile.duration || sfile.duration >= 0) {
                    return {
                        fileName: sfile.fileName,
                        fileDirName: sfile.fileDirName,
                        hash: `${rjcode}/${index}`,
                        ext: sfile.ext,
                        duration: sfile.duration
                    }
                }
                else {
                    return {
                        fileName: sfile.fileName,
                        fileDirName: sfile.fileDirName,
                        hash: `${rjcode}/${index}`,
                        ext: sfile.ext,
                    }
                }
            })
    
            // console.log(sortedFilesHash);
            return sortedFilesHash
        })
        .catch(err => {
            console.error(err)
        })
    })

/**
 * 
 * @param {object} tracks Tracks array.
 * @param {string} workTitle Work title.
 * @param {string} workDir Work relative directory. (work_foldername from database)
 * @param {string} rootFolder Single rootFolder from rootFolders.
 * @returns Array with tracks info.
 */
const toTree = (tracks, workTitle, workDir, rootFolder) => {
    const tree = [];
    
    // Insert folders
    tracks.forEach(track => {
        let fatherFolder = tree;
        const path = track.fileDirName ? track.fileDirName.split('/') : [];

        path.forEach(ifolderDirName => {
            const index = fatherFolder.findIndex(item => item.type === 'folder' && item.folderDirName === ifolderDirName);
            if (index === -1) {
                fatherFolder.push({
                type: 'folder',
                folderDirName: ifolderDirName,
                children: []
                });
            }
            fatherFolder = fatherFolder.find(item => item.type === 'folder' && item.folderDirName === ifolderDirName).children;
            });
        });
    // console.log(tree);
    
    // Insert files
    tracks.forEach(track => {
        let fatherFolder = tree;
        const paths = track.fileDirName ? track.fileDirName.split('/') : [];
        paths.forEach(ifolderDirName => {
        fatherFolder = fatherFolder.find(item => item.type === 'folder' && item.folderDirName === ifolderDirName).children;
        });
    
        // Path controlled by config.offloadMedia, config.offloadStreamPath and config.offloadDownloadPath
        // If config.offloadMedia is enabled, by default, the paths are:
        // /media/stream/VoiceWork/RJ123456/subdirs/track.mp3
        // /media/download//VoiceWork/RJ123456/subdirs/track.mp3
        //
        // If the folder is deeper:
        // /media/stream/VoiceWork/second/RJ123456/subdirs/track.mp3
        // /media/download/VoiceWork/second/RJ123456/subdirs/track.mp3
        let offloadStreamUrl = joinFragments(config.offloadStreamPath, rootFolder.name, workDir, track.fileDirName || '', track.fileName);
        let offloadDownloadUrl = joinFragments(config.offloadDownloadPath, rootFolder.name, workDir, track.fileDirName || '', track.fileName);
        if (process.platform === 'win32') {
        offloadStreamUrl = offloadStreamUrl.replace(/\\/g, '/');
        offloadDownloadUrl = offloadDownloadUrl.replace(/\\/g, '/');
        }
    
        const textBaseUrl = '/api/media/stream/'
        const mediaStreamBaseUrl = '/api/media/stream/'
        const mediaDownloadBaseUrl = '/api/media/download/'
        const textStreamBaseUrl = textBaseUrl + track.hash;    // Handle charset detection internally with jschardet
        const textDownloadBaseUrl = config.offloadMedia ? offloadDownloadUrl : mediaDownloadBaseUrl + track.hash;
        const mediaStreamUrl = config.offloadMedia ? offloadStreamUrl : mediaStreamBaseUrl + track.hash;
        const mediaDownloadUrl = config.offloadMedia ? offloadDownloadUrl : mediaDownloadBaseUrl + track.hash;
    
        if (track.ext === '.txt' || track.ext === '.lrc' || track.ext === '.srt' || track.ext === '.ass') { 
            if (track.ext !== '.txt') {
                fatherFolder.push({
                    type: 'text',
                    hash: track.hash,
                    title: track.fileName,
                    workTitle,
                    mediaStreamUrl: textStreamBaseUrl,
                    mediaDownloadUrl: textDownloadBaseUrl,
                    duration: track.duration
                });
            }
            else {
                fatherFolder.push({
                    type: 'text',
                    hash: track.hash,
                    title: track.fileName,
                    workTitle,
                    mediaStreamUrl: textStreamBaseUrl,
                    mediaDownloadUrl: textDownloadBaseUrl
                });
            }
        } else if (track.ext === '.jpg' || track.ext === '.jpeg' || track.ext === '.png' || track.ext === '.webp' ) {
            fatherFolder.push({
                type: 'image',
                hash: track.hash,
                title: track.fileName,
                workTitle,
                mediaStreamUrl,
                mediaDownloadUrl
            });
        } else if (track.ext === '.pdf') {
            fatherFolder.push({
                type: 'other',
                hash: track.hash,
                title: track.fileName,
                workTitle,
                mediaStreamUrl,
                mediaDownloadUrl
            });
        }
        else {
            if (track.duration) {
                fatherFolder.push({
                    type: 'audio',
                    hash: track.hash,
                    title: track.fileName,
                    workTitle,
                    mediaStreamUrl,
                    mediaDownloadUrl,
                    duration: track.duration
                });
            }
            else {
                fatherFolder.push({
                    type: 'audio',
                    hash: track.hash,
                    title: track.fileName,
                    workTitle,
                    mediaStreamUrl,
                    mediaDownloadUrl,
                });
            }
        }
    });
    // console.log(tree);
    return tree;
};

const encodeSplitFragments = (fragments) => {
    // On windows, replace "dir\RJ123456" => "dir/RJ123456"
    const expandedFragments = fragments.map(fragment => fragment.replace(/\\/g, '/').split('/'))
    return expandedFragments.flat().map(fragment => encodeURIComponent(fragment));
}

/**
 * 
 * @param {string} baseUrl Base url.
 * @param  {...string} fragments Fragments.
 * @returns URL without 'http://' or 'https://'
 */
const joinFragments = (baseUrl, ...fragments) => {
    const pattern = new RegExp(/^https?:\/\//);
    const encodedFragments = encodeSplitFragments(fragments);
    
    // http(s)://example.com/
    if (pattern.test(baseUrl)) {
        return urljoin(baseUrl, ...encodedFragments);
    } else {
        // /media/stream/
        return path.join(baseUrl, ...fragments).replace(/\\/g, '/');
    }
}

/**
 * Check if process.send() available, if available send payload 
 * to parent. Otherwise, print payload to the console.
 * @param {*} payload Can be object.
 */
const prcSend = payload => {
    if (process.send) {
        process.send(payload)
    }
    else {
        console.log(payload);
    }
}

function getLrcDuration(lrcPath) {
    try {
        const content = fs.readFileSync(lrcPath, 'utf-8');
        const data = lrcParser(content)
        if (data.scripts.length === 0) {
            return 'noContent'
        }
        else {
            const endTime = data.scripts[data.scripts.length - 1].end
            return endTime
        }
    }
    catch (err) {
        console.error(err)
        return 0
    }
    
}

function getVttDuration(VttPath) {
    try {
        const content = fs.readFileSync(VttPath, 'utf-8')
        const parser = new WebVTTParser ();
        const parsed = parser.parse(content);
        if (parsed.cues.length === 0) {
            return 'noContent'
        }
        else {
            return parsed.cues[parsed.cues.length - 1].endTime
        }
    }
    catch (err) {
        console.error(err)
        return 0
    }
}

function getSrtDuration(srtPath) {
    try {
        const content = fs.readFileSync(srtPath, 'utf-8')
        const parsed = vttParser.fromVtt(content);
        if (parsed.length === 0) {
            return 'noContent'
        }
        else {
            const endTime = parsed[parsed.length - 1].endTime
            return timestampToSeconds(endTime)
        }
    }
    catch(err) {
        console.error(err)
        return 0
    }
}

function timestampToSeconds(timestamp) {
    const [hour, minute, rest] = timestamp.split(':');
    const [second, millisecond] = rest.split(',');

    return parseInt(hour) * 3600 + 
           parseInt(minute) * 60 + 
           parseInt(second) + 
           parseInt(millisecond) / 1000;
}

function getAssDuration(assPath) {
    try {
        const content = fs.readFileSync(assPath, 'utf-8');
        const parsed = subsrt.parse(content, { format: 'ass' });
        const caption = parsed.filter(sub => sub.type === 'caption')
        if (caption.length === 0) {
            return 'noContent'
        }
        else {
            const endTime = caption[caption.length - 1].end
            return endTime / 1000
        }
    }
    catch (err) {
        console.error(err)
        return 0
    }
}

module.exports = {
    getFolderList,
    getWorkTrack,
    toTree,
    joinFragments,
    prcSend
}