//process.on( "warning", (warning)=>{console.trace( "WARNING:", warning ); } );
//process.on( "error", (warning)=>{console.trace( "ERROR PROCESS:", warning ); } );
//process.on( "exit", (warning)=>{console.trace( "EXIT:", warning ); } );

const Gun = require('gun/gun');

var _debug_counter = 0;
var __debug_counter = 0;
var _debug_tick = Date.now();
const _debug = false;

const rel_ = Gun.val.rel._; // '#'
const val_ = Gun._.field; // '.'
const node_ = Gun.node._; // '_'
const state_ = Gun.state._; // '>';

var qb;

const ACK_ = '@';
const SEQ_ = '#';

Gun.on('opt', function(ctx) {

    var goNext = function(){
	    this.to.next(ctx);
	    if (ctx.once) {
	        return;
	    }
    }.bind(this);

    // DB options
    var opt = ctx.opt.db || (ctx.opt.db = {});
    //opt.file = opt.file || ('file:gun.db?nolock=1');
    opt.contactPoints = opt.contactPoints || ['127.0.0.1'];
    opt.table = opt.table || 'gun_data';
    opt.keyspace = opt.keyspace || 'gun_db';
    opt.ttl = opt.ttl || 0;
    const drop = opt.drop || false;
    const qpath = opt.keyspace + "." + opt.table;
    const qb = require("cassanknex")({
	// debug: _debug || false,
        connection: {
            contactPoints: opt.contactPoints
        }
    });


    qb.on("ready", function(err) {
        if (err)
            console.error("Error Connecting to Cassandra Cluster", err);
	else
	    console.log("Cassandra Cluster connected!");

	var dropKeyspace = function(){
            qb()
             .dropKeyspaceIfExists(opt.keyspace)
            .exec(function(err, res) {
                if (err) {
                    console.log(err);
		}
		    createKeyspace();
	    });
	}
	var createIndex = function(){
		qb(opt.keyspace)
		  .createIndex(opt.table, "soul_index", "soul")
		  .createIndex(opt.table, "field_index", "field")
		  .createIndex(opt.table, "rel_index", "relation")
	            .exec(function(err, res) {
	                if (err) {
	                    console.log(err);
			}
		    });
	}

	var createTable = function(){
                qb(opt.keyspace)
                    .createColumnFamilyIfNotExists(opt.table)
                    .text("soul")
                    .text("field")
                    .text("value")
                    .text("relation")
                    .bigint("state")
                    .primary(["soul", "field"])
                    .exec(function(err, res) {
                        if (err) {
                            console.log(err);
                            return;
                        } else {
			    console.log("Gun-Cassandra Tables Ready!");
			    goGun();
			}
                    });
	}

	var createKeyspace = function(){
           // prepare keyspace & tables
           qb()
            .createKeyspaceIfNotExists(opt.keyspace)
            .withSimpleStrategy(1)
            .exec(function(err, res) {
                if (err) {
                    console.log(err);
                    return;
                }
		createTable();
            });
	}

        if (drop){
	    console.log('DROP',opt.keyspace);
	    dropKeyspace();
        } else {
       	    createKeyspace();
	}


    });

    var goGun = function(){

	goNext();
        var skip_put = null;
        var query;

        var gun = ctx.gun;

        ctx.on('put', function(at) {
            this.to.next(at);
            if (skip_put && skip_put == at[ACK_]) {
                if (_debug) {
                    var now = Date.now();
                    if (now - _debug_tick > 1000) {
                        _debug && console.log("N in M", _debug_counter - __debug_counter, now - _debug_tick, (_debug_counter - __debug_counter) / (now - _debug_tick));
                        _debug_tick = now;
                        __debug_counter = _debug_counter;
                    }
                    _debug_counter++;
                    _debug && console.log(new Date(), "skipping put in-get:", _debug_counter, " get putting:", skip_put, at[ACK_], JSON.stringify(at.put));
                }
                return;
            }
            _debug && console.log( new Date(), "PUT", at[SEQ_], at[ACK_], JSON.stringify( at.put ) );
            Gun.graph.is(at.put, null, function(value, field, node, soul) {
                var id;
                // kinda hate to always do a select just to see that the new update is newer than what was there.
                qb(opt.keyspace)
                    .select('state')
		    .from(opt.table)
                    .where('soul', '=', soul)
                    .andWhere('field', '=', field)
                    .exec(function(err, record) {
			_debug && console.log('STATE SELECT!',soul,field,record.rows[0]);
                        var dataRelation, dataValue, tmp;
                        var state = Gun.state.is(node, field);
                        // Check to see if what we have on disk is more recent.
                        if (record && record.rowLength > 0 && state <= record.rows[0].state) {
                            _debug && console.log( new Date(), "already newer in database.." ); 
                            ctx.on('in', {
                                [ACK_]: at[rel_],
                                ok: 1
                            });
                            return;
                        }
                        if (value && (tmp = value[rel_])) { // TODO: Don't hardcode.
                            dataRelation = tmp;
                            dataValue = "";
                        } else if (value) {
                            dataRelation = "";
                            dataValue = value;
                        } else {
                            dataRelation = "";
                            dataValue = "";
                        }
                        try {
                            var values = {
                                soul: soul,
                                field: field,
                                value: dataValue,
                                relation: dataRelation,
                                state: state
                            };
		            // _debug && console.log( new Date(), "INSERT values:", values );
                            qb(opt.keyspace)
                                .insert(values)
                                .into(opt.table)
				.usingTTL(opt.ttl)
                                .exec(function(err, result) {
                                    if(err) { console.log(err); return }
                                });

                            ctx.on('in', {
                                [ACK_]: at[rel_],
                                ok: 1
                            });
                        } catch (e) {
			    _debug && console.log( new Date(), "error inserting:",e);
                            ctx.on('in', {
                                [ACK_]: at[rel_],
                                err: e
                            });
                        }
                    });
            });

        });
        _debug && console.log( new Date(), " : Put done" );

      ctx.on('get', function(at) {
        this.to.next(at);
        if (!qb) {
            console.log("Lost the database somehow");
            return;
        }
        var lex = at.get,
            u;
        if (!lex) {
            return;
        }
        var soul = lex[SEQ_];
        var field = lex[val_];
	_debug && console.log('LEX',lex);
        _debug && console.log( new Date(), "doing get...for soul:", soul, "field:",field );
        if (node_ === field) {
            if (!qb) return;
            qb(opt.keyspace)
                .select()
		.from(opt.table)
                .where("soul", "=", soul)
                .limit(1)
                .exec(function(err, record) {
                    if (err) {
                        console.log('FAILED SELECT:', err);
                    }
		   
                    _debug && console.log( new Date(), "select result:", record );
                    if (!record || !record.rowLength == 0 || err) {
                        _debug && console.log( "So, result with an in?" );
                        return ctx.on('in', {
                            [ACK_]: at[SEQ_]
                        });
                    }
                    _debug && console.log( new Date(), "give back empty"  );
                    return ctx.on('in', {
                        [ACK_]: at[SEQ_],
                        put: {
                            [soul]: {
                                [node_]: {
                                    [rel_]: soul,
                                    [state_]: {}
                                }
                            }
                        }
                    });
                });

        }
        if (field) {

            qb(opt.keyspace)
                .select()
		.from(opt.table)
                .where("soul", "=", soul)
                .andWhere("field", "=", field)
                .exec(function(err, record) {
                    if (record && record.rowLength > 0) {
			var tmp = record.rows[0];
                        let rec = { soul: tmp.soul, field: tmp.field, relation: tmp.relation, state: parseInt(tmp.state), value: tmp.value };
                        _debug && console.log( new Date(), "Specific field?", rec );
                        var msg;
                        if (rec.relation)
                            msg = {
                                [rec.soul]: {
                                    [node_]: {
                                        [rel_]: rec.soul,
                                        [state_]: {
                                            [rec.field]: rec.state
                                        }
                                    },
                                    [rec.field]: {
                                        [rel_]: rec.relation
                                    }
                                }
                            };
                        else if (rec.value)
                            msg = {
                                [rec.soul]: {
                                    [node_]: {
                                        [rel_]: rec.soul,
                                        [state_]: {
                                            [rec.field]: rec.state
                                        }
                                    },
                                    [rec.field]: rec.value
                                }
                            };
                        else
                            msg = {
                                [rec.soul]: {
                                    [node_]: {
                                        [rel_]: rec.soul,
                                        [state_]: {
                                            [rec.field]: rec.state
                                        }
                                    },
                                    [rec.field]: null
                                }
                            };
                        skip_put = at[SEQ_];
                        _debug && console.log(new Date(), "PUT", msg);
                        ctx.on('in', {
                            [ACK_]: at[SEQ_],
                            put: msg
                        });
                        skip_put = null;
                    }
                    return;
                });

        }
        _debug && console.log( new Date(), "select all fields...", soul );
        qb(opt.keyspace)
            .select()
	    .from(opt.table)
            .where("soul", "=", soul)
            .exec(function(err, record) {
                if (!record || record.rowLength == 0) {
                    _debug && console.log( new Date(), "nothing... So, result with an in?" );
                    ctx.on('in', {
                        [ACK_]: at[SEQ_]
                    });
                } else {
                    _debug && console.log( new Date(), "got result",record.rows[0] );
                    if (record.rowLength > 0) {
                        var state, node;
                        var rec = {
                            [soul]: {
                                [node_]: {
                                    [rel_]: soul,
                                    [state_]: {}
                                }
                            }
                        };
                        node = rec[soul];
                        state = node[node_][state_];
                        record.rows.forEach(function(record) {
			    _debug && console.log('Parsing ROW:',record);
                            state[record.field] = parseInt(record.state);
                            if (record.relation)
                                node[record.field] = {
                                    [rel_]: record.relation
                                };
                            else if (record.value)
                                node[record.field] = record.value;
                            else
                                node[record.field] = null;
                        });
                        _debug && console.log( new Date(), "Node is now ------------\n", JSON.stringify(rec) );
                        skip_put = at[SEQ_];
                        _debug && console.log( new Date(), "put to gun" );
                        ctx.on('in', {
                            ACK_: at[SEQ_],
                            put: rec
                        });
                        skip_put = null;
                    } else record.rows.forEach(function(record) {
                        var msg;
                        if (record.relation)
                            msg = {
                                [soul]: {
                                    [node_]: {
                                        [rel_]: record.soul,
                                        [state_]: {
                                            [record.field]: parseInt(record.state)
                                        }
                                    },
                                    [record.field]: {
                                        [rel_]: record.relation
                                    }
                                }
                            };
                        else if (record.value)
                            msg = {
                                [soul]: {
                                    [node_]: {
                                        [rel_]: record.soul,
                                        [state_]: {
                                            [record.field]: parseInt(record.state)
                                        }
                                    },
                                    [record.field]: record.value
                                }
                            };
                        else
                            msg = {
                                [soul]: {
                                    [node_]: {
                                        [rel_]: record.soul,
                                        [state_]: {
                                            [record.field]: parseInt(record.state)
                                        }
                                    },
                                    [record.field]: null
                                }
                            };
                        _debug && console.log( "State is:", typeof( record.state ) );
                        _debug && console.log( new Date(), "  From Nodify", JSON.stringify(msg) );
                        skip_put = at[SEQ_];
                        _debug && console.log( new Date(), "put to gun" );
                        result = ctx.on('in', {
                            [ACK_]: at[SEQ_],
                            put: msg
                        });
                        skip_put = null;
                    });
                    _debug && console.log( new Date(), "put into gun done" );
                }
            });
      });

}


});
