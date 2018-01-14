<p>
    <a href="http://gun.js.org/"><img width="25%" src="https://cldup.com/TEy9yGh45l.svg"/></a>
</p> 

# Gun-Cassandra
CQL/Cassandra native persistence layer for [gun](https://github.com/amark/gun)

[GUN](https://github.com/amark/gun) is a realtime, distributed, offline-first, graph database engine.

### THIS IS EXPERIMENTAL WORK IN PROGRESS! USE AT YOUR OWN RISK!
#### Comments and PR/Contributions are super welcome!

-------------

### Installation

`npm install gun-cassandra`

### Usage

```javascript
var Gun = require('gun');
require('gun-cassandra');

var gun = Gun({
  file: false // turn off pesky file.js data.json default
  , db: {
	contactPoints: ['127.0.0.1'], 
	keyspace: 'gun'
  }
});
```

### Fluffy's Test
The following script runs Fluffy's test successfully. Speed is ridicolously low when initializing keyspace and table.<br>

#### GUN -> CQL <- GUN
```javascript
var cat = {name: "Fluffy", species: "kitty"};
var mark = {boss: cat};
cat.slave = mark;
gun.get('mark').put(mark);
```
```
cqlsh> SELECT * FROM gun_db.gun_data;

 soul                 | field   | relation             | state         | value
----------------------+---------+----------------------+---------------+--------
 jccj3klhbH4laGweIBiP |    name |                      | 1515798170328 | Fluffy
                 mark |    boss | jccj3klhbH4laGweIBiP | 1515798170328 |       
 jccj3klhbH4laGweIBiP |   slave |                 mark | 1515798170328 |       
 jccj3klhbH4laGweIBiP | species |                      | 1515798170328 |  kitty

```
```javascript
gun.get('mark').get('boss').get('name').val(function(data, key){
  // `val` grabs the data once, no subscriptions.
  console.log("Mark's boss is", data);
});
```
##### Output:
```
Mark's boss is Fluffy
```

#### CQL <- GUN
```
cqlsh> INSERT INTO gun_db.gun_data JSON '{ "soul": "jcdkfchqWeSXR7dzFJdU", "field": "gender", "state": 1515860865492, "relation": "", "value": "male"}';
```
```javascript
gun.get('mark').get('boss').get('gender').val(function(data, key){
   console.log("Mark's boss gender is", data);
   process.exit(0);
});
```
##### Output:
```
Mark's boss gender is male
```

##### Test Script
```
# nodejs test/simple.js 
Hello wonderful person! :) Thanks for using GUN, feel free to ask for help on https://gitter.im/amark/gun and ask StackOverflow questions tagged with 'gun'!
> Cassandra Cluster connected!
> Gun-Cassandra Tables Ready!
> waiting 10 seconds...
Mark's boss is Fluffy

## nodejs test/simple-read.js 
Hello wonderful person! :) Thanks for using GUN, feel free to ask for help on https://gitter.im/amark/gun and ask StackOverflow questions tagged with 'gun'!
reading from CQL...
Cassandra Cluster connected!
Gun-Cassandra Tables Ready!
Mark's boss is Fluffy
Boss is a kitty
```
##### Cassandra Schema (SimpleStrategy)
```
cqlsh> DESC KEYSPACE gun_db ;

CREATE KEYSPACE gun_db WITH replication = {'class': 'SimpleStrategy', 'replication_factor': '1'}  AND durable_writes = true;

CREATE TABLE gun_db.gun_data (
    soul text,
    field text,
    relation text,
    state bigint,
    value text,
    PRIMARY KEY ((soul, field))
) WITH bloom_filter_fp_chance = 0.01
    AND caching = {'keys': 'ALL', 'rows_per_partition': 'NONE'}
    AND comment = ''
    AND compaction = {'class': 'org.apache.cassandra.db.compaction.SizeTieredCompactionStrategy', 'max_threshold': '32', 'min_threshold': '4'}
    AND compression = {'chunk_length_in_kb': '64', 'class': 'org.apache.cassandra.io.compress.LZ4Compressor'}
    AND crc_check_chance = 1.0
    AND dclocal_read_repair_chance = 0.1
    AND default_time_to_live = 0
    AND gc_grace_seconds = 864000
    AND max_index_interval = 2048
    AND memtable_flush_period_in_ms = 0
    AND min_index_interval = 128
    AND read_repair_chance = 0.0
    AND speculative_retry = '99PERCENTILE';


```
##### Elassandra Schema (NetworkTopologyStrategy)
```
cqlsh> ALTER KEYSPACE gun_db WITH REPLICATION = { 'class' : 'NetworkTopologyStrategy', 'DC1' : 1 } AND DURABLE_WRITES = true;
cqlsh> DESC KEYSPACE gun_db ;

CREATE KEYSPACE gun_db WITH replication = {'class': 'NetworkTopologyStrategy', 'DC1': '1'}  AND durable_writes = true;

CREATE TABLE gun_db.gun_data (
    soul text,
    field text,
    relation text,
    state bigint,
    value text,
    PRIMARY KEY ((soul, field))
) WITH bloom_filter_fp_chance = 0.01
    AND caching = {'keys': 'ALL', 'rows_per_partition': 'NONE'}
    AND comment = ''
    AND compaction = {'class': 'org.apache.cassandra.db.compaction.SizeTieredCompactionStrategy', 'max_threshold': '32', 'min_threshold': '4'}
    AND compression = {'chunk_length_in_kb': '64', 'class': 'org.apache.cassandra.io.compress.LZ4Compressor'}
    AND crc_check_chance = 1.0
    AND dclocal_read_repair_chance = 0.1
    AND default_time_to_live = 0
    AND gc_grace_seconds = 864000
    AND max_index_interval = 2048
    AND memtable_flush_period_in_ms = 0
    AND min_index_interval = 128
    AND read_repair_chance = 0.0
    AND speculative_retry = '99PERCENTILE';
CREATE CUSTOM INDEX elastic_gun_data_idx ON gun_db.gun_data () USING 'org.elassandra.index.ExtendedElasticSecondaryIndex';
```
--------------
     
### Changelog
- 1.0.1 first version for gun 0.9.x based on node-db

### TODO
* [ ] Cleanup Gun>Cassandra insert logic
* [ ] Docker Test Builders _(Cassandra 3.11, Elassandra 5.5.0.9)_
* [ ] Modularize CQL queries _(named query in CassanKnex)_
* [ ] Stress-Performance Test

### Acknowledgement

Gun is open-sourced and copyrighted by Mark Nadal

Apache Cassandra, Apache Lucene, Apache, Lucene, Solr, TinkerPop, and Cassandra are trademarks of the Apache Software Foundation or its subsidiaries in Canada, the United States and/or other countries.

Based on [vfs-gun-db](https://github.com/d3x0r/gun-db) by d3x0r



