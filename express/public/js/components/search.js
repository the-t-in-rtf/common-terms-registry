// The main search module that allows users to view the Preference Terms Dictionary
/* global fluid, jQuery */
(function ($) {
    "use strict";
    var search    = fluid.registerNamespace("ctr.components.search");
    var templates = fluid.registerNamespace("ctr.components.templates");

    // TODO:  Create session-scoped variables for query, status, record type, and language, and use if no data is provided.

    search.clearSearchFilter = function(that) {
        that.applier.change("searchSettings.query", undefined);
    };

    search.showClearButton = function (that, show) {
        // Wire in support for clearing the search easily
        var clearButton = that.locate("clear");
        if (show) {
            clearButton.attr("tabIndex",0);
            clearButton.show();
        }
        else {
            clearButton.attr("tabIndex",-1);
            clearButton.hide();
        }
    };

    search.updateAddButton = function(that) {
        var addButtonContainer = that.locate("add");
        templates.replaceWith(addButtonContainer,"search-add-record-button");
    };

    // Change the search offset and trigger a refresh when a page navigation link is clicked
    search.changePage = function(that, event) {
        var element = $(event.currentTarget);
        var offset = element.attr('offset')? parseInt(element.attr('offset')) : undefined;

        if (!isNaN(offset) && offset >= 0) {
            // If we click on a link that has the same offset as the current value, no change functions are fired.
            that.applier.change("searchSettings.offset", offset);
        }
    };

    // Update the offset when the "page" input is updated
    search.updateOffsetFromPage = function(that) {
        that.applier.change("searchSettings.offset", search.calculateCurrentOffset(that));
    };

    // Update the page input when the offset is updated elsewhere
    search.updatePageFromOffset = function(that) {
        var pageElement = that.locate("page");
        var currentPage = search.calculateCurrentPage(that);
        pageElement.val(currentPage);
    };

    // return a page value based on the current offset
    search.calculateCurrentPage = function(that) {
        var currentPage = 1;
        if (that.model.searchSettings.limit !== -1) {
            currentPage = Math.floor(that.model.searchSettings.offset/that.model.searchSettings.limit) + 1;
        }
        return currentPage;
    };

    search.toggleSortControls = function(that) {
        var sortControls = that.locate("sort");
        if (that.model.count === 0) {
            sortControls.hide();
        }
        else {
            sortControls.show();
        }
    };

    // Return an offset based on the current page value
    search.calculateCurrentOffset = function(that) {
        var offset = that.model.searchSettings.offset;

        if (that.model.searchSettings.limit !== -1) {
            var pageElement = that.locate("page");
            var currentPage = parseInt(pageElement.val());
            if (currentPage && !isNaN(currentPage) && currentPage >= 1) {
                offset = (currentPage -1) * that.model.searchSettings.limit;
            }
        }

        return offset;
    };

    // Update the navigation links in the header when the number of records, pageLimit, or offset are changed
    search.updatePaginationControls = function(that) {

        var pages       = 1;
        var currentPage = search.calculateCurrentPage(that);

        // If the limits are off, we have one page of results, guaranteed
        if (that.model.searchSettings.limit !== -1) {
            if (that.model.count && that.model.count > 0) {
                pages = Math.ceil(that.model.count / that.model.searchSettings.limit);
            }
        }

        var pageLinks = that.locate("pageLinks");
        if (pages < 2) {
            pageLinks.hide();
        }
        else {
            var navOptions  = {
                offset:         0,
                page:           currentPage,
                totalPages:     pages
            };

            templates.replaceWith(pageLinks,"search-navigation-page-controls", navOptions);

            var navStart = that.locate("navStart");
            navStart.attr('offset', 0);

            if (currentPage > 1) {
                var navPrevious = that.locate("navPrevious");
                navPrevious.attr('offset', (currentPage - 2) * that.model.searchSettings.limit);
            }
            if (currentPage < pages) {
                var navNext = that.locate("navNext");
                navNext.attr('offset', currentPage * that.model.searchSettings.limit);

                var navEnd = that.locate("navEnd");
                navEnd.attr('offset', (pages - 1) * that.model.searchSettings.limit);
            }
        }

        // Fire a "nav loaded" event so that we can wire up the appropriate listeners
        that.events.navBarLoaded.fire();
    };

    // We have to reset the offset if someone changes the search terms.  Otherwise we could be on a page that's larger than the result set.
    search.clearOffset = function(that)  {
        that.applier.change("searchSettings.offset", 0);
    };

    // Update the results displayed whenever we have new search data
    search.searchSettingsChanged = function(that) {
        var emptyQuery = !Boolean(that.model.searchSettings.query);
        if (that.showClearButton) {
            that.showClearButton(!emptyQuery);
        }

        // TODO:  Hide the option to sort by "best match" if there is no query data, show it if there is.
        // TODO:  Set the sort to "best match" when search query data is entered.

        // TODO: Figure out why the hell this is happening...
        if (!that.processResults) {
            console.log("searchSettingsChanged was called before invokers were in place.  Bailing out...");
            return;
        }

        var settings = {
            url:     that.options.baseUrl,
            success: that.processResults,
            error:   that.displayError,
            data:    {
                offset: that.model.searchSettings.offset,
                limit:  that.model.searchSettings.limit,
                sort:   that.model.searchSettings.sort,
                status: that.model.searchSettings.statuses
            }
        };

        if (!emptyQuery) {
            settings.data.q = that.model.searchSettings.query;
        }

        // TODO: Break out this AJAX assembly and launch function into its own function
        if (emptyQuery) {
            settings.url += "/terms";
            settings.data.children=true;
        }
        else {
            settings.url += "/search";
        }

        // TODO:  Wire in support for term/condition controls

        $.ajax(settings);
    };

    search.toggleStatusControls = function(that) {
        var statusSelect  = that.locate("statusSelect");
        var statusToggle  = that.locate("statusToggle");
        var statusOptions = that.locate("statusOptions");

        // Manage focus when opening and closing the menu
        // TODO:  Write a general function to better test visibility
        if ($(statusSelect).is(":visible")) {
            // TODO:  Write a better function to change not only 'display' but also ARIA attributes
            statusSelect.hide();
            statusToggle.focus();
        }
        else {
            statusSelect.show();
            statusOptions.focus();
        }
    };

    search.handleStatusKeys = function(that, event) {
        var statusSelect  = that.locate("statusSelect");
        var statusToggle  = that.locate("statusToggle");
        switch(event.keyCode) {
            case 27: // escape
                statusSelect.hide();
                statusToggle.focus();
                break;
        }
    };

    search.handleStatusControlKeys = function(that, event) {
        var statusSelect  = that.locate("statusSelect");
        var statusToggle  = that.locate("statusToggle");
        switch(event.keyCode) {
            case 13: // enter
                that.toggleStatusControls();
                break;
        }
    };


    search.displayError = function(that, jqXHR, textStatus, errorThrown) {
        var message = errorThrown;
        try {
            var jsonData = JSON.parse(jqXHR.responseText);
            if (jsonData.message) { message = jsonData.message; }
        }
        catch (e) {
            console.log("jQuery.ajax call returned meaningless jqXHR.responseText payload. Using 'errorThrown' instead.");
        }
        var viewport = that.locate("viewport");
        templates.prepend(viewport,"common-error", message);
        $(viewport).find(".alert-box:first").get(0).scrollIntoView(false);

        that.events.markupLoaded.fire();
    };

    // Function to update the current "page" of data displayed onscreen.
    search.displayCurrentPage = function(that) {
        var viewport = that.locate("viewport");

        if (that.model.records && that.model.records.length > 0) {
            viewport.html("");

            var pageSize = that.model.searchSettings.limit === -1 ? that.model.count : that.model.searchSettings.limit;
            if (that.model.count < pageSize) { pageSize = that.model.count; }
            var limit = limit !== -1 ? limit: that.model.records.length;

            var pageData = that.model.records;

            templates.append(viewport, "search-records", {records: pageData, user: that.model.user, pageSize: pageSize });
            templates.append(viewport, "search-navigation-footer",{});
        }
        else {
            templates.replaceWith(viewport, "search-norecord");
        }

        that.events.markupLoaded.fire();
    };

    search.processResults = function(that, data) {
        // TODO:  Come up with a meaningful list of untranslated records
        that.applier.change("records", data.records);
        that.applier.change("count",   data.total_rows);
    };

    // Update the "showing records X of Y" blurb.
    search.updatePageCount = function(that) {
        var recordCount = that.locate("recordCount");
        if (that.model.count === 0) {
            recordCount.hide();
        }
        else {
            var limit = that.model.searchSettings.limit;
            if (that.model.count < limit || limit === -1) {
                limit = that.model.count;
            }
            var options = {
                limit: limit,
                count: that.model.count
            };
            templates.replaceWith(recordCount, "search-record-count", options);
        }
    };

    //// Searches are unlimited, browsing is not.  We need something that decides whether to refresh or page internally based on the page size
    //search.refreshOrPageInternally = function(that) {
    //    var isSearch = Boolean(that.model.searchSettings.query);
    //    if (isSearch) {
    //        that.displayCurrentPage();
    //    }
    //    else {
    //        that.searchSettingsChanged();
    //    }
    //};

    // We have to do this because templates need to be loaded before we initialize our own code.
    search.init = function(that) {
        // TODO:  Update this to use the new templates handling and bind our "after" listener to that.
        templates.loadTemplates(function() {
            search.searchSettingsChanged(that);
        });
    };

    fluid.defaults("ctr.components.search", {
        gradeNames: ["fluid.viewRelayComponent", "autoInit"],
        baseUrl: "/api",
        selectors: {
            "query":         ".ptd-search-query",
            "sort":          ".ptd-search-sort",
            "add":           ".ptd-add-record-button",
            "status":        ".ptd-search-status",
            "clear":         ".ptd-clear-button",
            "aliasToggle":   ".alias-toggle",
            "statusOptions": ".ptd-search-status",
            "statusToggle":  ".ptd-search-status-toggle",
            "statusText":    ".ptd-search-status-current-text",
            "statusSelect":  ".ptd-search-status-selector",
            "navStart":      ".ptd-search-nav-start",
            "page":          ".ptd-search-nav-current-page",
            "navPrevious":   ".ptd-search-nav-previous",
            "pageLinks":     ".ptd-search-page-links",
            "navNext":       ".ptd-search-nav-next",
            "navEnd":        ".ptd-search-nav-end",
            "navPageLink":   ".ptd-search-nav-page-link",
            "navBar":        ".ptd-nav-bar",
            "header":        ".ptd-header",
            "recordCount":   ".ptd-record-count",
            "viewport":      ".ptd-viewport"
        },
        bindings: [
            {
                selector:    "query",
                path:        "searchSettings.query",
                elementType: "text"
            },
            {
                selector:    "sort",
                path:        "searchSettings.sort",
                elementType: "select"
            },
            {
                selector:    "status",
                path:        "searchSettings.statuses",
                elementType: "select"
            }
        ],
        components: {
            data:    {
                type: "ctr.components.data",
                options: {
                    model: {
                        searchSettings: {
                            offset:   0,
                            limit:    25,
                            sort:     "uniqueId",
                            statuses: ["active","unreviewed","candidate","draft"],
                            query:    ""
                        },
                        data: null
                    }
                }
            },
            userControls:    {
                type: "ctr.components.userControls",
                container: ".ptd-user-container",
                options: {
                    components: {
                        data: "{ctr.components.search}.data"
                    },
                    listeners: {
                        afterLogout:
                            [
                                {
                                    func: "{ctr.components.search}.events.refresh.fire"
                                },
                                {
                                    func: "{ctr.components.search}.updateAddButton"

                                }
                            ]
                    }
                }
            }
        },
        model: "{data}.model",
        events: {
            "refresh":           "preventable",
            "clearSearchFilter": "preventable",
            "markupLoaded":      "preventable",
            "navBarLoaded":      "preventable"
        },
        invokers: {
            "changePage": {
                funcName: "ctr.components.search.changePage",
                args: [ "{that}", "{arguments}.0"]
            },
            "clearSearchFilter": {
                funcName: "ctr.components.search.clearSearchFilter",
                args: [ "{that}"]
            },
            "displayCurrentPage": {
                funcName: "ctr.components.search.displayCurrentPage",
                args: [ "{that}"]
            },
            "displayError": {
                funcName: "ctr.components.search.displayError",
                args: ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2"]
            },
            // TODO:  Generalize this and make a generic drop-down element
            "handleStatusKeys": {
                funcName: "ctr.components.search.handleStatusKeys",
                args: ["{that}", "{arguments}.0"]
            },
            "handleStatusControlKeys": {
                funcName: "ctr.components.search.handleStatusControlKeys",
                args: ["{that}", "{arguments}.0"]
            },
            "processResults": {
                funcName: "ctr.components.search.processResults",
                args: ["{that}", "{arguments}.0", "{arguments}.1", "{arguments}.2"]
            },
            "updateOffsetFromPage": {
                funcName: "ctr.components.search.updateOffsetFromPage",
                args: ["{that}"]
            },
            "updateAddButton": {
                funcName: "ctr.components.search.updateAddButton",
                args: ["{that}"]
            },
            "toggleStatusControls": {
                funcName: "ctr.components.search.toggleStatusControls",
                args: ["{that}"]
            },
            "showClearButton": {
                funcName: "ctr.components.search.showClearButton",
                args: ["{that}", "{arguments}.0"]
            },
            "searchSettingsChanged": {
                funcName: "ctr.components.search.searchSettingsChanged",
                excludeSource: "init",
                args: ["{that}"]
            }
        },
        modelListeners: {
            "count": [
                {
                    funcName: "ctr.components.search.updatePageCount",
                    excludeSource: "init",
                    args: ["{that}"]
                },
                {
                    funcName: "ctr.components.search.updatePaginationControls",
                    excludeSource: "init",
                    args: ["{that}"]
                },
                {
                    funcName: "ctr.components.search.toggleSortControls",
                    excludeSource: "init",
                    args: ["{that}"]
                }
            ],
            "records": [
                {
                    funcName: "ctr.components.search.displayCurrentPage",
                    excludeSource: "init",
                    args: ["{that}"]
                }
            ],
            "searchSettings.offset": [
                {
                    funcName: "ctr.components.search.updatePageFromOffset",
                    excludeSource: "init",
                    args: ["{that}"]
                },
                {
                    funcName: "ctr.components.search.searchSettingsChanged",
                    excludeSource: "init",
                    args: ["{that}"]
                },
                {
                    funcName: "ctr.components.search.updatePageCount",
                    excludeSource: "init",
                    args: ["{that}"]
                },
                {
                    funcName: "ctr.components.search.updatePaginationControls",
                    excludeSource: "init",
                    args: ["{that}"]
                }
            ],
            "searchSettings.limit": [
                {
                    funcName: "ctr.components.search.clearOffset",
                    excludeSource: "init",
                    args: ["{that}"]
                },
                {
                    funcName: "ctr.components.search.searchSettingsChanged",
                    excludeSource: "init",
                    args: ["{that}"]
                },
                {
                    funcName: "ctr.components.search.updatePageCount",
                    excludeSource: "init",
                    args: ["{that}"]
                },
                {
                    funcName: "ctr.components.search.updatePaginationControls",
                    excludeSource: "init",
                    args: ["{that}"]
                }
            ],
            "searchSettings.sort": [
                {
                    funcName: "ctr.components.search.clearOffset",
                    excludeSource: "init",
                    args: ["{that}"]
                },
                {
                    funcName: "ctr.components.search.searchSettingsChanged",
                    excludeSource: "init",
                    args: ["{that}"]
                }
            ],
            "searchSettings.query":    [
                {
                    funcName: "ctr.components.search.clearOffset",
                    excludeSource: "init",
                    args: ["{that}"]
                },
                {
                    funcName: "ctr.components.search.searchSettingsChanged",
                    excludeSource: "init",
                    args: ["{that}"]
                }
            ],
            "searchSettings.statuses": [
                {
                    funcName: "ctr.components.search.clearOffset",
                    excludeSource: "init",
                    args: ["{that}"]
                },
                {
                    funcName: "ctr.components.search.searchSettingsChanged",
                    excludeSource: "init",
                    args: ["{that}"]
                }
            ]
        },
        listeners: {
            onCreate: [
                {
                    "funcName": "ctr.components.search.init",
                    "args":     "{that}"
                },
                {
                    "this": "{that}.dom.statusToggle",
                    method: "click",
                    args:   "{that}.toggleStatusControls"
                },
                {
                    "this": "{that}.dom.statusToggle",
                    method: "keydown",
                    args:   "{that}.handleStatusControlKeys"
                },
                {
                    "this": "{that}.dom.statusOptions",
                    method: "blur",
                    args:   "{that}.toggleStatusControls"
                },
                {
                    "this": "{that}.dom.statusOptions",
                    method: "keydown",
                    args:   "{that}.handleStatusKeys"
                }
            ],
            navBarLoaded: [
                {
                    "this": "{that}.dom.navPageLink",
                    method: "click",
                    args:   "{that}.changePage"
                },
                {
                    "this": "{that}.dom.navPageLink",
                    method: "keydown",
                    args:   "{that}.changePage"
                },
                {
                    "this": "{that}.dom.page",
                    "method": "change",
                    "args": "{that}.updateOffsetFromPage"
                }
            ],
            markupLoaded: [
                {
                    "this": "{that}.dom.navPageLink",
                    method: "click",
                    args:   "{that}.changePage"
                },
                {
                    "this": "{that}.dom.navPageLink",
                    method: "keydown",
                    args:   "{that}.changePage"
                },
                {
                    "this": "{that}.dom.clear",
                    method: "click",
                    args:   "{that}.clearSearchFilter"
                },
                {
                    "this": "{that}.dom.clear",
                    method: "keydown",
                    args:   "{that}.clearSearchFilter"
                },
                {
                    "funcName": "ctr.components.binder.applyBinding",
                    "args":     "{that}"
                }
            ],
            "refresh": {
                func: "ctr.components.search.searchSettingsChanged",
                args: [ "{that}"]
            }
        }
    });
})(jQuery);