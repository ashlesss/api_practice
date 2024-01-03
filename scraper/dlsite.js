//cSpell:disable
const axios = require('axios');
const fs = require("fs-extra");
const { config } = require('../config')
const path = require('node:path');

/**
 * Get zh_CN and en_US work metadata
 * 
 * This function will made 3 api requests to dlsite per work.
 * @param {string} rjcode RJ code
 * @returns Object work 
 */
const scGetMetadata = rjcode => new Promise((resolve, reject) => {

    let work = {};

    // Get English metadata
    axios({
        method: 'GET',
        url: `https://www.dlsite.com/maniax/api/=/product.json?locale=en_US&workno=${rjcode}`
    })
    .then(res => {
        const mdata = res.data
        if (mdata.length === 0) {
            reject(new Error(`No metadata returned by RJcode: ${rjcode}`))
        }

        work.enGenres = mdata[0].genres ? JSON.stringify(mdata[0].genres) : null
    })
    .catch(err => {
        reject(`Get work metadata failed on ${rjcode} with error message: ${err.messasge}.`)
    })

    // Get Japanese metadata
    axios({
        method: 'GET',
        url: `https://www.dlsite.com/maniax/api/=/product.json?locale=ja_JP&workno=${rjcode}`,
    })
    .then(res => {
        const mdata = res.data
        if (mdata.length === 0) {
            reject(new Error(`No metadata returned by RJcode: ${rjcode}`))
        }

        work.jpGenres = mdata[0].genres ? JSON.stringify(mdata[0].genres) : null
    })
    .catch(err => {
        reject(`Get work metadata failed on ${rjcode} with error message: ${err.messasge}.`)
    })

    // Get Chinese metadata
    axios({
        method: 'GET',
        url: `https://www.dlsite.com/maniax/api/=/product.json?locale=zh_CN&workno=${rjcode}`,
    })
    .then(res => {
        return res.data
    })
    .then(mdata => {
        if (mdata.length === 0) {
            reject(new Error(`No metadata returned by RJcode: ${rjcode}`))
        }

        work.workno = mdata[0].workno;
        work.alt_rj_code = Number(mdata[0].workno.slice(2))
        work.work_name = mdata[0].work_name;
        work.circle_id = Number(mdata[0].circle_id.slice(2))
        work.nsfw = (mdata[0].age_category_string === 'adult') ? true: false;
        work.official_price = mdata[0].official_price;
        work.regist_date = mdata[0].regist_date.slice(0, 10);
        // work.rate_count_detail = mdata[0].rate_count_detail;
        work.genres = mdata[0].genres ? JSON.stringify(mdata[0].genres) : null
        work.maker_name = mdata[0].maker_name
        work.va = mdata[0].creaters.voice_by ? JSON.stringify(mdata[0].creaters.voice_by) : null

        work.imageUrl = mdata[0].image_main.url ? mdata[0].image_main.url : mdata[0].image_thum.url

        if (mdata[0].options) {
            if (mdata[0].options.match(/\bCHI_HANS\b/) || mdata[0].options.match(/\bCHI_HANT\b/)) {
                work.has_subtitle = true
            }
            else {
                work.has_subtitle = false
            }
        }
        else {
            work.has_subtitle = false
        }
        resolve(work)
    })
    .catch(err => {
        reject(`Get work metadata failed on ${rjcode} with error message: ${err.messasge}.`)
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
const scGetImg = (rjcode, imgUrl) => new Promise((resolve, reject) => {

    const fullUrl = `https:${imgUrl}`
    const parsedUrl = new URL(fullUrl)
    const imgName = path.basename(parsedUrl.pathname)
    imgPath = config.img_folder
    // `${imgPath}${rjcode}_img_main.jpg`
    if (fs.existsSync(path.join(imgPath, imgName))) {
        console.log(`${imgName} already exists`);
        resolve({
            main_img: imgName
        });
    }
    else {
        axios({
            method: 'GET',
            url: fullUrl,
            responseType: 'stream'
        })
        .then(res => {
            res.data.pipe(fs.createWriteStream(path.join(imgPath, imgName)));
            res.data.on('end', () => {
                console.log(`${imgName} download completed.`);
                resolve({
                    main_img: imgName
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
            return scGetImg(metadata.workno, metadata.imageUrl)
                .then(imgName => {
                    return Object.assign(work, metadata, saledata, imgName)
                })
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
    // redirectedGetMetadata
}