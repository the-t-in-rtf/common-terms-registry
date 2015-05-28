// A generalized "picker"
/* global fluid, jQuery */
(function ($) {
    "use strict";
    var picker    = fluid.registerNamespace("ctr.components.picker");
    var templates = fluid.registerNamespace("ctr.components.templates");

    // Hide the current value and show the controls when the toggle is selected
    picker.toggleControls = function(that){
        that.locate("view").toggle();
        that.locate("edit").toggle();
    };

    // Start checking for updates to the query
    picker.startPolling   = function(that) {
        picker.polling = setInterval(function(){ picker.pollForUpdates(that); }, 1000);
    };

    // Check for updates to the query by firing a change.  If nothing has changed, nothing will be done
    picker.pollForUpdates = function(that) {
        that.applier.change("query", that.locate("query").val());
    };

    // Stop checking for updates to the query
    picker.stopPolling    = function() {
       clearInterval(picker.polling);
    };

    // TODO:  Work with Cindy, Justin and others to prevent firing this multiple times:  http://issues.gpii.net/browse/CTR-121
    // Monitor the changes to the query and refresh the results
    picker.refreshSuggestions = function(that) {
        var queryElement = that.locate("query");
        if (queryElement && queryElement.val() && queryElement.val().length > 0) {
            // TODO:  pick this up from the configuration somehow
            var statusString = "&status=";
            statusString += ["active","draft","unreviewed","candidate"].join("&status=");

            var options = {
                url:     that.options.baseUrl + "/api/search?limit=5&q=" + queryElement.val() + statusString,
                success: that.displaySuggestions,
                error:   that.displayError
            };
            $.ajax(options);
        }
        else {
            // Hide the suggestion box for now, there are no results to display
            that.locate("suggestions").hide();
        }
    };

    // display the list of suggestions
    picker.displaySuggestions = function(that, data) {
        // Clear out any previous error messages
        $(that.locate("container")).find(".alert-box").remove();

        templates.replaceWith(that.locate("suggestions"),"common-parent-picker-suggestions",data);

        that.events.suggestionsLoaded.fire();

        // We have to locate the suggestions box again as the markup has changed.  Otherwise we are operating on a phantom object in memory
        that.locate("suggestions").show();
    };

    picker.refreshPicker = function(that) {
        templates.replaceWith(that.locate("container"), "common-parent-picker", that.model);
        that.events.markupLoaded.fire();
    };

    // display any errors returned
    picker.displayError = function(that, jqXHR, textStatus, errorThrown) {
        // Clear out any previous error messages
        $(that.locate("container")).find(".alert-box").remove();

        var message = errorThrown;
        try {
            var jsonData = JSON.parse(jqXHR.responseText);
            if (jsonData.message) { message = jsonData.message; }
        }
        catch (e) {
            console.log("jQuery.ajax call returned meaningless jqXHR.responseText payload. Using 'errorThrown' instead.");
        }

        var view = that.locate("view");
        templates.prepend(view,"common-error", message);
        $(view).find(".alert-box:first").get(0).scrollIntoView(false);

        // TODO:  Convert this to use invoker and avoid passing "that"
        that.toggleControls(that);
    };

    // Update the current value with the "picked" suggestion and toggle the controls / value display
    picker.pickParent = function (that, event) {
        var element = $(event.currentTarget);
        var value   = element.attr("value");

        // TODO:  Convert this to use invoker and avoid passing "that"
        that.toggleControls(that);

        var field = (that.model.record && that.model.record.type === "translation") ? "record.translationOf" : "record.aliasOf";
        that.applier.change(field, value);
    };

    // load our template into the default container
    picker.init = function(that) {
        templates.loadTemplates(function() {
            picker.refreshPicker(that);
        });
    };

    picker.navigateWithinSuggestions = function(that, event) {
        var fromElement = that.locate("selectedSuggestion");
        var toElement   = null;
        switch(event.keyCode) {
            // Up arrow
            case 38:
                toElement = that.locate("suggestion").last();

                if (fromElement && fromElement.length > 0) {
                    var previous = fromElement.prev();
                    if (previous) {
                        toElement = previous;
                    }
                }

                if (fromElement) { fromElement.removeClass('ptd-parent-picker-suggestion-selected'); }
                if (toElement) { toElement.addClass('ptd-parent-picker-suggestion-selected'); }
                break;
            // Down arrow
            case 40:
                toElement = that.locate("suggestion").first();

                if (fromElement && fromElement.length > 0) {
                    var next = fromElement.next();
                    if (next) {
                        toElement = next;
                    }
                }

                if (fromElement) { fromElement.removeClass('ptd-parent-picker-suggestion-selected'); }
                if (toElement) { toElement.addClass('ptd-parent-picker-suggestion-selected'); }
                break;
            // Enter key or space bar
            case 13:
            case 32:
                // pick this element
                if (fromElement) { fromElement.keypress(); }
                break;
        }
    };

    fluid.defaults("ctr.components.picker", {
        gradeNames: ["fluid.viewRelayComponent", "baseUrlAware", "autoInit"],
        model: {
            record:    null,
            query:     null
        },
        selectors: {
            "container":          ".ptd-parent-picker-container",
            "toggle":             ".ptd-parent-picker-toggle",
            "selectedSuggestion": ".ptd-parent-picker-suggestion-selected",
            "view":               ".ptd-parent-picker-view",
            "edit":               ".ptd-parent-picker-edit",
            "picked":             ".ptd-parent-picker-picked",
            "query":              ".ptd-parent-picker-search-query",
            "suggestions":        ".ptd-parent-picker-suggestions",
            "suggestion":         ".ptd-parent-picker-suggestion"
        },
        events: {
            "markupLoaded":      "preventable",
            "suggestionsLoaded": "preventable",
            "picked":            "preventable"
        },
        invokers: {
            "toggleControls": {
                funcName:   "ctr.components.picker.toggleControls",
                args:       ["{that}"]
            },
            "displayError": {
                funcName: "ctr.components.picker.displayError",
                args:     ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2"]
            },
            "displaySuggestions": {
                funcName: "ctr.components.picker.displaySuggestions",
                args: [   "{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2"]
            },
            "refreshSuggestions": {
                funcName: "ctr.components.picker.refreshSuggestions",
                args: [   "{that}"]
            },
            "navigateWithinSuggestions": {
                funcName: "ctr.components.picker.navigateWithinSuggestions",
                args: [ "{that}", "{arguments}.0"]
            },
            "init": {
                funcName: "ctr.components.picker.init",
                args: [ "{that}"]
            },
            "pickParent": {
                funcName: "ctr.components.picker.pickParent",
                args: [ "{that}", "{arguments}.0"]
            },
            "startPolling": {
                funcName: "ctr.components.picker.startPolling",
                args: [ "{that}"]
            },
            "pollForUpdates": {
                funcName: "ctr.components.picker.pollForUpdates",
                args: [ "{that}"]
            },
            "stopPolling": {
                funcName: "ctr.components.picker.stopPolling",
                args: [ "{that}"]
            }
        },
        modelListeners: {
            "record.aliasOf": [
                {
                    funcName: "ctr.components.picker.refreshPicker",
                    args: ["{that}"]
                }
            ],
            "record.translationOf": [
                {
                    funcName: "ctr.components.picker.refreshPicker",
                    args: ["{that}"]
                }
            ],
            query: [
                {
                    funcName: "ctr.components.picker.refreshSuggestions",
                    args: ["{that}"]
                }
            ]
        },
        listeners: {
            onCreate:  [
                {
                    "funcName": "ctr.components.picker.init",
                    "args":     "{that}"
                }
            ],
            suggestionsLoaded: [
                {
                    "this": "{that}.dom.suggestion",
                    method: "click",
                    args:   "{that}.pickParent"
                },
                {
                    "this": "{that}.dom.suggestion",
                    method: "keypress",
                    args:   "{that}.pickParent"
                },
                {
                    "this": "{that}.dom.suggestions",
                    method: "keydown",
                    args:   "{that}.navigateWithinSuggestions"
                }
            ],
            markupLoaded: [
                {
                    "this": "{that}.dom.query",
                    method: "focus",
                    args:   "{that}.startPolling"
                },
                {
                    "this": "{that}.dom.query",
                    method: "blur",
                    args:   "{that}.stopPolling"
                },
                {
                    "this": "{that}.dom.toggle",
                    method: "click",
                    args:   "{that}.toggleControls"
                },
                {
                    "this": "{that}.dom.toggle",
                    method: "keypress",
                    args:   "{that}.toggleControls"
                }
            ]
        }
    });
})(jQuery);