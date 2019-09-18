var db = require("./database");
var https = require("https");

module.exports = {
    getBackup: function(req, res) {
        console.log("start");
        db.getBackup(function(result) {
            //on doit retourner un fichier
            console.log("finish");
            res.set({ "Content-Disposition": "attachment; filename=mysqldump.sql" });
            res.send(result);
        });
    }
};
