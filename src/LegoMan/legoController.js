var db = require("./database");
var helpers = require("./helpers");
var cors = require("cors");
var express = require("express");
var legoUserSession = require("./session");
var legoSession = require("./legoConnect");
var router = express.Router();

router.use("*", cors());
router.use("*", express.json({ extended: true }));

router.use("*", function userMiddleware(req, res, next) {
    //console.log(req.baseUrl);
    //a ajouter quand on va avoir fait le login
    legoUserSession.getUser(req, result => {
        //console.dir(result);
        if (
            !result &&
            req.baseUrl !== "/api/register" &&
            req.baseUrl !== "/api/validate" &&
            req.baseUrl !== "/api/pwChangeReq" &&
            req.baseUrl !== "/api/pwChange" &&
            req.baseUrl !== "/lego/test"
        ) {
            res.sendStatus(401);
        } else {
            //console.log("REQUEST START ====");
            next();
        }
    });
});

router.post("/register", legoSession.apiRegister);
router.post("/login", legoSession.apiLogin);

router.get("/test", function(req, res) {
    var model = require("./model.js");
    res.send({ Hello: " TEST" });
});

router.get("/getContainerData", function(req, res) {
    db.getPartsForLocation(req.query.name, function(result) {
        res.send(result);
    });
});

router.get("/getParts", function(req, res) {
    if (req.query.searchTerm === undefined || req.query.searchTerm === "") {
        db.getParts(10, req.query.currentPage, function(result) {
            res.send(result);
        });
    } else {
        db.searchParts(10, req.query.currentPage, req.query.searchTerm, function(result) {
            res.send(result);
        });
    }
});

router.get("/getLocations", function(req, res) {
    if (!req.query.currentPage && !req.query.searchTerm) {
        db.getLocations(function(result) {
            res.send(result);
        });
    } else {
        db.searchLocations(10, req.query.currentPage, req.query.searchTerm, function(result) {
            res.send(result);
        });
    }
});

router.get("/getSets", function(req, res) {
    //console.dir("search: " + req.query.searchTerm);
    if (req.query.searchTerm === undefined || req.query.searchTerm === "") {
        db.getSets(20, req.query.currentPage, req.session.userId, function(result) {
            res.send(result);
        });
    } else {
        db.searchSets(20, req.query.currentPage, req.query.searchTerm, req.session.userId, function(result) {
            res.send(result);
        });
    }
});

router.get("/cleanup", function(req, res) {
    db.eleminatePartDuplicates(function(result) {
        console.log("OK");
        res.send("OK");
    });
});

router.post("/changePartLocation", function(req, res) {
    db.changePartLocation(req.body.locationId, req.body.rebrickableId, function(result) {
        res.send(result);
    });
});

router.post("/createLocation", function(req, res) {
    db.createLocation(req.body.locationName, req.body.locationCode, req.body.locationType, function(result) {
        res.send(result);
    });
});

router.post("/updateLocationName", function(req, res) {
    db.updateLocationName(req.body.locationCode, req.body.newName, function(result) {
        res.send(result);
    });
});

router.get("/getPart", function(req, res) {
    helpers.getPartInformation(req.query.rebrickableId, function(result) {
        res.send(result);
    });
});

router.get("/getSet", function(req, res) {
    db.getSetData(req.query.rebrickableId, function(result) {
        res.send(result);
    });
});

router.get("/getLocation", function(req, res) {
    db.getLocationData(req.query.LocationCode, function(result) {
        res.send(result);
    });
});

router.get("/fetchPartData", function(req, res) {
    helpers.getPartInformation(req.query.rebrickableId, function(result) {
        //console.log(result);
        res.send(result);
    });
});

router.get("/fetchColor", function(req, res) {
    helpers.getColorInformation(req.query.rebrickableId, function(result) {
        res.send(result);
    });
});

router.get("/getColorsForPart", function(req, res) {
    db.getPartColors(req.query.rebrickableId, function(result) {
        res.send(result);
    });
});

router.get("/getSortedPartsStats", function(req, res) {
    db.getSortedPartsStats(function(result) {
        res.send(result);
    });
});

router.post("/updateSetQt", function(req, res) {
    //console.dir("setID: " + req.body.setId + ", qt: " + req.body.quantity + " , userId: " + req.session.userId);

    db.updateSetOwnership(req.body.setId, req.body.quantity, req.session.userId, function(result) {
        res.send(result);
    });
});

router.post("/fetchSet", function(req, res) {
    helpers.getSetInformation(req.body.SetCode, function(result) {
        //console.log({ "Set ID": result });
        res.send({ "Set ID": result });
    });
});

module.exports = router;
