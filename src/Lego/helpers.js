var https = require("https");
const async = require("async");

exports.forEachLeaves = function(obj, leafPath, call) {
    if (obj === undefined) {
        return;
    }
    if (Array.isArray(obj)) {
        for (var i in obj) {
            var arrayElement = obj[i];
            exports.forEachLeaves(arrayElement, leafPath, call);
        }
        return;
    }
    if (leafPath.length === 1) {
        var returned = call(obj[leafPath[0]], obj);
        if (returned !== undefined) {
            obj = returned;
        }
    } else {
        var subLeafPath = Object.assign([], leafPath);
        var branch = subLeafPath.shift();
        var subObject = obj[branch];
        if (Array.isArray(subObject)) {
            for (var i in subObject) {
                var subObjectArrayElement = subObject[i];
                exports.forEachLeaves(subObjectArrayElement, subLeafPath, call);
            }
        } else {
            exports.forEachLeaves(subObject, subLeafPath, call);
        }
    }
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
