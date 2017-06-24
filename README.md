# pgexport

Export data from PostgreSQL database to file.


## Installation

```sh
$ npm install pgexport -g
```

## Usage

```sh
$ pgexport

  Usage: pgexport [options]

  Options:

    -h, --help                output usage information
    -v, --version             output the version number
    --connect <connect>       Db connection string
    --to <to>                 Destination file
    --from <from>             Source table, subquery or sql file
    --where <where>           Query criteria
    -f, --force [true|false]  Non-interactive, default=false
    -d, --debug [true|false]  Show debug messages, default=false


$ pgexport --connect="user@localhost" --from="public.logs" --to="/path/to/file.log"
$ pgexport --connect="user@localhost" --from="public.logs" --to="/path/to/file.log.gz" --where="name='foo'" -f
$ pgexport --connect="user@localhost" --from="/path/to/query.sql" --to="tmp/logs.log" -f -d
$ pgexport --connect="user@localhost" --from="select id, name, ts from public.logs" --to="/path/to/file.log"

```

## File Format

Data records will be in a JSON format. Each line represents a row from the database source with JSON attribute names as column names.
File will be gzipped if the destination file has a .gz extension.

```sh
$ cat sample.log
{ "ts":"2017-06-01T01:14:09Z", "event":"pageview", "url":"http://www.abc.com" }
{ "ts":"2017-06-01T01:39:51Z", "event":"pageview", "url":"http://www.def.com" }
{ "ts":"2017-06-01T02:11:47Z", "event":"pageview", "url":"http://www.ghi.com" }
```

## Database Connection String

The general form for a connection string:

```sh
[user[:password]@][netloc][:port][/dbname][?param1=value1&...]
```
Examples:

```sh
localhost
localhost:5433
localhost/mydb
user@localhost
user:secret@localhost
other@localhost/otherdb?connect_timeout=10
```
