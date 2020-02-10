const Sequelize = require("sequelize");
var helpers = require("./helpers");

const sequelize = new Sequelize(process.env.mysql_database, process.env.mysql_user, process.env.mysql_password, {
    host: process.env.mysql_host,
    dialect: "mysql",
    logging: false
});
exports.sequelize = sequelize;

exports.Set = sequelize.define(
    "set",
    {
        // attributes
        Name: {
            type: Sequelize.STRING,
            allowNull: true
        },
        RebrickableId: {
            type: Sequelize.STRING,
            unique: true,
            allowNull: false
        },
        RebrickableJSON: {
            type: Sequelize.JSON,
            defaultValue: {},
            allowNull: true
        },
        Year: {
            type: Sequelize.INTEGER,
            allowNull: true
        },
        ImageURL: {
            type: Sequelize.STRING,
            defaultValue: "",
            allowNull: true
        }
    },
    {
        // options
    }
);

exports.Part = sequelize.define(
    "part",
    {
        // attributes
        Name: {
            type: Sequelize.STRING,
            allowNull: false,
            defaultValue: ""
        },
        RebrickableId: {
            type: Sequelize.STRING,
            unique: true,
            allowNull: false
        },
        RebrickableJSON: {
            type: Sequelize.JSON,
            defaultValue: {},
            allowNull: true
        },
        RebrickableImageUrl: {
            type: Sequelize.STRING,
            defaultValue: ""
        }
    },
    {
        // options
    }
);

exports.Location = sequelize.define(
    "location",
    {
        // attributes
        LocationCode: {
            type: Sequelize.STRING,
            allowNull: false
        },
        Name: {
            type: Sequelize.STRING,
            allowNull: false
        },
        type: {
            type: Sequelize.STRING
        }
    },
    {
        // options
    }
);

exports.Color = sequelize.define(
    "color",
    {
        // attributes
        Name: {
            type: Sequelize.STRING,
            allowNull: false,
            defaultValue: ""
        },
        RebrickableId: {
            type: Sequelize.STRING,
            unique: true,
            allowNull: false
        },
        RebrickableJSON: {
            type: Sequelize.JSON,
            defaultValue: {},
            allowNull: true
        },
        Hex: {
            type: Sequelize.STRING,
            defaultValue: "FFFFFF"
        },
        Transparent: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
        }
    },
    {
        // options
    }
);

exports.User = sequelize.define(
    "user",
    {
        // attributes
        Name: {
            type: Sequelize.STRING,
            allowNull: false
        },
        Email: {
            type: Sequelize.STRING,
            allowNull: false
        },
        Valid: {
            type: Sequelize.BOOLEAN,
            allowNull: false
        }
    },
    {
        // options
    }
);

exports.PartLocation = sequelize.define(
    "parts_location",
    {
        // attributes
        id: {
            type: Sequelize.INTEGER,
            allowNull: true,
            primaryKey: true
        },
        RebrickableId: {
            type: Sequelize.STRING,
            allowNull: false
        },
        RebrickableColor: {
            type: Sequelize.STRING,
            allowNull: false
        },
        Quantity: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        LocationCode: {
            type: Sequelize.STRING,
            allowNull: false
        },
        colorId: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        locationId: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        PartId: {
            type: Sequelize.INTEGER,
            allowNull: false
        }
    },
    {
        // options
    }
);

exports.SetPart = sequelize.define(
    "sets_part",
    {
        // attributes
        id: {
            type: Sequelize.INTEGER,
            allowNull: true,
            primaryKey: true
        },
        PartRebrickableId: {
            type: Sequelize.STRING,
            allowNull: false
        },
        ColorRebrickableId: {
            type: Sequelize.STRING,
            allowNull: false
        },
        Quantity: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        isSpare: {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
            allowNull: false
        }
    },
    {
        // options
    }
);

exports.SetUser = sequelize.define(
    "sets_user",
    {
        // attributes
        Quantity: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        isOwned: {
            type: Sequelize.BOOLEAN,
            allowNull: false
        },
        inInventory: {
            type: Sequelize.BOOLEAN,
            allowNull: false
        },
        isBuilt: {
            type: Sequelize.BOOLEAN,
            allowNull: false
        }
    },
    {
        // options
    }
);

exports.PartColor = sequelize.define(
    "parts_color",
    {
        // attributes
        ImageURL: {
            type: Sequelize.STRING,
            allowNull: true
        },
        PartId: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        ColorId: {
            type: Sequelize.INTEGER,
            allowNull: false
        }
    },
    {
        // options
    }
);

//exports.SetPart.hasOne(exports.Part, { foreignKey: "Id", sourceKey: "PartId" });
//exports.SetPart.hasOne(exports.Set, { foreignKey: "Id", sourceKey: "SetId" });

exports.PartColor.belongsToMany(exports.Set, {
    through: {
        model: exports.SetPart
    },
    constraints: false
});

exports.Location.belongsToMany(exports.PartColor, {
    through: {
        model: exports.PartLocation
    },
    constraints: false
});

exports.PartColor.belongsToMany(exports.Location, {
    through: {
        model: exports.PartLocation
    },
    constraints: false
});

exports.Set.belongsToMany(exports.User, {
    through: {
        model: exports.SetUser
    },
    constraints: false
});

exports.Set.hasMany(exports.SetPart, {
    constraints: false
});

exports.Location.hasMany(exports.PartLocation, {
    constraints: false
});

exports.PartColor.hasMany(exports.SetPart, {
    constraints: false
});

exports.PartColor.hasMany(exports.PartLocation, {
    constraints: false
});

exports.Part.hasMany(exports.PartColor, {
    constraints: false
});

exports.Color.hasMany(exports.PartColor, {
    constraints: false
});

//A ENLEVER
exports.Part.hasMany(exports.SetPart, {
    constraints: false
});
exports.Color.hasMany(exports.SetPart, {
    constraints: false
});

//TODO: clean cette fonction... elle est complexe mais elle fonctionne bien
exports.IncludeMultiRelation = async function(startingObject, modelElement = exports.Set, path = ["sets_parts", "setId"], subItemName = "set", options = {}) {
    var isArray = false;
    if (Array.isArray(startingObject)) {
        for (var i in startingObject) {
            if (startingObject[i].toJSON !== undefined) {
                startingObject[i] = startingObject[i].toJSON();
            }
        }
        isArray = true;
    } else {
        if (startingObject.toJSON !== undefined) {
            startingObject = startingObject.toJSON();
        }
    }

    //on commence par regarde ce qu'on doit aller chercher
    var fkName = options.fk ? options.fk : "id";
    var invert = options.invert ? options.invert : false;

    var toGet = [];
    helpers.forEachLeaves(startingObject, path, leaf => {
        toGet.push(leaf);
    });

    var findAllWhere = {};
    findAllWhere[fkName] = toGet;

    return modelElement
        .findAll({ where: findAllWhere })
        .then(toAdd => {
            //on met en dictionaire avec les ids, on initialise
            var reducedToAdd = toAdd.reduce((map, obj) => {
                var jsonObj = obj.toJSON();
                if (fkName !== "id") {
                    if (Array.isArray(map[jsonObj[fkName]])) {
                        map[jsonObj[fkName]].push(jsonObj);
                    } else {
                        map[jsonObj[fkName]] = [jsonObj];
                    }
                } else {
                    map[jsonObj[fkName]] = jsonObj;
                }
                //console.log(jsonObj);
                if (invert) {
                    map[jsonObj[fkName]][path[0]] = [];
                }
                return map;
            }, {});
            //console.log(reducedToAdd);
            if (invert) {
                if (isArray) {
                    for (var i in startingObject) {
                        var currentObject = startingObject[i];
                        var subItemMap = {};
                        helpers.forEachLeaves(currentObject, path, (leaf, parent) => {
                            if (leaf === 0) {
                                return;
                            }
                            var invertToAdd = reducedToAdd[leaf];
                            invertToAdd[path[path.length - 2]] = parent;
                            subItemMap[leaf] = invertToAdd;
                        });
                        //enlever duplicates dans currentObject[subItemName]
                        currentObject[subItemName] = [];
                        for (var j in subItemMap) {
                            currentObject[subItemName].push(subItemMap[j]);
                        }
                    }
                } else {
                    var subItemMap = {};
                    helpers.forEachLeaves(startingObject, path, (leaf, parent) => {
                        if (leaf === 0) {
                            return;
                        }
                        var invertToAdd = reducedToAdd[leaf];
                        invertToAdd[path[path.length - 2]] = parent;
                        subItemMap[leaf] = invertToAdd;
                    });
                    startingObject[subItemName] = [];
                    for (var j in subItemMap) {
                        startingObject[subItemName].push(subItemMap[j]);
                    }
                }
            } else {
                helpers.forEachLeaves(startingObject, path, (leaf, parent) => {
                    parent[subItemName] = reducedToAdd[leaf];
                    return parent;
                });
            }
            return Promise.resolve(startingObject);
        })
        .catch(error => {
            return Promise.reject(error);
        });
};

//Cette fonction permet de valider que ce qui est associé existe bel et bien
exports.SetPart.InsertWithLinks = async function(setPartToUpsert) {
    //console.log("Converted SetPart: ");
    //console.log(JSON.stringify(setToUpsert));
    //on va commencer par valider 'Part'
    setPartToUpsert.set = undefined;
    return exports
        .upsertAndRetrieve(exports.Part, setPartToUpsert.partsColor.part)
        .then(part => {
            setPartToUpsert.partsColor.partId = part.id;
            setPartToUpsert.partId = part.id;
            delete setPartToUpsert.partsColor.part;
            return exports.upsertAndRetrieve(exports.Color, setPartToUpsert.partsColor.color);
        })
        .then(color => {
            setPartToUpsert.partsColor.colorId = color.id;
            setPartToUpsert.colorId = color.id;
            delete setPartToUpsert.partsColor.color;
            return exports.upsertAndRetrieve(exports.PartColor, setPartToUpsert.partsColor);
        })
        .then(partsColor => {
            setPartToUpsert.partsColorId = partsColor.id;
            delete setPartToUpsert.partsColor;
            //note: si ça me dit qu'on a pas de default, c'est qu'il manque une relation
            //console.log(JSON.stringify(setPartToUpsert));
            return exports.SetPart.create(setPartToUpsert);
        });
};

exports.upsertAndRetrieve = function(modelObject, toUpsert) {
    var uniqueWhere = { RebrickableId: toUpsert.RebrickableId };
    if (toUpsert.RebrickableId === undefined) {
        uniqueWhere = { ColorId: toUpsert.colorId, PartId: toUpsert.partId };
    }
    return modelObject
        .findOrCreate({ where: uniqueWhere, default: toUpsert })
        .then(result => {
            //on regarde si ce que l'on veut mettre est différent
            var found = result[0];
            var updateNeeded = false;
            for (var parameter in toUpsert) {
                if (found[parameter] !== toUpsert[parameter]) {
                    updateNeeded = true;
                }
            }
            if (updateNeeded) {
                //console.log("update Needed!!!");
                //console.log(toUpsert);
                return modelObject.update(toUpsert, { where: uniqueWhere }).then(() => {
                    return modelObject.findOne({ where: uniqueWhere });
                });
            } else {
                return Promise.resolve(found);
            }
        })
        .catch(err => {
            console.error("Problem retrieving / Updating Object of type " + modelObject.name + ": ");
            console.error("Object: ");
            console.log(toUpsert);
            console.error("UniqueWhere: ");
            console.log(uniqueWhere);
            console.error(err);
        });
};

//Set.sync().then(() => console.log("synced successfully"));
/*
Set.findAll({
    include: [{ model: User }],
    where: { RebrickableId: "9679-1" }
}).then(part => {
    console.log("part found:", JSON.stringify(part));
});
*/

/*
    Modification de FK:
    le lien entre Part et PartLocation passait pas le RebrickableId, ce qui n'est pas une bonne chose selon moi,
    je dois donc faire une conversion:

        UPDATE parts_locations
        INNER JOIN parts ON parts.RebrickableId = parts_locations.RebrickableId
        SET parts_locations.PartId = parts.Id
        
        UPDATE parts_locations
        INNER JOIN locations ON locations.LocationCode = parts_locations.LocationCode
        SET parts_locations.LocationId = locations.Id
        
        UPDATE parts_locations
        INNER JOIN colors ON colors.RebrickableId = parts_locations.RebrickableColor
        SET parts_locations.ColorId = colors.Id

        UPDATE sets_parts
        INNER JOIN parts ON parts.RebrickableId = sets_parts.PartRebrickableId
        SET sets_parts.PartId = parts.Id        

        UPDATE sets_parts
        INNER JOIN colors ON colors.RebrickableId = sets_parts.ColorRebrickableId
        SET sets_parts.ColorId = colors.Id

    Ajout de la table Parts_Colors: maintenant Parts_Locations et Sets_parts vont réferer à cette table pour les parts, on doit donc la populer
        Constraint Unique pour Part/Color:
        CREATE UNIQUE INDEX parts_colors
        ON parts_colors(`PartId`,`ColorId`)

        INSERT INTO parts_colors(`PartId`,`ColorId`)
        SELECT `PartId`,`ColorId` FROM `parts_locations` GROUP BY `PartId`,`ColorId`

        //Pour Bypasser les duplicates
        INSERT INTO parts_colors(`PartId`,`ColorId`)
        SELECT `sets_parts`.`PartId`,`sets_parts`.`ColorId` FROM `sets_parts` 
        LEFT JOIN `parts_colors` ON parts_colors.PartId = sets_parts.PartId AND parts_colors.ColorId = sets_parts.ColorId 
        WHERE parts_colors.Id IS NULL
        GROUP BY `sets_parts`.`PartId`,`sets_parts`.`ColorId`

        //update les colonnes        
        UPDATE parts_locations
        INNER JOIN parts_colors ON parts_colors.PartId = parts_locations.PartId AND parts_colors.ColorId = parts_locations.ColorId
        SET parts_locations.PartColorId = parts_colors.Id

        UPDATE sets_parts
        INNER JOIN parts_colors ON parts_colors.PartId = sets_parts.PartId AND parts_colors.ColorId = sets_parts.ColorId
        SET sets_parts.PartColorId = parts_colors.Id



*/
