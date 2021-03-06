const async = require("async");
var mysql = require("mysql");

exports.init = function(callback) {
    var connection = mysql.createConnection({
        database: process.env.mysql_database,
        host: process.env.mysql_host,
        user: process.env.mysql_user,
        password: process.env.mysql_password
    });

    connection.connect(function(err) {
        if (err) {
            console.error("Error connecting: " + err.stack);
            callback(err);
        } else {
            //console.log("Connected as thread id: " + connection.threadId);
            callback(connection, cb => {
                //après tout oon ferme la DB
                connection.end();
                cb();
            });
        }
    });
};

exports.validateUser = function(mail, password, callback) {
    exports.init(function(db, cb) {
        db.query("SELECT * FROM user WHERE email=? AND valid=1;", [mail], (err, row) => {
            if (err) {
                console.error(err.message);
                cb(() => {
                    callback(false);
                });
            } else if (row && row.length == 1) {
                //on a trouvé l'usilitateur, on valide le mot de passe
                //console.log(JSON.stringify(row));
                var bcrypt = require("bcrypt");
                bcrypt.compare(password, row[0].PwHash, function(err, res) {
                    if (res) {
                        // Passwords match
                        cb(() => {
                            callback(row[0]);
                        });
                    } else {
                        // Passwords don't match
                        cb(() => {
                            callback(false);
                        });
                    }
                });
            } else {
                //la rquête n'as rien retourné;
                cb(() => {
                    callback(false);
                });
            }
        });
    });
};

exports.validateEmail = function(mail, callback) {
    exports.init(function(db, cb) {
        db.query("SELECT * FROM user WHERE email=? AND Valid=1;", mail, (err, row) => {
            if (row) {
                //on a trouvé l'usilitateur, on envoie le id
                //console.log(JSON.stringify(row));
                callback(err, row[0].rowid);
            } else {
                //la rquête n'as rien retourné;
                callback(err, null);
            }
        });
    });
};

exports.validateAccount = function(key, cb) {
    if (key == null) {
        cb(false);
        return;
    }
    exports.init(function(db, cb2) {
        //console.log("key: " + key);
        db.query("SELECT * FROM mailkey WHERE keyID=?;", key, (err, row) => {
            if (err) {
                console.error(err.message);
                cb2(() => {
                    cb(false);
                });
            } else if (row) {
                var user = row[0].user;
                //on a le rownum de l'utilisateur en question, on va aller changer la valeur de 'valid'
                db.query("UPDATE user SET valid = ? WHERE rowid = ?", [1, user], function(err) {
                    if (err) {
                        console.error(err.message);
                    }
                    cb2(err => {
                        if (!err) {
                            cb(true);
                        }
                    });
                });
            } else {
                //la rquête n'as rien retourné;
                cb2(() => {
                    cb(false);
                });
            }
        });
    });
};

exports.validateKey = function(key, cb) {
    exports.init(function(db, cb2) {
        //console.log("key: " + key);
        db.query("SELECT * FROM mailkey WHERE keyID=?;", key, (err, row) => {
            if (err) {
                console.error(err.message);
                cb2(() => {
                    cb(false);
                });
            } else if (row) {
                cb2(() => {
                    cb(true, row[0].user, row[0].type);
                });
            } else {
                //la rquête n'as rien retourné;
                cb2(() => {
                    cb(false);
                });
            }
        });
    });
};

exports.createUser = function(email, password, name, callback) {
    exports.init((db, cb) => {
        //on hash le password avant de l'enregistrer dans la bd
        var bcrypt = require("bcrypt");
        bcrypt.hash(password, 10, function(err, hash) {
            db.query("INSERT INTO user(name, PwHash, email, valid) VALUES(?, ?, ?, 0)", [name, hash, email], function(err, result) {
                if (err) {
                    console.error(err.message);
                    cb(() => {
                        callback(false);
                    });
                } else {
                    var newRowId = result.insertId;
                    cb(() => {
                        callback(true, newRowId);
                    });
                }
            });
        });
    });
};

exports.createActionKey = function(action, userId, cb) {
    const uuidv1 = require("uuid/v1");
    var key = uuidv1();
    exports.init(function(db, cb2) {
        db.query("INSERT INTO mailkey(keyID, type, user) VALUES(?, ?, ?)", [key, action, userId], function(err) {
            if (err) {
                console.error(err.message);
            }
            cb2(err => {
                cb(err, key);
            });
        });
    });
};

exports.additem = function(name, description, link, userId, cb) {
    exports.init(function(db, cb2) {
        db.query("INSERT INTO item(name, description, link, user) VALUES(?, ?, ?, ?)", [name, description, link, userId], function(err, result) {
            if (err) {
                console.error(err.message);
            }
            var newRowId = result.insertId;
            cb2(err => {
                cb(newRowId);
            });
        });
    });
};

exports.edititem = function(name, description, link, userId, itemId, cb) {
    exports.init(function(db, cb2) {
        db.query("UPDATE item SET name=?, description=?, link=? WHERE rowid=?", [name, description, link, itemId], function(err, result) {
            cb2(err => {
                cb(err);
            });
        });
    });
};

exports.removeItem = function(itemid, userid, cb) {
    exports.init(function(db, cb2) {
        db.query("DELETE FROM item WHERE rowid = ?", [itemid], function(err) {
            if (err) {
                console.error(err.message);
            }
            cb2(err => {
                cb(err);
            });
        });
    });
};

exports.markAsBought = function(itemid, date, userid, owner, cb) {
    exports.init(function(db, cb2) {
        db.query("UPDATE item SET boughtOn = ?, boughtUser = ? WHERE rowid = ?", [date, userid, itemid], function(err) {
            if (err) {
                console.error(err.message);
            }
            cb2(err => {
                cb(err);
            });
        });
    });
};

exports.cancelBought = function(itemid, userid, owner, cb) {
    exports.init(function(db, cb2) {
        db.query("UPDATE item SET boughtOn = NULL, boughtUser = NULL WHERE rowid = ? AND boughtUser = ?", [itemid, userid], function(err) {
            if (err) {
                console.error(err.message);
            }
            cb2(err => {
                cb(err);
            });
        });
    });
};

exports.removeShare = function(itemid, userid, cb) {
    exports.init(function(db, cb2) {
        db.query("DELETE FROM share WHERE rowid = ?", [itemid], function(err) {
            if (err) {
                console.error(err.message);
            }
            cb2(err => {
                cb(err);
            });
        });
    });
};

exports.getShares = function(userId, cb) {
    exports.init(function(db, cb2) {
        var sql = "SELECT * FROM share Where user = ?";
        var rowList = [];
        db.query(sql, [userId], (err, result) => {
            if (err) {
                console.error(err.message);
            }
            // process each row here
            //rowList.push(result);
            //console.log(result);
            //console.log(fields);
            cb2(() => {
                cb(result);
            });
        });
    });
};

exports.getSharedToMe = function(myEmail, cb) {
    exports.init(function(db, cb2) {
        //pour debug
        var sql = "SELECT name, email, user.rowid FROM share JOIN user ON user.rowid = share.user WHERE toEmail = ? OR toEmail = 'test1@test.com'";
        //var sql = "SELECT name, email, user.rowid FROM share JOIN user ON user.rowid = share.user WHERE toEmail = ? COLLATE NOCASE";
        var rowList = [];
        db.query(sql, [myEmail], (err, result) => {
            if (err) {
                console.error(err.message);
            }
            // process each row here
            //rowList.push(result);
            //console.log(result);
            //console.log(fields);
            cb2(() => {
                cb(result);
            });
        });
    });
};

exports.getItemList = function(userId, cb) {
    exports.init(function(db, cb2) {
        var sql = "SELECT * FROM item Where user = ?";
        var rowList = [];
        db.query(sql, [userId], (err, result, fields) => {
            if (err) {
                console.error(err.message);
            }
            // process each row here
            //rowList.push(result);
            //console.log(result);
            //console.log(fields);
            cb2(() => {
                cb(result);
            });
        });
    });
};

exports.getSharedList = function(userId, cb) {
    exports.init(function(db, cb2) {
        var sql = "SELECT * FROM item Where User = ?";
        var rowList = [];
        db.query(sql, [userId], (err, result) => {
            if (err) {
                console.error(err.message);
            }
            // process each row here
            //rowList.push(result);
            //console.log(result);
            //console.log(fields);
            cb2(() => {
                cb(result);
            });
        });
    });
};

exports.getUser = function(userId, cb) {
    exports.init(function(db, cb2) {
        var sql = "SELECT * FROM user Where rowid = ?";
        db.query(sql, [userId], (err, result) => {
            if (err) {
                console.error(err.message);
            }
            cb2(() => {
                cb(result);
            });
        });
    });
};

exports.share = function(email, userId, cb) {
    exports.init(function(db, cb2) {
        db.query("INSERT INTO share(toEmail, user) VALUES(?, ?)", [email, userId], function(err, result) {
            if (err) {
                console.error(err.message);
            }
            var newRowId = result.insertId;
            cb2(err => {
                cb(err, newRowId);
            });
        });
    });
};

exports.updatePassword = function(password, userId, cb) {
    exports.init(function(db, cb2) {
        var bcrypt = require("bcrypt");
        bcrypt.hash(password, 10, function(err, hash) {
            db.query("UPDATE user SET PwHash = ? WHERE rowid = ?", [hash, userId], function(err) {
                cb2(cb);
            });
        });
    });
};

exports.addSecretMessage = function(ideaId, text, userId, cb) {
    exports.init(function(db, cb2) {
        db.query("INSERT INTO itemmessage(item, text, user) VALUES(?, ?, ?)", [ideaId, text, userId], function(err, result) {
            if (err) {
                console.error(err.message);
            }
            var newRowId = result.insertId;
            cb2(err => {
                cb(newRowId);
            });
        });
    });
};

exports.getSecretMessages = function(itemId, cb) {
    exports.init(function(db, cb2) {
        var sql = "SELECT * FROM itemmessage Where item = ?";
        var rowList = [];
        db.query(sql, [itemId], (err, result, fields) => {
            if (err) {
                console.error(err.message);
            }
            cb2(() => {
                cb(result);
            });
        });
    });
};
