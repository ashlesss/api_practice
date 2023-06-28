Built based on [kikoeru project](https://github.com/kikoeru-project)

## 6/27/2023

### Database
1. add `circle_id`, `alt_rj_code`, `nsfw`, `official_price`, `dl_count`, `regist_date`, columns to database
2. create `t_circle` table to database


### Description
Pagination is now can use `alt_rj_code` to fulfill the sorting feature.

Optimized database inserting operation. Reduced repeating insertion to database instead of inserting metadata as an object into the database. 

Refactored `tag_id` and `t_tag` table. The `tag_id` is now the same with DLsite's API.

TODO
`dl_count`