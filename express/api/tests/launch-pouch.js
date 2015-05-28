/*

Test script to launch the server with options comparable to those used in the test environment.

 */
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

fluid.setLogging(true);

require("gpii-express");
require("gpii-pouch");
require("../records");

var path = require("path");

var sampleDataFile = path.resolve(__dirname, "./data/records.json");

gpii.express({
    port:         "5757",
    baseUrl:      "http://localhost:5757",
    couchPort:    "7575",
    couchBaseUrl: "http://localhost:7575",
    couchDbUrl:   "http://localhost:7575/tr",
    members: {
        directChildrenOfInterest: [],
        childrenByParent:         {}
    },
    config: {
        express: {
            port:    "{that}.options.port",
            baseUrl: "{that}.options.baseUrl",
            session: {
                secret: "Printer, printer take a hint-ter."
            }
        }
    },
    components: {
        pouch: {
            type: "gpii.express",
            options: {
                config: {
                    express: {
                        "port" : "7575",
                        baseUrl: "http://localhost:7575"
                    },
                    app: {
                        name: "Pouch Test Server",
                        url:  "http://localhost:7575"
                    }
                },
                components: {
                    pouch: {
                        type: "gpii.pouch",
                        options: {
                            path: "/",
                            databases: { tr: { data: sampleDataFile } }
                        }
                    }
                }
            }
        },
        session: {
            type: "gpii.express.middleware.session"
        },
        records: {
            type: "gpii.ptd.records",
            options: {
                type:     "record",
                children: false,
                couchUrl: "{express}.options.couchDbUrl",
                path:     "/records"
            }
        },
        terms: {
            type: "gpii.ptd.records",
            options: {
                type:     "term",
                children: true,
                couchUrl: "{express}.options.couchDbUrl",
                path:     "/terms"

            }
        },
        aliases: {
            type: "gpii.ptd.records",
            options: {
                type:     "alias",
                children: false,
                couchUrl: "{express}.options.couchDbUrl",
                path:     "/aliases"

            }
        }
    }
});