const recursiveReaddir = require('recursive-readdir')
const path = require('node:path'); 
const { orderBy } = require('natural-orderby');
const config = require('../../config.json')
const urljoin = require('url-join');

const getWorkTrack = (rjcode, dir) => recursiveReaddir(dir)
    .then(files => {
        const filteredFiles = files.filter(file => {
            const ext = path.extname(file)

            return (ext === '.mp3' || ext === '.ogg' || ext === '.opus' || ext === '.wav' || ext === '.aac'
            || ext === '.flac' || ext === '.webm' || ext === '.mp4'|| ext === '.m4a' 
            || ext === '.txt' || ext === '.lrc' || ext === '.srt' || ext === '.ass'
            || ext === '.pdf'
            || ext === '.jpg' || ext === '.jpeg' || ext === '.png' || ext === '.webp');
        })
        // console.log(fileredFiles);
        // console.log(files);
        const sortedFiles = orderBy(filteredFiles.map((file) => {
            const shortFilePath = file.replace(path.join(dir, '/'), '');
            const dirName = path.dirname(shortFilePath);
      
            return {
              title: path.basename(file),
              subtitle: dirName === '.' ? null : dirName,
              ext: path.extname(file),
            };
          }), [v => v.subtitle, v => v.title, v => v.ext]);
        //   console.log(sortedFiles);

          const sortedHashedFiles = sortedFiles.map(
            (file, index) => ({
              title: file.title,
              subtitle: file.subtitle,
              hash: `${rjcode}/${index}`,
              ext: file.ext,
            }),
          );
          return sortedHashedFiles;
        // console.log(sortedHashedFiles);
    })

const toTree = (tracks, workTitle, workDir, rootFolder) => {
    const tree = [];
    
    // Insert folders
    tracks.forEach(track => {
        let fatherFolder = tree;
        const path = track.subtitle ? track.subtitle.split('\\') : [];
        path.forEach(folderName => {
        const index = fatherFolder.findIndex(item => item.type === 'folder' && item.title === folderName);
        if (index === -1) {
            fatherFolder.push({
            type: 'folder',
            title: folderName,
            children: []
            });
        }
        fatherFolder = fatherFolder.find(item => item.type === 'folder' && item.title === folderName).children;
        });
    });
    
    // Insert files
    tracks.forEach(track => {
        let fatherFolder = tree;
        const paths = track.subtitle ? track.subtitle.split('\\') : [];
        paths.forEach(folderName => {
        fatherFolder = fatherFolder.find(item => item.type === 'folder' && item.title === folderName).children;
        });
    
        // Path controlled by config.offloadMedia, config.offloadStreamPath and config.offloadDownloadPath
        // If config.offloadMedia is enabled, by default, the paths are:
        // /media/stream/VoiceWork/RJ123456/subdirs/track.mp3
        // /media/download//VoiceWork/RJ123456/subdirs/track.mp3
        //
        // If the folder is deeper:
        // /media/stream/VoiceWork/second/RJ123456/subdirs/track.mp3
        // /media/download/VoiceWork/second/RJ123456/subdirs/track.mp3
        let offloadStreamUrl = joinFragments(config.offloadStreamPath, rootFolder.name, workDir, track.subtitle || '', track.title);
        let offloadDownloadUrl = joinFragments(config.offloadDownloadPath, rootFolder.name, workDir, track.subtitle || '', track.title);
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
        fatherFolder.push({
            type: 'text',
            hash: track.hash,
            title: track.title,
            workTitle,
            mediaStreamUrl: textStreamBaseUrl,
            mediaDownloadUrl: textDownloadBaseUrl
        });
        } else if (track.ext === '.jpg' || track.ext === '.jpeg' || track.ext === '.png' || track.ext === '.webp' ) {
        fatherFolder.push({
            type: 'image',
            hash: track.hash,
            title: track.title,
            workTitle,
            mediaStreamUrl,
            mediaDownloadUrl
        });
        } else if (track.ext === '.pdf') {
        fatherFolder.push({
            type: 'other',
            hash: track.hash,
            title: track.title,
            workTitle,
            mediaStreamUrl,
            mediaDownloadUrl
        });
        } else {
        fatherFolder.push({
            type: 'audio',
            hash: track.hash,
            title: track.title,
            workTitle,
            mediaStreamUrl,
            mediaDownloadUrl
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

module.exports = {
    getWorkTrack,
    toTree
}