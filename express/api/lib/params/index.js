// Static functions to standardize the conversion of query parameters to typed data.  Among other things, typed data
// can more easily be validated using a JSON Schema.
//
// The expected format for `fieldDefinition` is a map, whose keys are a series of field names (typically found in
// `req.query`).  Each field definition may optionally contain information including:
//
// 1.  The type of field (`type`).  Supported values include The default is to store the value as found in `req.query`.
// 2.  Whether the field should be automatically converted to lowercase (`forceLowercase`).  This only works with strings or arrays of strings, and takes precedence over the `type` field.
// 3.  A `defaultValue`, which will be set if no query data is provided.  Default values should be represented in the desired data type, no conversion of default values is performed.
//
// Here is an example field configuration:
//
// {
//   fieldWithDetails: {
//     type: "number",
//     defaultValue: 255
//   },
//   fieldToLowercase: {
//     forceLowercase: true
//   },
//   simpleField: {}
// }
//
// As with `fluid.each`, `null` and `undefined` are stripped from the resulting set of parameters.  Explicit "falsy"
// values like `false`, `"true"`, etc. are preserved.
//
// For more examples, see the tests included with this project.
//
"use strict";

var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");
fluid.registerNamespace("gpii.ptd.api.lib.params");

// Exclude null and undefined values, but not "falsy" values.  Required to avoid stripping "turn this off" parameter values.
gpii.ptd.api.lib.params.exists = function (value) {
    return value !== null && value !== undefined;
};

// Return a list of relevant parameters given a data map and a set of field definitions (see above).
gpii.ptd.api.lib.params.extractParams = function (dataMap, fieldDefinitions) {
    var params = {};
    fluid.each(fieldDefinitions, function (options, field) {
        // We only go through the process if there is meant to be data, i.e. if we were passed data and/or there are defaults for the field.
        var fieldValue = dataMap[field];

        // If we have either data from the request or default values, we need to set the field in our parameters.
        //
        // We cannot simply test `options.defaultValue` for truthiness, because we may want to literally set the default to `0` or `true`.
        if (gpii.ptd.api.lib.params.exists(fieldValue) || (options && (gpii.ptd.api.lib.params.exists(options.defaultValue)))) {
            if (gpii.ptd.api.lib.params.exists(fieldValue)) {
                if (options && options.forceLowerCase) {
                    // Lowercase Arrays
                    if (Array.isArray(fieldValue)) {
                        params[field] = fieldValue.map(function (entry) { return typeof entry === "string" ? entry.toLowerCase() : entry; });
                    }
                    // Lowercase string fields
                    else if (typeof fieldValue === "string") {
                        params[field] = fieldValue.toLowerCase();
                    }
                    // Everything that cannot be safely lowercased is left alone, the JSON schema validation should complain later on if we have invalid data as a result.
                    else {
                        params[field] = fieldValue;
                    }
                }
                else if (options && options.type === "number") {
                    params[field] = parseFloat(fieldValue);
                }
                else if (options && options.type === "date") {
                    params[field] = new Date(fieldValue);
                }
                else if (options && options.type === "boolean") {
                    params[field] = JSON.parse(typeof fieldValue === "string" ? fieldValue.toLowerCase() : fieldValue);
                }
                else {
                    params[field] = fieldValue;
                }
            }
            // If we got this far and there's no fieldValue data, we must have had valid default options.
            else {
                params[field] = options.defaultValue;
            }
        }
    });
    return params;
};

// Convenience function to return just the filter definitions that contain a "truthy" value for `filterKey`.
gpii.ptd.api.lib.params.getRelevantFields = function (fieldDefinitions, filterKey) {
    var relevantFields = {};
    fluid.each(fieldDefinitions, function (value, key) {
        if (value[filterKey]) { relevantFields[key] = value; }
    });
    return relevantFields;
};

// Common function to look up parameters by keyword, where keyword is one of the tag fields in our fieldDefinition.
gpii.ptd.api.lib.params.getRelevantParams = function (params, fieldDefinitions, keyword) {
    var relevantParams = {};
    var relevantFields = gpii.ptd.api.lib.params.getRelevantFields(fieldDefinitions, keyword);
    fluid.each(params, function (value, field) {
        if (relevantFields[field]) {
            relevantParams[field] = value;
        }
    });
    return relevantParams;
};

// Generate the configuration format used by the filter functions from a set of params and field definitions.
gpii.ptd.api.lib.params.getFilterParams = function (params, fieldDefinitions) {
    var keyword = "filterField";
    var filterFields = gpii.ptd.api.lib.params.getRelevantFields(fieldDefinitions, keyword);
    var filterParams = gpii.ptd.api.lib.params.getRelevantParams(params, fieldDefinitions, keyword);

    var includes = {};
    fluid.each(filterParams, function (value, field) {
        var fieldDefinition = filterFields[field];
        if (fieldDefinition) {
            if (fieldDefinition.comparison || fieldDefinition.type) {
                var fieldIncludes = {
                    value: value
                };
                if (fieldDefinition.comparison) {
                    fieldIncludes.comparison = fieldDefinition.comparison;
                }
                if (fieldDefinition.type) {
                    fieldIncludes.type = fieldDefinition.type;
                }
                includes[field] = fieldIncludes;
            }
            else {
                includes[field] = value;
            }
        }
    });

    // Only add "includes" if we actually have data
    if (Object.keys(includes).length > 0) {
        filterParams.includes = includes;
    }

    return filterParams;
};