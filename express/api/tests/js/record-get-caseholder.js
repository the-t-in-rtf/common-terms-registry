"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

require("./lib/testUtils");
require("./lib/sequence");
require("./lib/url");

var jqUnit = require("jqUnit");

fluid.registerNamespace("gpii.ptd.api.record.get.tests.caseHolder");

// Verify that we receive an appropriate response when no record is available.
gpii.ptd.api.record.get.tests.caseHolder.verifyNotFound = function (response, body) {
    gpii.ptd.api.tests.testUtils.isSaneResponse(jqUnit, null, response, body, 404);
};
// Verify that we receive an appropriate response when we omit the `uniqueId`.
gpii.ptd.api.record.get.tests.caseHolder.verifyBadSyntax = function (response, body) {
    gpii.ptd.api.tests.testUtils.isSaneResponse(jqUnit, null, response, body, 400);
};

// We will use this to verify that appropriate is returned for all cases that return a record.
gpii.ptd.api.record.get.tests.caseHolder.verifyRecord = function (response, body) {
    gpii.ptd.api.tests.testUtils.isSaneResponse(jqUnit, null, response, body);

    jqUnit.assertEquals("The request should have been successful...", 200, response.statusCode);

    var jsonData = JSON.parse(body);
    jqUnit.assertNotNull("There should be record data returned...", jsonData.record);

    if (jsonData.record) {
        gpii.ptd.api.tests.testUtils.isSaneRecord(jqUnit, jsonData.record);
    }
};

gpii.ptd.api.record.get.tests.caseHolder.verifyHasChildren = function (response, body) {
    gpii.ptd.api.record.get.tests.caseHolder.verifyRecord(response, body);

    var jsonData = JSON.parse(body);
    jqUnit.assertTrue("The record returned should have child data...", jsonData.record.aliases.length > 0);
};

gpii.ptd.api.record.get.tests.caseHolder.verifyHasNoChildren = function (response, body) {
    gpii.ptd.api.record.get.tests.caseHolder.verifyRecord(response, body);

    var jsonData = JSON.parse(body);
    jqUnit.assertNoValue("The record returned should not have child data...", jsonData.record.aliases);
};

// Wire in an instance of kettle.requests.request.http for each test and wire the check to its onError or onSuccess event
fluid.defaults("gpii.ptd.api.record.get.tests.caseHolder", {
    gradeNames: ["autoInit", "fluid.test.testCaseHolder"],
    mergePolicy: {
        rawModules:    "noexpand",
        sequenceStart: "noexpand"
    },
    moduleSource: {
        funcName: "gpii.ptd.api.tests.addRequiredSequences",
        args:     ["{that}.options.sequenceStart", "{that}.options.rawModules"]
    },
    sequenceStart: [
        { // This sequence point is required because of a QUnit bug - it defers the start of sequence by 13ms "to avoid any current callbacks" in its words
            func: "{testEnvironment}.events.constructServer.fire"
        },
        {
            listener: "fluid.identity",
            event:    "{testEnvironment}.events.onReady"
        },
        // The next sequence points are required to force pouch to index the views we will be testing.
        // Without these, even fairly large timeouts (5 seconds or more) will fail for the first response that hits a particular view.
        {
            func: "{recordsCacheView}.send"
        },
        {
            listener: "fluid.log",
            event: "{recordsCacheView}.events.onComplete",
            args: ["'records' view loaded..."]
        },
        {
            func: "{aliasesCacheView}.send"
        },
        {
            listener: "fluid.log",
            event: "{aliasesCacheView}.events.onComplete",
            args: ["'aliases' view loaded..."]
        },
        {
            func: "{termsCacheView}.send"
        },
        {
            listener: "fluid.log",
            event: "{termsCacheView}.events.onComplete",
            args: ["'terms' view loaded..."]
        },
        {
            func: "{childrenCacheView}.send"
        },
        {
            listener: "fluid.log",
            event: "{childrenCacheView}.events.onComplete",
            args: ["'children' view loaded..."]
        }
    ],
    rawModules: [
        {
            tests: [
                {
                    name: "Testing leaving out the uniqueId...",
                    type: "test",
                    sequence: [
                        {
                            func: "{missingDataRequest}.send"
                        },
                        {
                            listener: "gpii.ptd.api.record.get.tests.caseHolder.verifyBadSyntax",
                            event: "{missingDataRequest}.events.onComplete",
                            args: ["{missingDataRequest}.nativeResponse", "{arguments}.0"]
                        }
                    ]
                },
                // TODO:  We can't run the rest of the tests until we figure out why they are running out of memory.
                {
                    name: "Testing retrieving a record by its uniqueId...",
                    type: "test",
                    sequence: [
                        {
                            func: "{simpleRecordRequest}.send"
                        },
                        {
                            listener: "gpii.ptd.api.record.get.tests.caseHolder.verifyRecord",
                            event: "{simpleRecordRequest}.events.onComplete",
                            args: ["{simpleRecordRequest}.nativeResponse", "{arguments}.0"]
                        }
                    ]
                },
                {
                    name: "Testing using a uniqueId that doesn't exist...",
                    type: "test",
                    sequence: [
                        {
                            func: "{missingRecordRequest}.send"
                        },
                        {
                            listener: "gpii.ptd.api.record.get.tests.caseHolder.verifyNotFound",
                            event: "{missingRecordRequest}.events.onComplete",
                            args: ["{missingRecordRequest}.nativeResponse", "{arguments}.0"]
                        }
                    ]
                },
                {
                    name: "Testing retrieving a record with a space in its uniqueId...",
                    type: "test",
                    sequence: [
                        {
                            func: "{spaceRequest}.send"
                        },
                        {
                            listener: "gpii.ptd.api.record.get.tests.caseHolder.verifyRecord",
                            event: "{spaceRequest}.events.onComplete",
                            args: ["{spaceRequest}.nativeResponse", "{arguments}.0"]
                        }
                    ]
                },
                {
                    name: "Testing retrieving an alias with the `children` option set to true...",
                    type: "test",
                    sequence: [
                        {
                            func: "{aliasWithChildrenRequest}.send"
                        },
                        {
                            listener: "gpii.ptd.api.record.get.tests.caseHolder.verifyHasNoChildren",
                            event: "{aliasWithChildrenRequest}.events.onComplete",
                            args: ["{aliasWithChildrenRequest}.nativeResponse", "{arguments}.0"]
                        }
                    ]
                },
                {
                    name: "Testing retrieving a term with the `children` option set to true...",
                    type: "test",
                    sequence: [
                        {
                            func: "{termWithChildrenRequest}.send"
                        },
                        {
                            listener: "gpii.ptd.api.record.get.tests.caseHolder.verifyHasChildren",
                            event: "{termWithChildrenRequest}.events.onComplete",
                            args: ["{termWithChildrenRequest}.nativeResponse", "{arguments}.0"]
                        }
                    ]
                },
                {
                    name: "Testing retrieving a term with the `children` option set to false...",
                    type: "test",
                    sequence: [
                        {
                            func: "{termWithoutChildrenRequest}.send"
                        },
                        {
                            listener: "gpii.ptd.api.record.get.tests.caseHolder.verifyHasNoChildren",
                            event: "{termWithoutChildrenRequest}.events.onComplete",
                            args: ["{termWithoutChildrenRequest}.nativeResponse", "{arguments}.0"]
                        }
                    ]
                }
            ]
        }
    ],
    components: {
        // We have to hit each PouchDB view we plan to use first to avoid misleading timeout errors.
        recordsCacheView: {
            type: "kettle.test.request.http",
            options: {
                path: {
                    expander: {
                        funcName: "gpii.ptd.api.tests.assembleUrl",
                        args:     ["{testEnvironment}.options.couchBaseUrl", "/_design/api/_view/entries"]
                    }
                },
                port: "{testEnvironment}.options.couchPort",
                method: "GET"
            }
        },
        termsCacheView: {
            type: "kettle.test.request.http",
            options: {
                path: {
                    expander: {
                        funcName: "gpii.ptd.api.tests.assembleUrl",
                        args:     ["{testEnvironment}.options.couchBaseUrl", "/_design/api/_view/terms"]
                    }
                },
                port: "{testEnvironment}.options.couchPort",
                method: "GET"
            }
        },
        aliasesCacheView: {
            type: "kettle.test.request.http",
            options: {
                path: {
                    expander: {
                        funcName: "gpii.ptd.api.tests.assembleUrl",
                        args:     ["{testEnvironment}.options.couchBaseUrl", "/_design/api/_view/aliases"]
                    }
                },
                port: "{testEnvironment}.options.couchPort",
                method: "GET"
            }
        },
        childrenCacheView: {
            type: "kettle.test.request.http",
            options: {
                path: {
                    expander: {
                        funcName: "gpii.ptd.api.tests.assembleUrl",
                        args:     ["{testEnvironment}.options.couchBaseUrl", "/_design/api/_view/children"]
                    }
                },
                port: "{testEnvironment}.options.couchPort",
                method: "GET"
            }
        },
        missingDataRequest: {
            type: "kettle.test.request.http",
            options: {
                path: {
                    expander: {
                        funcName: "gpii.ptd.api.tests.assembleUrl",
                        args:     ["{testEnvironment}.options.baseUrl", "/"]
                    }
                },
                port: "{testEnvironment}.options.port",
                method: "GET"
            }
        },
        simpleRecordRequest: {
            type: "kettle.test.request.http",
            options: {
                path: {
                    expander: {
                        funcName: "gpii.ptd.api.tests.assembleUrl",
                        args:     ["{testEnvironment}.options.baseUrl", "/6DotComputerBrailleTable"]
                    }
                },
                port: "{testEnvironment}.options.port",
                method: "GET"
            }
        },
        missingRecordRequest: {
            type: "kettle.test.request.http",
            options: {
                path: {
                    expander: {
                        funcName: "gpii.ptd.api.tests.assembleUrl",
                        args:     ["{testEnvironment}.options.baseUrl", "/notGonnaFindThisOne"]
                    }
                },
                port: "{testEnvironment}.options.port",
                method: "GET"
            }
        },
        termWithChildrenRequest: {
            type: "kettle.test.request.http",
            options: {
                path: {
                    expander: {
                        funcName: "gpii.ptd.api.tests.assembleUrl",
                        args:     ["{testEnvironment}.options.baseUrl", "/6DotComputerBrailleTable?children=true"]
                    }
                },
                port: "{testEnvironment}.options.port",
                method: "GET"
            }
        },
        termWithoutChildrenRequest: {
            type: "kettle.test.request.http",
            options: {
                path: {
                    expander: {
                        funcName: "gpii.ptd.api.tests.assembleUrl",
                        args:     ["{testEnvironment}.options.baseUrl", "/6DotComputerBrailleTable?children=false"]
                    }
                },
                port: "{testEnvironment}.options.port",
                method: "GET"
            }
        },
        aliasWithChildrenRequest: {
            type: "kettle.test.request.http",
            options: {
                path: {
                    expander: {
                        funcName: "gpii.ptd.api.tests.assembleUrl",
                        args:     ["{testEnvironment}.options.baseUrl", "/AbsolutePointing?children=true"]
                    }
                },
                port: "{testEnvironment}.options.port",
                method: "GET"
            }
        },
        spaceRequest: {
            type: "kettle.test.request.http",
            options: {
                path: {
                    expander: {
                        funcName: "gpii.ptd.api.tests.assembleUrl",
                        args:     ["{testEnvironment}.options.baseUrl", "/absolute%20pointing"]
                    }
                },
                port: "{testEnvironment}.options.port",
                method: "GET"
            }
        }
    }
});