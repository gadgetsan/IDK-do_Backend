var key = process.env.REBRICKABLE_KEY;
var https = require("https");
var defaultPageSize = 50;

exports.GetPartsForSet = function(rebrickableId) {
    return rebrickableFetchMulti("sets", rebrickableId, "parts");
};
exports.GetSetInfo = function(rebrickableId) {
    return rebrickableFetch({ primaryData: "sets", rebrickableId: rebrickableId });
};

exports.SetToModel = function(rebrickableSet) {
    var modelSet = {
        Name: rebrickableSet.name,
        RebrickableId: rebrickableSet.set_num,
        RebrickableJSON: JSON.stringify(rebrickableSet),
        Year: rebrickableSet.year,
        ImageURL: rebrickableSet.set_img_url
    };
    return modelSet;
};

exports.PartToModel = function(rebrickablePart) {
    var modelPart = {
        RebrickableId: rebrickablePart.part_num,
        name: rebrickablePart.name
    };
    return modelPart;
};

exports.ColorToModel = function(rebrickableColor) {
    var modelColor = {
        RebrickableId: rebrickableColor.id,
        Name: rebrickableColor.name,
        Hex: rebrickableColor.rgb,
        Transparent: rebrickableColor.is_trans
    };
    return modelColor;
};

exports.PartsColorToModel = function(rebrickablePart, rebrickableColor) {
    var modelPartColor = {
        ImageURL: rebrickablePart.part_img_url
    };
    modelPartColor.part = exports.PartToModel(rebrickablePart);
    modelPartColor.color = exports.ColorToModel(rebrickableColor);
    return modelPartColor;
};

exports.SetPartToModel = function(rebrickableSetPart) {
    var modelSetPart = {
        Quantity: rebrickableSetPart.quantity,
        isSpare: rebrickableSetPart.is_spare,
        PartRebrickableId: rebrickableSetPart.part.part_num,
        ColorRebrickableId: rebrickableSetPart.color.id
    };
    if (rebrickableSetPart.part && rebrickableSetPart.color) {
        modelSetPart.partsColor = exports.PartsColorToModel(rebrickableSetPart.part, rebrickableSetPart.color);
    }
    if (rebrickableSetPart.set) {
        modelSetPart.set = exports.SetToModel(rebrickableSetPart.set);
    }
    return modelSetPart;
};

var rebrickableFetchMulti = function(primaryData, rebrickableId, secondaryData) {
    return rebrickableFetch({ primaryData: primaryData, rebrickableId: rebrickableId, secondaryData: secondaryData, page: 1, pageSize: defaultPageSize }).then(
        function(result) {
            var pageCount = Math.ceil(result.count / defaultPageSize);
            var fetchPromises = [];
            //on genere l'array de promesse qui va s'occuper d'aller chercher les données
            for (var i = 0; i < pageCount; i++) {
                fetchPromises[i] = rebrickableFetch({
                    primaryData: primaryData,
                    rebrickableId: rebrickableId,
                    secondaryData: secondaryData,
                    page: i + 1,
                    pageSize: defaultPageSize
                });
            }

            //maintenant, on va les fetcher
            return Promise.all(fetchPromises).then(result => {
                //console.dir(cleanPageResults(result));
                return cleanPageResults(result);
            });
        }
    );
};

var rebrickableFetch = function(parameters) {
    var urlString =
        "https://rebrickable.com/api/v3/lego/" +
        parameters.primaryData +
        "/" +
        parameters.rebrickableId +
        "/" +
        parameters.secondaryData +
        "/?page=" +
        parameters.page +
        "&page_size=" +
        parameters.pageSize +
        "&key=" +
        key;
    if (!parameters.secondaryData) {
        urlString = "https://rebrickable.com/api/v3/lego/" + parameters.primaryData + "/" + parameters.rebrickableId + "/?key=" + key;
    }
    //console.log(urlString);
    return simpleFetch(urlString);
};

var simpleFetch = function(url) {
    return new Promise(function(resolve, reject) {
        https
            .get(url, resp => {
                let rawData = "";
                resp.on("data", chunk => {
                    rawData += chunk;
                });

                resp.on("end", () => {
                    var data = JSON.parse(rawData);
                    return resolve(data);
                });
            })
            .on("error", err => {
                console.Error("Error while fetching " + url + " : " + err.message);
                return reject(err);
            });
    });
};

var cleanPageResults = function(raw) {
    var cleanResult = [];
    for (var result of raw) {
        //console.dir(result.results);
        cleanResult = cleanResult.concat(result.results);
    }
    return cleanResult;
};
