$(function() {
    var COOKIE_ID = "ctrCplSettings";

    var controlPanelSettings = {
        "type": "GENERAL",
        "status": "active",
        "onlyUnreviewed": false
    };
    loadControlPanelSettings();

    // field schemes so that we can display different fields for different record types and statuses
    var fieldSchemes = {};
    fieldSchemes['base'] = {
        edit: {
            width: "5%",
            edit: false,
            create: false,
            sorting: false,
            display: function(record) { return $.mustache($("#edit").html(),record.record); }
        },
        id:
        {
            key: true,
            list: false
        },
        type: {
            title: 'Record Type',
            list: false
        },
        uniqueId: {
            title: 'Unique ID',
            width: "15%"
        },
        termLabel: {
            title: 'Label',
            width: "15%"
        },
        localId: {
            title: 'Local Unique ID',
            list: false
        },
        defaultValue: {
            title: 'Value Space',
            sorting: false,
            width: "20%",
            display: function(record) { return $.mustache($("#value").html(),record.record);}
        },
        definition: {
            title: 'Definition / Notes',
            sorting: false,
            width: "20%",
            edit: false,
            create: false,
            display: function(record) { return $.mustache($("#definition").html(),record.record);}
        },
        aliases: {
            title: 'Aliases',
            sorting: true,
            width: "20%",
            edit: false,
            create: false,
            display: function(record) {
                // Because of limitations of list handling in mustache, we have to create the container and process rows individually
                var container = $("<div></div>");
                var aliasContainer = $($.mustache($("#aliases").html(),record.record));
                container.append(aliasContainer);

                if (record.record.aliases !== undefined && record.record.aliases.length > 0) {
                    for (var position in record.record.aliases) {
                        aliasRecord = record.record.aliases[position];
                        aliasContainer.append($.mustache($("#alias-list-entry").html(),aliasRecord.value));
                    }
                }

                return container;
            }
        },
        delete: {
            width: "5%",
            edit: false,
            create: false,
            sorting: false,
            display: function(record) { return $.mustache($("#delete").html(),record.record); }
        }
    }

    // load all Mustache templates
    $.get('templates/terms.mustache', function(templates) { $(templates).each(function() { $('body').append(this); }); }).then(loadFooterAndHeader);

    // TODO:  Convert to template
    $.couchProfile.templates = {
        profileReady : '<div class="avatar">{{#gravatar_url}}<img src="{{gravatar_url}}"/>{{/gravatar_url}}<div class="name">{{nickname}}</div></div><div style="clear:left;"></div>',
        newProfile : '<form><p>Hello {{name}}, Please setup your user profile.</p><label for="nickname">Nickname <input type="text" name="nickname" value=""></label><label for="email">Email (<em>for <a href="http://gravatar.com">Gravatar</a></em>) <input type="text" name="email" value=""></label><label for="url">URL <input type="text" name="url" value=""></label><input type="submit" value="Go &rarr;"><input type="hidden" name="userCtxName" value="{{name}}" id="userCtxName"></form>'
    };

    function wireUpTable(scheme, status) {
        if (scheme === undefined) { scheme = 'base'; }
        if (status == undefined) { status = 'active'; }

	    $("#content").jtable({
            paging: true,
            pageSize: 50,
            pageSizes: [50,100,250,500,1000,2500],
            sorting: true,
            defaultSorting: "uniqueId ASC",
            columnSelectable: false,
            // By default jTable uses a POST for everything, which doesn't work when couchdb expects a GET (lists, views, shows)
            // TODO:  Figure out how to do this for just the listAction
            ajaxSettings: {
                type: 'GET'
            },
            actions: {
                listAction: '/tr/_design/trapp/_list/jtable/entries'
             },
			fields: fieldSchemes[scheme]
		});

        loadTable();
	}

    function loadTable() {
        $("#content").jtable('load',{"displayStatus": controlPanelSettings.status, "displayType" : controlPanelSettings.type, "onlyUnreviewed": controlPanelSettings.onlyUnreviewed});
    }

    function saveControlPanelSettings() {
        $.cookie(COOKIE_ID,JSON.stringify(controlPanelSettings));
    }

    function loadControlPanelSettings() {
        // Check to see if the cookie exists
        var cookie = $.cookie(COOKIE_ID);
        if (cookie !== undefined) {
           var cookieJson = JSON.parse(cookie);

           // TODO:  This whole thing is very brittle, depending on constant combination of markup, selectors, etc.  Convert to Backbone.js or something else sane.
           if (cookieJson.status !== undefined) {
               controlPanelSettings.status = cookieJson.status;
               $(".filter-toggle").addClass("disabled");
               if (cookieJson.status === "active") {
                   $("#live-record-toggle").removeClass("disabled");
               }
               else if (cookieJson.status === "unreviewed") {
                   $("#unreviewed-record-toggle").removeClass("disabled");
               }
               else if (cookieJson.status === "candidate") {
                   $("#candidate-record-toggle").removeClass("disabled");
               }
               else if (cookieJson.status === "deleted") {
                   $("#deleted-record-toggle ").removeClass("disabled");
               }
           }

           if (cookieJson.type !== undefined) {
               controlPanelSettings.type = cookieJson.type;
               $(".type-toggle").addClass("disabled");

               if (cookieJson.type === "GENERAL") {
                   $("#general-type-toggle").removeClass("disabled");
               }
               else if (cookieJson.type === "ALIAS") {
                   $("#alias-type-toggle").removeClass("disabled");
               }
               else if (cookieJson.type === "TRANSLATION") {
                   $("#translation-type-toggle").removeClass("disabled");
               }
               else if (cookieJson.type === "OPERATOR") {
                   $("#operator-type-toggle").removeClass("disabled");
               }
           }

           if (cookieJson.onlyUnreviewed !== undefined) {
               controlPanelSettings.onlyUnreviewed = cookieJson.onlyUnreviewed;
               if (cookieJson.onlyUnreviewed === false) {
                   $("#comments-toggle").addClass("disabled");
               }
               else {
                   $("#comments-toggle").removeClass("disabled");
               }
           }
        }
    }


    function activateStatusFilter(id,status) {
        var toggle = $(id);
        if (toggle.hasClass("disabled")) {
            $(".filter-toggle").addClass("disabled");
            $(id).removeClass("disabled");

            controlPanelSettings.status = status;
            saveControlPanelSettings();

            loadTable();
        }
    }

    function activateTypeFilter(id,type) {
        var toggle = $(id);
        if (toggle.hasClass("disabled")) {
            $(".type-toggle").addClass("disabled");
            $(id).removeClass("disabled");

            controlPanelSettings.type = type;
            saveControlPanelSettings();

            loadTable();
        }
    }

    function activateCommentFilter(id) {
        var toggle = $(id);

        var onlyUnreviewed = false;
        if (toggle.hasClass("disabled")) {
            toggle.removeClass("disabled");
            onlyUnreviewed = true;
        }
        else {
            toggle.addClass("disabled")
        }

        controlPanelSettings.onlyUnreviewed = onlyUnreviewed;
        saveControlPanelSettings();

        loadTable();
    }
    
    function loadFooterAndHeader() {
        $("#footer").html($("#footer-template").html());
//    $("#footer").html($.mustache($("#footer-template").html()));
    $("#header").html($.mustache($("#header-template").html(),document));

        $("#account").couchLogin({
            loggedIn : function(r) {
		        $("#profile").couchProfile(r, {});
                $("#login-message").remove();
                $("#controls").show();
                $("#control-toggle,#control-panel-toggle").click(function() { $("#controls").slideToggle(75); return false;});

                $("#general-type-toggle").click(function() { activateTypeFilter("#general-type-toggle","GENERAL"); return false;});
                $("#alias-type-toggle").click(function() { activateTypeFilter("#alias-type-toggle","ALIAS"); return false;});
                $("#translation-type-toggle").click(function() { activateTypeFilter("#translation-type-toggle","TRANSLATION"); return false;});
                $("#operator-type-toggle").click(function() { activateTypeFilter("#operator-type-toggle","OPERATOR"); return false;});

                $("#comments-toggle").click(function() { activateCommentFilter("#comments-toggle"); return false;});

                $("#unreviewed-record-toggle").click(function() { activateStatusFilter("#unreviewed-record-toggle","unreviewed"); return false;});
                $("#candidate-record-toggle").click(function() { activateStatusFilter("#candidate-record-toggle","candidate"); return false;});
                $("#live-record-toggle").click(function() { activateStatusFilter("#live-record-toggle","active"); return false;});
                $("#deleted-record-toggle").click(function() { activateStatusFilter("#deleted-record-toggle","deleted"); return false;});

                $("#add-panel").show();

                wireUpTable();
            },
            loggedOut : function() {
                $("#content").html('<div id="login-message" class="alert alert-danger">You must log in to view the registry.</div>');
                $("#controls").hide();
                $("#add-panel").hide();
                $("#profile").html('<p>Please log in to see your profile.</p>');
            }
        });
    }

 });

function deleteRecord(id) {
    var data = $("#delete-" + id + "-form").serialize();

    // post results via AJAX
    $.ajax({
        url: "/tr/_design/trapp/_update/edit/",
        type: "POST",
        data: data,
        context: id,
        success: function(results, status, jqXHR){
            // if we succeed, remove the row
            $("#delete-" + this + "-form").closest("tr").remove();
        },
        error: function(jqXHR, status, errorString) {
            window.alert("Error deleting record '" + this + "': " + errorString);
        }
    });
}
