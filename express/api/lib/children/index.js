// Component to retrieve the list of children associated with an existing list of parent IDs
//
// This component only adds children to an existing list of "parents".  It does not page them,
// and will throw an error if you give it more data than it can work with.
//
// If the component has child data when it's created, it will go ahead and load the child data.  If data is added later, it will refresh its processed data.
//
// When the "children" have been added, it will apply a change to `model.processedRecords` and fire an `onChildrenLoaded` event.
//
// TODO:  When we do the same thing for the Unified Listing, consider extracting the common bits and using fluid.transform + rules to handle whatever results we receive.
//
// TODO:  We may eventually want to add support for filtering children by status.  If so, flesh out ../filters/index.js
"use strict";

var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");
fluid.registerNamespace("gpii.ptd.api.lib.children");

gpii.ptd.api.lib.children.filterToMatchingTerms = function (that, record) {
    return record.type === "term" && record.uniqueId;
};

// Pull out just the uniqueIds from a full map
gpii.ptd.api.lib.children.extractUniqueIds = function (record) {
    return record.uniqueId;
};

gpii.ptd.api.lib.children.requestChildren = function (that) {
    if (Array.isArray(that.model.originalRecords) && that.model.originalRecords.length > 0) {
        // Go through the list of parent records, we will process any that are "term" records
        var parentIds = that.model.originalRecords.filter(that.filterToMatchingTerms).map(gpii.ptd.api.lib.children.extractUniqueIds);

        if (parentIds.length === 0) {
            fluid.log("None of the records in question is eligible to be a parent, so we will continue without requesting any child data.");
            that.applier.change("processedRecords", []);
            that.events.onChildrenLoaded.fire(that);
        }
        else {
            // Request the list of children for the relevant records
            var keyString = JSON.stringify(parentIds);
            var qs = {};
            qs.keys = keyString;

            if (keyString.length > that.options.maxKeyData) {
                fluid.fail("Too much key data, cannot retrieve children.");
            }

            // This variable must be created per run, otherwise the second request will clobber the first.
            var request = require("request");

            // retrieve the child records via /tr/_design/api/_view/children?keys=
            var childRecordOptions = {
                "method":  "GET",
                "url" :    that.options.couchUrl + that.options.viewPath,
                "qs":      qs,
                "json":    true
                //,
                //"timeout": 5000 // In practice, we probably only need a second, but the defaults are definitely too low.
            };

            request(childRecordOptions, that.addChildRecords);
        }
    }
    // If we have no model data, pass it along and stop processing.
    else {
        // We apply a change for those who are listening to our model
        that.applier.change("processedRecords", that.model.originalRecords);

        // We also fire an event if someone wants to work with that instead.
        that.events.onChildrenLoaded.fire(that);
    }
};

gpii.ptd.api.lib.children.addChildRecords = function (that, error, response, body) {
    if (error) { fluid.fail(error); }

    var parentsWithChildren = [];
    var childData = {};

    // We should not be processing the data at all unless there are "child" records
    if (body.rows && body.rows.length > 0) {
        var allParentIds = that.model.originalRecords.map(gpii.ptd.api.lib.children.extractUniqueIds);

        fluid.each(body.rows, function (row) {
            var record = row.value;
            var parentId = record.aliasOf;
            if (record.type === "translation") { parentId = record.translationOf; }

            // Silently skip orphaned child records, which can show up in the rare cases where we can't exclude them upstream
            if (allParentIds.indexOf(parentId) !== -1) {
                var arrayName = "children";

                if (record.type === "alias") { arrayName = "aliases"; }
                else if (record.type === "transform") { arrayName = "transformations"; }
                else if (record.type === "translation") { arrayName = "translations"; }

                if (!childData[parentId]) { childData[parentId] = {}; }
                if (!childData[parentId][arrayName]) { childData[parentId][arrayName] = []; }
                childData[parentId][arrayName].push(record);
            }
        });
    }

    // We have to do this outside of the normal check in case our search returns only "parents" who do not yet have children
    fluid.each(that.model.originalRecords, function (originalRecord) {
        var parentRecord = fluid.copy(originalRecord);
        parentsWithChildren.push(parentRecord);
        var childDataForParent = childData[parentRecord.uniqueId];
        if (childDataForParent) {
            var keys = Object.keys(childDataForParent);
            for (var b = 0; b < keys.length; b++) {
                var key = keys[b];
                parentRecord[key] = childDataForParent[key];
            }
        }
    });

    // We apply a change for those who are listening to our model
    that.applier.change("processedRecords", parentsWithChildren);

    // We also fire an event if someone wants to work with that instead.
    that.events.onChildrenLoaded.fire(that);
};


fluid.defaults("gpii.ptd.api.lib.children", {
    gradeNames: ["fluid.modelRelayComponent", "autoInit"],
    couchUrl:   "http://localhost:5984/tr/",
    viewPath:   "/_design/api/_view/children",
    maxKeyData: 7500, // request (and most web servers) can only work with 8000 characters or less of query data
    model: {
        originalRecords:  [],
        processedRecords: []
    },
    invokers: {
        addChildRecords: {
            funcName: "gpii.ptd.api.lib.children.addChildRecords",
            args:     ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2"]
        },
        filterToMatchingTerms: {
            funcName: "gpii.ptd.api.lib.children.filterToMatchingTerms",
            args:     ["{that}", "{arguments}.0"]
        }
    },
    events: {
        onChildrenLoaded: null,
        onDataChanged:    null,
        // We're not ready to look up any results until we have at least some data and until we've had a chance to finish constructing ourselves.
        // TODO: "This can be simplified once FLUID-5519 is fixed in Infusion" -- Dr. Basman
        onReady: {
            events: {
                onDataChanged: "onDataChanged",
                onCreate:      "onCreate"
            }
        }
    },
    modelListeners: {
        // I had to fire the event so that I could define "onReady" as a compound event.
        // TODO: "This can be simplified once FLUID-5519 is fixed in Infusion" -- Dr. Basman
        originalRecords: [
            {
                func:          "{that}.events.onDataChanged.fire",
                args:          ["{that}"],
                excludeSource: "init"
            }
        ]
    },
    listeners: {
        "onReady.requestChildren": {
            funcName: "gpii.ptd.api.lib.children.requestChildren",
            args:     ["{that}"]
        }
    }
});