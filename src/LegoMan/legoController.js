var db = require("./database");
var helpers = require("./helpers");
var https = require("https");

module.exports = {
    getContainerData: function(req, res) {
        db.getPartsForLocation(req.query.name, function(result) {
            res.send(result);
        });
    },

    getParts: function(req, res) {
        if (req.query.searchTerm == undefined || req.query.searchTerm == "") {
            db.getParts(10, req.query.currentPage, function(result) {
                res.send(result);
            });
        } else {
            db.searchParts(10, req.query.currentPage, req.query.searchTerm, function(result) {
                res.send(result);
            });
        }
    },

    getLocations: function(req, res) {
        if (!req.query.currentPage && !req.query.searchTerm) {
            db.getLocations(function(result) {
                res.send(result);
            });
        } else {
            db.searchLocations(10, req.query.currentPage, req.query.searchTerm, function(result) {
                res.send(result);
            });
        }
    },

    getSets: function(req, res) {
        //console.dir("search: " + req.query.searchTerm);
        if (req.query.searchTerm == undefined || req.query.searchTerm == "") {
            db.getSets(20, req.query.currentPage, req.session.userId, function(result) {
                res.send(result);
            });
        } else {
            db.searchSets(20, req.query.currentPage, req.query.searchTerm, req.session.userId, function(result) {
                res.send(result);
            });
        }
    },

    cleanup: function(req, res) {
        db.eleminatePartDuplicates(function(result) {
            console.log("OK");
            res.send("OK");
        });
    },

    changePartLocation: function(req, res) {
        db.changePartLocation(req.body.locationId, req.body.rebrickableId, function(result) {
            res.send(result);
        });
    },

    createLocation: function(req, res) {
        db.createLocation(req.body.locationName, req.body.locationCode, req.body.locationType, function(result) {
            res.send(result);
        });
    },
    updateLocationName: function(req, res) {
        db.updateLocationName(req.body.locationCode, req.body.newName, function(result) {
            res.send(result);
        });
    },

    getPart: function(req, res) {
        helpers.getPartInformation(req.query.rebrickableId, function(result) {
            res.send(result);
        });
    },

    getSet: function(req, res) {
        db.getSetData(req.query.rebrickableId, function(result) {
            res.send(result);
        });
    },

    getLocation: function(req, res) {
        db.getLocationData(req.query.LocationCode, function(result) {
            res.send(result);
        });
    },

    fetchRebrikableData: function(req, res) {
        helpers.getPartInformation(req.query.rebrickableId, function(result) {
            res.send(result);
        });
    },

    fetchRebrikableColor: function(req, res) {
        helpers.getColorInformation(req.query.rebrickableId, function(result) {
            res.send(result);
        });
    },

    getColorsForPart: function(req, res) {
        db.getPartColors(req.query.rebrickableId, function(result) {
            res.send(result);
        });
    },
    getSortedPartsStats: function(req, res) {
        db.getSortedPartsStats(function(result) {
            res.send(result);
        });
    },
    updateSetQuantity: function(req, res) {
        //console.dir("setID: " + req.body.setId + ", qt: " + req.body.quantity + " , userId: " + req.session.userId);

        db.updateSetOwnership(req.body.setId, req.body.quantity, req.session.userId, function(result) {
            res.send(result);
        });
    },
    fetchRebrikableSet: function(req, res) {
        helpers.getSetInformation(req.body.SetCode, function(result) {
            //console.log({ "Set ID": result });
            res.send({ "Set ID": result });
        });
    }
};
