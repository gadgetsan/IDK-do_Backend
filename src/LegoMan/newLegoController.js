var helpers = require("./helpers");
var express = require("express");
var Rebrickable = require("./RebrickableInterface");
var Model = require("./model");
var cors = require("cors");
const { Op } = require("sequelize");

var router = express.Router();

router.use("*", cors());

router.get("/test", function(req, res) {
    var count = 0;
    res.send("TEST");
});

var defaultPageSize = 10;

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
        promise = Model.sequelize.query("SELECT DISTINCT partId FROM parts_locations").then(result => {
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

    Model.Set.findAll({
        limit: pageSize,
        offset: (pageNum - 1) * pageSize,
        where: { [Op.or]: [{ Name: { [Op.like]: "%" + search + "%" } }, { RebrickableId: { [Op.like]: "%" + search + "%" } }] }
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
    Model.Set.findByPk(setId, { include: [{ model: Model.SetPart, separate: true }] })
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
    Model.PartLocation.update({ locationId: req.params.locationId }, { where: { partId: req.params.id } })
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
        where: { [Op.or]: [{ Name: { [Op.like]: "%" + searchTerm + "%" } }, { LocationCode: { [Op.like]: "%" + searchTerm + "%" } }] }
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

router.all("/UpdateSet/:setId", function(req, res) {
    //vu que cette requête est couteuse, on devrais la limiter...
    //on va chercher la liste de pièces
    //TESTWITH: https://2pl3rqowrj.sse.codesandbox.io/lego2/UpdateSet/75198-1
    var setCode = req.params.setId;
    var currentSet = {};
    var stats = {};

    Rebrickable.GetSetInfo(setCode)
        .then(set => {
            //on va commencer par aller chercher les infos du set
            var modelSet = Rebrickable.SetToModel(set);
            return Model.upsertAndRetrieve(Model.Set, modelSet);
        })
        .then(retrievedSet => {
            //ensuite on va supprimer tout les SetPart
            currentSet = retrievedSet;
            return Model.SetPart.destroy({
                where: {
                    setId: retrievedSet.id
                }
            });
        })
        .then(() => {
            //ensuite on va aller chercher les données de Rebrickable
            return Rebrickable.GetPartsForSet(setCode);
        })
        .then(partList => {
            //on va enregistrer ce qu'on a été cherché¸
            stats.partsCount = partList.length;
            //partList = [partList[0]];
            return Promise.all(
                partList.map(part => {
                    //on va commencer par convertir en objet DB
                    //console.log(JSON.stringify(part));
                    //part.set = currentSet;
                    var partToAdd = Rebrickable.SetPartToModel(part);
                    partToAdd.setId = currentSet.id;
                    return Model.SetPart.InsertWithLinks(partToAdd);
                })
            );
        })
        .then(result => {
            //on va enregistrer ce qu'on a été cherché¸
            console.log("Updated the " + stats.partsCount + " different parts of the set named " + currentSet.Name + "(" + setCode + ") with success");
            return res.send(currentSet);
        })
        .catch(err => {
            console.error("ERROR: " + err.message);
            console.dir(err);
            res.send(err);
        });
});

module.exports = router;
