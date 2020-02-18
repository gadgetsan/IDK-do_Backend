var db = require("./database");
var https = require("https");
var LegoModel = require("./../Lego/Model");
const { Op } = require("sequelize");

module.exports = {
    getBackup: function(req, res) {
        console.log("start");
        db.getBackup(function(result) {
            //on doit retourner un fichier
            console.log("finish");
            res.set({ "Content-Disposition": "attachment; filename=mysqldump.sql" });
            res.send(result);
        });
    },
    ping: function(req, res) {
        res.send("pong");
    },
    updateAnySet: function(req, res) {
        var oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        //on va aller voir nos sets et regarder ceux que ça fait longtemps qu'on as pas mis à jour
        LegoModel.Set.findOne({
            where: {
                updatedAt: {
                    [Op.lt]: oneMonthAgo
                }
            }
        }).then(result => {
            if (result !== null) {
                res.send("Updating Set #" + result.RebrickableId + ": " + result.Name);
                return LegoModel.updateSet(result.RebrickableId);
            } else {
                return res.send("All sets are up to date");
            }
            //console.log(result.toJSON());
        });
    }
};
