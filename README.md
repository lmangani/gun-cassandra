# Gun-Cassandra
CQL/Cassandra native persistence layer for [gun](https://github.com/amark/gun)

[GUN](https://github.com/amark/gun) is a realtime, distributed, offline-first, graph database engine.

# WIP. DO NOT USE THIS (yet!)


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

### Test
The following test runs Fluffy's test successfully. Speed is ridicolously low due to keyspace and table initialization.
#### Run Test
```
# nodejs test/simple.js 
Hello wonderful person! :) Thanks for using GUN, feel free to ask for help on https://gitter.im/amark/gun and ask StackOverflow questions tagged with 'gun'!
> Cassandra Cluster connected!
> Gun-Cassandra Tables Ready!
> waiting 10 seconds...

Mark's boss is Fluffy
```
#### CQL Query
```
cqlsh> SELECT * FROM gun_db.gun_data;

 soul                 | field   | relation             | state         | value
----------------------+---------+----------------------+---------------+--------
 jccj3klhbH4laGweIBiP |    name |                      | 1515798170328 | Fluffy
                 mark |    boss | jccj3klhbH4laGweIBiP | 1515798170328 |       
 jccj3klhbH4laGweIBiP |   slave |                 mark | 1515798170328 |       
 jccj3klhbH4laGweIBiP | species |                      | 1515798170328 |  kitty

```
     
### Changelog
- 1.0.1 first version for gun 0.9.x based on node-db

### TODO
* [ ] Implement Docker Test w/ Cassandra 3.11
* [ ] Modularize CQL queries
* [ ] Stress-Performance Test

### Acknowledgement

Gun is open-sourced and copyrighted by Mark Nadal

Apache Cassandra, Apache Lucene, Apache, Lucene, Solr, TinkerPop, and Cassandra are trademarks of the Apache Software Foundation or its subsidiaries in Canada, the United States and/or other countries.

Based on [vfs-gun-db](https://github.com/d3x0r/gun-db) by d3x0r



