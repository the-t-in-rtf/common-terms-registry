// The record viewing and editing interface
/* global ctr, fluid, jQuery */
// TODO:  Move all template names to configurable variables
// TODO:  Use fully namespaced variable name instead of "details"
// TODO:  Confirm that "templates" works as a pure component
(function ($) {
    "use strict";
    var details    = fluid.registerNamespace("ctr.components.details");
    var templates  = fluid.registerNamespace("ctr.components.templates");

    details.load = function (that) {
        if (!that.data || !that.data.model) {
            var viewport = that.locate("viewport");
            templates.replaceWith(viewport, "error", {"message": "You must be logged in to create new records."});
            that.events.markupLoaded.fire();
            return;
        }

        // We are working with an existing record.  Load its full information
        if (that.data && that.data.model && that.data.model.record && that.data.model.record.uniqueId) {
            var settings = {
                url:     that.options.baseUrl + "/" + that.data.model.record.uniqueId + "?children=true",
                success: that.displayRecord,
                error:   that.displayError
            };

            $.ajax(settings);
        }
        // We are working with a new record.  Display the empty form with any data we have prepopulated.
        else {
            details.loadTypeTemplate(that);
        }
    };

    // Save the new version including any comments
    details.save = function (that) {
        var settings = {
            url:         that.options.baseUrl + "/",
            type:        "PUT",
            contentType: "application/json",
            processData: false,
            data:        JSON.stringify(that.data.model.record),
            success:     that.displayConfirmation,
            error:       that.displayError
        };

        $.ajax(settings);
    };

    details.addUse = function (that) {
        var newUse = that.locate("addUse");
        if (newUse) {
            var newUses = that.data.model.record.uses ? JSON.parse(JSON.stringify(that.data.model.record.uses)) : [];
            newUses.push($(newUse).val());
            that.data.applier.change("record.uses", newUses);

            var usesContainer = that.locate("usesContainer");
            templates.replaceWith(usesContainer, "details-fields-uses", that.data.model);
            that.events.markupLoaded.fire();
        }
    };

    details.removeUse = function (that, event) {
        // "this" should be the item clicked
        // figure out its position

        // This depends on the markup to include a position attribute
        var position = $(event.currentTarget).attr("position");

        if (position) {
            var newUses = that.data.model.record.uses ? JSON.parse(JSON.stringify(that.data.model.record.uses)) : [];
            newUses.splice(position, 1);
            that.data.applier.change("record.uses", newUses);

            var usesContainer = that.locate("usesContainer");
            templates.replaceWith(usesContainer, "details-fields-uses", that.data.model);
            that.events.markupLoaded.fire();
        }
        else {
            console.log("Couldn't determine list position of use, and as a result couldn't remove it.");
        }
    };

    details.displayError = function (that, jqXHR) {
        var viewport = that.locate("viewport");
        $(viewport).find(".alert-box").remove();

        var jsonData = {};
        try {
            jsonData = JSON.parse(jqXHR.responseText);
        }
        catch (e) {
            console.log("jQuery.ajax call returned meaningless jqXHR.responseText payload. Error messages may not be correctly displayed.");
        }

        // Display "summary" message if found
        var message = jsonData.message;
        if (message) {
            templates.prepend(viewport, "common-error-row", message);
        }

        // Display "field" messages inline
        if (jsonData.errors) {
            Object.keys(jsonData.errors).forEach(function (field) {
                var fieldElement = that.locate(field);
                var fieldErrors = jsonData.errors[field];
                if (fieldErrors) {
                    fieldElement.attr("aria-invalid", true);
                    templates.after(fieldElement, "details-field-errors", {errors: fieldErrors});
                }
            });
        }

        // scroll to the first error (`false` makes it scroll closer to the bottom of the screen instead of being hidden under the header)
        $(viewport).find(".alert-box:first").get(0).scrollIntoView(false);
    };

    details.displayConfirmation = function (that) {
        var viewport = that.locate("viewport");

        // This is the only way we can tell that we've saved a new record at the moment
        if (that.model.path === "/details/new") {
            templates.replaceWith(viewport, "details-created", that.model.record);
        }
        else {
            // Clear out any previous messages first.
            $(viewport).find(".alert-box").remove();

            templates.prepend(viewport, "success", {message: "Record saved."});
        }
        $(viewport).find(".alert-box.success:first").get(0).scrollIntoView(false);
    };

    details.getTemplate = function (type) {
        var template = "details-term";
        if (type && ["alias", "transform"].indexOf(type.toLowerCase()) !== -1) {
            template = "details-alias";
        }
        else if (type === "condition") {
            template = "details-condition";
        }
        return template;
    };

    details.loadTypeTemplate = function (that) {
        if (!that.data || !that.data.model) {
            console.log("loadTypeTemplate called before 'that' is correctly wired up.  Exiting.");
            return;
        }

        var viewport = that.locate("viewport");
        templates.replaceWith(viewport, details.getTemplate(that.data.model.record.type), that.data.model);
        that.events.markupLoaded.fire();
    };

    details.loadLinkTemplate = function (that) {
        if (!that.data || !that.data.model) {
            console.log("loadTypeTemplate called before 'that' is correctly wired up.  Exiting.");
            return;
        }

        var container = that.locate("parentLink");
        var template  = that.data.model.record.type === "translation" ? "details-fields-translationof" : "details-fields-aliasof";
        templates.replaceWith(container, template, that.data.model);
        that.events.markupLoaded.fire();
    };

    details.displayRecord = function (that, data) {
        var viewport = that.locate("viewport");
        if (data && data.record) {
            that.applier.change("record", data.record);
            details.loadTypeTemplate(that);
        }
        else {
            templates.replaceWith(viewport, "norecord", that.data.model);
            that.events.markupLoaded.fire();
        }
    };

    // TODO: bind in sanity checking when changing from a term (with aliases) to any other type of record

    details.init = function (that) {
        ctr.components.templates.loadTemplates(function () {
            details.load(that);
        });
    };

    // TODO:  Wire up comment controls

    fluid.defaults("ctr.components.details", {
        baseUrl: "/api/record",
        gradeNames: ["fluid.viewRelayComponent", "autoInit"],
        components: {
            data:    {
                type: "ctr.components.data",
                options: {
                    modelListeners: {
                        "record.type": "{ctr.components.details}.events.typeChanged"
                    }
                }
            },
            picker: {
                type:      "ctr.components.picker",
                container: "body",
                options: {
                    model: {
                        record: "{data}.model.record"
                    }
                }
            },
            controls: {
                type: "ctr.components.userControls",
                container: ".ptd-user-container",
                options: {
                    components: { data: "{data}" },
                    listeners: {
                        afterLogout:
                        {
                            func: "{ctr.components.details}.events.refresh.fire"
                        }
                    }
                }
            }
        },
        model: "{data}.model",
        bindings: [
            {
                selector:    "aliasOf",
                path:        "record.aliasOf",
                elementType: "text"
            },
            {
                selector:    "uniqueId",
                path:        "record.uniqueId",
                elementType: "text"
            },
            {
                selector:    "status",
                path:        "record.status",
                elementType: "radio"
            },
            {
                selector:    "type",
                path:        "record.type",
                elementType: "radio"
            },
            {
                selector:    "uses",
                path:        "record.uses",
                elementType: "list"
            },
            {
                selector:    "definition",
                path:        "record.definition",
                elementType: "text"
            },
            {
                selector:    "termLabel",
                path:        "record.termLabel",
                elementType: "text"
            },
            {
                selector:    "valueSpace",
                path:        "record.valueSpace",
                elementType: "text"
            },
            {
                selector:    "defaultValue",
                path:        "record.defaultValue",
                elementType: "text"
            },
            {
                selector:    "comment",
                path:        "comment",
                elementType: "text"
            }
        ],
        selectors: {
            "save":          ".save-button",
            "addUse":        "input[name='addUse']",
            "parentLink":    ".ptd-link-container",
            "removeUse":     ".remove-use",
            "viewport":      ".ptd-viewport",
            "status":        "input[name='status']",
            "type":          "input[name='type']",
            "uses":          "input[name='uses']",
            "usesContainer": ".uses-container",
            "uniqueId":      "input[name='uniqueId']",
            "definition":    "[name='definition']",
            "aliasOf":       "input[name='aliasOf']",
            "translationOf": "input[name='translationOf']",
            "termLabel":     "input[name='termLabel']",
            "valueSpace":    "input[name='valueSpace']",
            "defaultValue":  "input[name='defaultValue']",
            "comment":       "input[name='comment']"
        },
        events: {
            "refresh":      "preventable",
            "markupLoaded": "preventable",
            "typeChanged":  "preventable",
            "linkChanged":  "preventable"
        },
        invokers: {
            "save": {
                funcName: "ctr.components.details.save",
                args: [ "{that}"]
            },
            "addUse": {
                funcName: "ctr.components.details.addUse",
                args: [ "{that}"]
            },
            "removeUse": {
                funcName: "ctr.components.details.removeUse",
                args: [ "{that}", "{arguments}.0"]
            },
            "loadTypeTemplate": {
                funcName: "ctr.components.details.loadTypeTemplate",
                args: ["{that}"]
            },
            "loadLinkTemplate": {
                funcName: "ctr.components.details.loadLinkTemplate",
                args: ["{that}"]
            },
            "displayError": {
                funcName: "ctr.components.details.displayError",
                args: ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2"]
            },
            "displayRecord": {
                funcName: "ctr.components.details.displayRecord",
                args: ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2"]
            },
            "displayConfirmation": {
                funcName: "ctr.components.details.displayConfirmation",
                args: ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2"]
            }
        },
        listeners: {
            markupLoaded: [
                {
                    "this": "{that}.dom.addUse",
                    method: "change",
                    args:   "{that}.addUse"
                },
                {
                    "this": "{that}.dom.removeUse",
                    method: "click",
                    args:   "{that}.removeUse"
                },
                {
                    "this": "{that}.dom.removeUse",
                    method: "keypress",
                    args:   "{that}.removeUse"
                },
                {
                    "this": "{that}.dom.save",
                    method: "click",
                    args:   "{that}.save"
                },
                {
                    "this": "{that}.dom.save",
                    method: "keypress",
                    args:   "{that}.save"
                },
                {
                    "funcName": "ctr.components.binder.applyBinding",
                    "args":     "{that}"
                },
                {
                    "funcName": "{picker}.init",
                    "args":     "{that}"
                }
            ],
            onCreate: [
                {
                    "funcName": "ctr.components.details.init"
                }
            ],
            "typeChanged": {
                func: "ctr.components.details.loadTypeTemplate",
                args: [ "{that}"]
            },
            "linkChanged": {
                func: "ctr.components.details.loadLinkTemplate",
                args: [ "{that}"]
            },
            "refresh": {
                func: "ctr.components.details.load",
                args: [ "{that}"]
            }
        }
    });
})(jQuery);