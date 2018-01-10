
var Gun = require( "gun/gun" );
var gunNot = require('gun/lib/not')
var gunDb = require( "../index.js" );


//var vfs = require( "sack.vfs" );
//var vol = vfs.Volume( "Mount", "data.vfs", "key1", "key2" );
//var gun = new Gun( { db:{ file:'$sack@Mount$gun.db' } } );

var gun = new Gun( { db:{ contactPoints:['elassandra-seed'] } } );

var root = gun.get( 'db' );

var tick = Date.now();
for( var i = 1; i < 10; i++ ) {
	var obj = {};
	for( var j = 1; j < 100; j++ ) {
        	obj["key"+j] = "Some 10 character value";
	}
        root.get( i.toString() ).put( obj );
	if( i % 1001 == 1000 ) {
	        console.log( new Date(), "did ", i%1001, " in ", Date.now() - tick );
        	tick = Date.now();
	}
}
console.log( "done" );

