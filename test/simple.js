/* cleanup */
try{require('fs').unlinkSync('gun.db');
}catch(e){}

var Gun = require( "gun/gun" );
var gunNot = require('gun/lib/not')
var gunDb = require( "../index.js" );

var gun = Gun({
  file: false // turn off pesky file.js data.json default
  , db: {
	contactPoints: ['elassandra-seed'], 
	keyspace: 'gun_db',
	drop: false
  }
});

var cat = {name: "Fluffy", species: "kitty"};
var mark = {boss: cat};
cat.slave = mark;

// partial updates merge with existing data!
gun.get('mark').put(mark);


console.log('waiting 10 seconds...');
setTimeout(function(){ 
	// access the data as if it is a document.
	gun.get('mark').get('boss').get('name').val(function(data, key){
	  // `val` grabs the data once, no subscriptions.
	  console.log("Mark's boss is", data);
	});
}, 10000);
