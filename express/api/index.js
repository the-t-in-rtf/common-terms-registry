// An express router module that wraps all API functions together.  Currently sub-modules are transitioning to using
// `gpii.express.router`, eventually this will also be based on that.
//
"use strict";

var fluid = fluid || require("infusion");
var gpii  = fluid.registerNamespace("gpii");

require("./search");

// TODO:  Continue the process of converting all modules to Fluid components.
module.exports = function (config) {
    var express = require("express");
    var router = express.Router();

    var search = gpii.ptd.api.search({
        couchUrl:  config["couch.url"],
        baseUrl:   config["base.url"],
        luceneUrl: config["lucene.url"]
    });
    router.use("/search", search.getRouter());


    // Record lookup end points, one for all types, and one each per type
    var records = require("./records")(config);
    router.use("/records", records);

    var termsConfig = JSON.parse(JSON.stringify(config));
    termsConfig.recordType = "term";
    var terms = require("./records")(termsConfig);
    router.use("/terms", terms);

    var aliasConfig = JSON.parse(JSON.stringify(config));
    aliasConfig.recordType = "alias";
    var aliases = require("./records")(aliasConfig);
    router.use("/aliases", aliases);

    var transformConfig = JSON.parse(JSON.stringify(config));
    transformConfig.recordType = "transform";
    var transforms = require("./records")(transformConfig);
    router.use("/transforms", transforms);

    var translationConfig = JSON.parse(JSON.stringify(config));
    translationConfig.recordType = "translation";
    var translations = require("./records")(translationConfig);
    router.use("/translations", translations);

    var conditionsConfig = JSON.parse(JSON.stringify(config));
    conditionsConfig.recordType = "condition";
    var conditions = require("./records")(conditionsConfig);
    router.use("/conditions", conditions);

    var record = require("./record")(config);
    router.use("/record", record);

    // Display the API docs for everything else
    router.use("/", function (req, res) {
        if (req.path === "/") {
            var marked = require("marked");

            var markdown = "";
            var fs = require("fs");
            var BUF_LENGTH = 64 * 1024;
            var buffer = new Buffer(BUF_LENGTH);
            var mdFile = fs.openSync(__dirname + "/ctr.md", "r");
            var bytesRead = 1;
            var pos = 0;
            while (bytesRead > 0) {
                bytesRead = fs.readSync(mdFile, buffer, 0, BUF_LENGTH, pos);
                markdown += buffer.toString("utf8", 0, bytesRead);
                pos += bytesRead;
            }
            fs.closeSync(mdFile);

            res.render("pages/page", { "title": "API Documentation", "body": marked(markdown)});
        }
        else {
            res.status(404).render("pages/error", {message: "The page you requested was not found."});
        }
    });
    return router;
};

