// Test Environment for "records" and all typed variations (terms, aliases, etc.).
//
// See records-caseholder.js for individual test definitions.
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

fluid.setLogging(true);

require("gpii-express");
require("gpii-pouch");
require("../../record/get");
require("../../lib/fixedResponse");
require("./record-get-caseholder");

// We use just the request-handling bits of the kettle stack in our tests, but we include the whole thing to pick up the base grades
require("../../../node_modules/kettle");
require("../../../node_modules/kettle/lib/test/KettleTestUtils");

var path = require("path");

fluid.registerNamespace("gpii.ptd.api.record.get.tests.testEnvironment");
var sampleDataFile = path.resolve(__dirname, "../data/records.json");
fluid.defaults("gpii.ptd.api.record.get.tests.testEnvironment", {
    gradeNames:   ["fluid.test.testEnvironment", "autoInit"],
    baseUrl:      "http://localhost:7531/",
    port:         "7531",
    couchBaseUrl: "http://localhost:7537/",
    couchDbUrl:   "http://localhost:7537/tr",
    couchPort:    7537,
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
                    record: {
                        type: "gpii.ptd.api.record.get",
                        options: {
                            timeout: 10000,  // The timeout needs to be increased when debugging
                            baseUrl:  "{testEnvironment}.options.baseUrl",
                            couchUrl: "{testEnvironment}.options.couchDbUrl"
                        }
                    },
                    noid: {
                        type: "gpii.ptd.api.lib.fixedResponse",
                        options: {
                            path:       "/",
                            baseUrl:    "{testEnvironment}.options.baseUrl",
                            statusCode: 400,
                            message:    "You must provide a uniqueId."
                        }
                    }
                }
            }
        },
        testCaseHolder: {
            type: "gpii.ptd.api.record.get.tests.caseHolder"
        }
    }
});

gpii.ptd.api.record.get.tests.testEnvironment();