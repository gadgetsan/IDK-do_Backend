//var admin = require("firebase-admin");

const Firestore = require("@google-cloud/firestore");

exports.init = function() {
    var serviceAccount = {
        type: "service_account",
        project_id: "idk-do",
        private_key_id: process.env.firebase_private_key_id,
        private_key: Buffer.from(process.env.firebase_private_key_64, "base64")
            .toString()
            .replace(/\\n/g, "\n"),
        client_email: process.env.firebase_client_email,
        client_id: process.env.firebase_client_id,
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: process.env.firebase_client_x509_cert_url
    };
    /*
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://idk-do.firebaseio.com"
        });
    }
    var fbdb = admin.firestore();
    */

    var fbdb = new Firestore({
        credentials: serviceAccount,
        projectId: "idk-do"
    });

    return fbdb;
};

exports.snapToList = function(snap) {
    var list = [];
    for (var i = 0; i < snap.docs.length; i++) {
        var toPush = snap.docs[i].data();
        toPush.rowid = snap.docs[i].id;
        list.push(toPush);
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
        itemCB(doc, index, result => {
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
        .then(
            snap => {
                snap.forEach(doc => {
                    var user = doc.data();
                    var bcrypt = require("bcrypt");
                    bcrypt.compare(password, user.pw_hash, function(err, res) {
                        user.rowid = doc.id;
                        if (res && user.valid == 1) {
                            callback(user);
                        } else {
                            // Passwords don't match
                            callback(false);
                        }
                    });
                });
            },
            error => {
                console.error("Error while validating user: " + error);
                callback(false);
            }
        );
};

exports.validateEmail = function(mail, callback) {
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
        .then(
            snap => {
                snap.forEach(doc => {
                    var user = doc.data();
                    callback(null, doc.id);
                });
            },
            error => {
                console.error("Error while validating user: " + error);
                callback(error, null);
            }
        );
};

exports.validateAccount = function(key, cb) {
    exports.validateKey(key, keyData => {
        //console.log(keyData);
        if (keyData.type == "validate") {
            var userId = keyData.user;
            var db = exports.init();
            var ref = db
                .collection("users")
                .doc(userId)
                .update("valid", 1)
                .then(() => {
                    cb(true);
                })
                .catch(function(error) {
                    console.error("Error while marking user as Valid: " + error);
                    cb(error);
                });
        } else {
            cb(false);
        }
    });
};

exports.validateKey = function(key, cb) {
    var db = exports.init();
    var ref = db.collection("mail_keys");
    var query = ref
        .doc(key)
        .get()
        .then(doc => {
            if (doc.exists) {
                cb(doc.data());
            } else {
                console.error("CETTE CLÉ N'EXISTE PAS: " + key);
                cb(null);
            }
        });
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
        }).then(
            newRef => {
                callback(true, newRef.id);
            },
            error => {
                console.error("Error while creating user: " + error);
                callback(false);
            }
        );
    });
};

//UPDATED
exports.createActionKey = function(action, userId, cb) {
    const uuidv1 = require("uuid/v1");
    var key = uuidv1();

    var db = exports.init();
    var ref = db.collection("mail_keys").doc(key);
    ref.set({
        user: userId,
        type: action
    }).then(
        newRef => {
            cb(null, key);
        },
        error => {
            console.error("Error while creating action Key: " + error);
            cb(false);
        }
    );
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
    }).then(
        newRef => {
            cb(newRef.id);
        },
        error => {
            console.error("Error while adding item: " + error);
            cb(false);
        }
    );
};

exports.removeItem = function(itemid, userid, cb) {
    //TODO: valider que la personne qui veut supprimer est propriétaire
    var db = exports.init();
    //console.log("item: " + itemid + ", user: " + userid);
    var ref = db
        .collection("items")
        .doc(userid)
        .collection("list")
        .doc(itemid)
        .delete()
        .then(cb)
        .catch(function(error) {
            console.error("Error while deleting item: " + error);
            cb(error);
        });
};

exports.markAsBought = function(itemid, date, userid, ownerId, cb) {
    var db = exports.init();
    var ref = db
        .collection("items")
        .doc(ownerId)
        .collection("list")
        .doc(itemid)
        .update("boughtOn", date, "boughtUser", userid)
        .then(cb)
        .catch(function(error) {
            console.error("Error while modifying item: " + error);
            cb(error);
        });
};

exports.removeShare = function(itemid, userid, cb) {
    //TODO: valider que la personne qui veut supprimer est propriétaire
    var db = exports.init();
    //console.log("item: " + itemid + ", user: " + userid);
    var ref = db
        .collection("shares")
        .doc(itemid)
        .delete()
        .then(cb)
        .catch(function(error) {
            console.error("Error while deleting item: " + error);
            cb(error);
        });
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
    var query = ref.get().then(
        snap => {
            exports.asyncSnap(
                snap,
                (value, index, callback) => {
                    var toReturn = value.data();
                    //on va aller cher cher le user et ajouter les informations dont on a besoin
                    toReturn.user.get().then(doc => {
                        var user = doc.data();
                        toReturn.name = user.name;
                        toReturn.email = user.email;
                        toReturn.rowid = doc.id;
                        callback(toReturn);
                    });
                },
                doneArray => {
                    //console.log(doneArray);
                    cb(doneArray);
                }
            );
        },
        error => {
            console.error("Error while getting lists that are shared to me: " + error);
            cb(false);
        }
    );
};

exports.getItemList = function(userId, cb) {
    var db = exports.init();
    var ref = db
        .collection("items")
        .doc(userId)
        .collection("list");
    var query = ref.get().then(
        snap => {
            exports.asyncSnap(
                snap,
                (value, index, callback) => {
                    var toReturn = value.data();
                    //on doit mettre la clé dans le rowid
                    toReturn.rowid = value.id;
                    //console.log(toReturn);
                    callback(toReturn);
                },
                doneArray => {
                    //console.log(doneArray);
                    cb(doneArray);
                }
            );
        },
        error => {
            console.error("Error while getting list of items: " + error);
            cb([]);
        }
    );
};

exports.getSharedList = function(userId, cb) {
    var db = exports.init();
    var ref = db
        .collection("items")
        .doc(userId)
        .collection("list");
    var query = ref.get().then(
        snap => {
            exports.asyncSnap(
                snap,
                (value, index, callback) => {
                    var toReturn = value.data();
                    //on doit mettre la clé dans le rowid
                    toReturn.rowid = value.id;
                    //console.log(toReturn);
                    callback(toReturn);
                },
                doneArray => {
                    //console.log(doneArray);
                    cb(doneArray);
                }
            );
        },
        error => {
            console.error("Error while getting list of items: " + error);
            cb([]);
        }
    );
};

exports.getUser = function(userId, cb) {
    var db = exports.init();
    var ref = db.collection("users").doc(userId);
    ref.get().then(
        snap => {
            var user = snap.data();
            cb(user);
        },
        error => {
            console.error("Error while getting user: " + error);
            cb(null);
        }
    );
};

exports.share = function(email, userId, cb) {
    var db = exports.init();
    var ref = db.collection("shares");
    ref.add({
        user: db.collection("users").doc(userId),
        toEmail: email
    }).then(
        newRef => {
            cb(null, newRef.id);
        },
        error => {
            console.error("Error while sharing a list: " + error);
            cb(false);
        }
    );
};

exports.updatePassword = function(password, userId, cb) {
    var db = exports.init();
    var bcrypt = require("bcrypt");

    bcrypt.hash(password, 10, function(err, hash) {
        var ref = db
            .collection("users")
            .doc(userId)
            .update("pw_hash", hash)
            .then(() => {
                cb(true);
            })
            .catch(function(error) {
                console.error("Error while marking user as Valid: " + error);
                cb(error);
            });
    });
};
