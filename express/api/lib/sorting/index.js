// Library containing static functions to consistently handle sorting.
//
// These functions work directly with the syntax we are passing to couchdb-lucene, since other interfaces are working
// with results lucene-couchdb sorts for us.  With this function, we can apply the same sort syntax to our own data, for
// example, when browsing through records instead of searching.
//
// The syntax follows the same conventions as [couchdb-lucene](https://github.com/rnewson/couchdb-lucene), namely, a
// sort option looks like a field name, and is optionally prefixed with a direction indicator (/ for ascending, \ for
// descending order).
//
// We also support type-specific sorting using an optional suffix enclosed in less than an greater than signs.  For
// example, `\updated<date>` would sort records by the date when they were updated, in descending order.
//
// As with couchdb-lucene we support sorting by 'float', 'double', 'int', 'long' and 'date'.  If no suffix is specified,
// we default to "natural" sorting, i.e. whatever Javascript thinks is appropriate (normally, alphabetical sorting).
//
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");
fluid.registerNamespace("gpii.ptd.api.lib.sorting");

// The main `sort` function.  Works with an array containing maps of values, and the parameter syntax outlined above.
//
// Like `Array.sort()` itself, this will modify the source array.  If you do not want this, you are expected to provide
// a copy of the array yourself, for example, by passing in the output of `fluid.copy(array)`.
gpii.ptd.api.lib.sorting.sort = function (array, sortParams) {
    if (Array.isArray(sortParams)) {
        return gpii.ptd.api.lib.sorting.sortByArray(array, sortParams);
    }
    else if (typeof sortParams === "string") {
        return gpii.ptd.api.lib.sorting.sortByValue(array, sortParams);
    }

    // Anything else fails silently
};

// Process an array of sort parameters.
gpii.ptd.api.lib.sorting.sortByArray = function (array, sortParams) {
    // We must apply the search in reverse so that the most significant sorting is applied last.
    var reverseParams = sortParams.reverse();

    fluid.each(reverseParams, function (param) {
        gpii.ptd.api.lib.sorting.sortByValue(array, param);
    });
};

// Process a single sort parameter
gpii.ptd.api.lib.sorting.sortByValue = function (array, sortParam) {
    var sortFunction = gpii.ptd.api.lib.sorting.generateSortFunction(sortParam);
    array.sort(sortFunction);
};

gpii.ptd.api.lib.sorting.generateSortFunction = function (rawParam) {
    var param     = gpii.ptd.api.lib.sorting.getParam(rawParam);
    var direction = gpii.ptd.api.lib.sorting.getDirection(rawParam);
    var type      = gpii.ptd.api.lib.sorting.getType(rawParam);

    return function (a, b) {
        // Type the comparison variable so that sorting is handled appropriately.
        var typedValueA = a[param], typedValueB = b[param];

        // All of the non-int number types are treated as "float" values.  As we are not likely to be dealing with
        // ultra-fine sorting to multiple decimal places, this is likely to be acceptable.
        if (type === "float" || type === "double" || type === "long") {
            typedValueA = parseFloat(a[param]);
            typedValueB = parseFloat(b[param]);
        }
        else if (type === "int") {
            typedValueA = parseInt(a[param], 10);
            typedValueB = parseInt(b[param], 10);
        }
        else if (type === "date") {
            typedValueA = new Date(a[param]);
            typedValueB = new Date(b[param]);
        }

        if (typedValueA === typedValueB)        { return 0; }
        else if (!typedValueA && typedValueB)   { return -1 * direction; }
        else if (typedValueA  && !typedValueB)  { return  1 * direction; }
        else if (typedValueA < typedValueB)     { return -1 * direction; }
        else if (typedValueA > typedValueB)     { return  1 * direction; }

        return 0;
    };
};


// Extract the field name from the sort parameter, without including the optional direction and type qualifiers.
gpii.ptd.api.lib.sorting.getParam = function (rawParam) {
    var matches = rawParam.match(/^([\\/])?([^<]+)<?.*$/);
    if (matches) {
        return matches[2];
    }

    return rawParam;
};

// Extract the type qualifier, if no type is found, we default to "natural".
gpii.ptd.api.lib.sorting.getType = function (rawParam) {
    var matches = rawParam.match(/^.+<(.+)>$/);
    if (matches) {
        return matches[1];
    }

    return "natural";
};

// If we have a slash prepended in front of us, we are descending (-1).  Otherwise, we are ascending (1).
gpii.ptd.api.lib.sorting.getDirection = function (rawParam) {
    var matches = rawParam.match(/^\\.+/);
    if (matches) {
        return -1;
    }

    return 1;
};

// "shim" to support the use of this module using `var sorting = require(".../sorting/")`.
// TODO:  Remove this once we have finished converting all API code to Fluid components.
module.exports = function () {
    return gpii.ptd.api.lib.sorting;
};