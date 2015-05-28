// TODO:  These tests will not work until they are refactored to use the new helper library at a minimum.
// tests for all write methods
"use strict";
var fluid = require("infusion");
var namespace = "gpii.ctr.record.tests.write";
var write = fluid.registerNamespace(namespace);

write.loader = require("../../../configs/lib/config-loader");
write.config = write.loader.loadConfig(require("../../../configs/express/test-pouch.json"));

// TODO:  When we add support for versioning, we should disable it for these tests and test the version code separately

// TODO:  When we add support for attribution, we should test it

write.testUtils = require(".././testUtils")(write.config);
write.request = require("request");

write.validRecord = require("../../tests/data/valid");
write.invalidRecord = require("../../tests/data/invalid");

write.loadPouch = function() {
    write.pouch = require('.././pouch')(write.config);

    write.pouch.start(function() {
        write.startExpress();
    });
};

// We reuse a lot of sample data without clearing out our data.  We reset the uniqueId to avoid updating records when we mean to add new ones.
write.anonymizeId = function(record) {
    var newRecord = JSON.parse(JSON.stringify(record));

    var newId = "";
    for (var a = 0; a < 12; a++) { newId += String.fromCharCode(Math.round(97 + Math.random() * 25)); }
    newRecord.uniqueId=newId;

    return newRecord;
};

write.checkFields = function(original, saved, jqUnit) {
    Object.keys(saved).forEach(function(field){
        var excludedFields = ["updated","_id","_rev"];
        if (excludedFields.indexOf(field) === -1) {
            jqUnit.assertEquals("The field '" + field + "' should match what we submitted.", original[field], saved[field]);
        }
    });
};

// Spin up an express instance
write.startExpress = function() {
    write.express = require('.././express')(write.config);

    write.express.start(function() {
        // Mount all variations on the module
        var record = require('../../record')(write.config);
        write.express.app.use('/record', record);

        // Load the user management library so we can test permissions, etc.
        var couchUser = require('express-user-couchdb');

        var bodyParser = require('body-parser');
        var router = write.express.express.Router();
        router.use(bodyParser.json());
        router.use(couchUser(write.config));
        write.express.app.use(router);

        write.runTests();
    });
};

write.runTests = function() {
    console.log("Running tests...");

    var jqUnit = require("jqUnit");
    jqUnit.module("Record API (write)");

    jqUnit.asyncTest("Use PUT to create a new record (not logged in)", function() {
        var options = {
            "url": "http://localhost:" + write.config.port + "/record/",
            "json": write.anonymizeId(write.validRecord)
        };

        var request = require("request");
        request.put(options, function(e,r,b) {
            jqUnit.start();

            jqUnit.assertEquals("The response should indicate that a login is required.", 401, r.statusCode);
            jqUnit.assertFalse("The response should not be 'ok'", b.ok);

            jqUnit.assertNull("There should not be a record returned.", b.record);
        });
    });

    jqUnit.asyncTest("Use PUT to create a new record (logged in)", function() {
        var request = require("request");
        write.jar = request.jar();
        request.defaults({"jar":write.jar});

        var loginOptions = {
            "url": "http://localhost:" + write.config.port + "/api/user/signin",
            "json": { "name": "admin", "password": "admin"},
            "jar": write.jar
        };
        request.post(loginOptions,function(e,r,b){
            jqUnit.start();
            jqUnit.assertNull("There should be no login errors returned",e);
            jqUnit.assertTrue("The login should have been successful.", b.ok);
            jqUnit.stop();

            var newRecord = write.anonymizeId(write.validRecord);
            var options = {
                "url": "http://localhost:" + write.config.port + "/record/",
                "json": newRecord,
                "jar":  write.jar
            };
            request.put(options, function(e,r,b) {
                jqUnit.start();
                jqUnit.assertNull("There should be no raw errors returned", e);
                jqUnit.assertNull("There should be no validation errors returned", b.errors);
                jqUnit.stop();

                // Make sure the record was actually created
                request.get("http://localhost:" + write.express.app.get('port') + "/record/" + newRecord.uniqueId,function(e,r,b) {
                    jqUnit.start();
                    jqUnit.assertNull("There should be no errors returned",e);

                    var jsonData = JSON.parse(b);
                    jqUnit.assertValue("There should be a record returned (" + JSON.stringify(b) + ").", jsonData.record);

                    if (jsonData.record && jsonData.record !== undefined) {
                        write.checkFields(newRecord, jsonData.record, jqUnit);
                    }
                    jqUnit.stop();

                    var logoutOptions = {
                        "url": "http://localhost:" + write.config.port + "/api/user/signout",
                        "jar": write.jar
                    };
                    request.post(logoutOptions,function(e,r,b) {
                        jqUnit.start();
                        jqUnit.assertNull("There should be no logout errors returned",e);
                    });
                });
            });
        });
    });

    jqUnit.asyncTest("Use PUT to update an existing record (logged in)", function() {

        var originalRecord = JSON.parse(JSON.stringify(write.validRecord));
        originalRecord.uniqueId = "updateTest";

        var updatedRecord = JSON.parse(JSON.stringify(originalRecord));
        updatedRecord.definition="This has been updated";

        var createOptions = {
            "url": "http://localhost:" + write.config.port + "/record/",
            "json": originalRecord
        };

        var loginRequest = require("request");
        var loginOptions = {
            "url": "http://localhost:" + write.config.port + "/api/user/signin",
            "json": { "name": "admin", "password": "admin"}
        };
        loginRequest.post(loginOptions,function(e,r,b){
            jqUnit.start();
            jqUnit.assertNull("There should be no login errors returned",e);
            jqUnit.assertTrue("The login should have been successful.", b.ok);
            jqUnit.stop();

            var request = require("request");
            request.put(createOptions, function(e,r,b) {
                jqUnit.start();
                jqUnit.assertNull("There should be no raw errors returned", e);
                jqUnit.assertNull("There should be no validation errors returned", b.errors);
                jqUnit.stop();

                var updateOptions = {
                    "url": "http://localhost:" + write.config.port + "/record/",
                    "json": updatedRecord
                };
                // PUT the update
                request.put(updateOptions, function(e,r,b) {
                    jqUnit.start();
                    jqUnit.assertNull("There should be no errors returned",e);
                    jqUnit.stop();

                    // Check the results
                    request.get("http://localhost:" + write.express.app.get('port') + "/record/" + originalRecord.uniqueId, function(e,r,b) {
                        jqUnit.start();
                        jqUnit.assertNull("There should be no errors returned",e);

                        var jsonData = JSON.parse(b);

                        jqUnit.assertNotNull("There should be a record returned.", jsonData.record);

                        if (jsonData.record && jsonData.record !== undefined) {
                            write.checkFields(updatedRecord, jsonData.record, jqUnit);
                        }
                        jqUnit.stop();

                        var logoutRequest = require("request");
                        var logoutOptions = {
                            "url": "http://localhost:" + write.config.port + "/api/user/signout"
                        };
                        logoutRequest.post(logoutOptions,function(e,r,b) {
                            jqUnit.start();
                            jqUnit.assertNull("There should be no logout errors returned",e);
                        });
                    });
                });
            });
        });
    });

    jqUnit.asyncTest("Use PUT to try and add an invalid record", function() {
        var request = require("request");
        write.jar = request.jar();
        request.defaults({"jar":write.jar});

        var loginOptions = {
            "url": "http://localhost:" + write.config.port + "/api/user/signin",
            "json": { "name": "admin", "password": "admin"},
            "jar": write.jar
        };
        request.post(loginOptions,function(e,r,b){
            jqUnit.start();
            jqUnit.assertNull("There should be no login errors returned",e);
            jqUnit.assertTrue("The login should have been successful.", b.ok);
            jqUnit.stop();

            var options = {
                "url": "http://localhost:" + write.config.port + "/record/",
                "json": write.anonymizeId(write.invalidRecord),
                "jar": write.jar
            };

            var request = require("request");
            request.put(options, function(e,r,b) {
                debugger;
                jqUnit.start();

                jqUnit.assertNull("There should be no errors returned",e);

                jqUnit.assertFalse("The response should not be 'OK'.", b.ok);
                jqUnit.assertValue("There should be validation errors (" + JSON.stringify(b) + ").", b.errors);

                jqUnit.stop();

                // Make sure the record was not actually created
                request.get("http://localhost:" + write.express.app.get('port') + "/record/" + write.invalidRecord.uniqueId,function(e,r,b) {
                    jqUnit.start();
                    jqUnit.assertNull("There should be no errors returned",e);

                    var jsonData = JSON.parse(b);

                    jqUnit.assertTrue("There should be no record returned.", jsonData.record === null || jsonData.record === undefined || jsonData.record === {});
                });
            });
        });
    });

    jqUnit.asyncTest("Use POST to try amd create a new record without logging in...", function() {
        var options = {
            "url": "http://localhost:" + write.config.port + "/record/",
            "json": write.anonymizeId(write.validRecord)
        };

        var request = require("request");
        request.post(options, function(e,r,b) {
            jqUnit.start();

            jqUnit.assertEquals("The response should indicate that a login is required.", 401, r.statusCode);
            jqUnit.assertFalse("The response should not be 'ok'", b.ok);
        });
    });

    jqUnit.asyncTest("Use POST to create a new record (logged in)", function() {
        var request = require("request");
        write.jar = request.jar();
        request.defaults({"jar":write.jar});
        var loginOptions = {
            "url":  "http://localhost:" + write.config.port + "/api/user/signin",
            "json": { "name": "admin", "password": "admin"},
            "jar":  write.jar
        };
        request.post(loginOptions,function(e,r,b){
            jqUnit.start();
            jqUnit.assertNull("There should be no login errors returned",e);
            jqUnit.assertTrue("The login should have been successful.", b.ok);
            jqUnit.stop();

            var newRecord = write.anonymizeId(write.validRecord);
            var options = {
                "url":  "http://localhost:" + write.config.port + "/record/",
                "json": newRecord,
                "jar":  write.jar
            };
            request.post(options, function(e,r,b) {
                jqUnit.start();
                jqUnit.assertNull("There should be no raw errors returned",e);
                jqUnit.assertNull("There should be no validation errors (" + JSON.stringify(b.errors) + ").", b.errors);
                jqUnit.stop();

                // Make sure the record was actually created
                request.get("http://localhost:" + write.config.port + "/record/" + newRecord.uniqueId ,function(e,r,b) {
                    jqUnit.start();
                    jqUnit.assertNull("There should be no raw errors returned", e);
                    jqUnit.assertNull("There should be no validation errors returned (" + JSON.stringify(b.errors) + ").", b.errors);

                    var jsonData = JSON.parse(b);

                    jqUnit.assertValue("There should be a record returned (" + b + ")", jsonData.record);

                    if (jsonData.record && jsonData.record !== undefined) {
                        write.checkFields(newRecord, jsonData.record, jqUnit);
                    }

                    jqUnit.stop();

                    var logoutRequest = require("request");
                    var logoutOptions = {
                        "url": "http://localhost:" + write.config.port + "/api/user/signout"
                    };
                    logoutRequest.post(logoutOptions,function(e,r,b) {
                        jqUnit.start();
                        jqUnit.assertNull("There should be no logout errors returned",e);
                    });
                });
            });
        });
    });

    jqUnit.asyncTest("Use POST to try and add an invalid record", function() {
        var request = require("request");
        write.jar = request.jar();
        request.defaults({"jar":write.jar});
        var loginOptions = {
            "url": "http://localhost:" + write.config.port + "/api/user/signin",
            "json": { "name": "admin", "password": "admin"},
            "jar": write.jar
        };
        request.post(loginOptions,function(e,r,b){
            jqUnit.start();
            jqUnit.assertNull("There should be no login errors returned",e);
            jqUnit.assertTrue("The login should have been successful.", b.ok);
            jqUnit.stop();

            var newRecord = write.anonymizeId(write.invalidRecord);
            var options = {
                "url": "http://localhost:" + write.config.port + "/record/",
                "json": newRecord,
                "jar":  write.jar
            };

            request.post(options, function(e,r,b) {
                jqUnit.start();

                jqUnit.assertNull("There should be no raw errors", e);

                jqUnit.assertFalse("The response should not be 'OK'...", b.ok);
                jqUnit.assertValue("There should be validation errors (" + JSON.stringify(b) + ").", b.errors);

                jqUnit.stop();

                // Make sure the record was not actually created
                request.get("http://localhost:" + write.config.port + "/record/" + newRecord.uniqueId,function(e,r,b) {
                    jqUnit.start();
                    jqUnit.assertNull("There should be no raw errors returned", e);
                    jqUnit.assertNull("There should be no validation errors returned", b.errors);

                    var jsonData = JSON.parse(b);

                    jqUnit.assertTrue("There should be no record returned.", jsonData.record === null || jsonData.record === undefined || jsonData.record === {});
                });
            });
        });
    });

    jqUnit.asyncTest("Use DELETE to try and remove a new record without logging in...", function() {
        // This is hard-coded to a single existing record included in the data set.
        var options = {
            "url": "http://localhost:" + write.config.port + "/record/preferredWrittenLanguage",
            "json": write.anonymizeId(write.validRecord)
        };

        var request = require("request");
        request.del(options, function(e,r,b) {
            jqUnit.start();

            jqUnit.assertEquals("The response should indicate that a login is required (" + b + ").", 401, r.statusCode);
            jqUnit.assertFalse("The response should not be 'ok'", b.ok);
        });
    });

    jqUnit.asyncTest("Use DELETE to remove a record (logged in)...", function() {
        var request = require("request");
        write.jar = request.jar();
        request.defaults({"jar":write.jar});
        var loginOptions = {
            "url": "http://localhost:" + write.config.port + "/api/user/signin",
            "json": { "name": "admin", "password": "admin"},
            "jar": write.jar
        };
        request.post(loginOptions,function(e,r,b){
            jqUnit.start();
            jqUnit.assertNull("There should be no login errors returned",e);
            jqUnit.assertTrue("The login should have been successful.", b.ok);
            jqUnit.stop();

            var options = {
                "url": "http://localhost:" + write.config.port + "/record/preferredWrittenLanguage",
                "jar":  write.jar
            };

            request.del(options, function(e,r,b) {
                var jsonData = JSON.parse(b);
                jqUnit.start();

                jqUnit.assertNull("There should be no raw errors", e);
                jqUnit.assertTrue("The response should be 'OK' (" + b + ")...", jsonData.ok);
                jqUnit.assertUndefined("There should be no validation errors (" + b + ").", jsonData.errors);
                jqUnit.stop();

                // Make sure the record was actually removed
                request.get("http://localhost:" + write.config.port + "/record/preferredWrittenLanguage", function(e,r,b) {
                    jqUnit.start();
                    jqUnit.assertNull("There should be no raw errors returned", e);
                    jqUnit.assertNull("There should be no validation errors returned", b.errors);

                    var jsonData = JSON.parse(b);

                    jqUnit.assertTrue("There should be no record returned.", jsonData.record === null || jsonData.record === undefined || jsonData.record === {});
                });
            });
        });
    });

    // TODO:  Test versioning on all successful adds and updates
};

write.loadPouch();
