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
const promiseLimit = require('promise-limit');
const { db, insertMediaDuration } = require("../database/metadata");
const IMAGE_FILE = [
    '.jpg', '.jpeg', '.png', '.webp'
]
const SUBTITLE_FILE = [
    '.vtt', '.lrc', '.srt', '.ass'
]
const TEXT_FILE = ['.txt']
const OTHER_FILE = ['.pdf']
const AUDIO_FILE = [
    '.mp3', '.ogg', '.opus', '.wav', '.aac', '.flac', 
    '.webm', '.m4a'
]
const VIDEO_FILE = [
    '.mp4'
]
const MEDIA_FILE = AUDIO_FILE.concat(VIDEO_FILE)
const ALL_FILES = IMAGE_FILE.concat(
    SUBTITLE_FILE, IMAGE_FILE, TEXT_FILE, OTHER_FILE,
    AUDIO_FILE, VIDEO_FILE
)

async function* getFolderList(rootFolder, current = '', depth = 0 ) { 

    const folders = await fs.promises.readdir(path.join(rootFolder.path, current));
  
    for (const folder of folders) {
      const absolutePath = path.resolve(rootFolder.path, current, folder);
      const relativePath = path.join(current, folder);

      try {
        if ((await fs.promises.stat(absolutePath)).isDirectory()) {
            const regex = /RJ\d{6,8}/i
            if (folder.match(regex)) { 
                // Found a work folder, don't go any deeper.
                yield {
                    rjcode: folder.match(regex)[0],
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
 * @param {boolean} durationEnable Get audio and subtitle files duration switch. Default to true when no input.
 * @returns Work tracks array.
 */
const getWorkTrack = (rjcode, dir, durationEnable = true) => recursiveReaddir(dir)
.then(files => {
    // console.log(files);
    const filteredFiles = files.filter(file => {
        const ext = path.extname(file.path).toLowerCase()

        return ALL_FILES.find(e => e === ext);
    })
    // console.log(filteredFiles);
    // console.log(files);

    if (durationEnable) {
        const unSortedFilesPromises = filteredFiles.map(file => {
            const shortFilePath = file.path.replace(path.join(dir, '/'), '');
            const dirName = path.dirname(shortFilePath);
            return limitGetDuration(file, dirName, rjcode)
        })

        return Promise.all(unSortedFilesPromises)
        .then(unSortedFiles => {
            // console.log(unSortedFiles);
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
            console.error(err);
            return 'failed'
        })
    }
    else {
        const sortedFiles = orderBy(filteredFiles.map(file => {
            const shortFilePath = file.path.replace(path.join(dir, '/'), '');
            const dirName = path.dirname(shortFilePath);

            return {
                fileName: path.basename(file.path),
                fileDirName: dirName === '.' ? null : dirName,
                ext: path.extname(file.path),
            }
        }),[v => v.fileDirName, v => v.fileName, v => v.ext])

        const sortedFilesHash = sortedFiles.map((sfile, index) => {
            return {
                fileName: sfile.fileName,
                fileDirName: sfile.fileDirName,
                hash: `${rjcode}/${index}`,
                ext: sfile.ext,
            }
        })

        return sortedFilesHash
    }
})

const getDuration = (file, dirName, rjcode) => {
    if (MEDIA_FILE.find(e => e === path.extname(file.path))) {
        // console.log(file.mtimeMs);
        return db('t_track_duration')
        .select('duration')
        .where({
            rj_code: rjcode,
            file_name: path.basename(file.path),
            file_path: file.path
        })
        .andWhere(function() {
            this.where('mtime_ms', '=', file.mtimeMs)
        })
        .first()
        .then(duration => {
            // console.log(duration);
            if (duration) {
                return {
                    fileName: path.basename(file.path),
                    fileDirName: dirName === '.' ? null : dirName,
                    ext: path.extname(file.path),
                    duration: duration.duration
                }; 
            }

            return mm.parseFile(file.path)
            .then(metadata => {
                const duration = metadata.format.duration
                return insertMediaDuration(
                    rjcode, path.basename(file.path), duration, file.mtimeMs,
                    file.path
                )
                .then(() => {
                    return {
                        fileName: path.basename(file.path),
                        fileDirName: dirName === '.' ? null : dirName,
                        ext: path.extname(file.path),
                        duration: duration
                    };
                })
            })
        })
        
    }
    else if (path.extname(file.path) === '.lrc') {
        // const lrcDuration = await getLrcDuration(file)
        return getLrcDuration(file.path).then(lrcDuration => {
            return {
                fileName: path.basename(file.path),
                fileDirName: dirName === '.' ? null : dirName,
                ext: path.extname(file.path),
                duration: lrcDuration
            }
        })
    }
    else if (path.extname(file.path) === '.srt') {
        // const srtDuration = await getSrtDuration(file)
        return getSrtDuration(file.path).then(srtDuration => {
            return {
                fileName: path.basename(file.path),
                fileDirName: dirName === '.' ? null : dirName,
                ext: path.extname(file.path),
                duration: srtDuration
            }
        })
    }
    else if (path.extname(file.path) === '.ass') {
        // const assDuration = await getAssDuration(file)
        return getAssDuration(file.path).then(assDuration => {
            return {
                fileName: path.basename(file.path),
                fileDirName: dirName === '.' ? null : dirName,
                ext: path.extname(file.path),
                duration: assDuration
            }
        })
    }
    else if (path.extname(file.path) === '.vtt') {
        // const vttDuration = await getVttDuration(file)
        return getVttDuration(file.path).then(vttDuration => {
            return {
                fileName: path.basename(file.path),
                fileDirName: dirName === '.' ? null : dirName,
                ext: path.extname(file.path),
                duration: vttDuration
            }
        })
    }
    else {
        return {
            fileName: path.basename(file.path),
            fileDirName: dirName === '.' ? null : dirName,
            ext: path.extname(file.path),
        };
    }
}

const limit = promiseLimit(config.getFileDurationMaxParallelism ? 
    config.getFileDurationMaxParallelism : 2)
/**
 * 
 * @param {String} file Absolute directory of requested work
 * @param {String} dirName Directory name
 * @returns 
 */
const limitGetDuration = (file, dirName, rjcode) => {
    return limit(() => getDuration(file, dirName, rjcode))
}

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
    
        if (SUBTITLE_FILE.find(e => e === track.ext) 
            || TEXT_FILE.find(e => e === track.ext)
        ) { 
            fatherFolder.push({
                type: 'text',
                hash: track.hash,
                title: track.fileName,
                workTitle,
                mediaStreamUrl: textStreamBaseUrl,
                mediaDownloadUrl: textDownloadBaseUrl,
                duration: track.duration ?? undefined
            });
        } else if (IMAGE_FILE.find(e => e === track.ext)) {
            fatherFolder.push({
                type: 'image',
                hash: track.hash,
                title: track.fileName,
                workTitle,
                mediaStreamUrl,
                mediaDownloadUrl
            });
        } else if (OTHER_FILE.find(e => e === track.ext)) {
            fatherFolder.push({
                type: 'other',
                hash: track.hash,
                title: track.fileName,
                workTitle,
                mediaStreamUrl,
                mediaDownloadUrl
            });
        }
        else if (VIDEO_FILE.find(e => e === track.ext)) {
            fatherFolder.push({
                type: 'video',
                hash: track.hash,
                title: track.fileName,
                workTitle,
                mediaStreamUrl,
                mediaDownloadUrl,
                duration: track.duration ?? undefined
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
                duration: track.duration ?? undefined
            });
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

async function getLrcDuration(lrcPath) {
    try {
        const content = await fs.readFile(lrcPath, 'utf-8');
        const captions = subsrt.parse(content, { format: 'lrc'});
        if (captions.length === 0) {
            return 0
        }
        else {
            const data = captions.filter(caption => {
                if (caption.type === 'caption') {
                    return caption
                }
            })
            if (data.length === 0) {
                return 0
            }
            else {
                return (data[data.length - 1].end) / 1000
            }
        }
    }
    catch (err) {
        console.error(err)
        return 0
    }
    
}

async function getVttDuration(VttPath) {
    try {
        const content = await fs.readFile(VttPath, 'utf-8')
        const parser = new WebVTTParser ();
        const parsed = parser.parse(content);
        if (parsed.cues.length === 0) {
            return 0
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

async function getSrtDuration(srtPath) {
    try {
        const content = await fs.readFile(srtPath, 'utf-8')
        const parsed = vttParser.fromVtt(content);
        if (parsed.length === 0) {
            return 0
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

async function getAssDuration(assPath) {
    try {
        const content = await fs.readFile(assPath, 'utf-8');
        const parsed = subsrt.parse(content, { format: 'ass' });
        const caption = parsed.filter(sub => sub.type === 'caption')
        if (caption.length === 0) {
            return 0
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
    prcSend,
}