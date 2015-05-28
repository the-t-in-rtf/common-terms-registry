// Utility functions for common sanity checks in unit tests
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");
fluid.registerNamespace("gpii.ptd.api.tests.testUtils");

require("../../../../schema/lib/schema-helper");
var helper = gpii.schema.helper();

gpii.ptd.api.tests.testUtils.isSaneRecord = function isSaneRecord(jqUnit, record) {
    jqUnit.assertNotNull("Record should not be null...", record);

    if (record) {
        jqUnit.assertNotNull("Record type should not be null...", record.type);

        if (record.type) {
            // TODO:  We cannot screen these out until PouchDB (our test db) properly supports the require function.
            // See: https://github.com/pouchdb/pouchdb/issues/973
//                jqUnit.assertNull("There should not be an '_id' parameter returned as part of our records...",record._id);
//                jqUnit.assertNull("There should not be a '_rev' parameter returned as part of our records...",record._rev);

            var errors = helper.validate(record.type, record);
            jqUnit.assertUndefined("There should not be any validation errors:" + JSON.stringify(errors), errors);
        }
    }
};

gpii.ptd.api.tests.testUtils.isSaneResponse = function isSaneResponse(jqUnit, error, response, body) {
    jqUnit.assertNull("No errors should be returned...", error);
    jqUnit.assertNotNull("A response should be returned...", response);
    jqUnit.assertNotNull("The request should include a return code...", response.statusCode);
    jqUnit.assertNotNull("A body should be returned...", body);

    // Additions in support of associating JSON Schemas with all results
    var contentTypeHeader = response.headers["content-type"];
    jqUnit.assertNotNull("A response should have a 'Content-Type' header...", contentTypeHeader);
    if (contentTypeHeader) {
        jqUnit.assertTrue("The 'Content-Type' header should contain a 'profile' link...", contentTypeHeader.indexOf("profile") !== -1);
        jqUnit.assertTrue("The 'Content-Type' header should follow the 'type+json' pattern...", contentTypeHeader.indexOf("+json") !== -1);
    }

    var linkHeader = response.headers.link;
    jqUnit.assertNotNull("A response should have a 'Link' header...", linkHeader);
    if (linkHeader) {
        jqUnit.assertTrue("The 'Link' header should contain a URL...", linkHeader.indexOf("http") !== -1);
        jqUnit.assertTrue("The 'Link' header should indicate that the link describes the record format...", linkHeader.indexOf("describedBy") !== -1);
    }

    var jsonData = JSON.parse(body);
    jqUnit.assertNotNull("The 'ok' variable should always be set...", jsonData.ok);
};

// A Convenience shim for tests that still require this library.  Their configuration options will be ignored, as they never differed anyway.
// TODO:  Review and remove this once all legacy code is converted to Fluid components and namespaced libraries.
module.exports = function () {
    return gpii.ptd.api.tests.testUtils;
};


