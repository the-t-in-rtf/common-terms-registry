"use strict";

// TODO:  We are in the process of converting this to a Fluid component

var fluid = fluid || require("infusion");
var gpii  = fluid.registerNamespace("gpii");

require("../lib/fixedResponse");
require("./get");

// All handlers for /api/record
module.exports = function (config) {
    var express = require("express");

    var router = express.Router();

    var get = gpii.ptd.api.record.get({
        couchUrl: config["couch.url"],
        baseUrl:  config["base.url"]
    });
    router.get("/:uniqueId", get.getRouter());

    var noid = gpii.ptd.api.lib.fixedResponse({
        path:       "/",
        baseUrl:    config["base.url"],
        statusCode: 400,
        ok:         false,
        message:    "You must provide a uniqueId."
    });
    router.get("/", noid.getRouter());

    var put = require("./put")(config);
    router.use("/", put);

    var post = require("./post")(config);
    router.use("/", post);

    var del = require("./delete")(config);
    router.use("/", del);

    return router;
};
