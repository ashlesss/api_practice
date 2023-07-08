Built based on [kikoeru project](https://github.com/kikoeru-project)

## 7/8/2023

### In `./filesystem/`
1. Create `scanner` and `scanModule` to scan all the works in the given directories.
2. Test `process.send()`.
3. Able to remove duplicated works in scan queue and able to handle non-directory given by the users.
4. More feedback prompts with statistical info on scan progress.

### In `./database/`
1. `ops.js` and `opsTest.js` have been **deprecated**. Program will not use these to scan all the work in the given directories
instead of using scanner in `./filesystem`.
2. Add `updateSaledata` method in order to update work's sales data.

## 7/7/2023 

### In `./api/server.js`
1. Export api routes for `index.js` to initialize the server.

### In `./index.js`
1. Expose apis and create Websocket.

## 7/5/2023

### Push test files
1. Push test files to repo.

### In `./database/metadata/metadata.js`
1. Make transaction more reliable 
2. Add a ~~async~~ method that can be used for both getting work's metadata, and insert that work and its metadata into database.

### In `./database/ops.js`
1. Use `getWorksData` to fetch data and insert to database.
2. Refactor the error prompts. Works that made error will be collected to an array with work's RJcode and error message attached.

### In `./scraper/dlsite.js`
1. Contain all the fetching methods.
2. A ~~async~~ method `scWorkAllData` that will fetch and return a work's metadata and salesdata.
3. Fix variable(`url`, `work`, `sale`) didn't declare its type when created in `scGetMetadata`, `scGetSaledata`. And they cause to keep returning the same piece of data no matter what parameters are being put in.
4. Switch `rate_count_detail` source from DLsite's json api to ajax api in order to stay in the same data type with `updateSaledata` method.

## 7/3/2023

### In `./database/ops.js`
1. Put all the database insertion into `transaction`
2. Add more error prompts 

### Database
1. Change self-increment id to circle id from DLsite in `t_circle` table

## 7/2/2023

### In `./database/ops.js`
1. Fix if folder name has words in front of RJ code that cause program can't get the correct RJ code
to complete the operation which also causes program to crash. (BUG)
2. Add *records add completed* prompts.

### TODO
~~1. add *try...catch* to the metadata function~~ <br>
~~2. add more error prompts which can be helpful if errors pop up~~

## 6/28/2023

### In `./database/query.js`
1. Extract elements from array so that front-end can use that data directly.

### In `./routes/db_query.js`
1. When use `/api/query/rc?page=` if the page query number larger than max page calculated, it will return code 404.

### Functionality 
1. getImage function no longer fetches existing images from dlsite.
2. Use another public api to fetch sales info.
3. add sales info to the database
4. simplify codes.

### Database 
1. add `regist_date`, `rate_count`, `rate_average_2dp`, and `rate_count_detail` to the `ys` table.

## 6/27/2023

### Database
1. add `circle_id`, `alt_rj_code`, `nsfw`, `official_price`, `dl_count`, `regist_date`, columns to `ys` table.
2. create `t_circle` table to database


### Functionality
Pagination is now can use `alt_rj_code` to fulfill the sorting feature.

Optimized database inserting operation. Reduced repeating insertion to database instead of inserting metadata as an object into the database. 

Refactored `tag_id` and `t_tag` table. The `tag_id` is now the same with DLsite's API.

TODO
~~`dl_count`~~