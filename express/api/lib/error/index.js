"use strict";

// TODO:  Audit this once the API refactor is complete.  We should be able to remove it then.
module.exports = function () {
    var fluid = require("infusion");
    var error = fluid.registerNamespace("gpii.ctr.api.lib.error");

    error.constructError = function (status, message) {
        var error = new Error(message);
        error.status = status;
        error.ok = false;
        return error;
    };

    return error;
};
