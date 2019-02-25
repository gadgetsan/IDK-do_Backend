var db = require("./database");
module.exports = {
    getList: function(req, res) {
        var share = `<p><a href="/web/shareList">Partager ma liste</a></p>`;
        var page = `<p><a href="/web/addListItem">Ajouter un item à la liste</a></p>`;
        db.getItemList(req.session.rowid, result => {
            var htmlList = "<table>";
            for (const element of result) {
                if (element.link) {
                    htmlList += "<tr><td><strong><a href='" + element.link + "'>" + element.name + "</a></strong> - " + element.description + "</td></tr>";
                } else {
                    htmlList += "<tr><td><strong>" + element.name + "</strong> - " + element.description + "</td></tr>";
                }
                // ... do something with s ...
            }
            htmlList += "</table>";
            db.getShares(req.session.rowid, result => {
                var SharesList = "<h4>Cette liste est partagée avec: </h4><ul>";
                for (const element of result) {
                    SharesList += "<li>" + element.toEmail + "</li>";
                }
                SharesList += "</ul>";
                db.getSharedToMe(req.session.email, result => {
                    var SharesFromList = "<h4>Ces utilisateurs partagent leur liste avec vous: </h4><ul>";
                    for (const element of result) {
                        SharesFromList += "<li>" + element.name + " (" + element.email + ")</li>";
                    }
                    SharesFromList;
                    SharesFromList += "</ul>";

                    res.send(
                        "Bienvenue " +
                            req.session.name +
                            " avec le email " +
                            req.session.email +
                            " et le rowid " +
                            req.session.rowid +
                            htmlList +
                            page +
                            SharesList +
                            share +
                            SharesFromList
                    );
                });
            });
            //console.log("Resultat: " + JSON.stringify(resultat));
        });
    },
    getAddItem: function(req, res) {
        res.sendFile("/sandbox/minifront/addItem.htm");
    },
    apiList: function(req, res) {
        db.getItemList(req.session.rowid, result => {
            res.send(result);
        });
    },
    apiShares: function(req, res) {
        db.getShares(req.session.rowid, result => {
            res.send(result);
        });
    },
    apiSharedList: function(req, res) {
        //console.dir(req.query);
        db.getSharedList(req.query.sharedUserId, result => {
            res.send(result);
        });
    },
    apiSharedWithMe: function(req, res) {
        db.getSharedToMe(req.session.email, result => {
            //console.dir(result);
            res.send(result);
        });
    },
    apiGetUser: function(req, res) {
        db.getUser(req.query.rowid, result => {
            //console.dir(result);
            res.send(result);
        });
    },
    postAddItem: function(req, res) {
        db.addItem(req.body.name, req.body.description, req.body.link, req.session.rowid, function(err) {
            if (err) {
                console.error(err.message);
                res.sendFile("/sandbox/minifront/addItem.htm");
            } else {
                res.redirect("/web/list");
            }
        });
    },
    apiAddItem: function(req, res) {
        db.addItem(req.body.name, req.body.description, req.body.link, req.session.rowid, function(err, newRowId) {
            if (err) {
                console.error(err.message);
                res.send(false);
            } else {
                res.send(newRowId.toString());
            }
        });
    },
    apiAddShare: function(req, res) {
        db.share(req.body.shareEmail, req.session.rowid, function(err, newRowId) {
            if (err) {
                console.error(err.message);
                res.send(false);
            } else {
                res.send(newRowId.toString());
            }
        });
    },
    apiRemoveItem: function(req, res) {
        db.removeItem(req.body.rowid, req.body.userid, function(err) {
            if (err) {
                console.error(err.message);
                res.send(false);
            } else {
                res.send(true);
            }
        });
    },
    apiRemoveShare: function(req, res) {
        db.removeShare(req.body.rowid, req.body.userid, function(err) {
            if (err) {
                console.error(err.message);
                res.send(false);
            } else {
                res.send(true);
            }
        });
    },
    apiMarkBought: function(req, res) {
        var datetime = new Date();
        db.markAsBought(req.body.rowid, datetime, req.session.rowid, function(err) {
            if (err) {
                console.error(err.message);
                res.send(false);
            } else {
                res.send(true);
            }
        });
    },
    getShareList: function(req, res) {
        res.sendFile("/sandbox/minifront/shareList.htm");
    },
    postShareList: function(req, res) {
        db.share(req.body.shareEmail, req.session.rowid, function(err) {
            if (err) {
                console.error(err.message);
                res.sendFile("/sandbox/minifront/shareList.htm");
            } else {
                res.redirect("/web/list");
            }
        });
    }
};