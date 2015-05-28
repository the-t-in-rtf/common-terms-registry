// Test Environment for "records" and all typed variations (terms, aliases, etc.).
//
// See records-caseholder.js for individual test definitions.
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

fluid.setLogging(true);

require("gpii-express");
require("gpii-pouch");
require("../../records");
require("./records-caseholder");

// We use just the request-handling bits of the kettle stack in our tests, but we include the whole thing to pick up the base grades
require("../../../node_modules/kettle");
require("../../../node_modules/kettle/lib/test/KettleTestUtils");

var path = require("path");

fluid.registerNamespace("gpii.ptd.api.records.tests.records");
var sampleDataFile = path.resolve(__dirname, "../data/records.json");
fluid.defaults("gpii.ptd.api.records.tests.records", {
    gradeNames:   ["fluid.test.testEnvironment", "autoInit"],
    baseUrl:      "http://localhost:7532/",
    port:         "7532",
    couchBaseUrl: "http://localhost:7534/",
    couchDbUrl:   "http://localhost:7534/tr",
    couchPort:    7534,
    events: {
        constructServer: null,
        expressStarted:  null,
        pouchStarted:    null,
        onReady: {
            events: {
                expressStarted: "expressStarted",
                pouchStarted:   "pouchStarted"
            }
        }
    },
    components: {
        express: {
            type: "gpii.express",
            createOnEvent: "constructServer",
            options: {
                events: {
                    onStarted: "{testEnvironment}.events.expressStarted"
                },
                config: {
                    express: {
                        port:    "{testEnvironment}.options.port",
                        baseUrl: "{testEnvironment}.options.baseUrl"
                    }
                },
                components: {
                    pouch: {
                        type: "gpii.express",
                        options: {
                            listeners: {
                                "onStarted": "{testEnvironment}.events.pouchStarted.fire"
                            },
                            config: {
                                express: {
                                    "port" : "{testEnvironment}.options.couchPort",
                                    baseUrl: "{testEnvironment}.options.couchBaseUrl"
                                },
                                app: {
                                    name: "Pouch Test Server",
                                    url:  "{testEnvironment}.options.couchBaseUrl"
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
                    records: {
                        type: "gpii.ptd.api.records",
                        options: {
                            type:     "record",
                            children: false,
                            baseUrl:  "{testEnvironment}.options.baseUrl",
                            couchUrl: "{testEnvironment}.options.couchDbUrl",
                            path:     "/records"
                        }
                    },
                    terms: {
                        type: "gpii.ptd.api.records",
                        options: {
                            type:     "term",
                            children: true,
                            baseUrl:  "{testEnvironment}.options.baseUrl",
                            couchUrl: "{testEnvironment}.options.couchDbUrl",
                            path:     "/terms"

                        }
                    },
                    aliases: {
                        type: "gpii.ptd.api.records",
                        options: {
                            type:     "alias",
                            children: false,
                            baseUrl:  "{testEnvironment}.options.baseUrl",
                            couchUrl: "{testEnvironment}.options.couchDbUrl",
                            path:     "/aliases"

                        }
                    }
                }
            }
        },
        testCaseHolder: {
            type: "gpii.ptd.api.records.tests.caseHolder"
        }
    }
});

gpii.ptd.api.records.tests.records();