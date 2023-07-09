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
        resolve(work)
    })
    .catch(err => {
        reject(`Get work metadata failed on ${rjcode} with error message: ${err.messasge}`)
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
        reject(`Get work saledata failed on ${rjcode} with error message: ${err.messasge}`)
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
    // resolve(sid)
    // console.log(sid);

    // Hard coded img path
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
    return Promise.all([
        scGetMetadata(rjcode),
        scGetSaledata(rjcode),
        scGetImg(rjcode)
    ])
    .then(res => {
        let work = {}
        return Object.assign(work, res[0], res[1], res[2])
    })
    .catch(err => {
        return err
    })
}

module.exports = {
    scGetMetadata,
    scGetSaledata,
    scGetImg,
    scWorkAllData
}