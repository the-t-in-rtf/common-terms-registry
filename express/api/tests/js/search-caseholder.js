"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

require("./lib/testUtils");
require("./lib/sequence");
require("./lib/url");

var jqUnit = require("jqUnit");


fluid.registerNamespace("gpii.ptd.api.search.tests.caseHolder");

gpii.ptd.api.search.tests.caseHolder.verifySimpleSearchResponse = function (response, body) {
    gpii.ptd.api.tests.testUtils.isSaneResponse(jqUnit, null, response, body);

    jqUnit.assertEquals("The request should have been successful...", response.statusCode, 200);

    var jsonData = JSON.parse(body);
    jqUnit.assertTrue("The total number of rows returned should be greater than zero...", jsonData.total_rows > 0);

    jqUnit.assertTrue("There should be at least one record...", jsonData.records && jsonData.records.length > 0);
    gpii.ptd.api.tests.testUtils.isSaneRecord(jqUnit, jsonData.records && jsonData.records[0] ? jsonData.records[0] : null);
};

gpii.ptd.api.search.tests.caseHolder.verifyEmptySearchResponse = function (response, body) {
    gpii.ptd.api.tests.testUtils.isSaneResponse(jqUnit, null, response, body);

    jqUnit.assertEquals("The request should not have been successful...", response.statusCode, 400);

    var data = (typeof body === "string") ? JSON.parse(body) : body;
    jqUnit.assertEquals("The response should not have been 'ok'...", false, data.ok);
    jqUnit.assertNotUndefined("There should have been an error message...", data.message);
    jqUnit.assertUndefined("There should not have been any records returns...", data.records);
};

gpii.ptd.api.search.tests.caseHolder.verifyImpossibleSearchResponse = function (response, body) {
    gpii.ptd.api.tests.testUtils.isSaneResponse(jqUnit, null, response, body);

    jqUnit.assertEquals("The request should have been successful...", response.statusCode, 200);

    var jsonData = JSON.parse(body);
    jqUnit.assertEquals("The total number of rows returned should be zero...", 0, jsonData.total_rows);

    jqUnit.assertDeepEq("There should not be any records...", [], jsonData.records);
};

gpii.ptd.api.search.tests.caseHolder.verifyLimitedResponse = function (response, body) {
    gpii.ptd.api.search.tests.caseHolder.verifySimpleSearchResponse(response, body);

    var jsonData = JSON.parse(body);
    jqUnit.assertEquals("The total number of records should equal the limit...", 5, jsonData.records.length);
};

gpii.ptd.api.search.tests.caseHolder.verifyFirstPagingResponse = function (responseObject, response, body) {
    gpii.ptd.api.search.tests.caseHolder.verifySimpleSearchResponse(response, body);

    var data = typeof body === "string" ? JSON.parse(body) : body;

    // Hold on to the first record we received for later comparison.
    responseObject.record = data.records[0];
};

gpii.ptd.api.search.tests.caseHolder.verifySecondPagingResponse = function (firstResponseObject, response, body) {
    gpii.ptd.api.search.tests.caseHolder.verifySimpleSearchResponse(response, body);

    var data = typeof body === "string" ? JSON.parse(body) : body;
    var secondRecord = data.records[data.records.length - 1];

    // Our last record should match the previously saved record.
    jqUnit.assertDeepEq("Pages of search results that overlap should contain the same record...", firstResponseObject.record, secondRecord);
};

gpii.ptd.api.search.tests.caseHolder.verifyFirstSortingResponse = function (responseObject, response, body) {
    gpii.ptd.api.search.tests.caseHolder.verifySimpleSearchResponse(response, body);

    var data = typeof body === "string" ? JSON.parse(body) : body;

    // Hold on to the first record we received for later comparison.
    responseObject.record = data.records[0];
};

gpii.ptd.api.search.tests.caseHolder.verifySecondSortingResponse = function (firstResponseObject, response, body) {
    gpii.ptd.api.search.tests.caseHolder.verifySimpleSearchResponse(response, body);

    var data = typeof body === "string" ? JSON.parse(body) : body;

    // Our first record should not match the previously saved record.
    jqUnit.assertDeepNeq("Records sorted A-Z should not match records sorted Z-A...", firstResponseObject.record, data.records[0]);
};

gpii.ptd.api.search.tests.caseHolder.verifyFirstQualifiedResponse = function (responseObject, response, body) {
    gpii.ptd.api.search.tests.caseHolder.verifySimpleSearchResponse(response, body);

    var data = typeof body === "string" ? JSON.parse(body) : body;

    // Hold on to the first record we received for later comparison.
    responseObject.records = data.records;
};

gpii.ptd.api.search.tests.caseHolder.verifySecondQualifiedResponse = function (firstResponseObject, response, body) {
    gpii.ptd.api.search.tests.caseHolder.verifySimpleSearchResponse(response, body);

    var data = typeof body === "string" ? JSON.parse(body) : body;

    jqUnit.assertTrue("A search limited by field should return less results than a search that is unlimited...", firstResponseObject.records.length > data.records.length);

    data.records.forEach(function (record) {
        jqUnit.assertTrue("The qualified field should contain the search term...", record.termLabel && record.termLabel.indexOf("comp") !== -1);
    });
};

// Wire in an instance of kettle.requests.request.http for each test and wire the check to its onError or onSuccess event
fluid.defaults("gpii.ptd.api.search.tests.caseHolder", {
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
        }
    ],
    rawModules: [
        {
            tests: [
                {
                    name: "Testing simple searching...",
                    type: "test",
                    sequence: [
                        {
                            func: "{searchWithOnlyQuery}.send"
                        },
                        {
                            listener: "gpii.ptd.api.search.tests.caseHolder.verifySimpleSearchResponse",
                            event: "{searchWithOnlyQuery}.events.onComplete",
                            args: ["{searchWithOnlyQuery}.nativeResponse", "{arguments}.0"]
                        }
                    ]
                },
                {
                    name: "Testing searching with no query...",
                    type: "test",
                    sequence: [
                        {
                            func: "{searchWithoutQuery}.send"
                        },
                        {
                            listener: "gpii.ptd.api.search.tests.caseHolder.verifyEmptySearchResponse",
                            event: "{searchWithoutQuery}.events.onComplete",
                            args: ["{searchWithoutQuery}.nativeResponse", "{arguments}.0"]
                        }
                    ]
                },
                {
                    name: "Testing searching with a nonsense query that should not match anything...",
                    type: "test",
                    sequence: [
                        {
                            func: "{searchWithImpossibleQuery}.send"
                        },
                        {
                            listener: "gpii.ptd.api.search.tests.caseHolder.verifyImpossibleSearchResponse",
                            event: "{searchWithImpossibleQuery}.events.onComplete",
                            args: ["{searchWithImpossibleQuery}.nativeResponse", "{arguments}.0"]
                        }
                    ]
                },
                {
                    name: "Testing searching with a limited number of responses...",
                    type: "test",
                    sequence: [
                        {
                            func: "{searchWithLimit}.send"
                        },
                        {
                            listener: "gpii.ptd.api.search.tests.caseHolder.verifyLimitedResponse",
                            event: "{searchWithLimit}.events.onComplete",
                            args: ["{searchWithLimit}.nativeResponse", "{arguments}.0"]
                        }
                    ]
                },
                {
                    name: "Testing paging...",
                    type: "test",
                    sequence: [
                        {
                            func: "{firstSearchWithPaging}.send"
                        },
                        {
                            listener: "gpii.ptd.api.search.tests.caseHolder.verifyFirstPagingResponse",
                            event: "{firstSearchWithPaging}.events.onComplete",
                            args: ["{firstSearchWithPaging}", "{firstSearchWithPaging}.nativeResponse", "{arguments}.0"]
                        },
                        {
                            func: "{secondSearchWithPaging}.send"
                        },
                        {
                            listener: "gpii.ptd.api.search.tests.caseHolder.verifySecondPagingResponse",
                            event: "{secondSearchWithPaging}.events.onComplete",
                            args: ["{firstSearchWithPaging}", "{secondSearchWithPaging}.nativeResponse", "{arguments}.0"]
                        }
                    ]
                },
                {
                    name: "Testing sorting...",
                    type: "test",
                    sequence: [
                        {
                            func: "{firstSearchWithSorting}.send"
                        },
                        {
                            listener: "gpii.ptd.api.search.tests.caseHolder.verifyFirstSortingResponse",
                            event: "{firstSearchWithSorting}.events.onComplete",
                            args: ["{firstSearchWithSorting}", "{firstSearchWithSorting}.nativeResponse", "{arguments}.0"]
                        },
                        {
                            func: "{secondSearchWithSorting}.send"
                        },
                        {
                            listener: "gpii.ptd.api.search.tests.caseHolder.verifySecondSortingResponse",
                            event: "{secondSearchWithSorting}.events.onComplete",
                            args: ["{firstSearchWithSorting}", "{secondSearchWithSorting}.nativeResponse", "{arguments}.0"]
                        }
                    ]
                },
                {
                    name: "Testing field qualifiers...",
                    type: "test",
                    sequence: [
                        {
                            func: "{firstSearchWithQualifiers}.send"
                        },
                        {
                            listener: "gpii.ptd.api.search.tests.caseHolder.verifyFirstSortingResponse",
                            event: "{firstSearchWithQualifiers}.events.onComplete",
                            args: ["{firstSearchWithQualifiers}", "{firstSearchWithSorting}.nativeResponse", "{arguments}.0"]
                        },
                        {
                            func: "{secondSearchWithQualifiers}.send"
                        },
                        {
                            listener: "gpii.ptd.api.search.tests.caseHolder.verifySecondSortingResponse",
                            event: "{secondSearchWithQualifiers}.events.onComplete",
                            args: ["{firstSearchWithQualifiers}", "{secondSearchWithQualifiers}.nativeResponse", "{arguments}.0"]
                        }
                    ]
                }
            ]
        }
    ],
    components: {
        searchWithOnlyQuery: {
            type: "kettle.test.request.http",
            options: {
                path: {
                    expander: {
                        funcName: "gpii.ptd.api.tests.assembleUrl",
                        args:     ["{testEnvironment}.options.baseUrl", "/search?q=android"]
                    }
                },
                port: "{testEnvironment}.options.port",
                method: "GET"
            }
        },
        searchWithoutQuery: {
            type: "kettle.test.request.http",
            options: {
                path: {
                    expander: {
                        funcName: "gpii.ptd.api.tests.assembleUrl",
                        args:     ["{testEnvironment}.options.baseUrl", "/search"]
                    }
                },
                port: "{testEnvironment}.options.port",
                method: "GET"
            }
        },
        searchWithImpossibleQuery: {
            type: "kettle.test.request.http",
            options: {
                path: {
                    expander: {
                        funcName: "gpii.ptd.api.tests.assembleUrl",
                        args:     ["{testEnvironment}.options.baseUrl", "/search?q=flibbertygibbit"]
                    }
                },
                port: "{testEnvironment}.options.port",
                method: "GET"
            }
        },
        searchWithLimit: {
            type: "kettle.test.request.http",
            options: {
                path: {
                    expander: {
                        funcName: "gpii.ptd.api.tests.assembleUrl",
                        args:     ["{testEnvironment}.options.baseUrl", "/search?q=android&limit=5"]
                    }
                },
                port: "{testEnvironment}.options.port",
                method: "GET"
            }
        },
        firstSearchWithPaging: {
            type: "kettle.test.request.http",
            options: {
                path: {
                    expander: {
                        funcName: "gpii.ptd.api.tests.assembleUrl",
                        args:     ["{testEnvironment}.options.baseUrl", "/search?q=braille&offset=22limit=1"]
                    }
                },
                port: "{testEnvironment}.options.port",
                method: "GET"
            }
        },
        secondSearchWithPaging: {
            type: "kettle.test.request.http",
            options: {
                path: {
                    expander: {
                        funcName: "gpii.ptd.api.tests.assembleUrl",
                        args:     ["{testEnvironment}.options.baseUrl", "/search?q=braille&limit=23"]
                    }
                },
                port: "{testEnvironment}.options.port",
                method: "GET"
            }
        },
        firstSearchWithSorting: {
            type: "kettle.test.request.http",
            options: {
                path: {
                    expander: {
                        funcName: "gpii.ptd.api.tests.assembleUrl",
                        args:     ["{testEnvironment}.options.baseUrl", "/search?q=keyboard&sort=definition"]
                    }
                },
                port: "{testEnvironment}.options.port",
                method: "GET"
            }
        },
        secondSearchWithSorting: {
            type: "kettle.test.request.http",
            options: {
                path: {
                    expander: {
                        funcName: "gpii.ptd.api.tests.assembleUrl",
                        args:     ["{testEnvironment}.options.baseUrl", "/search?q=keyboard&sort=%5cdefinition"]
                    }
                },
                port: "{testEnvironment}.options.port",
                method: "GET"
            }
        },
        firstSearchWithQualifiers: {
            type: "kettle.test.request.http",
            options: {
                path: {
                    expander: {
                        funcName: "gpii.ptd.api.tests.assembleUrl",
                        args:     ["{testEnvironment}.options.baseUrl", "/search?q=computer"]
                    }
                },
                port: "{testEnvironment}.options.port",
                method: "GET"
            }
        },
        secondSearchWithQualifiers: {
            type: "kettle.test.request.http",
            options: {
                path: {
                    expander: {
                        funcName: "gpii.ptd.api.tests.assembleUrl",
                        args:     ["{testEnvironment}.options.baseUrl", "/search?q=termLabel:computer"]
                    }
                },
                port: "{testEnvironment}.options.port",
                method: "GET"
            }
        }
    }
});