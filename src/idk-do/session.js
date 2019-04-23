var db = require("./sqlDatabase");
var debug = false;
module.exports.getUser = (req, cb) => {
    //si on reçoit le email et le password, c'est qu'il est en cours de de se looger donc on l'authentifie et on l'écrit dans la session
    if (req.baseUrl == "/web/login" || req.baseUrl == "/api/login") {
        db.validateUser(req.body.email, req.body.password, function(result) {
            //il est validé, on l'inscrit dans la session
            if (result) {
                req.session.logged = true;
                req.session.name = result.name;
                req.session.email = result.email;
                req.session.rowid = result.rowid;
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
                req.session.rowid = result.rowid;
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
            req.session.rowid = "4";
        }
        if (req.session.logged || debug) {
            cb(true);
        } else {
            cb(false);
        }
    }
};
