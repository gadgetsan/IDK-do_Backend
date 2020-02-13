var Model = require("./../Lego/Model");
var debug = false;

module.exports.validate = (username, password) => {
    return Model.User.findOne({ where: { email: username, Valid: true } })
        .then(user => {
            user = user.toJSON();
            var bcrypt = require("bcrypt");
            return bcrypt.compare(password, user.PwHash).then(result => {
                if (result) {
                    // Passwords match
                    //console.log("the password was right!");
                    return Promise.resolve(user);
                } else {
                    // Passwords don't match
                    //console.log("Password comparison failed...");
                    return Promise.resolve(undefined);
                }
            });
        })
        .catch(err => {
            return Promise.resolve(undefined);
        });
};

module.exports.login = req => {
    //console.log(req.body);
    return module.exports.validate(req.body.email, req.body.password);
};

module.exports.get = req => {
    //si on reçoit le email et le password, c'est qu'il est en cours de de se looger donc on l'authentifie et on l'écrit dans la session
    if (req.headers.authorization && req.headers.authorization.indexOf("Basic ") > -1) {
        //validation pour les requêtes à l'API
        const base64Credentials = req.headers.authorization.split(" ")[1];
        const credentials = Buffer.from(base64Credentials, "base64").toString("ascii");
        const [username, password] = credentials.split(":");
        return module.exports.validate(username, password);
    } else {
        if (debug) {
            return Promise.resolve({ Name: "DEBUG", Email: "test1@test.com", userId: 2 });
        } else {
            return Promise.resolve(undefined);
        }
    }
    /*
    if (req.baseUrl == "/lego/login" || req.baseUrl == "/lego/login") {
        db.validateUser(req.body.email, req.body.password, function(result) {
            //il est validé, on l'inscrit dans la session
            if (result) {
                req.session.logged = true;
                req.session.name = result.name;
                req.session.email = result.email;
                req.session.userId = result.rowid;
                cb(true);
            } else {
                cb(false);
            }
        });
    } else if (req.headers.authorization && req.headers.authorization.indexOf("Basic ") > -1) {
        //validation pour les requêtes à l'API
        const base64Credentials = req.headers.authorization.split(" ")[1];
        const credentials = Buffer.from(base64Credentials, "base64").toString("ascii");
        const [username, password] = credentials.split(":");
        //console.log("Username: " + username + " Password: " + password);
        db.validateUser(username, password, function(result) {
            if (result) {
                req.session.logged = true;
                req.session.name = result.name;
                req.session.email = result.email;
                req.session.userId = result.rowid;
                cb(true);
            } else {
                cb(false);
            }
        });
    } else {
        if (debug) {
            req.session.logged = true;
            req.session.name = "DEBUG";
            req.session.email = "test1@test.com";
            req.session.userId = "2";
        }
        if (req.session.logged || debug) {
            cb(true);
        } else {
            cb(false);
        }
    }*/
};
