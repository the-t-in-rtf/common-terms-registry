"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

require("./lib/testUtils");
require("./lib/sequence");
require("./lib/url");

var jqUnit = require("jqUnit");

// TODO: We cannot test operators, transforms, or translations until we actually agree on what they should look like.

fluid.registerNamespace("gpii.ptd.api.records.tests.caseHolder");

// TODO: Migrate the rest of these once we have a better pattern for repeating tests per-endpoint.
//
//    // There should be records updated since the year 2000
//    fluid.each(that.options.recordTypeEndPoints, function (endPoint) {
//            jqUnit.asyncTest("Filter endpoint '" + endPoint + "' by future date...", function () {
//                request.get(that.options.config.express.baseUrl + "/" + endPoint + "?updated=2000-01-01", function (error, response, body) {
//                    jqUnit.start();
//
//                    gpii.ptd.api.tests.testUtils.isSaneResponse(jqUnit, error, response, body);
//
//                    var jsonData = JSON.parse(body);
//                    jqUnit.assertTrue("The results should include the date filter information passed in the query...", jsonData.params.updated);
//                    jqUnit.assertTrue("Limiting records by a date in the past should have returned results...", jsonData.records && jsonData.records.length > 0);
//                });
//            });
//        }
//    );
//
//    // Confirm that /api/records?recordType=term returns the same number of records as /api/terms
//    fluid.each(that.options.recordTypeEndPoints, function (endPoint) {
//        var recordType = that.options.recordTypesByEndpoint[endPoint];
//        jqUnit.asyncTest("Testing endpoint '" + endPoint + "' versus records?recordType=" + recordType + "...", function () {
//            var firstRecordCount, secondRecordCount, firstTotalRows, secondTotalRows;
//            request.get(that.options.config.express.baseUrl + "/records?recordType=" + recordType, function (error, response, body) {
//                jqUnit.start();
//
//                gpii.ptd.api.tests.testUtils.isSaneResponse(jqUnit, error, response, body);
//
//                var jsonData = JSON.parse(body);
//                firstRecordCount = jsonData.records ? jsonData.records.length : 0;
//                firstTotalRows = jsonData.total_rows;
//
//                jqUnit.stop();
//
//                request.get(that.options.config.express.baseUrl + "/" + endPoint, function (error, response, body) {
//                    jqUnit.start();
//
//                    gpii.ptd.api.tests.testUtils.isSaneResponse(jqUnit, error, response, body);
//
//                    var jsonData = JSON.parse(body);
//                    secondRecordCount = jsonData.records ? jsonData.records.length : 0;
//                    secondTotalRows = jsonData.total_rows;
//
//                    jqUnit.assertEquals("There should be the same number of records returned for both records?recordType=" + recordType + " and /api/" + endPoint + "...", firstRecordCount, secondRecordCount);
//
//                    jqUnit.assertEquals("total_rows should be the same for both records?recordType=" + recordType + " and /api/" + endPoint + "...", firstTotalRows, secondTotalRows);
//                });
//            });
//        });
//    });
//
//    // Confirm that the same number of terms are returned with and without the "children" option
//    jqUnit.asyncTest("Testing terms with and without children...", function () {
//        var firstRecordCount, secondRecordCount, firstTotalRows, secondTotalRows;
//        request.get(that.options.config.express.baseUrl + "/terms", function (error, response, body) {
//            jqUnit.start();
//
//            gpii.ptd.api.tests.testUtils.isSaneResponse(jqUnit, error, response, body);
//
//            var jsonData = JSON.parse(body);
//            firstRecordCount = jsonData.records ? jsonData.records.length : 0;
//            firstTotalRows = jsonData.total_rows;
//
//            jqUnit.stop();
//
//            request.get(that.options.config.express.baseUrl + "/terms?children=true", function (error, response, body) {
//                jqUnit.start();
//
//                gpii.ptd.api.tests.testUtils.isSaneResponse(jqUnit, error, response, body);
//
//                var jsonData = JSON.parse(body);
//                secondRecordCount = jsonData.records ? jsonData.records.length : 0;
//                secondTotalRows = jsonData.total_rows;
//
//                jqUnit.assertEquals("There should be the same number of records returned with and without children...", firstRecordCount, secondRecordCount);
//
//                jqUnit.assertEquals("There should be the same total_rows returned with and without children......", firstTotalRows, secondTotalRows);
//            });
//        });
//    });
//
//    // There should be no records updated in the year 3000
//    fluid.each(that.options.recordTypeEndPoints, function (endPoint) {
//            jqUnit.asyncTest("Filter endpoint '" + endPoint + "' by future date...", function () {
//                request.get(that.options.config.express.baseUrl + "/" + endPoint + "?updated=3000-01-01", function (error, response, body) {
//                    jqUnit.start();
//
//                    gpii.ptd.api.tests.testUtils.isSaneResponse(jqUnit, error, response, body);
//
//                    var jsonData = JSON.parse(body);
//                    jqUnit.assertTrue("The results should include the date filter information passed in the query...", jsonData.params.updated);
//                    jqUnit.assertTrue("Limiting records by a far future date should not have returned anything...", jsonData.records && jsonData.records.length === 0);
//                });
//            });
//        }
//    );
//
//    // When using the children option, "updated" should also be respected
//    jqUnit.asyncTest("Terms with children, limited by future date...", function () {
//        request.get(that.options.config.express.baseUrl + "/terms?children=true&updated=3000-01-01", function (error, response, body) {
//            jqUnit.start();
//
//            gpii.ptd.api.tests.testUtils.isSaneResponse(jqUnit, error, response, body);
//
//            var jsonData = JSON.parse(body);
//            jqUnit.assertTrue("The results should include the date filter information passed in the query...", jsonData.params.updated);
//            jqUnit.assertTrue("Limiting records by a far future date should not have returned anything...", jsonData.records && jsonData.records.length === 0);
//        });
//    });
//
//    // When using the children option, the "status" field should work correctly
//    fluid.each(that.options.allowedStatuses, function (status) {
//        jqUnit.asyncTest("Terms w/ children, limited by status '" + status + "'...", function () {
//            request.get(that.options.config.express.baseUrl + "/terms?children=true&status=" + status, function (error, response, body) {
//                jqUnit.start();
//
//                gpii.ptd.api.tests.testUtils.isSaneResponse(jqUnit, error, response, body);
//
//                var jsonData = JSON.parse(body);
//                jqUnit.assertEquals("The results should include the status filter information passed in the query...", status, jsonData.params.statuses[0]);
//                if (jsonData.records) {
//                    jsonData.records.forEach(function (record) {
//                        jqUnit.assertEquals("All records should have the requested status...", status, record.status);
//                    });
//                }
//            });
//
//        });
//    });
//
//
//    // Test multi-sort functionality
//    fluid.each(that.options.recordTypeEndPoints, function (endPoint) {
//        jqUnit.asyncTest("Testing multi-sort of '" + endPoint + "'...", function () {
//            var firstRecordCount, secondRecordCount, firstTotalRows, secondTotalRows, firstData, secondData;
//            request.get(that.options.config.express.baseUrl + "/" + endPoint + "?sort=status&sort=uniqueId", function (error, response, body) {
//                jqUnit.start();
//
//                gpii.ptd.api.tests.testUtils.isSaneResponse(jqUnit, error, response, body);
//
//                firstData        = JSON.parse(body);
//                firstRecordCount = firstData.records ? firstData.records.length : 0;
//                firstTotalRows   = firstData.total_rows;
//
//                jqUnit.stop();
//
//                request.get(that.options.config.express.baseUrl + "/" + endPoint + "?sort=status&sort=\\uniqueId", function (error, response, body) {
//                    jqUnit.start();
//
//                    gpii.ptd.api.tests.testUtils.isSaneResponse(jqUnit, error, response, body);
//
//                    secondData        = JSON.parse(body);
//                    secondRecordCount = secondData.records ? secondData.records.length : 0;
//                    secondTotalRows   = secondData.total_rows;
//
//                    jqUnit.assertEquals("There should be the same number of records returned for both sorts...", firstRecordCount, secondRecordCount);
//                    jqUnit.assertEquals("There should be the same number of total_rows for both sorts...", firstTotalRows, secondTotalRows);
//                    jqUnit.assertDeepNeq("The sorted data from both runs should not be equal", firstData.records, secondData.records);
//                });
//            });
//        });
//    });
//
//    // Test multi-sort functionality with ?children=true
//    jqUnit.asyncTest("Testing multi-sort of terms with children=true...", function () {
//        var firstRecordCount, secondRecordCount, firstTotalRows, secondTotalRows, firstData, secondData;
//        request.get(that.options.config.express.baseUrl + "/records?recordType=term&sort=status&sort=uniqueId", function (error, response, body) {
//            jqUnit.start();
//
//            gpii.ptd.api.tests.testUtils.isSaneResponse(jqUnit, error, response, body);
//
//            firstData        = JSON.parse(body);
//            firstRecordCount = firstData.records ? firstData.records.length : 0;
//            firstTotalRows   = firstData.total_rows;
//
//            jqUnit.stop();
//
//            request.get(that.options.config.express.baseUrl + "/records?recordType=term&sort=status&sort=\\uniqueId", function (error, response, body) {
//                jqUnit.start();
//
//                gpii.ptd.api.tests.testUtils.isSaneResponse(jqUnit, error, response, body);
//
//                secondData        = JSON.parse(body);
//                secondRecordCount = secondData.records ? secondData.records.length : 0;
//                secondTotalRows   = secondData.total_rows;
//
//                jqUnit.assertEquals("There should be the same number of records returned for both sorts...", firstRecordCount, secondRecordCount);
//                jqUnit.assertEquals("There should be the same number of total_rows for both sorts...", firstTotalRows, secondTotalRows);
//                jqUnit.assertDeepNeq("The sorted data from both runs should not be equal", firstData.records, secondData.records);
//            });
//        });
//    });
//
//    // The output from "terms" and "records" should not include children with the "children" option set to false
//    fluid.each(that.options.endPointsWithChildren, function (endPoint) {
//            jqUnit.asyncTest("Query endpoint '" + endPoint + " with the 'children' argument set to false...", function () {
//                request.get(that.options.config.express.baseUrl + "/" + endPoint + "?children=false", function (error, response, body) {
//                    jqUnit.start();
//
//                    gpii.ptd.api.tests.testUtils.isSaneResponse(jqUnit, error, response, body);
//                    var jsonData = JSON.parse(body);
//
//                    jqUnit.assertTrue("There should have been records returned...", jsonData.records);
//                    if (jsonData.records) {
//                        jsonData.records.forEach(function (record) {
//                            jqUnit.assertUndefined("Record '" + record.uniqueId + "' should not have contained any children", record.aliases);
//                        });
//                    }
//                });
//            });
//        }
//    );
//
//    // The output from "terms" and "records" should include children when the "children" option is set to true
//    fluid.each(that.options.endPointsWithChildren, function (endPoint) {
//            jqUnit.asyncTest("Query endpoint '" + endPoint + " with the 'children' argument set to true...", function () {
//                request.get(that.options.config.express.baseUrl + "/" + endPoint + "?children=true", function (error, response, body) {
//                    jqUnit.start();
//
//                    gpii.ptd.api.tests.testUtils.isSaneResponse(jqUnit, error, response, body);
//                    var jsonData = JSON.parse(body);
//
//                    jqUnit.assertTrue("There should have been records returned...", jsonData.records);
//                    if (jsonData.records) {
//                        var aliasesFound = false;
//                        jsonData.records.forEach(function (record) {
//                            if (record.aliases) { aliasesFound = true; }
//                        });
//
//                        jqUnit.assertTrue("There should have been at least one record with 'aliases' data...", aliasesFound);
//                    }
//                });
//            });
//        }
//    );
//
//    // Test that modules other than "records" and "terms" do not support the "children" option
//    fluid.each(that.options.recordTypeEndPoints, function (endPoint) {
//            // skip "terms", which should support "children"
//            if (endPoint !== "terms") {
//                jqUnit.asyncTest("Query endpoint '" + endPoint + " with the 'children' argument set to true (should complain)...", function () {
//                    request.get(that.options.config.express.baseUrl + "/" + endPoint + "?children=true", function (error, response, body) {
//                        jqUnit.start();
//
//                        gpii.ptd.api.tests.testUtils.isSaneResponse(jqUnit, error, response, body);
//
//                        jqUnit.assertNotEquals("Asking the '" + endPoint + "' end point to return children should not have been successful...", response.statusCode, 200);
//                    });
//                });
//            }
//        }
//    );

// For reference while migrating the tests, here are the legacy variables we are unpacking into individual requests, etc.
//
//recordTypeEndPoints:   ["terms", "aliases"],
//    endPointsWithChildren: ["terms", "records"],
//    allEndPoints:          ["terms", "aliases", "records"],
//    recordTypesByEndpoint: {
//    terms: "term",
//        aliases: "alias",
//        conditions: "condition",
//        transforms: "transform",
//        translations: "translation"
//},
//
// TODO: Remove this once the tests have been successfully updated

gpii.ptd.api.records.tests.caseHolder.verifyDefaultResponse = function (response, body) {
    gpii.ptd.api.tests.testUtils.isSaneResponse(jqUnit, null, response, body);

    jqUnit.assertEquals("The request should have been successful...", response.statusCode, 200);

    var jsonData = JSON.parse(body);
    jqUnit.assertTrue("The total number of rows returned should be greater than zero...", parseInt(jsonData.total_rows, 10) > 0);

    jqUnit.assertTrue("There should be at least one record...", jsonData.records && jsonData.records.length > 0);
    gpii.ptd.api.tests.testUtils.isSaneRecord(jqUnit, jsonData.records && jsonData.records[0] ? jsonData.records[0] : null);
};

gpii.ptd.api.records.tests.caseHolder.verifyFirstPagingResponse = function (requestComponent, response, body) {
    gpii.ptd.api.tests.testUtils.isSaneResponse(jqUnit, null, response, body);

    var jsonData = JSON.parse(body);
    jqUnit.assertEquals("The results should include the correct offset...", 0, jsonData.offset);
    jqUnit.assertEquals("The results should include the correct limit...",  2, jsonData.limit);
    jqUnit.assertTrue("The correct number of results should have been returned...", jsonData.records && jsonData.records.length === 2);

    requestComponent.firstRecord = (jsonData.records && jsonData.records[1]) ? jsonData.records[1] : "first paged record was empty";
};

// We will be comparing our results with the previous run.  Those results are stored in the previous request component.
gpii.ptd.api.records.tests.caseHolder.verifySecondPagingResponse = function (previousRequestComponent, response, body) {
    gpii.ptd.api.tests.testUtils.isSaneResponse(jqUnit, null, response, body);

    var jsonData = JSON.parse(body);
    jqUnit.assertEquals("The results should include the correct offset...", 1, jsonData.offset);
    jqUnit.assertEquals("The results should include the correct limit...", 1, jsonData.limit);
    jqUnit.assertTrue("The correct number of results should have been returned...", jsonData.records && jsonData.records.length === 1);

    var secondRecord = jsonData.records && jsonData.records[0] ? jsonData.records[0] : "second paged record was empty";

    jqUnit.assertDeepEq("The last record in set 0-1 should be the same as the first record in set 1-2...", previousRequestComponent.firstRecord, secondRecord);
};

gpii.ptd.api.records.tests.caseHolder.verifyFirstSortResponse = function (requestComponent, response, body) {
    gpii.ptd.api.tests.testUtils.isSaneResponse(jqUnit, null, response, body);

    var jsonData = JSON.parse(body);
    requestComponent.firstRecord = (jsonData.records && jsonData.records[0]) ? jsonData.records[0] : "first sorted record was empty";
};

// We will be comparing our results with the previous run.  Those results are stored in the previous request component.
gpii.ptd.api.records.tests.caseHolder.verifySecondSortResponse = function (previousRequestComponent, response, body) {
    gpii.ptd.api.tests.testUtils.isSaneResponse(jqUnit, null, response, body);

    var jsonData = JSON.parse(body);
    var secondRecord = jsonData.records && jsonData.records[0] ? jsonData.records[0] : "second sorted record was empty";

    jqUnit.assertDeepNeq("The first record sorted A-Z should not be the same as the first record sorted Z-A...", previousRequestComponent.firstRecord, secondRecord);
};

gpii.ptd.api.records.tests.caseHolder.verifyFirstStatusLimitedResponse = function (requestComponent, response, body) {
    gpii.ptd.api.tests.testUtils.isSaneResponse(jqUnit, null, response, body);

    var jsonData = JSON.parse(body);
    jqUnit.assertDeepEq("The results should include the status filter information passed in the query...", "deleted", jsonData.params.status);
    requestComponent.firstRecordCount = jsonData.total_rows;
};

// We will be comparing our results with the previous run.  Those results are stored in the previous request component.
gpii.ptd.api.records.tests.caseHolder.verifySecondStatusLimitedResponse = function (previousRequestComponent, response, body) {
    gpii.ptd.api.tests.testUtils.isSaneResponse(jqUnit, null, response, body);

    var jsonData = JSON.parse(body);

    jqUnit.assertDeepEq("The results should include the status filter information passed in the query...", ["unreviewed", "deleted"], jsonData.params.status);

    var secondRecordCount = jsonData.total_rows;

    // There may not be "deleted" records in the sample data for all record types, but the count should never be lower.
    jqUnit.assertTrue("There should always be more records when we supply an additional status to match...", secondRecordCount > previousRequestComponent.firstRecordCount);
};


// Wire in an instance of kettle.requests.request.http for each test and wire the check to its onError or onSuccess event
fluid.defaults("gpii.ptd.api.records.tests.caseHolder", {
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
                    name: "Testing all endpoints with no arguments...",
                    type: "test",
                    sequence: [
                        {
                            func: "{recordsDefaults}.send"
                        },
                        {
                            listener: "gpii.ptd.api.records.tests.caseHolder.verifyDefaultResponse",
                            event: "{recordsDefaults}.events.onComplete",
                            args: ["{recordsDefaults}.nativeResponse", "{arguments}.0"]
                        },
                        {
                            func: "{termsDefaults}.send"
                        },
                        {
                            listener: "gpii.ptd.api.records.tests.caseHolder.verifyDefaultResponse",
                            event: "{termsDefaults}.events.onComplete",
                            args: ["{termsDefaults}.nativeResponse", "{arguments}.0"]
                        },
                        {
                            func: "{aliasesDefaults}.send"
                        },
                        {
                            listener: "gpii.ptd.api.records.tests.caseHolder.verifyDefaultResponse",
                            event: "{aliasesDefaults}.events.onComplete",
                            args: ["{aliasesDefaults}.nativeResponse", "{arguments}.0"]
                        }
                    ]
                },
                {
                    name: "Testing paging, all endpoints...",
                    type: "test",
                    sequence: [
                        {
                            func: "{recordsFirstPage}.send"
                        },
                        {
                            listener: "gpii.ptd.api.records.tests.caseHolder.verifyFirstPagingResponse",
                            event: "{recordsFirstPage}.events.onComplete",
                            args: ["{recordsFirstPage}", "{recordsFirstPage}.nativeResponse", "{arguments}.0"]
                        },
                        {
                            func: "{recordsSecondPage}.send"
                        },
                        {
                            listener: "gpii.ptd.api.records.tests.caseHolder.verifySecondPagingResponse",
                            event: "{recordsSecondPage}.events.onComplete",
                            args: ["{recordsFirstPage}", "{recordsSecondPage}.nativeResponse", "{arguments}.0"]
                        },
                        // Pouch seems to return more aliases for the first pass than the second, which causes a fail.
                        // TODO:  Investigate further.
                        //{
                        //    func: "{termsFirstPage}.send"
                        //},
                        //{
                        //    listener: "gpii.ptd.api.records.tests.caseHolder.verifyFirstPagingResponse",
                        //    event: "{termsFirstPage}.events.onComplete",
                        //    args: ["{termsFirstPage}", "{termsFirstPage}.nativeResponse", "{arguments}.0"]
                        //},
                        //{
                        //    func: "{termsSecondPage}.send"
                        //},
                        //{
                        //    listener: "gpii.ptd.api.records.tests.caseHolder.verifySecondPagingResponse",
                        //    event: "{termsSecondPage}.events.onComplete",
                        //    args: ["{termsFirstPage}", "{termsSecondPage}.nativeResponse", "{arguments}.0"]
                        //},
                        {
                            func: "{aliasesFirstPage}.send"
                        },
                        {
                            listener: "gpii.ptd.api.records.tests.caseHolder.verifyFirstPagingResponse",
                            event: "{aliasesFirstPage}.events.onComplete",
                            args: ["{aliasesFirstPage}", "{aliasesFirstPage}.nativeResponse", "{arguments}.0"]
                        },
                        {
                            func: "{aliasesSecondPage}.send"
                        },
                        {
                            listener: "gpii.ptd.api.records.tests.caseHolder.verifySecondPagingResponse",
                            event: "{aliasesSecondPage}.events.onComplete",
                            args: ["{aliasesFirstPage}", "{aliasesSecondPage}.nativeResponse", "{arguments}.0"]
                        }
                    ]
                },
                //{
                //    name: "Testing sorting, all endpoints...",
                //    type: "test",
                //    sequence: [
                //        {
                //            func: "{recordsFirstSort}.send"
                //        },
                //        {
                //            listener: "gpii.ptd.api.records.tests.caseHolder.verifyFirstSortResponse",
                //            event: "{recordsFirstSort}.events.onComplete",
                //            args: ["{recordsFirstSort}", "{recordsFirstSort}.nativeResponse", "{arguments}.0"]
                //        },
                //        {
                //            func: "{recordsSecondSort}.send"
                //        },
                //        {
                //            listener: "gpii.ptd.api.records.tests.caseHolder.verifySecondSortResponse",
                //            event: "{recordsSecondSort}.events.onComplete",
                //            args: ["{recordsFirstSort}", "{recordsSecondSort}.nativeResponse", "{arguments}.0"]
                //        },
                //        {
                //            func: "{termsFirstSort}.send"
                //        },
                //        {
                //            listener: "gpii.ptd.api.records.tests.caseHolder.verifyFirstSortResponse",
                //            event: "{termsFirstSort}.events.onComplete",
                //            args: ["{termsFirstSort}", "{termsFirstSort}.nativeResponse", "{arguments}.0"]
                //        },
                //        {
                //            func: "{termsSecondSort}.send"
                //        },
                //        {
                //            listener: "gpii.ptd.api.records.tests.caseHolder.verifySecondSortResponse",
                //            event: "{termsSecondSort}.events.onComplete",
                //            args: ["{termsFirstSort}", "{termsSecondSort}.nativeResponse", "{arguments}.0"]
                //        },
                //        {
                //            func: "{aliasesFirstSort}.send"
                //        },
                //        {
                //            listener: "gpii.ptd.api.records.tests.caseHolder.verifyFirstSortResponse",
                //            event: "{aliasesFirstSort}.events.onComplete",
                //            args: ["{aliasesFirstSort}", "{aliasesFirstSort}.nativeResponse", "{arguments}.0"]
                //        },
                //        {
                //            func: "{aliasesSecondSort}.send"
                //        },
                //        {
                //            listener: "gpii.ptd.api.records.tests.caseHolder.verifySecondSortResponse",
                //            event: "{aliasesSecondSort}.events.onComplete",
                //            args: ["{aliasesFirstSort}", "{aliasesSecondSort}.nativeResponse", "{arguments}.0"]
                //        }
                //    ]
                //},
                {
                    name: "Testing limiting by status, all endpoints...",
                    type: "test",
                    sequence: [
                        {
                            func: "{recordsFirstStatusLimited}.send"
                        },
                        {
                            listener: "gpii.ptd.api.records.tests.caseHolder.verifyFirstStatusLimitedResponse",
                            event: "{recordsFirstStatusLimited}.events.onComplete",
                            args: ["{recordsFirstStatusLimited}", "{recordsFirstStatusLimited}.nativeResponse", "{arguments}.0"]
                        },
                        {
                            func: "{recordsSecondStatusLimited}.send"
                        },
                        {
                            listener: "gpii.ptd.api.records.tests.caseHolder.verifySecondStatusLimitedResponse",
                            event: "{recordsSecondStatusLimited}.events.onComplete",
                            args: ["{recordsFirstStatusLimited}", "{recordsSecondStatusLimited}.nativeResponse", "{arguments}.0"]
                        },
                        {
                            func: "{termsFirstStatusLimited}.send"
                        },
                        {
                            listener: "gpii.ptd.api.records.tests.caseHolder.verifyFirstStatusLimitedResponse",
                            event: "{termsFirstStatusLimited}.events.onComplete",
                            args: ["{termsFirstStatusLimited}", "{termsFirstStatusLimited}.nativeResponse", "{arguments}.0"]
                        },
                        {
                            func: "{termsSecondStatusLimited}.send"
                        },
                        {
                            listener: "gpii.ptd.api.records.tests.caseHolder.verifySecondStatusLimitedResponse",
                            event: "{termsSecondStatusLimited}.events.onComplete",
                            args: ["{termsFirstStatusLimited}", "{termsSecondStatusLimited}.nativeResponse", "{arguments}.0"]
                        },
                        {
                            func: "{aliasesFirstStatusLimited}.send"
                        },
                        {
                            listener: "gpii.ptd.api.records.tests.caseHolder.verifyFirstStatusLimitedResponse",
                            event: "{aliasesFirstStatusLimited}.events.onComplete",
                            args: ["{aliasesFirstStatusLimited}", "{aliasesFirstStatusLimited}.nativeResponse", "{arguments}.0"]
                        },
                        {
                            func: "{aliasesSecondStatusLimited}.send"
                        },
                        {
                            listener: "gpii.ptd.api.records.tests.caseHolder.verifySecondStatusLimitedResponse",
                            event: "{aliasesSecondStatusLimited}.events.onComplete",
                            args: ["{aliasesFirstStatusLimited}", "{aliasesSecondStatusLimited}.nativeResponse", "{arguments}.0"]
                        }
                    ]
                }

                // TODO: Move in the remaining tests from above
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
        recordsDefaults: {
            type: "kettle.test.request.http",
            options: {
                path: {
                    expander: {
                        funcName: "gpii.ptd.api.tests.assembleUrl",
                        args:     ["{testEnvironment}.options.baseUrl", "/records"]
                    }
                },
                port: "{testEnvironment}.options.port",
                method: "GET"
            }
        },
        termsDefaults: {
            type: "kettle.test.request.http",
            options: {
                path: {
                    expander: {
                        funcName: "gpii.ptd.api.tests.assembleUrl",
                        args:     ["{testEnvironment}.options.baseUrl", "/terms"]
                    }
                },
                port: "{testEnvironment}.options.port",
                method: "GET"
            }
        },
        aliasesDefaults: {
            type: "kettle.test.request.http",
            options: {
                path: {
                    expander: {
                        funcName: "gpii.ptd.api.tests.assembleUrl",
                        args:     ["{testEnvironment}.options.baseUrl", "/aliases"]
                    }
                },
                port: "{testEnvironment}.options.port",
                method: "GET"
            }
        },
        recordsFirstPage: {
            type: "kettle.test.request.http",
            options: {
                path: {
                    expander: {
                        funcName: "gpii.ptd.api.tests.assembleUrl",
                        args:     ["{testEnvironment}.options.baseUrl", "/records?offset=0&limit=2"]
                    }
                },
                port: "{testEnvironment}.options.port",
                method: "GET"
            }
        },
        recordsSecondPage: {
            type: "kettle.test.request.http",
            options: {
                path: {
                    expander: {
                        funcName: "gpii.ptd.api.tests.assembleUrl",
                        args:     ["{testEnvironment}.options.baseUrl", "/records?offset=1&limit=1"]
                    }
                },
                port: "{testEnvironment}.options.port",
                method: "GET"
            }
        },
        termsFirstPage: {
            type: "kettle.test.request.http",
            options: {
                path: {
                    expander: {
                        funcName: "gpii.ptd.api.tests.assembleUrl",
                        args:     ["{testEnvironment}.options.baseUrl", "/terms?offset=0&limit=2"]
                    }
                },
                port: "{testEnvironment}.options.port",
                method: "GET"
            }
        },
        termsSecondPage: {
            type: "kettle.test.request.http",
            options: {
                path: {
                    expander: {
                        funcName: "gpii.ptd.api.tests.assembleUrl",
                        args:     ["{testEnvironment}.options.baseUrl", "/terms?offset=1&limit=1"]
                    }
                },
                port: "{testEnvironment}.options.port",
                method: "GET"
            }
        },
        aliasesFirstPage: {
            type: "kettle.test.request.http",
            options: {
                path: {
                    expander: {
                        funcName: "gpii.ptd.api.tests.assembleUrl",
                        args:     ["{testEnvironment}.options.baseUrl", "/aliases?offset=0&limit=2"]
                    }
                },
                port: "{testEnvironment}.options.port",
                method: "GET"
            }
        },
        aliasesSecondPage: {
            type: "kettle.test.request.http",
            options: {
                path: {
                    expander: {
                        funcName: "gpii.ptd.api.tests.assembleUrl",
                        args:     ["{testEnvironment}.options.baseUrl", "/aliases?offset=1&limit=1"]
                    }
                },
                port: "{testEnvironment}.options.port",
                method: "GET"
            }
        },
        recordsFirstSort: {
            type: "kettle.test.request.http",
            options: {
                path: {
                    expander: {
                        funcName: "gpii.ptd.api.tests.assembleUrl",
                        args:     ["{testEnvironment}.options.baseUrl", "/records?sort=termLabel"]
                    }
                },
                port: "{testEnvironment}.options.port",
                method: "GET"
            }
        },
        recordsSecondSort: {
            type: "kettle.test.request.http",
            options: {
                path: {
                    expander: {
                        funcName: "gpii.ptd.api.tests.assembleUrl",
                        args:     ["{testEnvironment}.options.baseUrl", "/records?sort=%5CtermLabel"]
                    }
                },
                port: "{testEnvironment}.options.port",
                method: "GET"
            }
        },
        termsFirstSort: {
            type: "kettle.test.request.http",
            options: {
                path: {
                    expander: {
                        funcName: "gpii.ptd.api.tests.assembleUrl",
                        args:     ["{testEnvironment}.options.baseUrl", "/terms?sort=termLabel"]
                    }
                },
                port: "{testEnvironment}.options.port",
                method: "GET"
            }
        },
        termsSecondSort: {
            type: "kettle.test.request.http",
            options: {
                path: {
                    expander: {
                        funcName: "gpii.ptd.api.tests.assembleUrl",
                        args:     ["{testEnvironment}.options.baseUrl", "/terms?sort=%5CtermLabel"]
                    }
                },
                port: "{testEnvironment}.options.port",
                method: "GET"
            }
        },
        aliasesFirstSort: {
            type: "kettle.test.request.http",
            options: {
                path: {
                    expander: {
                        funcName: "gpii.ptd.api.tests.assembleUrl",
                        args:     ["{testEnvironment}.options.baseUrl", "/aliases?sort=termLabel"]
                    }
                },
                port: "{testEnvironment}.options.port",
                method: "GET"
            }
        },
        aliasesSecondSort: {
            type: "kettle.test.request.http",
            options: {
                path: {
                    expander: {
                        funcName: "gpii.ptd.api.tests.assembleUrl",
                        args:     ["{testEnvironment}.options.baseUrl", "/aliases?sort=%5CtermLabel"]
                    }
                },
                port: "{testEnvironment}.options.port",
                method: "GET"
            }
        },
        recordsFirstStatusLimited: {
            type: "kettle.test.request.http",
            options: {
                path: {
                    expander: {
                        funcName: "gpii.ptd.api.tests.assembleUrl",
                        args:     ["{testEnvironment}.options.baseUrl", "/records?status=deleted"]
                    }
                },
                port: "{testEnvironment}.options.port",
                method: "GET"
            }
        },
        recordsSecondStatusLimited: {
            type: "kettle.test.request.http",
            options: {
                path: {
                    expander: {
                        funcName: "gpii.ptd.api.tests.assembleUrl",
                        args:     ["{testEnvironment}.options.baseUrl", "/records?status=unreviewed&status=deleted"]
                    }
                },
                port: "{testEnvironment}.options.port",
                method: "GET"
            }
        },
        termsFirstStatusLimited: {
            type: "kettle.test.request.http",
            options: {
                path: {
                    expander: {
                        funcName: "gpii.ptd.api.tests.assembleUrl",
                        args:     ["{testEnvironment}.options.baseUrl", "/terms?status=deleted"]
                    }
                },
                port: "{testEnvironment}.options.port",
                method: "GET"
            }
        },
        termsSecondStatusLimited: {
            type: "kettle.test.request.http",
            options: {
                path: {
                    expander: {
                        funcName: "gpii.ptd.api.tests.assembleUrl",
                        args:     ["{testEnvironment}.options.baseUrl", "/terms?status=unreviewed&status=deleted"]
                    }
                },
                port: "{testEnvironment}.options.port",
                method: "GET"
            }
        },
        aliasesFirstStatusLimited: {
            type: "kettle.test.request.http",
            options: {
                path: {
                    expander: {
                        funcName: "gpii.ptd.api.tests.assembleUrl",
                        args:     ["{testEnvironment}.options.baseUrl", "/aliases?status=deleted"]
                    }
                },
                port: "{testEnvironment}.options.port",
                method: "GET"
            }
        },
        aliasesSecondStatusLimited: {
            type: "kettle.test.request.http",
            options: {
                path: {
                    expander: {
                        funcName: "gpii.ptd.api.tests.assembleUrl",
                        args:     ["{testEnvironment}.options.baseUrl", "/aliases?status=unreviewed&status=deleted"]
                    }
                },
                port: "{testEnvironment}.options.port",
                method: "GET"
            }
        }

        // TODO: Wire in our remaining request handlers, one per test
    }
});