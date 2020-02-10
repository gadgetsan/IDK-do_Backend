var mysql = require("mysql");

exports.connection = "";
exports.connectionCount = 0;

var pool = mysql.createPool({
    database: process.env.mysql_database,
    host: process.env.mysql_host,
    user: process.env.mysql_user,
    password: process.env.mysql_password,
    multipleStatements: true,
    connectionLimit: 10
});

exports.releaseConnection = function(callback) {
    //après tout oon ferme la DB
    //console.log("connection Closing, Count: " + exports.connectionCount);
    exports.connectionCount--;
    if (exports.connectionCount === 0) {
        exports.connection.end();
        exports.connection = "";
        //console.log("Closing master Connection <=====");
    }

    callback();
};

exports.init = function(callback) {
    pool.getConnection(function(err, connection) {
        if (err) {
            console.error(err.message);
        }
        callback(connection);
        connection.release();
    });
    //console.log("Trying to connect from " + exports.init.caller);
    /*
    exports.connectionCount++;
    console.log("connection Open, Count: " + exports.connectionCount);
    if (exports.connectionCount == 1) {
        exports.connection = mysql.createConnection({
            database: "heroku_56b52ebe3f3cfd2",
            host: process.env.mysql_host,
            user: process.env.mysql_user,
            password: process.env.mysql_password,
            multipleStatements: true
        });
        //console.log("Opening master Connection =====>");
        exports.connection.connect(function(err) {
            if (err) {
                console.error("Error connecting: " + err.stack);
                callback(err);
            } else {
                //console.log("Connected as thread id: " + connection.threadId);
                callback(exports.connection, exports.releaseConnection);
            }
        });
    } else {
        callback(exports.connection, exports.releaseConnection);
    }
    */
};

exports.getPartsForLocation = function(locationCode, callback) {
    exports.init(function(db) {
        db.query("SELECT RebrickableId FROM parts_locations WHERE LocationCode =? GROUP BY RebrickableId;", [locationCode], (err, row) => {
            //console.dir(row);
            callback(row);
        });
    });
};

exports.createLocation = function(locationName, locationCode, type, callback) {
    //console.log("LocationName: " + locationName + " LocationCode: " + locationCode, " type: " + type);
    exports.init(function(db) {
        db.query("SELECT * FROM locations WHERE LocationCode = ?;", [locationCode], (err, rows) => {
            if (rows.length === 0) {
                db.query("INSERT INTO locations (LocationCode, Name, Type) VALUES (?,?, ?)", [locationCode, locationName, type], (err, row) => {
                    //console.dir(rows);
                    if (err) {
                        console.error("Error: " + err.stack);
                        callback(err);
                    } else {
                        callback(row);
                    }
                });
            } else {
                callback(err);
            }
        });
    });
};

exports.getParts = function(pageSize, pageNum, callback) {
    exports.init(function(db) {
        db.query(
            `SELECT parts.Id, parts_locations.RebrickableId, parts.Name, SUM(Quantity) AS TotalQuantity, parts_locations.LocationCode, locations.Name AS LocationName 
            FROM parts_locations 
            LEFT JOIN locations ON locations.LocationCode = parts_locations.LocationCode 
            LEFT JOIN parts ON parts_locations.RebrickableId = parts.RebrickableId 
            WHERE parts_locations.LocationCode IS NULL
            GROUP BY parts.Id, parts_locations.RebrickableId, parts_locations.LocationCode, locations.Name, parts.Name
            ORDER BY TotalQuantity DESC 
            LIMIT ?,?;`,
            [(pageNum - 1) * pageSize, pageSize],
            (err, rows) => {
                if (err) {
                    console.error(err.message);
                }
                //console.dir(rows);
                callback(rows);
            }
        );
    });
};

exports.searchParts = function(pageSize, pageNum, searchTerm, callback) {
    var actualSearchTerm = "%" + searchTerm + "%";
    //console.log(actualSearchTerm);
    exports.init(function(db) {
        db.query(
            `SELECT parts.Id, parts_locations.RebrickableId, parts.Name, SUM(Quantity) AS TotalQuantity, parts_locations.LocationCode, locations.Name AS LocationName 
            FROM parts_locations 
            LEFT JOIN locations ON locations.LocationCode = parts_locations.LocationCode 
            LEFT JOIN parts ON parts_locations.RebrickableId = parts.RebrickableId 
            WHERE parts_locations.RebrickableId LIKE ?
            GROUP BY parts.Id, parts_locations.RebrickableId, parts.Name, parts_locations.LocationCode, locations.Name
            ORDER BY TotalQuantity DESC LIMIT ?,?;`,
            [actualSearchTerm, (pageNum - 1) * pageSize, pageSize],
            (err, rows) => {
                if (err) {
                    console.error(err.message);
                }
                //console.dir(rows);
                callback(rows);
            }
        );
    });
};

exports.getLocations = function(callback) {
    exports.init(function(db) {
        db.query("SELECT * FROM locations", [], (err, rows) => {
            if (err) {
                console.error(err.message);
            }
            //console.dir(rows);
            callback(rows);
        });
    });
};

exports.searchLocations = function(pageSize, pageNum, searchTerm, callback) {
    var actualSearchTerm = "%" + searchTerm + "%";
    exports.init(function(db) {
        db.query(
            `SELECT locations.Name, Sum(parts_locations.Quantity) AS TotalQuantity, locations.LocationCode 
            FROM locations 
            LEFT JOIN parts_locations ON parts_locations.LocationCode = locations.LocationCode 
            WHERE locations.Name LIKE ? OR locations.LocationCode LIKE ? 
            GROUP BY locations.Name, locations.LocationCode 
            ORDER BY TotalQuantity DESC LIMIT ?,?;`,
            [actualSearchTerm, actualSearchTerm, (pageNum - 1) * pageSize, pageSize],
            (err, rows) => {
                if (err) {
                    console.error(err.message);
                }
                //console.dir(rows);
                callback(rows);
            }
        );
    });
};

exports.getSets = function(pageSize, pageNum, userId, callback) {
    exports.init(function(db) {
        db.query(
            "SELECT *, sets.Id AS Id FROM sets JOIN sets_users ON sets_users.SetId = sets.Id WHERE sets_users.UserId = ? LIMIT ?,?",
            [userId, (pageNum - 1) * pageSize, pageSize],
            (err, rows) => {
                if (err) {
                    console.error(err.message);
                }
                //console.dir(rows);
                callback(rows);
            }
        );
    });
};

exports.searchSets = function(pageSize, pageNum, searchTerm, userId, callback) {
    var actualSearchTerm = "%" + searchTerm + "%";
    exports.init(function(db) {
        db.query(
            `SELECT *, sets.Id AS Id
            FROM sets
            LEFT JOIN sets_users ON sets_users.SetId = sets.Id
            WHERE (sets.Name LIKE ? OR sets.RebrickableId LIKE ? )
            AND (sets_users.UserId = ? OR sets_users.UserId IS NULL)
            LIMIT ?,?;`,
            [actualSearchTerm, actualSearchTerm, userId, (pageNum - 1) * pageSize, pageSize],
            (err, rows) => {
                if (err) {
                    console.error(err.message);
                }
                //console.dir(rows);
                callback(rows);
            }
        );
    });
};

exports.changePartLocation = function(locationCode, rebrickableId, callback) {
    exports.init(function(db) {
        db.query("UPDATE parts_locations SET LocationCode=? WHERE RebrickableId=?", [locationCode, rebrickableId], (err, rows) => {
            //console.dir(rows);
            if (err) {
                console.error("Error connecting: " + err.stack);
                callback(err);
            } else {
                callback(rows);
            }
        });
    });
};

exports.updateLocationName = function(code, newName, callback) {
    exports.init(function(db) {
        db.query("UPDATE locations SET Name=? WHERE LocationCode=?", [newName, code], (err, rows) => {
            //console.dir(rows);
            if (err) {
                console.error("Error connecting: " + err.stack);
                callback(err);
            } else {
                callback(rows);
            }
        });
    });
};

exports.getPartData = function(rebrickableId, callback) {
    exports.init(function(db) {
        db.query("SELECT * FROM parts WHERE RebrickableId =? ;", [rebrickableId], (err, rows) => {
            //console.dir(row);
            if (err) {
                console.error("Error connecting: " + err.stack);
                callback(err);
            } else {
                callback(rows[0]);
            }
        });
    });
};

exports.getSetData = function(rebrickableId, callback) {
    exports.init(function(db) {
        db.query(
            `SELECT 
                sets_parts.Id AS Id, 
                sets.RebrickableId AS SetID, 
                sets.Name, sets.Year, 
                parts.Name, parts.RebrickableImageUrl, 
                sets_parts.PartRebrickableId as RebrickableId, 
                sets_parts.quantity AS Quantity, 
                sets_parts.ColorRebrickableId AS RebrickableColor, 
                colors.Hex, 
                colors.Name AS ColorName, 
                locations.LocationCode,
                locations.Name AS LocationName
            FROM sets_parts 
            LEFT JOIN sets ON sets.Id = sets_parts.SetId 
            LEFT JOIN colors ON colors.RebrickableId = sets_parts.ColorRebrickableId 
            LEFT JOIN parts ON sets_parts.PartRebrickableId = parts.RebrickableId 
            LEFT JOIN parts_locations ON parts_locations.RebrickableId = sets_parts.PartRebrickableId AND parts_locations.RebrickableColor = sets_parts.ColorRebrickableId 
            LEFT JOIN locations ON locations.LocationCode = parts_locations.LocationCode 
            WHERE sets.RebrickableId  =?
            ORDER BY locations.LocationCode IS NOT NULL, sets_parts.ColorRebrickableId`,
            [rebrickableId],
            (err, rows) => {
                //console.dir(row);
                if (err) {
                    console.error("Error connecting: " + err.stack);
                    callback(err);
                } else {
                    callback(rows);
                }
            }
        );
    });
};
exports.eleminatePartDuplicates = function(callback) {
    exports.init(function(db) {
        db.query(`SELECT RebrickableId, count(*) as count, MAX(Id) AS IdToKeep FROM parts GROUP BY RebrickableId HAVING count >= 2;`, [], (err, rows) => {
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
                db.query(`DELETE FROM parts WHERE RebrickableId IN (?) AND Id NOT IN (?);`, [rebrickableToRemove, idToKeep], (err, rows) => {
                    //console.dir(rows);
                    if (err) {
                        console.error("Error connecting: " + err.stack);
                        callback(err);
                    } else {
                        callback(rows);
                    }
                });
            }
        });
    });
};

exports.getColorData = function(rebrickableId, callback) {
    exports.init(function(db) {
        db.query("SELECT * FROM colors WHERE RebrickableId =? ;", [rebrickableId], (err, rows) => {
            //console.dir(row);
            if (err) {
                console.error("Error connecting: " + err.stack);
                callback(err);
            } else {
                callback(rows[0]);
            }
        });
    });
};

exports.getLocationData = function(locationCode, callback) {
    exports.init(function(db) {
        db.query(
            `SELECT parts_locations.RebrickableId, locations.Name, locations.LocationCode, SUM(Quantity) AS TotalQuantity, parts.Name, parts.RebrickableImageUrl
            FROM parts_locations 
            LEFT JOIN locations ON locations.LocationCode = parts_locations.LocationCode 
            LEFT JOIN parts ON parts_locations.RebrickableId = parts.RebrickableId 
            WHERE parts_locations.LocationCode =? 
            GROUP BY parts_locations.RebrickableId, locations.Name, locations.LocationCode, parts.Name, parts.RebrickableImageUrl
            ORDER BY SUM(Quantity) DESC;`,
            [locationCode],
            (err, rows) => {
                //console.dir(row);
                if (err) {
                    console.error("Error connecting: " + err.stack);
                    callback(err);
                } else {
                    callback(rows);
                }
            }
        );
    });
};

exports.createPartData = function(rebrickableId, name, json, callback) {
    var parsedJSON = JSON.parse(json);
    exports.init(function(db) {
        db.query(
            "INSERT INTO parts (RebrickableId, Name, RebrickableJSON, RebrickableImageUrl) VALUES (?, ?, ?, ?)",
            [rebrickableId, name, json, parsedJSON.part_img_url],
            (err, row) => {
                //console.dir(rows);
                if (err) {
                    console.error("Error connecting: " + err.stack);
                    callback(err);
                } else {
                    callback(row);
                }
            }
        );
    });
};

exports.createColorData = function(rebrickableId, name, json, callback) {
    var parsedJSON = JSON.parse(json);
    exports.init(function(db) {
        db.query(
            "INSERT INTO colors (RebrickableId, Name, Hex, Transparent, RebrickableJSON) VALUES (?, ?, ?, ?, ?)",
            [rebrickableId, name, parsedJSON.rgb, parsedJSON.is_trans, json],
            (err, row) => {
                //console.dir(rows);
                if (err) {
                    console.error("Error connecting: " + err.stack);
                    callback(err);
                } else {
                    callback(row);
                }
            }
        );
    });
};

exports.createSetDataIfNotExist = function(rebrickableId, name, json, callback) {
    var parsedJSON = JSON.parse(json);

    exports.init(function(db) {
        db.query("SELECT * FROM sets WHERE RebrickableId =? ;", [rebrickableId], (err, rows) => {
            //console.dir(row);
            if (err) {
                console.error("Error connecting: " + err.stack);
                callback(err);
            } else {
                if (rows.length === 0) {
                    exports.init(function(db) {
                        db.query(
                            "INSERT INTO sets (RebrickableId, Name, RebrickableJSON, Year) VALUES (?, ?, ?, ?)",
                            [rebrickableId, name, json, parsedJSON.year],
                            (err, row) => {
                                //console.dir(rows);
                                if (err) {
                                    console.error("Error connecting: " + err.stack);
                                    callback(err);
                                } else {
                                    callback(row.insertId);
                                }
                            }
                        );
                    });
                } else {
                    //console.dir(rows);
                    callback(rows[0].Id);
                }
            }
        });
    });
};

exports.createSetPartIfNotExist = function(partId, partColor, setId, quantity, callback) {
    exports.init(function(db) {
        db.query("SELECT * FROM sets_parts WHERE PartRebrickableId =? AND ColorRebrickableId = ? AND SetId = ? ;", [partId, partColor, setId], (err, rows) => {
            //console.dir(row);
            if (err) {
                console.error("Error connecting: " + err.stack);
                callback(err);
            } else {
                if (rows.length === 0) {
                    db.query(
                        "INSERT INTO sets_parts (ColorRebrickableId, PartRebrickableId, Quantity, SetId) VALUES (?, ?, ?, ?)",
                        [partColor, partId, quantity, setId],
                        (err, row) => {
                            //console.dir(rows);
                            if (err) {
                                console.error("Error connecting: " + err.stack);
                                callback(err);
                            } else {
                                callback(row.insertId);
                            }
                        }
                    );
                } else {
                    callback(rows[0].Id);
                }
            }
        });
    });
};

//on utilisera cette fonction pour mettre à jour l'objet Part dans le cas ou on veut modifier
//la forme de l'objet
exports.updatePartData = function(oldData, callback) {
    var rebrickableImgUrl = JSON.parse(oldData.RebrickableJSON).part_img_url;
    exports.init(function(db) {
        db.query("UPDATE parts SET RebrickableImageUrl=? WHERE Id=?", [rebrickableImgUrl, oldData.Id], (err, rows) => {
            //console.dir(rows);
            if (err) {
                console.error("Error connecting: " + err.stack);
                callback(err);
            } else {
                exports.getPartData(oldData.RebrickableId, function(result) {
                    callback(result);
                });
            }
        });
    });
};

exports.getPartColors = function(rebrickablePartId, callback) {
    exports.init(function(db) {
        db.query(
            `SELECT parts_locations.RebrickableColor, colors.Name AS ColorName, colors.Hex, colors.Transparent, Sum(Quantity) AS Quantity
            FROM parts_locations
            LEFT JOIN colors ON colors.RebrickableId = parts_locations.RebrickableColor
            WHERE parts_locations.RebrickableId LIKE ?
            GROUP BY parts_locations.RebrickableColor, colors.Name, colors.Hex, colors.Transparent
            ORDER BY Quantity DESC;`,
            [rebrickablePartId],
            (err, rows) => {
                if (err) {
                    console.error(err.message);
                }
                //console.dir(rows);
                callback(rows);
            }
        );
    });
};

exports.getSortedPartsStats = function(callback) {
    exports.init(function(db) {
        db.query(
            `SELECT SUM(parts_locations.Quantity) AS TotalQuantity, parts_locations.LocationCode FROM parts_locations GROUP BY parts_locations.LocationCode ORDER BY SUM(parts_locations.Quantity) DESC`,
            [],
            (err, rows) => {
                if (err) {
                    console.error(err.message);
                }
                //console.dir(rows);
                callback(rows);
            }
        );
    });
};

exports.updateSetOwnership = function(setId, quantity, userId, callback) {
    exports.init(function(db) {
        //on commence par aller voir si l'utilisateur possèdait deja ce set
        //console.log("UserID: " + userId + ", quantity: " + quantity);
        db.query(`SELECT * FROM sets_users WHERE SetId = ? AND UserId = ?`, [setId, userId], (err, rows) => {
            if (err) {
                console.error(err.message);
            }
            if (rows.length === 0) {
                //si il n'existais pas deja, on doit le crééer
                db.query(
                    "INSERT INTO sets_users(SetId, UserId, quantity, isOwned, inInventory, isBuilt) VALUES(?, ?, ?, 1, 1, 0) ",
                    [setId, userId, quantity],
                    function(err, result) {
                        if (err) {
                            console.error(err.message);
                        }
                        var delta = quantity;
                        //on va aller chercher le set en question
                        exports.updateInventoryForSet(setId, delta, userId, function(result) {
                            callback(result);
                        });
                    }
                );
            } else {
                //si il existais deja, on le met à jour
                db.query("UPDATE sets_users SET quantity=?, isOwned=1, inInventory=1 WHERE SetID=? AND UserId=?", [quantity, setId, userId], function(
                    err,
                    result
                ) {
                    if (err) {
                        console.error(err.message);
                    }
                    var delta = quantity - rows[0].quantity;
                    //on va aller chercher le set en question
                    exports.updateInventoryForSet(setId, delta, userId, function(result) {
                        callback(result);
                    });
                });
            }
        });
    });
};

exports.updateInventoryForSet = function(setId, delta, userId, callback) {
    exports.init(function(db) {
        //après avoir fait la mise à jour de la quantité, on va mettre à jour l'inventaire des pièces
        db.query(`SELECT * FROM sets_parts WHERE SetId = ?`, [setId], (err, rows) => {
            var query = "";
            var queryParams = [];
            if (err) {
                console.error(err.message);
                callback(false);
            } else {
                for (var i = 0; i < rows.length; ++i) {
                    query +=
                        "INSERT INTO parts_locations (Quantity, UserId, RebrickableId, RebrickableColor) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE Quantity=Quantity+? ;";
                    queryParams.push(delta, userId, rows[i].PartRebrickableId, rows[i].ColorRebrickableId, delta);
                    //console.log("Part: " + rows[i].PartRebrickableId + ", Color: " + rows[i].ColorRebrickableId + ", Delta: " + rows[i].Quantity * delta);
                }
                //console.log(query);
                //console.log(queryParams);

                db.query(query, queryParams, (err, rows) => {
                    if (err) {
                        console.error(err.message);
                        callback(false);
                    } else {
                        callback(true);
                    }
                });
            }
        });
    });
};

exports.createUser = function(email, password, name, callback) {
    exports.init(db => {
        //on hash le password avant de l'enregistrer dans la bd
        var bcrypt = require("bcrypt");
        bcrypt.hash(password, 10, function(err, hash) {
            db.query("INSERT INTO user(name, PwHash, email, valid) VALUES(?, ?, ?, 0)", [name, hash, email], function(err, result) {
                if (err) {
                    console.error(err.message);
                    callback(false);
                } else {
                    var newRowId = result.insertId;
                    callback(true, newRowId);
                }
            });
        });
    });
};

exports.validateUser = function(mail, password, callback) {
    //console.log("mail: " + mail + " password: " + password);
    exports.init(function(db) {
        db.query("SELECT * FROM user WHERE email=? AND valid=1;", [mail], (err, row) => {
            if (err) {
                console.error(err.message);
                callback(false);
            } else if (row && row.length === 1) {
                //on a trouvé l'usilitateur, on valide le mot de passe
                //console.log(JSON.stringify(row));
                var bcrypt = require("bcrypt");
                bcrypt.compare(password, row[0].PwHash, function(err, res) {
                    if (res) {
                        // Passwords match
                        callback(row[0]);
                    } else {
                        // Passwords don't match
                        callback(false);
                    }
                });
            } else {
                //la rquête n'as rien retourné;
                callback(false);
            }
        });
    });
};

exports.createActionKey = function(action, userId, callback) {
    const uuidv1 = require("uuid/v1");
    var key = uuidv1();
    exports.init(function(db) {
        db.query("INSERT INTO mailkey(keyID, type, user) VALUES(?, ?, ?)", [key, action, userId], function(err) {
            if (err) {
                console.error(err.message);
            }
            callback(err, key);
        });
    });
};

/*
QUERY FOR Loose parts:
SELECT
	parts_locations.RebrickableId,
	parts_locations.RebrickableColor,
	parts_locations.Quantity,
	sets_parts.Quantity * sets_users.quantity AS QuantityFromsets,
	parts_locations.Quantity - ( sets_parts.Quantity * sets_users.quantity ) AS Missing,
	sets.`Name` 
FROM
	parts_locations
	LEFT JOIN sets_parts ON sets_parts.PartRebrickableId = parts_locations.RebrickableId 
	AND sets_parts.ColorRebrickableId = parts_locations.RebrickableColor
	LEFT JOIN sets ON sets.Id = sets_parts.SetId
	LEFT JOIN sets_users ON sets_users.SetId = sets.Id 
WHERE
	parts_locations.UserId = 7 
	AND ( sets_users.UserId = 7 OR sets_parts.Id IS NULL ) 
	AND ( sets_users.inInventory > 0 OR sets_parts.Id IS NULL ) 
ORDER BY
	RebrickableId,
	RebrickableColor
*/
