// Library to add consistent handling of paging (slicing arrays, etc.)
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");
fluid.registerNamespace("gpii.ptd.api.lib.paging");

gpii.ptd.api.lib.paging.pageArray = function (that, array, params) {
    // We can only work with arrays, we should explicitly fail if the user tries to call us on map data.
    if (!Array.isArray(array)) {
        fluid.fail("The paging component can't work with anything but an array.");
    }

    // Pick up the defaults from our options unless we have been passed something else explicitly.
    params = params ? params : {};
    fluid.each(that.options.defaultParams, function (value, key) {
        if (!params[key]) { params[key] = value; }
    });

    if (params.offset === 0 && params.limit === -1) {
        return array;
    }
    else if (params.limit === -1) {
        return array.slice(params.offset);
    }
    else {
        return array.slice(params.offset, params.offset + params.limit);
    }
};

fluid.defaults("gpii.ptd.api.lib.paging", {
    gradeNames: ["fluid.littleComponent", "autoInit"],
    defaultParams : {
        offset: 0,
        limit: -1
    },
    invokers: {
        pageArray: {
            funcName: "gpii.ptd.api.lib.paging.pageArray",
            args:     ["{that}", "{arguments}.0", "{arguments}.1"]
        }
    }
});

// A compatibility "shim" that supports the old behavior, namely requiring the module and instantiating it using a `config` variable (which we ignore).
module.exports = function () {
    return gpii.ptd.api.lib.paging();
};