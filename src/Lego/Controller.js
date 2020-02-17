var helpers = require("./helpers");
var express = require("express");
var Rebrickable = require("./RebrickableInterface");
var Model = require("./Model");
var cors = require("cors");
var user = require("./../Auth/User");
const { Op, QueryTypes } = require("sequelize");

var router = express.Router();
var defaultPageSize = 10;

router.use("*", cors());

router.use("*", function authMiddleware(req, res, next) {
    //console.log(req.baseUrl);
    //a ajouter quand on va avoir fait le login
    user.get(req).then(user => {
        if (user) {
            req.user = user;
            //console.log(user);
            next();
        } else {
            res.sendStatus(403);
        }
    });
});

router.get("/test", function(req, res) {
    Model.updateSet("6398-1").then(result => {
        res.send(result);
        //return res.send("Updated Set #" + result.RebrickableId + ": " + result.Name);
    });
});

//Test pour la quantité de pièces de chaque set:
/*
TEST:
https://2pl3rqowrj.sse.codesandbox.io/lego2/Parts/1/search
*/
router.get("/Parts/:page/:search?", function(req, res) {
    var pageSize = defaultPageSize;
    var pageNum = req.params.page;
    var where = {};
    var promise = Promise.resolve([]);
    if (!req.params.search) {
        //si on n'as pas de paramètres de recherche, on limite à ceux qui n'ont pas d'emplacement
        //https://stackoverflow.com/questions/43122077/left-excluding-join-in-sequelize
        promise = Model.sequelize
            .query("SELECT DISTINCT partId FROM parts_locations WHERE UserId = :userId", {
                replacements: { userId: req.user.id }
            })
            .then(result => {
                var flattenedList = [];
                result[0].forEach(element => {
                    flattenedList.push(element.partId);
                });
                //on a recu les part qui on des emplacements, maintenant, on ne veux pas les avoir dans la prochaine requête
                return Promise.resolve(flattenedList);
            });
    }

    promise
        .then(idsToExclude => {
            if (req.params.search) {
                where = { [Op.or]: [{ Name: { [Op.like]: "%" + req.params.search + "%" } }, { RebrickableId: { [Op.like]: "%" + req.params.search + "%" } }] };
            } else {
                where = {
                    [Op.not]: { id: idsToExclude }
                };
            }
            return Model.Part.findAll({
                include: [{ model: Model.PartColor, required: false }],
                limit: pageSize,
                offset: (pageNum - 1) * pageSize,
                where: where
            });
        })
        .then(result => {
            return Model.IncludeMultiRelation(result, Model.PartLocation, ["parts_colors", "id"], "PartLocations", { fk: "partsColorId" });
        })
        .then(result => {
            return Model.IncludeMultiRelation(result, Model.Location, ["parts_colors", "PartLocations", "locationId"], "locations", { invert: true });
        })
        .then(result => {
            return res.send(result);
        })
        .catch(error => {
            console.error(error);
            res.status(500).send(error);
        });
});

router.get("/Sets/:page/:search?", function(req, res) {
    var pageSize = defaultPageSize;
    var pageNum = req.params.page;
    var search = req.params.search ? req.params.search : "";
    var where = { [Op.or]: [{ Name: { [Op.like]: "%" + search + "%" } }, { RebrickableId: { [Op.like]: "%" + search + "%" } }] };
    var include = undefined;
    if (search === "") {
        //on va aller chercher les set de ce user
        where = undefined;
        include = [{ model: Model.SetUser, where: { UserId: req.user.id } }];
    }

    Model.Set.findAll({
        limit: pageSize,
        offset: (pageNum - 1) * pageSize,
        where,
        include
    })
        .then(result => {
            return res.send(result);
        })
        .catch(error => {
            console.error(error);
            res.status(500).send(error);
        });
});

router.get("/Part/:id", function(req, res) {
    var partId = req.params.id;

    Model.Part.findByPk(partId, { include: [{ model: Model.PartColor, separate: true }] })
        .then(result => {
            return Model.IncludeMultiRelation(result, Model.SetPart, ["parts_colors", "id"], "SetPart", { fk: "partsColorId" });
        })
        .then(result => {
            return Model.IncludeMultiRelation(result, Model.PartLocation, ["parts_colors", "id"], "PartLocations", { fk: "partsColorId" });
        })
        .then(result => {
            return Model.IncludeMultiRelation(result, Model.Location, ["parts_colors", "PartLocations", "locationId"], "Location", { invert: false });
        })
        .then(result => {
            return Model.IncludeMultiRelation(result, Model.Set, ["parts_colors", "SetPart", "setId"], "Set", { invert: false });
        })
        .then(result => {
            return Model.IncludeMultiRelation(result, Model.Location, ["parts_colors", "PartLocations", "locationId"], "locations", { invert: true });
        })
        .then(result => {
            return Model.IncludeMultiRelation(result, Model.Color, ["parts_colors", "colorId"], "Color");
        })
        .then(result => {
            return res.send(result);
        })
        .catch(error => {
            console.error(error);
            res.status(500).send(error);
        });
});

router.get("/Set/:id", function(req, res) {
    var setId = req.params.id;
    Model.Set.findByPk(setId, { include: [{ model: Model.SetPart, separate: true }, { model: Model.SetUser, separate: true, where: { UserId: req.user.id } }] })
        .then(result => {
            return Model.IncludeMultiRelation(result.toJSON(), Model.Color, "sets_parts", "colorId", "Color");
        })
        .then(result => {
            return Model.IncludeMultiRelation(result, Model.Color, ["sets_parts", "colorId"], "Color");
        })
        .then(result => {
            return Model.IncludeMultiRelation(result, Model.PartColor, ["sets_parts", "partsColorId"], "Parts", { invert: true });
        })
        .then(result => {
            return Model.IncludeMultiRelation(result, Model.Part, ["Parts", "partId"], "Part");
        })
        .then(result => {
            return Model.IncludeMultiRelation(result, Model.PartLocation, ["Parts", "id"], "PartLocations", { fk: "partsColorId" });
        })
        .then(result => {
            return Model.IncludeMultiRelation(result, Model.Location, ["Parts", "PartLocations", "locationId"], "Location");
        })
        .then(result => {
            return res.send(result);
        })
        .catch(error => {
            console.error(error);
            res.status(500).send(error);
        });
});

router.all("/Part/:id/ChangeLocation/:locationId", function(req, res) {
    //TESTWITH: https://21sle.sse.codesandbox.io/lego2/Part/27/ChangeLocation/97
    //TODO: passer par les PartColor, parce que partId ne sera plus fiable bientot...
    Model.PartLocation.update({ locationId: req.params.locationId }, { where: { [Op.and]: [{ partId: req.params.id }, { UserId: req.user.id }] } })
        .then(result => {
            return Model.Part.findByPk(req.params.id, { include: [{ model: Model.PartColor, separate: true }] });
        })
        .then(result => {
            return Model.IncludeMultiRelation(result, Model.SetPart, ["parts_colors", "id"], "SetPart", { fk: "partsColorId" });
        })
        .then(result => {
            return Model.IncludeMultiRelation(result, Model.PartLocation, ["parts_colors", "id"], "PartLocations", { fk: "partsColorId" });
        })
        .then(result => {
            return Model.IncludeMultiRelation(result, Model.Location, ["parts_colors", "PartLocations", "locationId"], "Location", { invert: false });
        })
        .then(result => {
            return Model.IncludeMultiRelation(result, Model.Set, ["parts_colors", "SetPart", "setId"], "Set", { invert: false });
        })
        .then(result => {
            return Model.IncludeMultiRelation(result, Model.Location, ["parts_colors", "PartLocations", "locationId"], "locations", { invert: true });
        })
        .then(result => {
            return Model.IncludeMultiRelation(result, Model.Color, ["parts_colors", "colorId"], "Color");
        })
        .then(result => {
            return res.send(result);
        })
        .catch(error => {
            console.error(error);
            res.status(500).send(error);
        });
});

router.get("/Location/:id", function(req, res) {
    var partId = req.params.id;

    Model.Location.findByPk(partId, { include: [{ model: Model.PartLocation, separate: true }] })
        .then(result => {
            return Model.IncludeMultiRelation(result, Model.PartColor, ["parts_locations", "partsColorId"], "PartColor", { invert: true });
        })
        .then(result => {
            return Model.IncludeMultiRelation(result, Model.Color, ["PartColor", "ColorId"], "Color");
        })
        .then(result => {
            return Model.IncludeMultiRelation(result, Model.Part, ["PartColor", "PartId"], "Parts", { invert: true });
        })
        .then(result => {
            return res.send(result);
        })
        .catch(error => {
            console.error(error);
            res.status(500).send(error);
        });
});

router.get("/Locations/:page?/:search?", function(req, res) {
    var pageSize = defaultPageSize;
    var searchTerm = req.params.search ? req.params.search : "";
    var whereObject = {
        where: {
            [Op.and]: [
                { [Op.or]: [{ Name: { [Op.like]: "%" + searchTerm + "%" } }, { LocationCode: { [Op.like]: "%" + searchTerm + "%" } }] },
                { UserId: req.user.id }
            ]
        }
    };
    if (req.params.page !== undefined) {
        whereObject.limit = pageSize;
        whereObject.offset = (req.params.page - 1) * pageSize;
    }

    Model.Location.findAll(whereObject)
        .then(result => {
            return res.send(result);
        })
        .catch(error => {
            console.error(error);
            res.status(500).send(error);
        });
});

router.all("/ChangeQuantity/:setId/:newQuantity", function(req, res) {
    Model.upsert(
        Model.SetUser,
        {
            Quantity: req.params.newQuantity,
            isOwned: true,
            inInventory: true,
            isBuilt: false,
            setId: req.params.setId,
            userId: req.user.id
        },
        {
            setId: req.params.setId,
            userId: req.user.id
        }
    )
        .then(result => {
            res.send(result);
        })
        .catch(error => {
            console.error(error);
            res.status(500).send(error);
        });
});

router.all("/UpdateAny", function(req, res) {
    var oneMonthAgo = new Date();
    var start = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    //on va aller voir nos sets et regarder ceux que ça fait longtemps qu'on as pas mis à jour
    Model.Set.findOne({
        where: {
            updatedAt: {
                [Op.lt]: oneMonthAgo
            }
        }
    }).then(result => {
        if (result !== null) {
            Model.updateSet(result.RebrickableId).then(result => {
                var end = new Date() - start;
                return res.send("Updated Set #" + result.RebrickableId + ": " + result.Name + " in " + end + "ms");
            });
        } else {
            return res.send("All sets are up to date");
        }
        //console.log(result.toJSON());
    });
});

router.all("/UpdateQuantities", function(req, res) {
    var start = new Date();
    var fs = require("fs");
    fs.readFile("src/Lego/SQL/parts_locations_update.sql", "utf8", function(err, query) {
        if (err) throw err;
        Model.sequelize
            .query(query, {
                replacements: { userId: req.user.id }
            })
            .then(result => {
                var end = new Date() - start;
                //console.log(result);
                console.info("Execution time:" + end + "ms");
                res.send("OK");
            });
    });
});

router.all("/UpdateSet/:setId", function(req, res) {
    //vu que cette requête est couteuse, on devrais la limiter...
    //on va chercher la liste de pièces
    //TESTWITH: https://2pl3rqowrj.sse.codesandbox.io/lego2/UpdateSet/75198-1
    var start = new Date();
    console.info("Starting the update of Set # " + req.params.setId);
    var setCode = req.params.setId;
    Model.updateSet(setCode)
        .then(result => {
            var end = new Date() - start;
            console.info("Execution time:" + end + "ms");
            res.send(result);
        })
        .catch(error => {
            console.error(error);
            res.sendStatus(500);
        });
});

module.exports = router;
