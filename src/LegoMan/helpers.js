var db = require("./database");
var https = require("https");
const async = require("async");

exports.getPartInformation = function(rebrickableId, callback) {
    db.getPartData(rebrickableId, function(result) {
        //console.log(result);

        if (result == undefined) {
            //if brick data does not exist
            https
                .get("https://rebrickable.com/api/v3/lego/parts/" + rebrickableId + "/?key=32552537c296d5cffbbc9c56854853ae", resp => {
                    let rawData = "";
                    -// A chunk of data has been recieved.
                    resp.on("data", chunk => {
                        rawData += chunk;
                    });

                    // The whole response has been received. Print out the result.
                    resp.on("end", () => {
                        //go fetch it,
                        //create part and add data
                        //console.log("response received: " + rawData);
                        var data = JSON.parse(rawData);
                        db.createPartData(rebrickableId, data.name, rawData, function(result) {
                            db.getPartData(rebrickableId, function(result) {
                                callback(result);
                            });
                        });
                    });
                })
                .on("error", err => {
                    console.log("Error: " + err.message);
                });
        } else {
            //sinon, on regarde si on doit faire les update
            if (result.RebrickableImageUrl == "") {
                db.updatePartData(result, function(result) {
                    callback(result);
                });
            } else {
                callback(result);
            }
        }
    });
};

exports.getColorInformation = function(rebrickableId, callback) {
    db.getColorData(rebrickableId, function(result) {
        //console.log(result);

        if (result == undefined) {
            //if brick data does not exist
            https
                .get("https://rebrickable.com/api/v3/lego/colors/" + rebrickableId + "/?key=32552537c296d5cffbbc9c56854853ae", resp => {
                    let rawData = "";
                    // A chunk of data has been recieved.
                    resp.on("data", chunk => {
                        rawData += chunk;
                    });

                    // The whole response has been received. Print out the result.
                    resp.on("end", () => {
                        //go fetch it,
                        //create part and add data
                        //console.log("response received: " + rawData);
                        var data = JSON.parse(rawData);
                        db.createColorData(rebrickableId, data.name, rawData, function(result) {
                            db.getColorData(rebrickableId, function(result) {
                                callback(result);
                            });
                        });
                    });
                })
                .on("error", err => {
                    console.log("Error: " + err.message);
                });
        } else {
            //sinon, on regarde si on doit faire les update
            callback(result);
        }
    });
};
exports.RecursiveGetSetData = function(url, callback) {
    if (url == null) {
        callback([]);
    } else {
        //we first fetch the data
        https
            .get(url, resp => {
                let rawData = "";
                resp.on("data", chunk => {
                    rawData += chunk;
                });

                resp.on("end", () => {
                    var data = JSON.parse(rawData);
                    //on va chercher la/les prochaines pages
                    exports.RecursiveGetSetData(data.next, nextPageResult => {
                        //on ajoute les données de la présente page
                        //console.dir(data);
                        for (var currentPageResult of data.results) {
                            nextPageResult.push({
                                partId: currentPageResult.part.part_num,
                                partColor: currentPageResult.color.id,
                                quantity: currentPageResult.quantity
                            });
                        }
                        //on retourne le tout
                        callback(nextPageResult);
                    });
                    //once we get the data, if there is a next page, we call it recursively to add it to our data
                });
            })
            .on("error", err => {
                console.log("Error: " + err.message);
            });
    }
};

exports.getSetInformation = function(rebrickableId, callback) {
    exports.RecursiveGetSetData(
        "https://rebrickable.com/api/v3/lego/sets/" + rebrickableId + "/parts/?page=1&page_size=50&key=32552537c296d5cffbbc9c56854853ae",
        result => {
            https
                .get("https://rebrickable.com/api/v3/lego/sets/" + rebrickableId + "/?key=32552537c296d5cffbbc9c56854853ae", resp => {
                    let rawData = "";
                    // A chunk of data has been recieved.
                    resp.on("data", chunk => {
                        rawData += chunk;
                    });

                    // The whole response has been received. Print out the result.
                    resp.on("end", () => {
                        //go fetch it,
                        //create part and add data
                        var data = JSON.parse(rawData);
                        //console.log("set Info received: " + rawData);
                        //console.log("part Info received: " + result);
                        db.createSetDataIfNotExist(rebrickableId, data.name, rawData, dataSetId => {
                            //console.log(dataSetId);
                            //Pour tout les parts, on va les enregistrer si elles n'existent pas deja
                            async.forEach(result, function(setPart, cb) {
                                //console.dir(setPart);
                                db.createSetPartIfNotExist(setPart.partId, setPart.partColor, dataSetId, setPart.quantity, cb);
                            });

                            callback(dataSetId);
                        });
                    });
                })
                .on("error", err => {
                    console.log("Error: " + err.message);
                });
        }
    );
};
