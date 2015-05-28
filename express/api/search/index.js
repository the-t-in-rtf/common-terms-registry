"use strict";

var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");
fluid.registerNamespace("gpii.ptd.api.search");

// Bring in our helper components
require("gpii-express");
require("../lib/sorting");
require("../lib/filters");
require("../lib/paging");
require("../lib/children");
require("../lib/params");
require("../../schema/lib/request");
require("../../schema/lib/schema-helper");

var request = require("request");

fluid.registerNamespace("gpii.ptd.api.search.request");

// We cannot URI encode colons, as Lucene will not decode them. Everything else we must encode to avoid problems with bad characters.
gpii.ptd.api.search.encodeSkippingColons = function (value) {
    if (!value || typeof value !== "string") {
        return value;
    }

    var segments = value.split(":");
    var encodedSegments = segments.map(encodeURIComponent);

    return encodedSegments.join(":");
};

// Validate the parameters extracted previously.
gpii.ptd.api.search.request.validateInput = function (that) {
    // Start by validating using JSON Schema
    var errors = that.helper.validate(that.options.querySchemaName, that.results.params);
    if (errors) {
        throw (errors);
    }
};

gpii.ptd.api.search.request.handleRequest = function (that) {
    try {
        // Extract the parameters we will use throughout the process from the request.
        that.results.params = gpii.ptd.api.lib.params.extractParams(that.request.query, that.options.queryFields);

        // Make sure the user has sent us valid input
        gpii.ptd.api.search.request.validateInput(that);
    }
    catch (err) {
        that.sendSchemaAwareResponse(400, "message", { ok: false, message: err });
        return;
    }

    var queryData = gpii.ptd.api.search.request.generateLuceneQueryString(that);
    
    var requestConfig = {
        "url" :    that.options.luceneUrl,
        "qs":      queryData,
        "json":    true,
        "timeout": 10000 // In practice, we probably only need a second, but this is set high to give lucene time to respond.
    };

    request(requestConfig, that.processLuceneResponse);
};

// Add select fields to lucene's query string.  Used to reduce the number of circumstances in which we will hit the
// character limit in retrieving our full list of records.
gpii.ptd.api.search.request.generateLuceneQueryString = function (that) {
    var statusQueryString    = "";
    if (that.results.params.status) {
        if (Array.isArray(that.results.params.status)) {
            var qualifiedStatusValues = that.results.params.status.map(function (value) {
                return "status:" + value;
            });
            statusQueryString = "(" + qualifiedStatusValues.join(" OR ") + ")";
        }
        else {
            statusQueryString = "(status:" + that.results.params.status + ")";
        }
    }

    var searchQueryString = Array.isArray(that.results.params.q) ? that.results.params.q.join(" ") : that.results.params.q;

    var queryString = "(" + searchQueryString + ")";
    if (that.results.params.status) {
        queryString += " AND " + statusQueryString;
    }

    var queryData = {
        //"q":     gpii.ptd.api.search.encodeSkippingColons(queryString),
        "q":     queryString,
        "limit": 1000000 // Hard-coded limit to disable limiting by Lucene.  Required because of CTR-148
    };

    return queryData;
};

// Process the raw search results returned by Lucene and derive the list of distinct terms.
gpii.ptd.api.search.request.processLuceneResponse = function (that, error, response, body) {
    if (error) {
        var errorBody = {
            "ok": false,
            "message": error
        };

        that.sendSchemaAwareResponse("500", "message", errorBody);
        return;
    }

    var distinctUniqueIdMap = {};
    if (body && body.rows) {
        // build a list of unique term IDs, skipping duplicates.
        for (var i = 0; i < body.rows.length; i++) {
            var record = body.rows[i].fields;
            var uniqueId = record.uniqueId;

            if (record.type === "alias" || record.type === "transform") {
                uniqueId = record.aliasOf;
            }
            else if (record.type === "translation") {
                uniqueId = record.translationOf;
            }

            distinctUniqueIdMap[uniqueId] = true;
        }
    }
    var distinctUniqueIds = Object.keys(distinctUniqueIdMap);

    that.results.total_rows = distinctUniqueIds.length;
    if (distinctUniqueIds.length === 0) {
        return that.sendSchemaAwareResponse("200", "search", that.results);
    }

    var distinctKeyString = JSON.stringify(distinctUniqueIds);
    if (distinctKeyString.length > 7500) {
        return that.sendSchemaAwareResponse(500, "message", {ok: false, message: "Your query returned too many search results to display.  Please add additional search terms or filters."});
    }
    else {
        var parentRecordOptions = {
            "url" : that.options.couchUrl + "/_design/api/_view/entries",
            "qs": { keys: distinctKeyString },
            "json": true
        };

        request.get(parentRecordOptions, that.processCouchResponse);
    }
};

gpii.ptd.api.search.request.processCouchResponse = function (that, error, _, body) {
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

        var filterParams    = gpii.ptd.api.lib.params.getFilterParams(that.results.params, that.options.queryFields);
        var filteredRecords = gpii.ptd.api.lib.filter.filter(records, filterParams);

        // Update the total number of search results
        that.results.total_rows = filteredRecords.length;

        // Sort the filtered results if needed.
        if (that.results.params.sort) {
            gpii.ptd.api.lib.sorting.sort(filteredRecords, that.results.params.sort);
        }

        // Page the results
        var pagerParams  = gpii.ptd.api.search.request.getPagingParams(that);
        var pagedRecords = that.pager.pageArray(filteredRecords, pagerParams);

        // Let the "children" module look up any child records and wait for it.
        that.children.applier.change("originalRecords", pagedRecords);
    }
    else {
        // We somehow did not receive records from couch.  Pass on whatever we did receive.
        that.sendSchemaAwareResponse("500", "message", { ok: false, message: body });
    }
};

gpii.ptd.api.search.request.sendResults = function (that) {
    that.results.records = that.children.model.processedRecords;
    that.sendSchemaAwareResponse(200, "message", that.results);
};

gpii.ptd.api.search.request.checkRequirements = function (that) {
    if (!that.options.couchUrl || !that.options.luceneUrl) {
        var message = "The search API must have both a couchUrl and luceneUrl option configured.";
        that.sendSchemaAwareResponse(500, JSON.stringify({ok: false, message: message}));
        fluid.fail(message);
    }

    gpii.ptd.api.search.request.handleRequest(that);
};

// Expander function that can be used to set a variable to today's date (in ISO 9660 format).
gpii.ptd.api.search.request.setDate = function () {
    return (new Date()).toISOString();
};

gpii.ptd.api.search.request.getPagingParams = function (that) {
    return gpii.ptd.api.lib.params.getRelevantParams(that.results.params, that.options.queryFields, "pagingField");
};

fluid.defaults("gpii.ptd.api.search.request", {
    gradeNames: ["gpii.schema.requestAware", "autoInit"],
    querySchemaName:   "search-query",
    luceneUrl:         "",
    couchUrl:          "",
    children:          false,
    typesWithChildren: ["term", "record"],
    components: {
        "pager": {
            type: "gpii.ptd.api.lib.paging"
        },
        "children": {
            type: "gpii.ptd.api.lib.children",
            options: {
                couchUrl: "{request}.options.couchUrl",
                listeners: {
                    "onChildrenLoaded": {
                        funcName: "gpii.ptd.api.search.request.sendResults",
                        args: [ "{gpii.ptd.api.search.request}"]
                    }
                }
            }
        }
    },
    members: {
        results:   {
            ok:         true,
            total_rows: 0,
            params:     "{that}.params",
            records:    [],
            retrievedAt: {
                expander: {
                    funcName: "gpii.ptd.api.search.request.setDate"
                }
            }
        }
    },
    // The list of query fields we support, with hints about their defaults (if any) and their default value (if any)
    //
    // All actual query input validation is handled using a JSON schema.
    queryFields: {
        "q": {
        },
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
        "updated": {
            type:        "date",
            comparison:  "ge",  // We want records whose date is equal to or newer than the `updated` field
            filterField: true
        }
    },
    listeners: {
        "onCreate.checkRequirements": {
            funcName: "gpii.ptd.api.search.request.checkRequirements",
            args:     ["{that}"]
        }
    },
    invokers: {
        processLuceneResponse: {
            funcName: "gpii.ptd.api.search.request.processLuceneResponse",
            args:     ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2"]
        },
        processCouchResponse: {
            funcName: "gpii.ptd.api.search.request.processCouchResponse",
            args:     ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2"]
        }
    }
});

fluid.defaults("gpii.ptd.api.search", {
    gradeNames:        ["gpii.express.requestAware.router", "autoInit"],
    path:              "/search",
    maxKeyData:        7500,
    requestAwareGrade: "gpii.ptd.api.search.request",
    dynamicComponents: {
        requestHandler: {
            options: {
                maxKeyData:      "{search}.options.maxKeyData",
                querySchemaName: "{search}.options.querySchemaName",
                couchUrl:        "{search}.options.couchUrl",
                luceneUrl:       "{search}.options.luceneUrl",
                baseUrl:         "{search}.options.baseUrl"
            }
        }
    }
});