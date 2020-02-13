var express = require("express");
var cors = require("cors");
var user = require("./../Auth/User");

var router = express.Router();
router.use("*", cors());
router.use("*", express.json({ extended: false }));

router.post("/login", function(req, res) {
    user.login(req).then(user => {
        if (user) {
            //console.log("SUCCESS");
            res.send(user);
        } else {
            //console.log("ERROR");
            res.sendStatus(403);
        }
    });
});

module.exports = router;
