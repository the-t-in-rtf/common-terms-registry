// A very quick and dirty script to extract test data for "children" tests.
//
// You will likely need to edit the results to simplify the views
"use strict";
var request = require("request");
var fs      = require("fs");
var options = {
    url: "http://admin:admin@localhost:5984/tr/_all_docs?include_docs=true"
};

var timestamp = (new Date()).getTime();
var output = "/tmp/children-" + timestamp + ".json";

// Add records you want to test here (and to the test case holder for child tests).
var filterToUids = [
    "brailleDevice",
    "host",
    "showAccels",
    "showWelcomeDialogAtStartup",
    "zoom"
];

function hasRelevantUid(record) {
    // Preserve "design" documents (views).
    if (record._id && record._id.indexOf("_design") !== -1) {
        return true;
    }

    var fieldsToCheck = ["uid", "aliasOf", "translationOf"];
    for (var a = 0; a < fieldsToCheck.length; a++) {
        var field = fieldsToCheck[a];
        if (record[field] && filterToUids.indexOf(record[field]) !== -1) {
            return true;
        }
    }

    return false;
}


request(options, function (error, response, body) {
    var data = typeof body === "string" ? JSON.parse(body) : body;
    var processedData = data.rows.map(function (row) {
        var record = row.doc;

        if (record._id.indexOf("_design") === 0) {
            return record;
        }
        else {
            var fieldsToDelete = ["_id", "_rev", "source"];
            for (var a = 0; a < fieldsToDelete.length; a++) {
                var field = fieldsToDelete[a];
                if (record[field]) {
                    delete record[field];
                }
            }
            return record;
        }
    }).filter(hasRelevantUid);

    fs.writeFile(output, JSON.stringify(processedData, null, 2), {}, function () {
        console.log("Output saved to '" + output + "'...");
    });
});
