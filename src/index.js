var express = require("express");
var cors = require("cors");
var app = express();

var connectCtrl = require("./connectController");
var listCtrl = require("./listController");
var db = require("./database");
var userSession = require("./session");
//console.log("test");

//on utilise le urlencoded sur le web et le jsonencoded dans l'API
app.use("/web/*", express.urlencoded({ extended: true }));
app.use("/api/*", express.json({ extended: true }));

//pour pouvoir repondre à des requêtes à l'exterieur du domaine
app.use("/api/*", cors());

//Middleware pour la gestion de l'accès et de l'utilisateur
app.use("/web/*", function userMiddleware(req, res, next) {
    userSession.getUser(req, result => {
        if (!result && req.baseUrl != "/web/login" && req.baseUrl != "/web/register" && req.baseUrl != "/") {
            res.redirect("/web/login");
        } else {
            next();
        }
    });
});
app.use("/api/*", function userMiddleware(req, res, next) {
    //console.log(req.baseUrl);
    userSession.getUser(req, result => {
        if (
            !result &&
            req.baseUrl != "/api/register" &&
            req.baseUrl != "/api/validate" &&
            req.baseUrl != "/api/pwChangeReq" &&
            req.baseUrl != "/api/pwChange"
        ) {
            res.sendStatus(401);
        } else {
            next();
        }
    });
});

app.get("/", function(req, res) {
    res.redirect("/web/login");
});

app.get("/web/login", connectCtrl.loginGet);
app.post("/web/login", connectCtrl.loginPost);
app.post("/api/login", connectCtrl.apiLogin);

app.get("/web/register", connectCtrl.registerGet);
app.post("/web/register", connectCtrl.registerPost);
app.post("/api/register", connectCtrl.apiRegister);
app.post("/api/pwChangeReq", connectCtrl.apiRequestPasswordChange);
app.post("/api/pwChange", connectCtrl.apiPasswordChange);
app.post("/api/validate", connectCtrl.apiValidate);

app.get("/web/list", listCtrl.getList);
app.get("/web/addListItem", listCtrl.getAddItem);
app.post("/web/addListItem", listCtrl.postAddItem);
app.get("/web/shareList", listCtrl.getShareList);
app.post("/web/shareList", listCtrl.postShareList);

app.get("/api/list", listCtrl.apiList);
app.get("/api/shares", listCtrl.apiShares);
app.get("/api/sharedWithMe", listCtrl.apiSharedWithMe);
app.get("/api/sharedList", listCtrl.apiSharedList);
app.get("/api/user", listCtrl.apiGetUser);
app.post("/api/addIdea", listCtrl.apiAddItem);
app.post("/api/addShare", listCtrl.apiAddShare);
app.post("/api/deleteIdea", listCtrl.apiRemoveItem);
app.post("/api/deleteShare", listCtrl.apiRemoveShare);
app.post("/api/boughtItem", listCtrl.apiMarkBought);

app.listen(8080);
