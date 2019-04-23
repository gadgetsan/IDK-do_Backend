const async = require("async");
var mysql = require("mysql");

exports.init = function(callback) {
    var connection = mysql.createConnection({
        database: "Lego_Management",
        host: process.env.mysql_host,
        user: process.env.mysql_user,
        password: process.env.mysql_password
    });

    connection.connect(function(err) {
        if (err) {
            console.error("Error connecting: " + err.stack);
            callback(err);
        } else {
            //console.log("Connected as thread id: " + connection.threadId);
            callback(connection, cb => {
                //après tout oon ferme la DB
                connection.end();
                cb();
            });
        }
    });
};

exports.getPartsForLocation = function(locationCode, callback) {
    exports.init(function(db, cb) {
        db.query("SELECT RebrickableId FROM Parts_Locations WHERE LocationCode =? GROUP BY RebrickableId;", [locationCode], (err, row) => {
            //console.dir(row);
            cb(() => {
                callback(row);
            });
        });
    });
};

exports.createLocation = function(locationName, locationCode, type, callback) {
    //console.log("LocationName: " + locationName + " LocationCode: " + locationCode, " type: " + type);
    exports.init(function(db, cb) {
        db.query("SELECT * FROM Locations WHERE LocationCode = ?;", [locationCode], (err, rows) => {
            if (rows.length == 0) {
                db.query("INSERT INTO Locations (LocationCode, Name, Type) VALUES (?,?, ?)", [locationCode, locationName, type], (err, row) => {
                    //console.dir(rows);
                    if (err) {
                        console.error("Error: " + err.stack);
                        cb(() => {
                            callback(err);
                        });
                    } else {
                        cb(() => {
                            callback(row);
                        });
                    }
                });
            } else {
                cb(() => {
                    callback(err);
                });
            }
        });
    });
};

exports.getParts = function(pageSize, pageNum, callback) {
    exports.init(function(db, cb) {
        db.query(
            `SELECT Parts.Id, Parts_Locations.RebrickableId, Parts.Name, SUM(Quantity) AS TotalQuantity, Parts_Locations.LocationCode, Locations.Name AS LocationName 
            FROM Parts_Locations 
            LEFT JOIN Locations ON Locations.LocationCode = Parts_Locations.LocationCode 
            LEFT JOIN Parts ON Parts_Locations.RebrickableId = Parts.RebrickableId 
            WHERE Parts_Locations.LocationCode IS NULL
            GROUP BY Parts.Id, Parts_Locations.RebrickableId, Parts_Locations.LocationCode, Locations.Name, Parts.Name
            ORDER BY TotalQuantity DESC 
            LIMIT ?,?;`,
            [(pageNum - 1) * pageSize, pageSize],
            (err, rows) => {
                if (err) {
                    console.error(err.message);
                }
                //console.dir(rows);
                cb(() => {
                    callback(rows);
                });
            }
        );
    });
};

exports.searchParts = function(pageSize, pageNum, searchTerm, callback) {
    var actualSearchTerm = "%" + searchTerm + "%";
    //console.log(actualSearchTerm);
    exports.init(function(db, cb) {
        db.query(
            `SELECT Parts.Id, Parts_Locations.RebrickableId, Parts.Name, SUM(Quantity) AS TotalQuantity, Parts_Locations.LocationCode, Locations.Name AS LocationName 
            FROM Parts_Locations 
            LEFT JOIN Locations ON Locations.LocationCode = Parts_Locations.LocationCode 
            LEFT JOIN Parts ON Parts_Locations.RebrickableId = Parts.RebrickableId 
            WHERE Parts_Locations.RebrickableId LIKE ?
            GROUP BY Parts.Id, Parts_Locations.RebrickableId, Parts.Name, Parts_Locations.LocationCode, Locations.Name
            ORDER BY TotalQuantity DESC LIMIT ?,?;`,
            [actualSearchTerm, (pageNum - 1) * pageSize, pageSize],
            (err, rows) => {
                if (err) {
                    console.error(err.message);
                }
                //console.dir(rows);
                cb(() => {
                    callback(rows);
                });
            }
        );
    });
};

exports.getLocations = function(callback) {
    exports.init(function(db, cb) {
        db.query("SELECT * FROM Locations", [], (err, rows) => {
            if (err) {
                console.error(err.message);
            }
            //console.dir(rows);
            cb(() => {
                callback(rows);
            });
        });
    });
};

exports.searchLocations = function(pageSize, pageNum, searchTerm, callback) {
    var actualSearchTerm = "%" + searchTerm + "%";
    exports.init(function(db, cb) {
        db.query(
            `SELECT Locations.Name, Sum(Parts_Locations.Quantity) AS TotalQuantity, Locations.LocationCode 
            FROM Locations 
            LEFT JOIN Parts_Locations ON Parts_Locations.LocationCode = Locations.LocationCode 
            WHERE Locations.Name LIKE ? OR Locations.LocationCode LIKE ? 
            GROUP BY Locations.Name, Locations.LocationCode 
            ORDER BY TotalQuantity DESC LIMIT ?,?;`,
            [actualSearchTerm, actualSearchTerm, (pageNum - 1) * pageSize, pageSize],
            (err, rows) => {
                if (err) {
                    console.error(err.message);
                }
                //console.dir(rows);
                cb(() => {
                    callback(rows);
                });
            }
        );
    });
};

exports.getSets = function(pageSize, pageNum, callback) {
    exports.init(function(db, cb) {
        db.query("SELECT * FROM Sets LEFT JOIN Sets_Users ON Sets_Users.SetId = Sets.Id LIMIT ?,?", [(pageNum - 1) * pageSize, pageSize], (err, rows) => {
            if (err) {
                console.error(err.message);
            }
            //console.dir(rows);
            cb(() => {
                callback(rows);
            });
        });
    });
};

exports.searchSets = function(pageSize, pageNum, searchTerm, callback) {
    var actualSearchTerm = "%" + searchTerm + "%";
    exports.init(function(db, cb) {
        db.query(
            `SELECT *
            FROM Sets
            LEFT JOIN Sets_Users ON Sets_Users.SetId = Sets.Id
            WHERE Sets.Name LIKE ? OR Sets.RebrickableId LIKE ? 
            LIMIT ?,?;`,
            [actualSearchTerm, actualSearchTerm, (pageNum - 1) * pageSize, pageSize],
            (err, rows) => {
                if (err) {
                    console.error(err.message);
                }
                //console.dir(rows);
                cb(() => {
                    callback(rows);
                });
            }
        );
    });
};

exports.changePartLocation = function(locationCode, rebrickableId, callback) {
    exports.init(function(db, cb) {
        db.query("UPDATE Parts_Locations SET LocationCode=? WHERE RebrickableId=?", [locationCode, rebrickableId], (err, rows) => {
            //console.dir(rows);
            if (err) {
                console.error("Error connecting: " + err.stack);
                callback(err);
            } else {
                cb(() => {
                    callback(rows);
                });
            }
        });
    });
};

exports.updateLocationName = function(code, newName, callback) {
    exports.init(function(db, cb) {
        db.query("UPDATE Locations SET Name=? WHERE LocationCode=?", [newName, code], (err, rows) => {
            //console.dir(rows);
            if (err) {
                console.error("Error connecting: " + err.stack);
                callback(err);
            } else {
                cb(() => {
                    callback(rows);
                });
            }
        });
    });
};

exports.getPartData = function(rebrickableId, callback) {
    exports.init(function(db, cb) {
        db.query("SELECT * FROM Parts WHERE RebrickableId =? ;", [rebrickableId], (err, rows) => {
            //console.dir(row);
            if (err) {
                console.error("Error connecting: " + err.stack);
                callback(err);
            } else {
                cb(() => {
                    callback(rows[0]);
                });
            }
        });
    });
};

exports.getSetData = function(rebrickableId, callback) {
    exports.init(function(db, cb) {
        db.query(
            `SELECT 
                Sets_Parts.Id AS Id, 
                Sets.RebrickableId AS SetID, 
                Sets.Name, Sets.Year, 
                Parts.Name, Parts.RebrickableImageUrl, 
                Sets_Parts.PartRebrickableId as RebrickableId, 
                Sets_Parts.quantity AS Quantity, 
                Sets_Parts.ColorRebrickableId AS RebrickableColor, 
                Colors.Hex, 
                Colors.Name AS ColorName, 
                Locations.LocationCode,
                Locations.Name AS LocationName
            FROM Sets_Parts 
            LEFT JOIN Sets ON Sets.Id = Sets_Parts.SetId 
            LEFT JOIN Colors ON Colors.RebrickableId = Sets_Parts.ColorRebrickableId 
            LEFT JOIN Parts ON Sets_Parts.PartRebrickableId = Parts.RebrickableId 
            LEFT JOIN Parts_Locations ON Parts_Locations.RebrickableId = Sets_Parts.PartRebrickableId AND Parts_Locations.RebrickableColor = Sets_Parts.ColorRebrickableId 
            LEFT JOIN Locations ON Locations.LocationCode = Parts_Locations.LocationCode 
            WHERE Sets.RebrickableId  =?
            ORDER BY Locations.LocationCode IS NOT NULL, Sets_Parts.ColorRebrickableId`,
            [rebrickableId],
            (err, rows) => {
                //console.dir(row);
                if (err) {
                    console.error("Error connecting: " + err.stack);
                    callback(err);
                } else {
                    cb(() => {
                        callback(rows);
                    });
                }
            }
        );
    });
};
exports.eleminatePartDuplicates = function(callback) {
    exports.init(function(db, cb) {
        db.query(`SELECT RebrickableId, count(*) as count, MAX(Id) AS IdToKeep FROM Parts GROUP BY RebrickableId HAVING count >= 2;`, [], (err, rows) => {
            //console.dir(row);
            if (err) {
                console.error("Error connecting: " + err.stack);
                callback(err);
            } else {
                //console.dir(rows);
                var rebrickableToRemove = [];
                var idToKeep = [];
                for (var i = 0; i < rows.length; ++i) {
                    rebrickableToRemove.push(rows[i].RebrickableId);
                    idToKeep.push(rows[i].IdToKeep);
                }
                //console.log("rebrickableToRemove: " + rebrickableToRemove.join(","));
                //console.log("idToKeep: " + idToKeep.join(","));
                db.query(`DELETE FROM Parts WHERE RebrickableId IN (?) AND Id NOT IN (?);`, [rebrickableToRemove, idToKeep], (err, rows) => {
                    //console.dir(rows);
                    if (err) {
                        console.error("Error connecting: " + err.stack);
                        callback(err);
                    } else {
                        cb(() => {
                            callback(rows);
                        });
                    }
                });
            }
        });
    });
};

exports.getColorData = function(rebrickableId, callback) {
    exports.init(function(db, cb) {
        db.query("SELECT * FROM Colors WHERE RebrickableId =? ;", [rebrickableId], (err, rows) => {
            //console.dir(row);
            if (err) {
                console.error("Error connecting: " + err.stack);
                callback(err);
            } else {
                cb(() => {
                    callback(rows[0]);
                });
            }
        });
    });
};

exports.getLocationData = function(locationCode, callback) {
    exports.init(function(db, cb) {
        db.query(
            `SELECT Parts_Locations.RebrickableId, Locations.Name, Locations.LocationCode, SUM(Quantity) AS TotalQuantity, Parts.Name, Parts.RebrickableImageUrl
            FROM Parts_Locations 
            LEFT JOIN Locations ON Locations.LocationCode = Parts_Locations.LocationCode 
            LEFT JOIN Parts ON Parts_Locations.RebrickableId = Parts.RebrickableId 
            WHERE Parts_Locations.LocationCode =? 
            GROUP BY Parts_Locations.RebrickableId, Locations.Name, Locations.LocationCode, Parts.Name, Parts.RebrickableImageUrl
            ORDER BY SUM(Quantity) DESC;`,
            [locationCode],
            (err, rows) => {
                //console.dir(row);
                if (err) {
                    console.error("Error connecting: " + err.stack);
                    callback(err);
                } else {
                    cb(() => {
                        callback(rows);
                    });
                }
            }
        );
    });
};

exports.createPartData = function(rebrickableId, name, json, callback) {
    var parsedJSON = JSON.parse(json);
    exports.init(function(db, cb) {
        db.query(
            "INSERT INTO Parts (RebrickableId, Name, RebrickableJSON, RebrickableImageUrl) VALUES (?, ?, ?, ?)",
            [rebrickableId, name, json, parsedJSON.part_img_url],
            (err, row) => {
                //console.dir(rows);
                if (err) {
                    console.error("Error connecting: " + err.stack);
                    callback(err);
                } else {
                    cb(() => {
                        callback(row);
                    });
                }
            }
        );
    });
};

exports.createColorData = function(rebrickableId, name, json, callback) {
    var parsedJSON = JSON.parse(json);
    exports.init(function(db, cb) {
        db.query(
            "INSERT INTO Colors (RebrickableId, Name, Hex, Transparent, RebrickableJSON) VALUES (?, ?, ?, ?, ?)",
            [rebrickableId, name, parsedJSON.rgb, parsedJSON.is_trans, json],
            (err, row) => {
                //console.dir(rows);
                if (err) {
                    console.error("Error connecting: " + err.stack);
                    callback(err);
                } else {
                    cb(() => {
                        callback(row);
                    });
                }
            }
        );
    });
};

exports.createSetDataIfNotExist = function(rebrickableId, name, json, callback) {
    var parsedJSON = JSON.parse(json);

    exports.init(function(db, cb) {
        db.query("SELECT * FROM Sets WHERE RebrickableId =? ;", [rebrickableId], (err, rows) => {
            //console.dir(row);
            if (err) {
                console.error("Error connecting: " + err.stack);
                callback(err);
            } else {
                if (rows.length == 0) {
                    exports.init(function(db, cb) {
                        db.query(
                            "INSERT INTO Sets (RebrickableId, Name, RebrickableJSON, Year) VALUES (?, ?, ?, ?)",
                            [rebrickableId, name, json, parsedJSON.year],
                            (err, row) => {
                                //console.dir(rows);
                                if (err) {
                                    console.error("Error connecting: " + err.stack);
                                    callback(err);
                                } else {
                                    cb(() => {
                                        callback(row.insertId);
                                    });
                                }
                            }
                        );
                    });
                } else {
                    cb(() => {
                        //console.dir(rows);
                        callback(rows[0].Id);
                    });
                }
            }
        });
    });
};

exports.createSetPartIfNotExist = function(partId, partColor, setId, quantity, callback) {
    exports.init(function(db, cb) {
        db.query("SELECT * FROM Sets_Parts WHERE PartRebrickableId =? AND ColorRebrickableId = ? AND SetId = ? ;", [partId, partColor, setId], (err, rows) => {
            //console.dir(row);
            if (err) {
                console.error("Error connecting: " + err.stack);
                callback(err);
            } else {
                if (rows.length == 0) {
                    exports.init(function(db, cb) {
                        db.query(
                            "INSERT INTO Sets_Parts (ColorRebrickableId, PartRebrickableId, Quantity, SetId) VALUES (?, ?, ?, ?)",
                            [partColor, partId, quantity, setId],
                            (err, row) => {
                                //console.dir(rows);
                                if (err) {
                                    console.error("Error connecting: " + err.stack);
                                    callback(err);
                                } else {
                                    cb(() => {
                                        callback(row.insertId);
                                    });
                                }
                            }
                        );
                    });
                } else {
                    cb(() => {
                        //console.dir(rows);
                        callback(rows[0].Id);
                    });
                }
            }
        });
    });
};

//on utilisera cette fonction pour mettre à jour l'objet Part dans le cas ou on veut modifier
//la forme de l'objet
exports.updatePartData = function(oldData, callback) {
    var rebrickableImgUrl = JSON.parse(oldData.RebrickableJSON).part_img_url;
    exports.init(function(db, cb) {
        db.query("UPDATE Parts SET RebrickableImageUrl=? WHERE Id=?", [rebrickableImgUrl, oldData.Id], (err, rows) => {
            //console.dir(rows);
            if (err) {
                console.error("Error connecting: " + err.stack);
                callback(err);
            } else {
                exports.getPartData(oldData.RebrickableId, function(result) {
                    cb(() => {
                        callback(result);
                    });
                });
            }
        });
    });
};

exports.getPartColors = function(rebrickablePartId, callback) {
    exports.init(function(db, cb) {
        db.query(
            `SELECT Parts_Locations.RebrickableColor, Colors.Name AS ColorName, Colors.Hex, Colors.Transparent, Sum(Quantity) AS Quantity
            FROM Parts_Locations
            LEFT JOIN Colors ON Colors.RebrickableId = Parts_Locations.RebrickableColor
            WHERE Parts_Locations.RebrickableId LIKE ?
            GROUP BY Parts_Locations.RebrickableColor, Colors.Name, Colors.Hex, Colors.Transparent
            ORDER BY Quantity DESC;`,
            [rebrickablePartId],
            (err, rows) => {
                if (err) {
                    console.error(err.message);
                }
                //console.dir(rows);
                cb(() => {
                    callback(rows);
                });
            }
        );
    });
};

exports.getSortedPartsStats = function(callback) {
    exports.init(function(db, cb) {
        db.query(
            `SELECT SUM(Parts_Locations.Quantity) AS TotalQuantity, Parts_Locations.LocationCode FROM Parts_Locations GROUP BY Parts_Locations.LocationCode ORDER BY SUM(Parts_Locations.Quantity) DESC`,
            [],
            (err, rows) => {
                if (err) {
                    console.error(err.message);
                }
                //console.dir(rows);
                cb(() => {
                    callback(rows);
                });
            }
        );
    });
};

exports.createUser = function(email, password, name, callback) {
    exports.init((db, cb) => {
        //on hash le password avant de l'enregistrer dans la bd
        var bcrypt = require("bcrypt");
        bcrypt.hash(password, 10, function(err, hash) {
            db.query("INSERT INTO User(name, PwHash, email, valid) VALUES(?, ?, ?, 0)", [name, hash, email], function(err, result) {
                if (err) {
                    console.error(err.message);
                    cb(() => {
                        callback(false);
                    });
                } else {
                    var newRowId = result.insertId;
                    cb(() => {
                        callback(true, newRowId);
                    });
                }
            });
        });
    });
};

exports.validateUser = function(mail, password, callback) {
    //console.log("mail: " + mail + " password: " + password);
    exports.init(function(db, cb) {
        db.query("SELECT * FROM User WHERE email=? AND valid=1;", [mail], (err, row) => {
            if (err) {
                console.error(err.message);
                cb(() => {
                    callback(false);
                });
            } else if (row && row.length == 1) {
                //on a trouvé l'usilitateur, on valide le mot de passe
                //console.log(JSON.stringify(row));
                var bcrypt = require("bcrypt");
                bcrypt.compare(password, row[0].PwHash, function(err, res) {
                    if (res) {
                        // Passwords match
                        cb(() => {
                            callback(row[0]);
                        });
                    } else {
                        // Passwords don't match
                        cb(() => {
                            callback(false);
                        });
                    }
                });
            } else {
                //la rquête n'as rien retourné;
                cb(() => {
                    callback(false);
                });
            }
        });
    });
};

exports.createActionKey = function(action, userId, cb) {
    const uuidv1 = require("uuid/v1");
    var key = uuidv1();
    exports.init(function(db, cb2) {
        db.query("INSERT INTO MailKey(keyID, type, user) VALUES(?, ?, ?)", [key, action, userId], function(err) {
            if (err) {
                console.error(err.message);
            }
            cb2(err => {
                cb(err, key);
            });
        });
    });
};
