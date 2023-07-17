Built based on [kikoeru project](https://github.com/kikoeru-project)

# Known dlsite API issues
1. When user gives work that is translated by dlsite official. The RJ code of that work will not contain any VAs info. And right now there is no way to redirect work to its original work by using info provided in dlsite api.

## 7/16/2023

### In `./filesystem/utils/getTracks.js`
1. Refactor the `getWorkTrack` method object's element names to prevent from mixed with `subtitle` as the subtitle of certain works. And `title` as title name of certain works.
    * `title` --> `fileName`
    * `subtitle` --> `fileDirName`
2. Refactor the `toTree` method object's elements names to prevent from mixed with `title` as title name of certain works.
    * `title` --> `folderDirName`
3. If folder is deeper, put that folder inside its parent's folder in `toTree` method. **(Only support Linux OS.)**

### In `./routes/media.js`
1. Create router that handle download and stream. (Mostly Adopted from [kikoeru project](https://github.com/kikoeru-project))

## 7/15/2023 

### In `./filesystem/utils/getTracks.js`
1. Add `getWorkTrack` and `toTree` methods that will get work track and insert tracks into a work tree. (Mostly Adopted from [kikoeru project](https://github.com/kikoeru-project)) 

## TODO 
1. ~~Api url in `toTree` need to change to current back-end api.~~(Completed)
2. ~~Add routers that serve streaming and downloading.~~(Completed)
3. Standardize api url with *kikoeru project*.
## 7/14/2023

### In `./database/query.js`
1. upgrade Precise searching precision. Searching is now can narrow down with the keywords provided by user. Only showing relevant results to user keywords.


## 7/13/2023

### In `./database/query.js`
1. Add `getWorkByKeyword` method to handle incoming search value and return results **(Wuhu~, drive me crazy)**

### In `./routes/`
1. Add route `/api/search/:keyword` to handle incoming search values.
2. Make a utility that is used to format the work results straight from the database.

### Database 
1. Fix `alt_rj_code` missing in `works_w_metadata` view table.

### Functionality
1. Precise *(I guess)* searching is now available
    * Search work by va, circle, tags
    * Support multiple keywords search

Precise searching is tested with small amounts of data. <br>

**It only support search formats like:**
    * va: `$va:秋山はるる$`
    * circle: `$va:テグラユウキ$`
    * tag: `$tag:环绕音$`
    * RJcode: `RJ12345678` or `RJ123456`

Direct search by va, circle, tag will be supported in the future.

## 7/12/2023

### In `./routes/db_query.js`
1. Remove duplicate api routes. **(QUERY API ENDPOINT CHANGED, FRONT-END REFACTOR REQUIRED)**
    * `/api/query/find/:id` is now moved to `/api/query/work/:id`.
    * `/api/query/tag/:id` is now deprecated.
    * `/api/query/record?rjcode` is now moved to `/api/query/work/:id`.

## In `./database/query.js`
1. Remove unused methods.

## 7/11/2023

### In `./database/query.js`
1. Change the pagination offset formula.
2. Remove returning all works feature.
3. Refactor the query JSON results **(QUERY API RESULT CHANGED, FRONT-END REFACTOR REQUIRED)** 

### In `./routes/db_query.js`
1. Work query api endpoint changed to `/api/query/works`. **(QUERY API ENDPOINT CHANGED, FRONT-END REFACTOR REQUIRED)** 

### Database 
1. add `work_main_img` to view table so that front-end can use that information to fetch work cover image. 

## 7/10/2023

### In `./database/metadata.js`
1. Add VAs related to the work to the db.
2. Check if `workdata.va` in `getWorksData` is `undefined` or not before inserting work to database. (See **Know dlsite API issues 1**)

### In `./scraper/dlsite.js`
1. Store VAs info to the work object.

### In `database.query.js`
1. Add VAs info to query results.
2. Optimize RJ work query. With `works_w_metadata` table, we can now return query result faster only make query to that table.

### Database
1. Create `t_va_id` and `t_va` table to store VAs for works.
2. Create `works_w_metadata` table which contains all works and their metadata all together for faster query 
**(SPECIAL THANKS TO KIKOERU PROJECT DEVS' SOURCE CODE!! So that I can really understand how nested views work in database)**

### TODO
1. ~~Create a view table which will be helpful for querying work's metadata.~~(Completed)

## 7/9/2023

### In `./scraper/dlsite.js`
1. Add error handler to `scWorkAllData`.
2. Redirect translated work's RJ code to work's original RJ code in order to 
get that work's valid metadata and saledata.
3. Store redirected work's `original_workno` from DLsite so that `scGetImg` method
will get the work's image as expected.

### In `./filesystem/`
1. Send logs to parent process.
2. Limit parallel requests in order to keep from being blocked by api providers.
3. Send invalid work/path list to parent to remind users the path is not a directory or a work with invalid RJ code.
4. Create a util `prcSend.js` to help child process send message to parent process.

### In `./database/`
1. Add `updateWorkDir` method in `metadata.js` to update work's directory if a work already existed in the database.
2. `worksPerPage` variable can be set in the config file. 

### TODO
1. ~~Need to check if the user provided RJ code is parent RJ code of the work in DLsite, if not, need to redirect the metadata request to work's parent RJ code.~~(completed)
2. ~~Add VAs to the database.~~(completed)
3. ~~Add more filter options to api. Such as sort with tags/va/circle etc.~~(Completed)

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
1. ~~add *try...catch* to the metadata function~~ (completed)
2. ~~add more error prompts which can be helpful if errors pop up~~(completed)

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
~~`dl_count`~~(completed)