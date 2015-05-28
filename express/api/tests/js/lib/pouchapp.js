// A convenience utility to import our couchapp views into a pouchdb instance, required for testing purposes.
// Converts a series of couchapp directories into a single view like:
//
// "_id": "_design/api",
//    "views": {
//      "flat": {
//          "map": "function()...."
//      },
//      "etc": { "map": ... }
//  },
// "validate_doc_update": "function() ...."

"use strict";

function loadCouchappViews(path) {
    var fs = require("fs");

    var json = { "_id": "_design/api", "views": {}};

    // read the couchapp parent directory
    fs.readdirSync(path + "/views").forEach(function(file){
        // skip the library directory that we already scanned...
        if (file !== "lib") {
            var mapContent = fs.readFileSync(path + "/views/" + file + "/map.js", {"encoding": "utf8"});

            json.views[file] = {"map": mapContent};
        }
    });

    return json;
}

module.exports = function () {
    var fluid = require("infusion");
    var pouchapp = fluid.registerNamespace("gpii.ctr.api.tests.lib.pouchapp");

    pouchapp.loadCouchappViews = loadCouchappViews;
    return pouchapp;
};