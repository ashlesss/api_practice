//cSpell:disable
const axios = require('axios');
const fs = require("fs-extra");
const config = require('../config.json')

/**
 * 
 * @param {string} rjcode RJ code
 * @returns Object work 
 */
const scGetMetadata = rjcode => new Promise((resolve, reject) => {
    const url = `https://www.dlsite.com/maniax/api/=/product.json?locale=zh_CN&workno=${rjcode}`;
    let work = {};

    axios({
        method: 'GET',
        url: url,
    })
    .then(res => {
        return res.data
    })
    .then(mdata => {
        if (mdata.length === 0) {
            reject(new Error(`No metadata returned by RJcode: ${rjcode}`))
        }

        if (mdata[0].translation_info.is_original === true) {
            work.workno = mdata[0].workno;
            work.alt_rj_code = Number(mdata[0].workno.slice(2))
            work.work_name = mdata[0].work_name;
            work.circle_id = Number(mdata[0].circle_id.slice(2))
            work.nsfw = (mdata[0].age_category_string === 'adult') ? true: false;
            work.official_price = mdata[0].official_price;
            work.regist_date = mdata[0].regist_date.slice(0, 10);
            // work.rate_count_detail = mdata[0].rate_count_detail;
            work.genres = JSON.stringify(mdata[0].genres)
            work.maker_name = mdata[0].maker_name
            work.va = JSON.stringify(mdata[0].creaters.voice_by)
            resolve(work)
        }
        else {
            return redirectedGetMetadata(mdata[0].translation_info.original_workno, mdata[0].work_name, rjcode)
            .then(rmdata => {
                resolve(rmdata)
            })
        }
    })
    .catch(err => {
        reject(`Get work metadata failed on ${rjcode} with error message: ${err.messasge}.`)
    })
})

/**
 * 
 * @param {string} originRjcode Original RJ code that is redirected to original 
 * work's RJ code from folder work's RJ code.
 * @param {string} rworkname Chinese work name.
 * @param {string} folderRjcode RJ code from user folder.
 * @returns work object that stores work metadata.
 */
const redirectedGetMetadata = (originRjcode, rworkname, folderRjcode) => new Promise((resolve, reject) => {
    const url = `https://www.dlsite.com/maniax/api/=/product.json?locale=zh_CN&workno=${originRjcode}`
    let work = {}

    axios({
        method: 'GET',
        url: url,
    })
    .then(res => {
        return res.data
    })
    .then(rmdata => {
        if (rmdata.length === 0) {
            reject(new Error(`No redirected metadata returned by RJcode: ${rjcode}`))
        }
        work.workno = folderRjcode;
        work.alt_rj_code = Number(folderRjcode.slice(2))
        work.original_workno = rmdata[0].workno
        work.work_name = rworkname;
        work.circle_id = Number(rmdata[0].circle_id.slice(2))
        work.nsfw = (rmdata[0].age_category_string === 'adult') ? true: false;
        work.official_price = rmdata[0].official_price;
        work.regist_date = rmdata[0].regist_date.slice(0, 10);
        // work.rate_count_detail = rmdata[0].rate_count_detail;
        work.genres = JSON.stringify(rmdata[0].genres)
        work.maker_name = rmdata[0].maker_name
        work.va = JSON.stringify(rmdata[0].creaters.voice_by)
        resolve(work)
    })
    .catch(err => {
        reject(`Get redirected work metadata failed on ${rjcode} with error message: ${err.messasge}.`)
    })
})

/**
 * 
 * @param {string} rjcode RJ code
 * @returns Object sales data
 */
const scGetSaledata = rjcode => new Promise((resolve, reject) => {
    const url = `https://www.dlsite.com/maniax-touch/product/info/ajax?product_id=${rjcode}`;
    let sale = {}

    axios({
        method: 'GET',
        url: url
    })
    .then(res => {
        return res.data
    })
    .then(data => {
        if (!data[rjcode]) {
            reject(new Error(`No salesdata returned by RJcode: ${rjcode}`))
        }
        sale.dl_count = data[rjcode].dl_count;
        sale.rate_count = data[rjcode].rate_count;
        sale.rate_count_detail = JSON.stringify(data[rjcode].rate_count_detail); 
        sale.rate_average_2dp = data[rjcode].rate_average_2dp;
        resolve(sale)
    })
    .catch(err => {
        if (err.message) {
            reject(`Get work saledata failed on ${rjcode} with error message: ${err.message}`)
        }
        else {
            reject(`Get work saledata failed on ${rjcode} with error message: ${err}`)
        }
    })
})

/**
 * 
 * @param {string} rjcode 
 * @return Img name
 */
const scGetImg = rjcode => new Promise((resolve, reject) => {
    let sid;
    if (rjcode.length === 8) {
        let nrj = Number(rjcode.slice(2))
        let tmp = (nrj % 1000 === 0) ? nrj : nrj - (nrj % 1000) + 1000
        sid = (`000000${tmp}`).slice(-6)
    }
    else {
        let nrj = Number(rjcode.slice(2))
        let tmp = (nrj % 1000 === 0) ? nrj : nrj - (nrj % 1000) + 1000
        sid = (`00000000${tmp}`).slice(-8)
    }

    imgPath = config.img_folder

    if (fs.existsSync(`${imgPath}${rjcode}_img_main.jpg`)) {
        // console.log(`${rjcode}_img_main.jpg already exists`);
        resolve({
            main_img: `${rjcode}_img_main.jpg`
        });
    }
    else {
        axios({
            method: 'GET',
            url: `https://img.dlsite.jp/modpub/images2/work/doujin/RJ${sid}/${rjcode}_img_main.jpg`,
            responseType: 'stream'
        })
        .then(res => {
            res.data.pipe(fs.createWriteStream(`${imgPath}${rjcode}_img_main.jpg`));
            res.data.on('end', () => {
                console.log(`${rjcode}_img_main.jpg download completed.`);
                resolve({
                    main_img: `${rjcode}_img_main.jpg`
                });
            })
            
        })
        .catch(err => {
            reject(`Download ${rjcode} cover failed with message: ${err.message}`);
        })
    }
})

/**
 * 
 * @param {string} rjcode RJcode
 * @returns Object work's all metadata, saledata, cover img name. Return error message when operation failed.
 */
const scWorkAllData = rjcode => {
    let work = {}
    return scGetMetadata(rjcode)
    .then(metadata => {
        return scGetSaledata(metadata.workno)
        .then(saledata => {
            if (metadata.original_workno) {
                return scGetImg(metadata.original_workno)
                .then(imgName => {
                    return Object.assign(work, metadata, saledata, imgName)
                })
            }
            else {
                return scGetImg(metadata.workno)
                .then(imgName => {
                    return Object.assign(work, metadata, saledata, imgName)
                })
            }
        })
    })
    .catch(err => {
        return err
    }) 
}

module.exports = {
    scGetMetadata,
    scGetSaledata,
    scGetImg,
    scWorkAllData,
    redirectedGetMetadata
}