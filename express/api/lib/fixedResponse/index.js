// Simple requestAware router to send an appropriate fixed response.  The options are:
//
// 1. `path`: The relative path, same as any other `gpii.express.router` instance.
// 2. `baseUrl`: The user-facing base URL for this instance (used when providing links to the schemas referenced in the response)
// 3. `statusCode`: The HTTP status code to send.
// 4. `ok`: A boolean option indicating whether this is response to a successful or failed request.  You might set this to false when creating a "404" handler.
// 5. `message`: The JSON data to send.
//
// The last two options correspond to the following format:
//
// {
//   "ok": false,
//   "message": "You must provide a uniqueId."
// }
//
// The JSON Schema for this format can be found in the `message.json` file included with this code base.  The schema
// helper used here also sends headers providing links to the schema.
//
"use strict";

var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

require("../../../schema/lib/request");
require("../../../schema/lib/schema-helper");

fluid.registerNamespace("gpii.ptd.api.lib.fixedResponse.request");

gpii.ptd.api.lib.fixedResponse.request.handleRequest = function (that) {
    that.sendSchemaAwareResponse(that.options.statusCode, "message", { ok: that.options.ok, message: that.options.message });
};

fluid.defaults("gpii.ptd.api.lib.fixedResponse.request", {
    gradeNames:     ["gpii.schema.requestAware", "autoInit"],
    listeners: {
        "onCreate.handleRequest": {
            funcName: "gpii.ptd.api.lib.fixedResponse.request.handleRequest",
            args:     ["{that}"]
        }
    }
});

fluid.registerNamespace("gpii.ptd.api.lib.fixedResponse");
fluid.defaults("gpii.ptd.api.lib.fixedResponse", {
    gradeNames:        ["gpii.express.requestAware.router", "autoInit"],
    requestAwareGrade: "gpii.ptd.api.lib.fixedResponse.request",
    dynamicComponents: {
        requestHandler: {
            options: {
                ok:         "{fixedResponse}.options.ok",
                message:    "{fixedResponse}.options.message",
                statusCode: "{fixedResponse}.options.statusCode",
                baseUrl:    "{fixedResponse}.options.baseUrl"
            }
        }
    }
});