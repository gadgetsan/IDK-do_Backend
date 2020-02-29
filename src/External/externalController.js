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
                //si on n'as pas de set que ça fait plusieurs mois qu'on as pas mis à jour, on va aller chercher ceux qui n'ont pas la bonne quantité
                LegoModel.sequelize
                    .query(
                        "SELECT * FROM (SELECT sets.Name, sets.RebrickableId, sets.PartCount, SUM(sets_parts.Quantity) AS TotalQuantity FROM sets LEFT JOIN sets_parts ON sets_parts.SetId = sets.Id WHERE sets_parts.isSpare = false GROUP BY sets.Name, sets.PartCount, sets.RebrickableId) AS Quantities WHERE PartCount != TotalQuantity"
                    )
                    .then(result => {
                        var actualResult = result[0];
                        var firstResult = actualResult[0];
                        if (actualResult.length === 0) {
                            return res.send("All sets are up to date");
                        } else {
                            res.send(
                                "Updating Set #" +
                                    firstResult.RebrickableId +
                                    ": " +
                                    firstResult.Name +
                                    " because it had " +
                                    firstResult.TotalQuantity +
                                    " instead of " +
                                    firstResult.PartCount +
                                    " parts."
                            );
                            return LegoModel.updateSet(firstResult.RebrickableId);
                        }
                    });
            }
            //console.log(result.toJSON());
        });
    }
};

/*
SELECT * FROM (SELECT sets.Name, sets.PartCount, SUM(sets_parts.Quantity) AS TotalQuantity FROM sets
LEFT JOIN sets_parts ON sets_parts.SetId = sets.Id
WHERE sets_parts.isSpare = false
GROUP BY sets.Name, sets.PartCount) AS Quantities WHERE PartCount != TotalQuantity
*/
