//cSpell:disable
const axios = require('axios');
const fs = require("fs-extra");

/**
 * 
 * @param {string} rjcode RJ code
 * @returns Object work 
 */
const scGetMetadata = (rjcode) => new Promise((resolve, reject) => {
    url = `https://www.dlsite.com/maniax/api/=/product.json?locale=zh_CN&workno=${rjcode}`;
    work = {};

    axios({
        method: 'GET',
        url: url,
    })
    .then(res => {
        return res.data
    })
    .then(mdata => {
        if (mdata.length === 0) {
            reject(new Error(`No data returned by RJcode: ${rjcode}`))
        }
        work.workno = mdata[0].workno;
        work.alt_rj_code = Number(mdata[0].workno.slice(2))
        work.work_name = mdata[0].work_name;
        work.main_img = mdata[0].image_main.file_name;
        work.circle_id = Number(mdata[0].circle_id.slice(2))
        work.nsfw = (mdata[0].age_category_string === 'adult') ? true: false;
        work.official_price = mdata[0].official_price;
        work.regist_date = mdata[0].regist_date;
        work.rate_count_detail = mdata[0].rate_count_detail;
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
    url = `https://www.dlsite.com/maniax-touch/product/info/ajax?product_id=${rjcode}`;
    sale = {}

    axios({
        method: 'GET',
        url: url
    })
    .then(res => {
        return res.data
    })
    .then(data => {
        if (!data[rjcode]) {
            reject(new Error(`No data returned by RJcode: ${rjcode}`))
        }
        sale.dl_count = data[rjcode].dl_count;
        sale.rate_count = data[rjcode].rate_count;
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
const scGetImg = (rjcode) => new Promise((resolve, reject) => {
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

    // Hard coded img path
    imgPath = `../static/img/`

    if (fs.existsSync(`${imgPath}RJ${sid}_img_main.jpg`)) {
        console.log(`RJ${sid}_img_main.jpg already exists`);
        resolve(`RJ${sid}_img_main.jpg`);
    }
    else {
        axios({
            method: 'GET',
            url: `https://img.dlsite.jp/modpub/images2/work/doujin/RJ${sid}/${rjcode}_img_main.jpg`,
            responseType: 'stream'
        })
        .then(async res => {
            res.data.pipe(fs.createWriteStream(`${imgPath}RJ${sid}_img_main.jpg`));
            res.data.on('end', () => {
                console.log(`RJ${sid}_img_main.jpg download completed.`);
                resolve(`RJ${sid}_img_main.jpg`);
            })
        })
        .catch(err => {
            reject(`Download ${rjcode} cover failed with message: ${err.message}`);
        })
    }
})

// console.log(scGetImg('RJ080256'));

// scGetImg('RJ343788').then(data => {
//     console.log(data);
// })
// .catch(err => {
//     console.log(`scGetImg error: ${err}`);
// })

// scGetMetadata('RJ343788').then(data => {
//     console.log(data);
// })
// .catch(err => {
//     console.log(`scGetMetadata error: ${err}`);
// })

// scGetSaledata('RJ343788').then(data => {
//     console.log(data);
// })
// .catch(err => {
//     console.log(`scGetSaledata error: ${err}`);
// })