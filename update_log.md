Built based on [kikoeru project](https://github.com/kikoeru-project)

## 1/5/2024

1. Calculate work counts using the values returned by database.

## 1/4/2024

1. Optimize work's metadata requests.
2. Add search support for plain RJ code
3. When searching RJ code, it now will show the relevant translated works. 
4. Add `language_editions` metadata to database.

## 1/3/2024

1. Refactor search features.

## 1/2/2024

1. Fix regex return incorrect RJ code on scanning local RJ folders.
2. Add multi languages genres to database
3. Remove `redirectWork`.
4. Create new view table for work queries.

## 1/1/2024

1. Fix bugs on updating work's tracks.
2. Adding update work's tracks status to websocket.
3. Modulize socket and add authentication for websocket.

## 12/31/2023

1. Get media file's duration at scan and store it to the database.
2. Add health check to backend to notify frontend.
3. Change query work's tracks structures.(Refactor the `getWorkTracks` function)
4. Add update work's tracks module. 

## 12/30/2023

1. Fix some typos.
2. Change morgan time zone.

## 8/14/2023

### Add `randomPlay` route
1. this route is to used for randomly select works

### Add `.vtt` file extension
1. Add `.vtt` file extension to file list since front-end is supporting it.

## 8/11/2023

### Audio files' length/duration
1. Add a switch on `/download/` and `/stream/` api endpoint where front-end doesn't depend on these endpoint to get audio and subtitle's durations. And optimize server load.

### Http request log
1. Add http request logger `morgan`.

## 8/10/2023

### Audio files' length/duration
1. Get audio files' duration and add duration to the track information.

### `lrc` file
1. Get `lrc` file if that file in the same directory with audio.

## 8/9/2023

### Config file modification
1. Config file now can be modified through front-end by authorized users.

### Config route
1. Create config route to accept front-end config file modification.

### Database
1. Add `group` column to store user group. 

### JWT token
1. Add user `group` to the payload of JWT token to identify what groups the user belongs to.

## 8/8/2023

### Config file
1. Config file will now be created when the app starts if it doesn't exist.

### Database 
1. Database is now will be initialized at the start of the app if it doesn't exist, an admin user will be created upon database creation.
2. Schema is now managed by js file, no longer managed through migration file. Migration file is now only for migrate database data and test adding new data features.

### Scraper
1. Fix unformatted directory causing work's cover stored to different directory instead the directory in the config file.

## 8/7/2023

### JWT auth
1. Add a verification on request query token value. If user send JWT token through URL.

## 8/5/2023

### Login services
1. Add login services.

### JWT authorization
1. Use JWT to protect api from abuse.
2. JWT auth can be turn on or off.

## 8/4/2023

### In `./filesystem/scanModule.js`
1. Scanner now can scan deeper, with user's limitation depth, in the given root folders' path.

### In `./filesystem/utils/getFolderList.js`
1. Method that used to scan deeper in a specific given path.

### In `./filesystem/`
1. Combine all the util functions into a single `utils.js` file.

### Database
1. Remove `work_directory` since program doesn't use this info at all.
2. Change `work_foldername` to `work_dir` to store work folder relative directory. 

## 8/3/2023

### In `./database/query.js`
1. Refactor Regex for matching search keyword.

### In `./routes/db_query.js`
1. If the search keywords didn't have any match in the data or in Regex, return http code 200 with pagination and empty `works`.

## 8/2/2023

### In `./database/query.js`
1. Support search work with plain code. (RJcode without "RJ")

## 7/31/2023

### In `./routes/db_query.js`
1. Handle `subtitle` sorting.

## In `./database/query.js`
1. Handle `subtitle` sorting
2. Delete unnecessary step of reformating the work query result.

## 7/30/2023 

### In `./scraper/dlsite.js`
1. Add `has_subtitle` to database.

### In `./routes/db_query.js`
1. Handle `random` queries.

### In `./database/query.js` 
1. Handle `random` queries.

### In `./database/metadata.js`
1. Add `has_subtitle` value to database.

## 7/28/2023

### In `./scraper/dlsite.js`
1. Make redirected works' main image RJ code as same as the the RJ code on users' work folders.

### In `./filesystem/utils/getTracks.js`
1. Make all extension names to lower cases in order to make better file sorting.

### TODO 
1. Be able to scrape works that are translated by dlsite official. (Same work but different RJ code)

## 7/30/2023

### In `./routes/db_query.js`
1. Handle `random` query.

### In `./database/query.js`
1. Handle `random` query.

## 7/24/2023

### In `./routes/media.js`
1. Add more subtitle formats. 
2. Handle `fetch` request.

## 7/20/2023

### Known `BUGS`
1. ~~Some works don't have tags also, need to verify that before adding them to database.~~(Handled by front-end)

## 7/27/2023

### In `./routes/db_query.js`
1. When users query page number that is out of maximum page range, return pagination info and empty array of works instead of return 404.

## 7/18/2023

### In `./database/query.js`
1. Search is now support more searching options/keywords
    * sell: `$sell:1000$`
    * rate: `$rate:4.8$`
    * price: `$price:880$`

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