/*
    A Fluid component to standardize the parsing of JSON schemas.  For more information, see the [JSON schemas website](http://json-schema.org/)

    We use JSON schemas to:

        1.  Validate the JSON data passed to us (requires `options.schema` to be set).
        2.  Structure the JSON data we pass back (requires `options.baseUrl` to be set.

    You can use it for either use case, or both, but you must set the required options.

    The current implementation uses [z-schema](https://www.npmjs.com/package/z-schema) for validation, but as we groom
    the raw responses from that library and hide them behind our own invoker, we should be able to transition to another
    library or our own implementation if necessary.
 */
//   TODO:  This will eventually need to be extracted to a small standard component with more extensive tests, and reused in the Unified Listing.

"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

fluid.registerNamespace("gpii.schema.helper");

var fs      = require("fs");
var path    = require("path");
var url     = require("url");
var ZSchema = require("z-schema");

// Cache all our schemas on startup.
gpii.schema.helper.init = function (that) {
    fluid.each(that.options.schemas, function (schemaPath, schemaName) {
        var schemaContent = require(schemaPath);
        that.cache[schemaName] = schemaContent;
    });

    that.events.onSchemasCached.fire(that);
};

// Return a map of headers based on the supplied schema.  This map should be used within your gpii.express.router, etc.
// to return the appropriate headers.
gpii.schema.helper.getSchemaHeaders = function (that, key) {
    if (!that.options.baseUrl) {
        fluid.fail("You must provide a base URL option before you can use this component to construct headers.");
    }

    var schemaUrl = url.resolve(that.options.baseUrl, key + ".json");

    return {
        "Content-Type": "application/" + key + "+json; profile=\"" + schemaUrl + "\"",
        "Link": schemaUrl + "#; rel=\"describedBy\""
    };
};

// Previously, we allowed the schema helper access to the response object, which is just bad practice.
// This function is provided for temporary backward compatibility, and will be removed.
// TODO:  Remove this once we have completed the wider refactor
gpii.schema.helper.setSchemaHeaders = function (that, res, key) {
    if (res.headersSent) {
        fluid.fail("Can't set headers, they have already been sent.");
    }

    fluid.log("WARNING:  Your code is using the old method of setting schema headers, and should be updated.");
    var schemaHeaders = that.getSchemaHeaders(key);
    fluid.each(schemaHeaders, function (value, key) {
        res.set(key, value);
    });
};

gpii.schema.helper.validate = function (that, key, content) {
    if (!that.options.schemas) {
        fluid.fail("You must provide a map of schema names and paths to use this module.");
    }

    // We instantiate a new validator each time to avoid detecting errors from previous runs or from other sessions.
    var validator = new ZSchema(that.options.zSchemaOptions);

    // We have to validate the schemas themselves before we can validate records.
    var schemasValid = validator.validateSchema(Object.keys(that.cache).map(function (v) { return that.cache[v]; }));
    if (!schemasValid) {
        return (gpii.schema.helper.sanitizeValidationErrors(that, validator.getLastErrors()));
    }

    // Now validate the content.
    var contentValid = validator.validate(content, that.cache[key]);
    if (!contentValid) {
        return (gpii.schema.helper.sanitizeValidationErrors(that, validator.getLastErrors()));
    }

    return undefined;
};

/*
     Convert z-schema's unhelpful internal format to something more simply structured.

     z-schema gives us output like:

     [
         {
             "code": "OBJECT_MISSING_REQUIRED_PROPERTY",
             "params":["termLabel"],
             "message":"Missing required property: termLabel",
             "path":"#/"
         },
         {
             "code":"PATTERN",
             "params":["^[a-z]+([A-Z][a-z]+)*$","6DotComputerBrailleTable"],
             "message":"String does not match pattern ^[a-z]+([A-Z][a-z]+)*$: 6DotComputerBrailleTable",
             "path":"#/uniqueId"
         }
     ]

     See https://github.com/zaggino/z-schema/blob/master/src/Errors.js for the list of errors and
     https://github.com/zaggino/z-schema/blob/master/src/JsonValidation.js for the logic behind them.

     This function turns z-schema's output into something human-readable, which is especially important for
     pattern-based matches like uniqueId, which z-schema represents in an obtuse format.  This function also breaks
     down validation errors by field so that we can show feedback in-context.
 */
gpii.schema.helper.sanitizeValidationErrors = function (that, errors) {
    var saneErrors = {};

    errors.forEach(function (error) {
        // Errors with fields that contain data are already associated with the field based on the path
        var field = error.path.replace("#/", "");

        // Document-level failures about missing fields need to associated with the field based on the params
        if (error.code === "OBJECT_MISSING_REQUIRED_PROPERTY") { field = error.params[0]; }

        // We could have multiple validation errors for a single field, so we need to allow arrays
        if (!saneErrors[field]) { saneErrors[field] = []; }
        saneErrors[field].push(error.message);
    });

    return saneErrors;
};

// A convenience function to convert a list of schema names into the new options format.
// This will likely be removed once all local code has been converted to Fluid components.
// TODO: Remove this once we are a general module and not working with our own local schemas
gpii.schema.helper.constructSchemas = function (schemaNames) {
    var schemaBasePath = path.resolve(__dirname, "../schemas/");

    var schemaConfig = {};
    schemaNames.map(function (schemaName) {
        var schemaFilename = schemaName + ".json";
        schemaConfig[schemaName] =  path.resolve(schemaBasePath, schemaFilename);
    });

    return schemaConfig;
};

// We look up and then create a map of all templates for our defaults.  To override this, pass in `options.schemas` as a map of keys and full paths.
var schemaBasePath  = path.resolve(__dirname, "../schemas/");
var schemaFileNames = fs.readdirSync(schemaBasePath);
var schemaNames     = schemaFileNames.map(function (filename) { return filename.substring(0, filename.indexOf(".json")); });

fluid.defaults("gpii.schema.helper", {
    gradeNames: ["fluid.eventedComponent", "autoInit"],
    zSchemaOptions: {
        noExtraKeywords: true // Whether to allow additional fields not referenced in the schema.
    },
    schemas: {
        expander: {
            funcName: "gpii.schema.helper.constructSchemas",
            args:     [ schemaNames ]
        }
    },
    baseURl: undefined, // The base URL to use when constructing headers that refer to a particular schema.
    members: {
        cache: {} // Schema content is not expected to change after startup, and is cached for the life of the component.
    },
    listeners: {
        "onCreate.cacheSchemas": {
            funcName: "gpii.schema.helper.init",
            args: ["{that}"]
        }
    },
    events: {
        onSchemasCached: null
    },
    invokers: {
        getSchemaHeaders: {
            funcName: "gpii.schema.helper.getSchemaHeaders",
            args: ["{that}", "{arguments}.0"]
        },
        setSchemaHeaders: {
            funcName: "gpii.schema.helper.setSchemaHeaders",
            args: ["{that}", "{arguments}.0", "{arguments}.1"]
        },
        validate: {
            funcName: "gpii.schema.helper.validate",
            args:     ["{that}", "{arguments}.0", "{arguments}.1"]
        }
    }
});

// Transitional "shim" to allow using this module with the previous configuration syntax until all local code is converted to Fluid components.
module.exports = function (config) {
    return gpii.schema.helper({
        baseUrl: url.resolve(config["base.url"], "schema")
    });
};