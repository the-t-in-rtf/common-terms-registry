// Test Environment for "records" and all typed variations (terms, aliases, etc.).
//
// See records-caseholder.js for individual test definitions.
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

fluid.setLogging(true);

require("gpii-express");
require("gpii-pouch");
require("../../search");
require("./search-caseholder");

// We use just the request-handling bits of the kettle stack in our tests, but we include the whole thing to pick up the base grades
require("../../../node_modules/kettle");
require("../../../node_modules/kettle/lib/test/KettleTestUtils");

fluid.registerNamespace("gpii.ptd.api.search.tests.testEnvironment");
fluid.defaults("gpii.ptd.api.search.tests.testEnvironment", {
    gradeNames:   ["fluid.test.testEnvironment", "autoInit"],
    baseUrl:      "http://localhost:7532/",
    port:         "7532",
    // We cannot test with pouch because we need to integrate with Lucene.
    // TODO:  Replace this with a pouch instance
    couchUrl:     "http://localhost:5984/tr",
    // TODO:  Replace this with a reasonable "mock" of CouchDB + Lucene
    luceneUrl:    "http://localhost:5984/_fti/local/tr/_design/lucene/by_content",
    events: {
        constructServer: null,
        expressStarted:  null,
        pouchStarted:    null,
        onReady: {
            events: {
                expressStarted: "expressStarted"
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
                    search: {
                        type: "gpii.ptd.api.search",
                        options: {
                            baseUrl:   "{testEnvironment}.options.baseUrl",
                            couchUrl:  "{testEnvironment}.options.couchUrl",
                            luceneUrl: "{testEnvironment}.options.luceneUrl",
                            path:      "/search"

                        }
                    }
                }
            }
        },
        testCaseHolder: {
            type: "gpii.ptd.api.search.tests.caseHolder"
        }
    }
});

gpii.ptd.api.search.tests.testEnvironment();