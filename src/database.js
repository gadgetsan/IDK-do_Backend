const async = require("async");
const sqlite3 = require("sqlite3").verbose();
var dbFile = "db/test4.db";

var createTable = function(tableData, db, cb) {
    var sql = "CREATE TABLE IF NOT EXISTS " + tableData + ";";

    db.run(sql, function(err) {
        if (err) {
            console.error("ERROR during Table creation - " + err.message);
        }
        cb();
    });
};

exports.init = function(callback) {
    let db = new sqlite3.Database(dbFile, err => {
        if (err) {
            console.error("ERROR during Connection - " + err.message);
        } else {
            //console.log("Connected to the test database.");
        }
    });
    var tables = [
        "User (name TEXT, PwHash TEXT, username TEXT, email TEXT UNIQUE, valid INTEGER)",
        "Item (name TEXT, description TEXT, link TEXT, user NUMBER, boughtOn TEXT, boughtUser NUMBER)",
        "MailKey (key TEXT, type TEXT, user NUMBER)",
        "Share (user Number, toEmail TEXT)"
    ];
    async.each(
        tables,
        (element, cb) => {
            createTable(element, db, cb);
        },
        function(err) {
            callback(db, cb => {
                //après tout oon ferme la DB
                db.close(err => {
                    if (err) {
                        console.error("ERROR during Closing - " + err.message);
                    }
                    cb();
                    //console.log("Close the database connection.");
                });
            });
        }
    );
};

exports.validateUser = function(mail, password, callback) {
    exports.init(function(db, cb) {
        db.get("SELECT rowid, * FROM User WHERE email=? AND Valid=1;", mail, (err, row) => {
            if (err) {
                console.error(err.message);
                cb(() => {
                    callback(false);
                });
            } else if (row) {
                //on a trouvé l'usilitateur, on valide le mot de passe
                //console.log(JSON.stringify(row));
                var bcrypt = require("bcrypt");
                bcrypt.compare(password, row.PwHash, function(err, res) {
                    if (res) {
                        // Passwords match
                        cb(() => {
                            callback(row);
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
        db.get("SELECT rowid, * FROM User WHERE email=? AND Valid=1;", mail, (err, row) => {
            if (row) {
                //on a trouvé l'usilitateur, on envoie le id
                //console.log(JSON.stringify(row));
                callback(err, row.rowid);
            } else {
                //la rquête n'as rien retourné;
                callback(err, null);
            }
        });
    });
};

exports.validateAccount = function(key, cb) {
    exports.init(function(db, cb2) {
        //console.log("key: " + key);
        db.get("SELECT user, * FROM MailKey WHERE key=?;", key, (err, row) => {
            if (err) {
                console.error(err.message);
                cb2(() => {
                    cb(false);
                });
            } else if (row) {
                //console.log(row.user);
                //on a le rownum de l'utilisateur en question, on va aller changer la valeur de 'valid'
                db.run("UPDATE User SET valid = ? WHERE rowid = ?", [1, row.user], function(err) {
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
        db.get("SELECT user, * FROM MailKey WHERE key=?;", key, (err, row) => {
            if (err) {
                console.error(err.message);
                cb2(() => {
                    cb(false);
                });
            } else if (row) {
                cb2(() => {
                    cb(true, row.user, row.type);
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
            db.run("INSERT INTO User(name, PwHash, email, valid) VALUES(?, ?, ?, 0)", [name, hash, email], function(err) {
                var newRowId = this.lastID;
                if (err) {
                    console.error(err.message);
                    cb(() => {
                        callback(false);
                    });
                } else {
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
        db.run("INSERT INTO MailKey(key, type, user) VALUES(?, ?, ?)", [key, action, userId], function(err) {
            if (err) {
                console.error(err.message);
            }
            cb2(err => {
                cb(err, key);
            });
        });
    });
};

exports.resetData = function(cb) {
    let db = new sqlite3.Database(dbFile, err => {
        if (err) {
            console.error("ERROR during Connection - " + err.message);
        } else {
            //console.log("Connected to the test database.");
        }
    });

    db.run("DROP TABLE IF EXISTS User", function(err) {
        if (err) {
            console.error("ERROR during Table deletion - " + err.message);
        }
        cb();
    });
};

exports.addItem = function(name, description, link, userId, cb) {
    exports.init(function(db, cb2) {
        db.run("INSERT INTO Item(name, description, link, user) VALUES(?, ?, ?, ?)", [name, description, link, userId], function(err) {
            if (err) {
                console.error(err.message);
            }
            var newRowId = this.lastID;
            cb2(err => {
                cb(err, newRowId);
            });
        });
    });
};

exports.removeItem = function(itemid, userid, cb) {
    exports.init(function(db, cb2) {
        db.run("DELETE FROM Item WHERE rowid = ?", [itemid], function(err) {
            if (err) {
                console.error(err.message);
            }
            cb2(err => {
                cb(err);
            });
        });
    });
};

exports.markAsBought = function(itemid, date, userid, cb) {
    console.log(itemid);
    console.log(date);
    console.log(userid);
    exports.init(function(db, cb2) {
        db.run("UPDATE Item SET boughtOn = ?, boughtUser = ? WHERE rowid = ?", [date, userid, itemid], function(err) {
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
        db.run("DELETE FROM Share WHERE rowid = ?", [itemid], function(err) {
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
        var sql = "SELECT rowid, * FROM Share Where user = ?";
        var rowList = [];
        db.each(
            sql,
            [userId],
            (err, result) => {
                // process each row here
                rowList.push(result);
            },
            (err, rows) => {
                //console.log(JSON.stringify(rowList));
                cb2(() => {
                    cb(rowList);
                });
            }
        );
    });
};

exports.getSharedToMe = function(myEmail, cb) {
    exports.init(function(db, cb2) {
        //pour debug
        var sql =
            "SELECT name, email, User.rowid FROM Share JOIN User ON User.rowid = Share.user WHERE toEmail = ? OR toEmail = 'test1@test.com' COLLATE NOCASE";
        //var sql = "SELECT name, email, User.rowid FROM Share JOIN User ON User.rowid = Share.user WHERE toEmail = ? COLLATE NOCASE";
        var rowList = [];
        db.each(
            sql,
            [myEmail],
            (err, result) => {
                // process each row here
                rowList.push(result);
            },
            (err, rows) => {
                //console.log(JSON.stringify(rowList));
                cb2(() => {
                    cb(rowList);
                });
            }
        );
    });
};

exports.getItemList = function(userId, cb) {
    exports.init(function(db, cb2) {
        var sql = "SELECT rowid, * FROM Item Where User = ?";
        var rowList = [];
        db.each(
            sql,
            [userId],
            (err, result) => {
                // process each row here
                rowList.push(result);
            },
            (err, rows) => {
                //console.log(JSON.stringify(rowList));
                cb2(() => {
                    cb(rowList);
                });
            }
        );
    });
};

exports.getSharedList = function(userId, cb) {
    exports.init(function(db, cb2) {
        var sql = "SELECT rowid, * FROM Item Where User = ?";
        var rowList = [];
        db.each(
            sql,
            [userId],
            (err, result) => {
                // process each row here
                rowList.push(result);
            },
            (err, rows) => {
                //console.log(JSON.stringify(rowList));
                cb2(() => {
                    cb(rowList);
                });
            }
        );
    });
};

exports.getUser = function(userId, cb) {
    exports.init(function(db, cb2) {
        var sql = "SELECT * FROM User Where rowid = ?";
        var rowList = [];
        db.get(sql, [userId], (err, result) => {
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
        db.run("INSERT INTO Share(toEmail, user) VALUES(?, ?)", [email, userId], function(err) {
            if (err) {
                console.error(err.message);
            }
            var newRowId = this.lastID;
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
            db.run("UPDATE User SET PwHash = ? WHERE rowid = ?", [hash, userId], function(err) {
                cb2(cb);
            });
        });
    });
};
