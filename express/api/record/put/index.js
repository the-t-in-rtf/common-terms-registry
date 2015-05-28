"use strict";

module.exports = function (config) {
    var fluid = require("infusion");

    var namespace = "gpii.ctr.record.put";

    var record          = fluid.registerNamespace(namespace);
    record.error        = require("../../lib/error")(config);
    record.schemaHelper = require("../../../schema/lib/schema-helper")(config);

    var filters         = require("secure-filters");

    record.parseAndValidateInput = function () {
        if (!record.req.params || !record.req.params.uniqueId) {
            throw record.constructError(400, "You must provide the required query parameters to use this interface.");
        }

        if (record.req.query.children) {
            record.params.children = JSON.parse(record.req.query.children);
        }
    };

    var express = require("express");

    var router = express.Router();
    var bodyParser = require("body-parser");
    router.use(bodyParser.urlencoded());
    router.use(bodyParser.json());

    var handlePut = function (req, res) {
        // TODO:  Add support for commenting on a particular version as well as adding a comment while saving a change.

        if (!req.session || !req.session.user) {
            return res.status(401).send(JSON.stringify({ok: false, message: "You must be logged in to use this function."}));
        }

        // Make sure the current record has at least a uniqueId
        if (!req.body || !req.body.uniqueId) {
            return res.status(400).send({"ok": false, "message": "The data you have entered is not valid.  Please review.", "errors": { "uniqueId": "You must provide a uniqueId of the record you wish to update."}});
        }

        // Get the current document
        var readRequest = require("request");
        var sanitizedId = filters.js(req.body.uniqueId);
        readRequest.get(config["couch.url"] + "/_design/api/_view/entries?key=%22" + sanitizedId + "%22", function (readError, readResponse, readBody) {
            if (readError) {
                console.log(readError);
                return res.status(500).send({"ok": false, "message": "There was an error retrieving the record with uniqueId '" + sanitizedId + "'..."});
            }

            var jsonData = JSON.parse(readBody);

            // If we are trying to add a record that does not already exist, use a POST to upload to CouchDB
            if (!jsonData.rows || jsonData.rows.length === 0) {
                var postHelper = require("../post/post-helper")(config);
                return postHelper(req, res);
            }

            var originalRecord = jsonData.rows[0].value;
            var newRecord = JSON.parse(JSON.stringify(originalRecord));

            // TODO: Only allow data that matches the Schema or move this to the configuration
            var allowedFields = ["type", "permanency", "namespace", "uniqueId", "notes", "status", "termLabel", "valueSpace", "defaultValue", "source", "aliasOf", "translationOf", "definition", "uses", "applicationUniqueFlag"];

            // Overlay the supplied data onto this record, deleting any fields that are null, zero-length, undefined, or which only consist of whitespace
            allowedFields.forEach(function (field) {
                if (req.body[field] !== undefined) {
                    if (!req.body[field] || (req.body[field].trim && (req.body[field].trim() === "")) || req.body[field].length === 0) {
                        delete newRecord[field];
                    }
                    else {
                        newRecord[field] = req.body[field];
                    }
                }
            });

            // Set the "updated" field to the current date
            newRecord.updated = new Date().toISOString();

            // TODO: Set the "author" field to the current user

            // TODO:  Add support for versioning

            // TODO:  Confirm that the parent record exists when adding or editing a child record.

            var errors = record.schemaHelper.validate(newRecord.type, newRecord);
            if (errors) {
                return res.status(400).send({"ok": false, "message": "The data you have entered is not valid.  Please review.", "errors": errors});
            }

            // Upload the combined record to CouchDB
            var writeRequest = require("request");
            var writeOptions = {
                url: config["couch.url"] + "/" + newRecord._id,
                body: JSON.stringify(newRecord)
            };

            writeRequest.put(writeOptions, function (writeError, writeResponse, writeBody) {
                if (writeError) {
                    console.log(writeError);
                    return res.status(500).send({"ok": false, "message": "There was an error writing the record with uniqueId '" + req.body.uniqueId + "'..."});
                }

                if (writeResponse.statusCode === 201) {
                    res.status(200).send({ok: true, message: "Record updated.", record: newRecord});
                }
                else {
                    var jsonData = JSON.parse(writeBody);
                    res.status(writeResponse.statusCode).send({ok: false, message: "There were one or more problems that prevented your update from taking place.", "errors": jsonData.reason.errors });
                }
            });
        });
    };

    router.put("/", handlePut);

    return router;
};
