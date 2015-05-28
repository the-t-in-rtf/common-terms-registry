// Tests for the "children" module.
"use strict";
var fluid = require("infusion");
fluid.setLogging(true);

var gpii  = fluid.registerNamespace("gpii");
fluid.registerNamespace("gpii.ptd.api.tests.childrenTests");

require("gpii-express");
require("gpii-pouch");
require("../../../node_modules/kettle");
require("../../../node_modules/kettle/lib/test/KettleTestUtils");
require("../../lib/children");
require("./children-caseholder");

var path = require("path");

// If you need to updated the test data set, check out `extract-child-data.js`
var sampleDataFile = path.resolve(__dirname, "../data/child-records-and-views");

fluid.defaults("gpii.ptd.api.tests.childrenTests", {
    gradeNames: ["fluid.test.testEnvironment", "autoInit"],
    port:       5987,
    couchUrl:   "http://localhost:5987/tr/",
    viewPath:   "_design/api/_view/children",
    events: {
        constructServer: null,
        onStarted: null
    },
    components: {
        express: {       // instance of component under test
            createOnEvent: "constructServer",
            type: "gpii.express",
            options: {
                events: {
                    onStarted: "{testEnvironment}.events.onStarted"
                },
                config: {
                    express: {
                        port: "{testEnvironment}.options.port",
                        baseUrl: "{testEnvironment}.options.baseUrl"
                    }
                },
                components: {
                    "pouch": {
                        type: "gpii.pouch",
                        options: {
                            "databases": {
                                "tr": {
                                    "data": sampleDataFile
                                }
                            }
                        }
                    }
                }
            }
        },
        testCaseHolder: {
            type: "gpii.ptd.api.tests.childrenTestCaseHolder"
        }
    }
});

gpii.ptd.api.tests.childrenTests();