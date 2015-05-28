"use strict";

var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");
fluid.registerNamespace("gpii.ptd.api.records");

// Bring in our helper components
require("gpii-express");
require("../lib/sorting");
require("../lib/filters");
require("../lib/paging");
require("../lib/children");
require("../lib/params");
require("../../schema/lib/request");
require("../../schema/lib/schema-helper");

var request  = require("request");

fluid.registerNamespace("gpii.ptd.api.records.request");
gpii.ptd.api.records.request.checkRequirements = function (that) {
    if (!that.options.couchUrl) {
        fluid.fail("you must set a couchUrl option in order to use this component.");
    }
    if (!that.options.type) {
        fluid.fail("You must set a type in your options in order to use this component.");
    }
    if (!that.options.viewPath) {
        fluid.fail("You must set a viewPath in your options in order to use this component.");
    }
    if (that.options.viewPath[that.options.type] === -1) {
        fluid.fail("You must register a couch view for a new record type.  Can't continue.");
    }
    if (!that.options.querySchemaName) {
        fluid.fail("You must configure a schema name to be used for input validation.");
    }

    gpii.ptd.api.records.request.handleRequest(that);
};

// Use the standard `params` functions to convert `req.params` into data that can be validated, and that includes any
// default values not overridden by the query data.
gpii.ptd.api.records.request.extractParams = function (that, req) {
    // Use the standard `params` function to do most of the heavy lifting.
    that.params = gpii.ptd.api.lib.params.extractParams(req.query, that.options.queryFields);

    // If we are asked to provide "children", we have to override whatever record types we were passed and make sure we are dealing with "term" records.
    if (that.params.children) {
        that.params.type = "term";
    }
};

// Validate the parameters extracted previously.
gpii.ptd.api.records.request.validateInput = function (that) {
    // Start by validating using JSON Schema
    var errors = that.helper.validate(that.options.querySchemaName, that.params);
    if (errors) {
        throw (errors);
    }

    // Additional rules based on logic that's too complex for JSON Schema
    if (that.options.type !== "record" && that.params.type && that.params.type !== that.options.type) {
        throw ("Cannot use the 'type' parameter with this interface.");
    }

    if (that.params.children && that.options.typesWithChildren.indexOf(that.options.type) === -1) {
        throw ("Cannot use the 'children' parameter with anything but terms.");
    }
};

gpii.ptd.api.records.request.handleRequest = function (that) {
    try {
        // Extract the parameters we will use throughout the process from the request.
        gpii.ptd.api.records.request.extractParams(that, that.request);

        // Make sure the user has sent us valid input
        gpii.ptd.api.records.request.validateInput(that);
    }
    catch (err) {
        that.sendSchemaAwareResponse(400, "message", { ok: false, message: err });
        return;
    }

    // We prepend a ./ to the second half of the URL to ensure that the database name is not stripped out.
    var couchRequestUrl = that.options.couchUrl + that.options.viewPath[that.options.type];

    var requestConfig = {
        url:     couchRequestUrl,
        //data:    that.params,
        json:    true,
        timeout: 10000 // In practice, we probably only need a second, but the defaults are definitely too low.
    };

    request(requestConfig, that.processCouchResponse);
};

// Convert the couch data to our local format and continue processing, either by looking up children, or by sending the
// results to the end user.
gpii.ptd.api.records.request.processCouchResponse = function (that, error, _, body) {
    if (error) {
        var errorBody = {
            "ok": false,
            "message": error
        };

        that.sendSchemaAwareResponse("500", "message", errorBody);
        return;
    }

    if (body.rows) {
        // Couch includes a `docs` field in its response, and each field hides its data in a `value` field.  This line flattens that out.
        var records = body.rows.map(function (doc) {
            return doc.value;
        });

        var filterParams    = gpii.ptd.api.lib.params.getFilterParams(that.params, that.options.queryFields);
        var filteredRecords = gpii.ptd.api.lib.filter.filter(records, filterParams);

        // Now that we have retrieved the main payload and filtered it, we can save the total number of rows.
        that.total_rows = filteredRecords.length;

        // Sort the filtered results if needed.
        if (that.params.sort) {
            gpii.ptd.api.lib.sorting.sort(filteredRecords, that.params.sort);
        }

        // Page the results
        var pagerParams  = gpii.ptd.api.records.request.getPagingParams(that);
        var pagedRecords = that.pager.pageArray(filteredRecords, pagerParams);

        // Only lookup children if we are configured to work with them, and if we have "parent" records to start with.
        if (that.params.children && pagedRecords.length > 0) {
            // Wait for the `children` component to get the child records and then process the results (see listener below).
            that.children.applier.change("originalRecords", pagedRecords);
        }
        else {
            gpii.ptd.api.records.request.sendRecords(that, pagedRecords);
        }
    }
    else {
        // We somehow did not receive records from couch.  Pass on whatever we did receive.
        that.sendSchemaAwareResponse("500", "message", { ok: false, message: body });
    }
};

gpii.ptd.api.records.request.getPagingParams = function (that) {
    return gpii.ptd.api.lib.params.getRelevantParams(that.params, that.options.queryFields, "pagingField");
};

gpii.ptd.api.records.request.sendRecords = function (that, records) {
    var responseBody = {
        "ok":          true,
        "total_rows" : that.total_rows,
        "records":     records,
        "offset":      that.params.offset,
        "limit":       that.params.limit,
        "params":      that.params,
        "retrievedAt": new Date()
    };

    that.sendSchemaAwareResponse(200, "message", responseBody);
};

fluid.defaults("gpii.ptd.api.records.request", {
    gradeNames: ["gpii.schema.requestAware", "autoInit"],
    querySchemaName:   "records-query",
    couchUrl:          "",
    type:              "record",
    children:          false,
    typesWithChildren: ["term", "record"],
    components: {
        // The schema validation "helper".  If you want to use a different group of schemas, you'll need to configure the options for the helper.
        // We use the defaults supplied by the helper itself.
        "helper": {
            type: "gpii.schema.helper",
            options: {
                baseUrl: "{request}.options.baseUrl"
            }
        },
        "pager": {
            type: "gpii.ptd.api.lib.paging"
        },
        "children": {
            type: "gpii.ptd.api.lib.children",
            options: {
                couchUrl: "{request}.options.couchUrl",
                listeners: {
                    "onChildrenLoaded": {
                        funcName: "gpii.ptd.api.records.request.sendRecords",
                        args: [ "{gpii.ptd.api.records.request}", "{children}.model.processedRecords" ]
                    }
                }
            }
        }
    },
    members: {
        params:     {},
        total_rows: 0
    },
    // The list of query fields we support, with hints about their defaults (if any) and their default value (if any)
    //
    // All actual query input validation is handled using a JSON schema.
    queryFields: {
        "sort": {
            sortingField: true
        },
        "offset": {
            type:         "number",
            pagingField:  true,
            defaultValue: 0
        },
        "limit": {
            type:         "number",
            pagingField:  true,
            defaultValue: 25
        },
        "status": {
            filterField:  true,
            forceLower:   true,
            defaultValue: ["unreviewed", "draft", "candidate", "active"]
        },
        "children": {
            type:         "boolean",
            defaultValue: "{that}.options.children"
        },
        "updated": {
            type:        "date",
            comparison:  "ge",  // We want records whose date is equal to or newer than the `updated` field
            filterField: true
        },
        "type": {
            filterField: true,
            forceLower:  true
        }
    },
    viewPath: {
        alias:       "/_design/api/_view/aliases",
        condition:   "/_design/api/_view/conditions",
        record:      "/_design/api/_view/entries",
        term:        "/_design/api/_view/terms",
        transform:   "/_design/api/_view/transforms",
        translation: "/_design/api/_view/translations"
    },
    listeners: {
        "onCreate.checkRequirements": {
            funcName: "gpii.ptd.api.records.request.checkRequirements",
            args:     ["{that}"]
        }
    },
    invokers: {
        processCouchResponse: {
            funcName: "gpii.ptd.api.records.request.processCouchResponse",
            args:     ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2"]
        }
    }
});

fluid.defaults("gpii.ptd.api.records", {
    gradeNames:        ["gpii.express.requestAware.router", "autoInit"],
    path:              "/records",
    requestAwareGrade: "gpii.ptd.api.records.request",
    dynamicComponents: {
        requestHandler: {
            options: {
                querySchemaName: "{records}.options.querySchemaName",
                couchUrl:        "{records}.options.couchUrl",
                type:            "{records}.options.type",
                children:        "{records}.options.children",
                baseUrl:         "{records}.options.baseUrl"
            }
        }
    }
});

// A transitional "shim" to allow the previous CommonJS style of requiring this module.
// We return our "router" function, which the next level up will wire in using its own logic.
// TODO:  Remove this once the next level up ("api") has been refactored to use only Fluid components.
module.exports = function (config) {
    // We need to explicitly override the configuration that is ordinarily distributed by `gpii.express`.
    // TODO:  Make sure we fall back to the default behavior correctly once we are using `gpii.express` upstream.
    var records = gpii.ptd.api.records({
        type: (config && config.recordType) ? config.recordType : "record",
        children: (config && config.recordType === "term") ? true : false,
        modules: {
            expressConfigHolder: {
                type: ["gpii.express.expressConfigHolder"],
                options: {
                    config: config
                }
            }
        },
        // TODO:  Why can't we pick these up from the config holder?  Review with Antranig.
        couchUrl: config["couch.url"],
        baseUrl:  config["base.url"]
    });
    return records.getRouter();
};

