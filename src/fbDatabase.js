var admin = require("firebase-admin");

exports.init = function() {
    console.log(process.env.firebase_private_key.substring(0, 25));
    var serviceAccount = {
        type: "service_account",
        project_id: "idk-do",
        private_key_id: process.env.firebase_private_key_id,
        private_key: process.env.firebase_private_key.replace(/\\n/g, "\n"),
        client_email: process.env.firebase_client_email,
        client_id: process.env.firebase_client_id,
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: process.env.firebase_client_x509_cert_url
    };
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://idk-do.firebaseio.com"
        });
    }

    var fbdb = admin.firestore();
    return fbdb;
};

exports.snapToList = function(snap) {
    var list = [];
    for (var i = 0; i < snap.docs.length; i++) {
        list.push(snap.docs[i].data());
    }
    return list;
};

exports.asyncSnap = function(snap, itemCB, doneCB) {
    var itemsProcessed = 0;
    var list = [];
    if (snap.docs.length == 0) {
        doneCB(list);
    }
    snap.forEach((doc, index, array) => {
        itemCB(doc, result => {
            list.push(result);
            itemsProcessed++;
            if (itemsProcessed === snap.docs.length) {
                doneCB(list);
            }
        });
    });
};

exports.validateUser = function(mail, password, callback) {
    if (mail == undefined) {
        callback(false);
        return;
    }
    var db = exports.init();
    var ref = db.collection("users");
    var query = ref
        .where("email", "==", mail)
        .limit(1)
        .get()
        .then(snap => {
            snap.forEach(doc => {
                var user = doc.data();
                var bcrypt = require("bcrypt");
                bcrypt.compare(password, user.pw_hash, function(err, res) {
                    user.rowid = doc.id;
                    if (res) {
                        callback(user);
                    } else {
                        // Passwords don't match
                        callback(false);
                    }
                });
            });
        });
};

exports.validateEmail = function(mail, callback) {
    /*
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
    */
    callback("NOT IMPLEMENTED");
};

exports.validateAccount = function(key, cb) {
    /*
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
    */
    cb("NOT IMPLEMENTED");
};

exports.validateKey = function(key, cb) {
    /*
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
    */
    cb("NOT IMPLEMENTED");
};

//UPDATED
exports.createUser = function(email, password, name, callback) {
    var db = exports.init();
    var bcrypt = require("bcrypt");
    bcrypt.hash(password, 10, function(err, hash) {
        var ref = db.collection("users");
        ref.add({
            name: name,
            pw_hash: hash,
            email: email,
            valid: 0
        }).then(newRef => {
            callback(true, newRef.id);
        });
    });
};

//UPDATED
exports.createActionKey = function(action, userId, cb) {
    const uuidv1 = require("uuid/v1");
    var key = uuidv1();

    var db = exports.init();
    var ref = db.collection("mail_keys").doc(userId);
    ref.set({
        key: key,
        type: action
    }).then(newRef => {
        cb(null, key);
    });
};

exports.addItem = function(name, description, link, userId, cb) {
    var db = exports.init();
    var ref = db
        .collection("items")
        .doc(userId)
        .collection("list");
    ref.add({
        name: name,
        description: description,
        link: link
    }).then(newRef => {
        cb(null, newRef.id);
    });
};

exports.removeItem = function(itemid, userid, cb) {
    /*
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
    */
    cb("NOT IMPLEMENTED");
};

exports.markAsBought = function(itemid, date, userid, cb) {
    /*
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
    */
    cb("NOT IMPLEMENTED");
};

exports.removeShare = function(itemid, userid, cb) {
    /*
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
    */
    cb("NOT IMPLEMENTED");
};

exports.getShares = function(userId, cb) {
    var db = exports.init();
    var ref = db.collection("shares").where("user", "==", db.collection("users").doc(userId));
    var query = ref.get().then(snap => {
        cb(exports.snapToList(snap));
    });
};

exports.getSharedToMe = function(myEmail, cb) {
    var db = exports.init();
    var ref = db.collection("shares").where("toEmail", "==", myEmail);
    var query = ref.get().then(snap => {
        exports.asyncSnap(
            snap,
            (value, callback) => {
                var toReturn = value.data();
                //on va aller cher cher le user et ajouter les informations dont on a besoin
                toReturn.user.get().then(doc => {
                    var user = doc.data();
                    toReturn.name = user.name;
                    toReturn.email = user.email;
                    callback(toReturn);
                });
            },
            doneArray => {
                console.log(doneArray);
                cb(doneArray);
            }
        );
    });
};

exports.getItemList = function(userId, cb) {
    var db = exports.init();
    var ref = db
        .collection("items")
        .doc(userId)
        .collection("list");
    var query = ref.get().then(snap => {
        cb(exports.snapToList(snap));
    });
};

exports.getSharedList = function(userId, cb) {
    /*
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
    */
    cb("NOT IMPLEMENTED");
};

exports.getUser = function(userId, cb) {
    var db = exports.init();
    var ref = db.collection("users").doc(userId);
    ref.get().then(snap => {
        var user = snap.data();
        cb(user);
    });
    /*
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
    */
    cb("NOT IMPLEMENTED");
};

exports.share = function(email, userId, cb) {
    var db = exports.init();
    var ref = db.collection("shares");
    ref.add({
        user: db.collection("users").doc(userId),
        toEmail: email
    }).then(newRef => {
        cb(null, newRef.id);
    });
};

exports.updatePassword = function(password, userId, cb) {
    /*
    exports.init(function(db, cb2) {
        var bcrypt = require("bcrypt");
        bcrypt.hash(password, 10, function(err, hash) {
            db.run("UPDATE User SET PwHash = ? WHERE rowid = ?", [hash, userId], function(err) {
                cb2(cb);
            });
        });
    });
    */
    cb("NOT IMPLEMENTED");
};
