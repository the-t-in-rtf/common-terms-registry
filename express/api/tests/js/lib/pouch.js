// TODO:  Convert all usages of this to use `gpii.pouch`
// Utility functions to spin up pouch.
"use strict";

var path = require("path");

/*globals __dirname */

module.exports = function (config) {
    var fluid = require("infusion");
    var pouch = fluid.registerNamespace("gpii.ctr.api.tests.pouch");

    pouch.start = function (callback) {
        var PouchDB    = require("pouchdb");

        var memPouchDb = PouchDB.defaults({db: require("memdown")});
        memPouchDb("tr");
        memPouchDb("_users");

        var express    = require("express");
        var app        = express();


        var sessionator = require("./sessionator")(config);
        app.use("/_session", sessionator);

        // Add PouchDB with simulated CouchDb REST endpoints
        app.use("/", require("express-pouchdb")(memPouchDb));
        app.set("port", config["pouch.port"]);

        var http = require("http");
        http.createServer(app).listen(config["pouch.port"], function () {
            console.log("Pouch express server listening on port " + config["pouch.port"]);

            console.log("Pouch express started...");

            // Give express-pouch a bit of time to start up.  I gravy hate myself.
            setTimeout(function () { loadViews(callback); }, 500);
        });
    };

    function loadViews(callback) {
        var couchappUtils = require("./pouchapp")(config);

        var viewPath = path.resolve(__dirname, "../../../../../couchapp/api/");
        var viewContent = couchappUtils.loadCouchappViews(viewPath);

        var options = {
            "url": config["couch.url"] + "/_design/api",
            "json": viewContent
        };

        var request = require("request");
        request.put(options, function (e, r, b) {
            if (e && e !== null) {
                return console.log("Error loading views into pouch:  " + e);
            }
            else if (b.error) {
                return console.log("Error loading views into pouch:  " + b.error + ": " + b.reason);
            }

            console.log("Views loaded...");
            loadData(callback);
        });
    }

    function loadData(callback) {
        var data = require("../../data/records.json");

        // Hit our express instance, for some reason the bulk docs function doesn't seem to like us
        var options = {
            "url": config["couch.url"] + "/_bulk_docs",
            "json": data
        };

        var request = require("request");
        request.post(options, function (e, r, b) {
            if (e && e !== null) {
                return console.log("Error loading data into pouch:  " + e);
            }
            else if (b.error) {
                return console.log("Error loading data into pouch:  " + b.error + ": " + b.reason);
            }

            console.log("Data loaded...");

            loadUsers(callback);
        });
    }

    function loadUsers(callback) {
        var data = require("../../data/users.json");

        // Hit our express instance, for some reason the bulk docs function doesn't seem to like us
        var options = {
            "url": config.users + "/_bulk_docs",
            "json": data
        };

        var request = require("request");
        request.post(options, function (e, r, b) {
            if (e && e !== null) {
                return console.log("Error loading users into pouch:  " + e);
            }
            else if (b.error) {
                return console.log("Error loading users into pouch:  " + b.error + ": " + b.reason);
            }

            console.log("Users loaded...");

            if (callback) {
                callback();
            }
        });
    }

    return pouch;
};


