// Simple expander to combine base URLs with a path.
//
// Ideally, we would prefer to use something like `url.resolve()`, but we need to ignore leading slashes in many cases,
// otherwise `url.resolve("http://host/base/","/path")` results in mangled data like "http://host/path" when we
// actually want "http://host/base/path".
//
"use strict";
var fluid = fluid || require("infusion");
var gpii  = fluid.registerNamespace("gpii");
fluid.registerNamespace("gpii.ptd.api.tests");

gpii.ptd.api.tests.assembleUrl = function (baseUrl, path) {
    var fullPath;
    // We have to be careful of double slashes (or no slashes)
    if (baseUrl[baseUrl.length - 1] === "/" && path[0] === "/") {
        fullPath = baseUrl + path.substring(1);

    }
    else if (baseUrl[baseUrl.length - 1] !== "/" && path[0] !== "/") {
        fullPath = baseUrl + "/" + path;
    }
    else {
        fullPath = baseUrl + path;
    }
    return fullPath;
};