// A grade that adds schema awareness to `gpii.express.requestAware`.
"use strict";
var fluid     = fluid || require("infusion");
var gpii      = fluid.registerNamespace("gpii");
fluid.registerNamespace("gpii.schema.requestAware");
require("./schema-helper");

// Add the headers used with JSON Schema to the response object and then defer to `gpii.express.requestAware.sendResponse`.
gpii.schema.requestAware.sendSchemaAwareResponse = function (that, statusCode, schemaKey, body) {
    var headers = that.helper.getSchemaHeaders(schemaKey);
    fluid.each(headers, function (value, key) {
        that.response.header(key, value);
    });
    that.sendResponse(statusCode, body);
};

fluid.defaults("gpii.schema.requestAware", {
    gradeNames: ["gpii.express.requestAware", "autoInit"],
    components: {
        // The schema validation "helper".  If you want to use a different group of schemas, you'll need to configure the options for the helper.
        // We use the defaults supplied by the helper itself.
        "helper": {
            type: "gpii.schema.helper",
            options: {
                baseUrl: "{requestAware}.options.baseUrl"
            }
        }
    },
    invokers: {
        sendSchemaAwareResponse: {
            funcName: "gpii.schema.requestAware.sendSchemaAwareResponse",
            args: ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2"]
        }
    }
});