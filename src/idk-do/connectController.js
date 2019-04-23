var db = require("./sqlDatabase");
module.exports = {
    loginGet: function(req, res) {
        res.sendFile("./minifront/login.htm", { root: __dirname + "/../.." });
    },
    loginPost: function(req, res) {
        //res.send("Bienvenue " + req.session.name + " avec le email " + req.session.email);
        if (req.session.isLogged) {
            res.redirect("/web/login");
        } else {
            res.redirect("/web/list");
        }
    },
    apiLogin: function(req, res) {
        res.send(req.session);
        //res.send(req.session.isLogged);
    },
    apiRegister: function(req, res) {
        //console.log("receiving request");
        //on commence par créé le user
        db.createUser(req.body.email, req.body.password, req.body.name, (err, newUserId) => {
            //console.log("user created userId: " + newUserId);
            //ensuite on créé le code qu'il va utiliser pour valider le courriel
            var nodemailer = require("nodemailer");
            db.createActionKey("validate", newUserId, (err, key) => {
                //console.log("key created");
                //finalement, on envoie le courriel
                var transporter = nodemailer.createTransport({
                    service: "gmail",
                    auth: {
                        user: "stephaneblitz@gmail.com",
                        pass: process.env.MAIL_PASSWORD
                    }
                });
                var mailOptions = {
                    from: "stephaneblitz@gmail.com",
                    to: req.body.email,
                    subject: "Validation de votre compte pour le logiciel d'échange de cadeaux",
                    text: "Pour valider votre compte utilisateur, utilisez le lien suivant: " + process.env.SERVER_LINK + "/Validation?key=" + key
                };

                transporter.sendMail(mailOptions, function(error, info) {
                    if (error) {
                        console.log(error);
                    } else {
                        //console.log("Email sent: " + info.response);
                    }
                });
            });
            res.send("ok");
        });
    },
    registerGet: function(req, res) {
        res.sendFile("./minifront/register.htm", { root: __dirname + "/.." });
    },
    apiValidate: function(req, res) {
        db.validateAccount(req.body.key, result => {
            res.send(result);
        });
    },
    apiRequestPasswordChange: function(req, res) {
        //on commence par valider que le courriel existe
        db.validateEmail(req.body.email, (err, userId) => {
            //ensuite on envoie le courriel de reset
            //console.log(userId);
            if (!err) {
                var nodemailer = require("nodemailer");
                db.createActionKey("password", userId, (err, key) => {
                    //console.log("key created");
                    //finalement, on envoie le courriel
                    var transporter = nodemailer.createTransport({
                        service: "gmail",
                        auth: {
                            user: "stephaneblitz@gmail.com",
                            pass: process.env.MAIL_PASSWORD
                        }
                    });
                    var mailOptions = {
                        from: "stephaneblitz@gmail.com",
                        to: req.body.email,
                        subject: "Modification de votre mot de passe",
                        text:
                            `Une personne à fait une demande pour modifier votre mot de passe (si ce n'est pas vous, vous pouvez ne pas porter attention à ce courriel ),
                         cliquez sur le lien suivant pour le modifier: ` +
                            process.env.SERVER_LINK +
                            `/Password?key=` +
                            key
                    };

                    transporter.sendMail(mailOptions, function(error, info) {
                        if (error) {
                            console.log(error);
                        } else {
                            //console.log("Email sent: " + info.response);
                        }
                    });
                });
                res.send("ok");
            } else {
                res.send(400);
            }
        });
    },
    apiPasswordChange: function(req, res) {
        //on commence par valider que le la clé existe
        db.validateKey(req.body.key, keyData => {
            //on met à jour le mot de passe
            db.updatePassword(req.body.password, keyData.user, (err, userId, type) => {
                res.send("ok");
            });
        });
    },
    registerPost: function(req, res) {
        db.createUser(req.body.email, req.body.password, req.body.name, result => {
            res.redirect("/web/login");
        });
    }
};
