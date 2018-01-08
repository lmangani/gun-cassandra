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



