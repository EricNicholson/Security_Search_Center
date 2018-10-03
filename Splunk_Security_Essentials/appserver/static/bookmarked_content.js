"use strict";

function toHex(str) {
    //http://forums.devshed.com/javascript-development-115/convert-string-hex-674138.html
    var hex = '';
    for (var i = 0; i < str.length; i++) {
        hex += '' + str.charCodeAt(i).toString(16);
    }
    return hex;
}

window.NumSearchesSelected = 0

var addingIndividualContent = $.Deferred()
var examples = {}
loadSPL()
function trigger_clicked(str) {
    if (document.getElementById("checkbox_" + str).checked) {
        window.NumSearchesSelected += 1;
    } else {
        window.NumSearchesSelected -= 1;
    }
    $("#NumSearches").text(window.NumSearchesSelected)
}

window.SearchesInProgress = []
window.SearchesInQueue = []
window.SearchesComplete = []
window.allDataSources = new Object();
var BookmarkStatus = {"none": "Not On List", "bookmarked": "Bookmarked", "inQueue": "Ready for Deployment", "needData": "Waiting on Data", "issuesDeploying": "Deployment Issues", "needsTuning": "Needs Tuning", "successfullyImplemented": "Successfully Implemented" }
function Modal() {
    require(["underscore"], function(_) {
        var _createClass = function() {
            function defineProperties(target, props) {
                for (var i = 0; i < props.length; i++) {
                    var descriptor = props[i];
                    descriptor.enumerable = descriptor.enumerable || false;
                    descriptor.configurable = true;
                    if ("value" in descriptor) descriptor.writable = true;
                    Object.defineProperty(target, descriptor.key, descriptor);
                }
            }
            return function(Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; };
        }();

        function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

        function Modal(id, options) {
            var _this = this;

            _classCallCheck(this, Modal);

            var modalOptions = _.extend({ show: false }, options);

            // if "id" is the element that triggers the modal display, extract the actual id from it; otherwise use it as-is
            var modalId = id //!= null && (typeof id === 'undefined' ? 'undefined' : _typeof(id)) === 'object' && id.jquery != null ? id.attr('data-target').slice(1) : id;

            var header = $('<div>').addClass('modal-header');

            var headerCloseButton = $('<button>').addClass('close').attr({
                'type': 'button',
                'data-dismiss': 'modal',
                'aria-label': 'Close'
            }).append($('<span>').attr('aria-hidden', true).text('&times;'));

            this.title = $('<h3>').addClass('modal-title');

            this.body = $('<div>').addClass('modal-body');

            this.footer = $('<div>').addClass('modal-footer');

            this.$el = $('<div>').addClass('modal mlts-modal').attr('id', modalId).append($('<div>').addClass('modal-dialog').append($('<div>').addClass('modal-content').append(header.append(headerCloseButton, this.title), this.body, this.footer)));

            if (modalOptions.title != null) this.setTitle(modalOptions.title);

            if (modalOptions.type === 'wide') this.$el.addClass('modal-wide');
            else if (modalOptions.type === 'noPadding') this.$el.addClass('mlts-modal-no-padding');

            // remove the modal from the dom after it's hidden
            if (modalOptions.destroyOnHide !== false) {
                this.$el.on('hidden.bs.modal', function() {
                    return _this.$el.remove();
                });
            }

            this.$el.modal(modalOptions);
        }

        _createClass(Modal, [{
            key: 'setTitle',
            value: function setTitle(titleText) {
                this.title.text(titleText);
            }
        }, {
            key: 'show',
            value: function show() {
                this.$el.modal('show');
            }
        }, {
            key: 'hide',
            value: function hide() {
                this.$el.modal('hide');
            }
        }]);
        window.Modal = Modal
        return Modal;
    })
}
var myTestModal = new Modal('blah', {
    title: 'this is a test',
    destroyOnHide: true,
    type: 'wide'
});







require([
        "jquery",
        "underscore",
        "splunkjs/mvc",
        "splunkjs/mvc/utils",
        "splunkjs/mvc/tokenutils",
        "splunkjs/mvc/simplexml",
        "splunkjs/mvc/searchmanager",
        "/static/app/Splunk_Security_Essentials/components/data/sendTelemetry.js",
        //"components/splunk/AlertModal",
        //"views/shared/AlertModal.js",
        //"views/shared/Modal.js",
        // "/static/js/views/shared/Modal.js",

        //        "components/controls/Modal",
        "splunkjs/ready!",
        "bootstrap.tooltip",
        "bootstrap.popover",
        "css!../app/Splunk_Security_Essentials/style/data_source_check.css"
        //'json!components/data/ShowcaseInfo.json'
    ],
    function(
        $,
        _,
        mvc,
        utils,
        TokenUtils,
        DashboardController,
        SearchManager,
        Telemetry,
        //AlertModal,
        // Modal,
        Ready //,
        //ShowcaseInfo
    ) {

        var HTMLBlock = ""
        var unsubmittedTokens = mvc.Components.getInstance('default');
        var submittedTokens = mvc.Components.getInstance('submitted');
        var myDataset = "No dataset provided"

        var items = new Object
        appName = "Splunk_Security_Essentials"
        ShowcaseInfo = ""
        $("#bookmark_table").append("<table style=\"\" id=\"main_table\" class=\"table table-chrome\" ><thead><tr class=\"dvbanner\"><th style=\"width: 20px; text-align: center\" class=\"tableexpand\"><i class=\"icon-info\"></i></th><th class=\"tableExample\">Example Content</th><th class=\"tableChangeStatus\" style=\"text-align: center\">Change Status</th><th style=\"text-align: center\" class=\"tablebookmarked\">Bookmarked</th><th style=\"text-align: center\" class=\"tableawaitingdata\">Awaiting Data</th><th style=\"text-align: center\" class=\"tablereadyfordeploy\">Ready for Deployment</th><th style=\"text-align: center\" class=\"tabledeploymentissues\">Deployment Issues</th><th style=\"text-align: center\" class=\"tableneedstuning\">Needs Tuning</th><th style=\"text-align: center\" class=\"tablesuccess\">Successfully Implemented</th></tr></thead><tbody id=\"main_table_body\"></tbody></table>")
        $.getJSON('/static/app/Splunk_Security_Essentials/components/data/ShowcaseInfo.json', function(data) {
            var ShowcaseInfo = data
            
            var bookmarkItems = []
            $.ajax({ url: '/splunkd/__raw/servicesNS/nobody/Splunk_Security_Essentials/storage/collections/data/bookmark', async: false, success: function(returneddata) { bookmarkItems = returneddata } });
            
            var showcaseStatus = new Object()
            for (var i = 0; i < bookmarkItems.length; i++) {
                if(bookmarkItems[i].status == "needTuning")
                    bookmarkItems[i].status = "needsTuning" // Fixing a typo along the away
                showcaseStatus[bookmarkItems[i].showcase_name] = bookmarkItems[i].status

            }
            window.showcaseStatus = showcaseStatus
            
            var ShowcaseList = Object.keys(ShowcaseInfo.summaries)
            var newShowcaseInfo = new Object()
            newShowcaseInfo.roles = new Object()
            newShowcaseInfo.roles.default = new Object()
            newShowcaseInfo.roles.default.summaries = []
            newShowcaseInfo.summaries = new Object()

            var custombookmarkItems = []
            $.ajax({ url: '/splunkd/__raw/servicesNS/nobody/Splunk_Security_Essentials/storage/collections/data/bookmark_custom', async: false, success: function(returneddata) { custombookmarkItems = returneddata } });
         //   console.log("My bookmark, and count", custombookmarkItems, custombookmarkItems.length)
            $("#customSearches").find("text").text(custombookmarkItems.length)
            for(var i=0; i < custombookmarkItems.length; i++){
                var shortName = custombookmarkItems[i].showcase_name.replace(/ /g, "_").replace(/[^a-zA-Z0-9_]/g, "")
                var obj = new Object()
                obj.name = "Custom: " + custombookmarkItems[i].showcase_name
                if(typeof showcaseStatus[custombookmarkItems[i].showcase_name] == "undefined"){
                    obj.bookmark_status = custombookmarkItems[i].status
                  //  console.log("Checking the showcase.. no match for ", showcaseStatus, custombookmarkItems[i].showcase_name)
                }else{
                    obj.bookmark_status = showcaseStatus[custombookmarkItems[i].showcase_name]
                 //   console.log("Checking the showcase.. got a match for ", showcaseStatus, custombookmarkItems[i].showcase_name)
                }
                var datestring = new Date(custombookmarkItems[i]._time*1000)
                obj.description = custombookmarkItems[i].description + "<br />Added on " + datestring.toISOString().split('T')[0] + " by " + custombookmarkItems[i].user
                obj.datasource = custombookmarkItems[i].datasource
                obj.journey = custombookmarkItems[i].journey || ""
                obj.isCustom = true
                obj._key = custombookmarkItems[i]._key
                newShowcaseInfo['summaries'][shortName] = obj
                newShowcaseInfo.roles.default.summaries.push(shortName)
            }
            
           // console.log("Before: ", ShowcaseInfo)
           //console.log("ShowcaseList", ShowcaseList)
            for (var i = 0; i < ShowcaseList.length; i++) {
                var showcaseName = ShowcaseList[i]
                //console.log("Running(1).. ", showcaseName)
                if(typeof ShowcaseInfo.summaries[showcaseName].datasource != "undefined"){
                    var sources = ShowcaseInfo.summaries[showcaseName].datasource.split(/\|/g)
                    for(var g = 0; g < sources.length; g++){
                        window.allDataSources[sources[g]] = 1
                    }
                }
                //console.log("Running.. ", showcaseName)
                if ( (typeof showcaseStatus[ShowcaseInfo['summaries'][showcaseName]['name']] == "undefined" || showcaseStatus[ShowcaseInfo['summaries'][showcaseName]['name']] == "none")  && typeof ShowcaseInfo['summaries'][showcaseName]['bookmark_status'] == "undefined"){
                    //console.log(showcaseName,ShowcaseInfo['summaries'][showcaseName], ShowcaseInfo['summaries'][showcaseName]['name'], showcaseStatus[ShowcaseInfo['summaries'][showcaseName]['name']], "is out!")
                    delete ShowcaseInfo['summaries'][showcaseName]
                    ShowcaseInfo.roles.default.summaries.splice(i, 1)
                } else {
                    //console.log(showcaseName, "is in!")
                    if(typeof showcaseStatus[ShowcaseInfo['summaries'][showcaseName]['name']] != "undefined"){
                        ShowcaseInfo['summaries'][showcaseName]['bookmark_status'] = showcaseStatus[ShowcaseInfo['summaries'][showcaseName]['name']]
                    }  
                    newShowcaseInfo['summaries'][showcaseName] = ShowcaseInfo['summaries'][showcaseName]
                    newShowcaseInfo.roles.default.summaries.push(showcaseName)
                   // console.log("Here's my new showcase", newShowcaseInfo)
                }
            }
            ShowcaseInfo = newShowcaseInfo

            if(ShowcaseInfo.roles.default.summaries.length == 0){
                setTimeout(function(){
                    noContentMessage()
                }, 500)
                
            }
          // console.log("After: ", ShowcaseInfo)
         //  console.log("After new: ", newShowcaseInfo)
            ShowcaseInfo.roles.default.summaries.sort(function(a, b) {
                if (ShowcaseInfo.summaries[a].name > ShowcaseInfo.summaries[b].name) {
                    return 1;
                }
                if (ShowcaseInfo.summaries[a].name < ShowcaseInfo.summaries[b].name) {
                    return -1;
                }
                return 0;
            });
            for (var i = 0; i < ShowcaseInfo.roles.default.summaries.length; i++) {
                summary = ShowcaseInfo.summaries[ShowcaseInfo.roles.default.summaries[i]]
                addItem(summary, ShowcaseInfo.roles.default.summaries[i])
            }

            addingIndividualContent.resolve()
            window.ShowcaseInfo = ShowcaseInfo
            updateDataSourceBlock()

            $("#layout1").append(HTMLBlock) //#main_content
            
            $("#layout1").append('<div id="bottomTextBlock" style=""></div>')
            contentMessage()
            
            $(".tabledemo").css("text-align", "center")
            $(".tablelive").css("text-align", "center")
            $(".tableaccel").css("text-align", "center")
            $(".panel-body").css("padding", "0px")
        });




        if ($(".dvTooltip").length > 0) { $(".dvTooltip").tooltip() }
        if ($(".dvPopover").length > 0) { $(".dvPopover").popover() }
        

        //ProcessSearchQueue()
        $(".data_check_table").find("tr").each(function(num, blah) { $(blah).find("td").first().css("width", "20%") })
        $(".data_check_table").find("tr").each(function(num, blah) { $(blah).find("td").last().css("width", "65%") })

        unsubmittedTokens.set(myDataset.replace(/\W/g, ""), "Test");

        submittedTokens.set(unsubmittedTokens.toJSON());



        $("#clearbookmarkLink").click(function(){
            

            var confirmClearModal = new Modal('confirmClear', {
                title: 'Are You Sure?',
                destroyOnHide: true,
                type: 'wide'
            });
            $(confirmClearModal.$el).on("hide", function() {
                // Not taking any action on hide, but you can if you want to!
            })

            confirmClearModal.body.addClass('mlts-modal-form-inline').append("<p>Are you sure you want to clear the bookmarks?</p>")

            confirmClearModal.footer.append( $('<button>').attr({
                type: 'button',
                'data-dismiss': 'modal'
            }).addClass('btn  ').text('No').on('click', function() {
                confirmClearModal.hide()
            }),  $('<button>').attr({
                type: 'button',
                'data-dismiss': 'modal'
            }).addClass('btn btn-primary ').text('Yes').on('click', function() {
                confirmClearModal.hide()

                var resetSearch = new SearchManager({
                    "id": "resetSearch",
                    "cancelOnUnload": true,
                    "latest_time": "0",
                    "sample_ratio": null,
                    "status_buckets": 0,
                    "autostart": true,
                    "earliest_time": "now",
                    "search": '| makeresults | append [| inputlookup bookmark_lookup| multireport [| eval create="| makeresults | eval _time = " . _time . ", showcase_name=\\"" . showcase_name . "\\", status=\\"" . status . "\\", user=\\"" . coalesce(user, "") . "\\"" | stats values(create) as search_string | eval lineone = mvindex(search_string, 0), linetwo = mvindex(search_string,1, mvcount(search_string)) | eval search_string = lineone . " | append [" . mvjoin(linetwo, "] | append [") . "] | outputlookup bookmark_lookup" , user="admin", _time = now(), message="Cleared Bookmark List in Splunk Security Essentials. Use search_string to restore" | fields - line* | collect index=_internal ] [| where showcase_name = "impossible" | outputlookup bookmark_lookup]] | append [| inputlookup bookmark_custom_lookup| multireport [| eval create="| makeresults | eval _time = " . _time . ", showcase_name=\\"" . showcase_name . "\\", description=\\"" . description . "\\", datasource=\\"" . datasource . "\\", journey=\\"" . journey . "\\", status=\\"" . status . "\\", user=\\"" . coalesce(user, "") . "\\"" | stats values(create) as search_string  | eval lineone = mvindex(search_string, 0), linetwo = coalesce(mvindex(search_string,1, mvcount(search_string)),"") | eval search_string = lineone . " | append [" . mvjoin(linetwo, "] | append [") . "] | outputlookup bookmark_custom_lookup" , user="admin", _time = now(), message="Custom Content List in Splunk Security Essentials. Use search_string to restore" | fields - line* | collect index=_internal ] [| where showcase_name = "impossible" | outputlookup bookmark_custom_lookup]]',
                    "app": utils.getCurrentApp(),
                    "auto_cancel": 90,
                    "preview": true,
                    "runWhenTimeIsUndefined": false
                }, { tokens: false });
    
    
                resetSearch.on('search:done', function(properties) {
    
                        var successClearModal = new Modal('successClear', {
                            title: 'History Cleared',
                            destroyOnHide: true,
                            type: 'wide'
                        });
                        $(successClearModal.$el).on("hide", function() {
                            // Not taking any action on hide, but you can if you want to!
                        })
    
                        successClearModal.body.addClass('mlts-modal-form-inline').append("<p>Success!</p>")
    
                        successClearModal.footer.append( $('<button>').addClass('mlts-modal-submit').attr({
                            type: 'button',
                            'data-dismiss': 'modal'
                        }).addClass('btn btn-primary mlts-modal-submit').attr("id", "saveNewFilters").text('Okay').on('click', function() {
                            successClearModal.hide()
                        }))
                        successClearModal.show()
    
                        $("text.single-result").text("0")
                        
                        $("#main_table_body").find("tr").remove()
                        noContentMessage()
                    
                })
    
    
                resetSearch.on('search:error', function(properties) {
    
                    var failureClearModal = new Modal('failClear', {
                        title: 'Unable to Clear History',
                        destroyOnHide: true,
                        type: 'wide'
                    });
                    $(failureClearModal.$el).on("hide", function() {
                        // Not taking any action on hide, but you can if you want to!
                    })
    
                    failureClearModal.body.addClass('mlts-modal-form-inline').append("<p>Failed to Clear History! The query itself is below:</p><pre>" + '| makeresults | append [| inputlookup bookmark_lookup| multireport [| eval create="| makeresults | eval _time = " . _time . ", showcase_name=\\"" . showcase_name . "\\", status=\\"" . status . "\\", user=\\"" . coalesce(user, "") . "\\"" | stats values(create) as search_string | eval lineone = mvindex(search_string, 0), linetwo = mvindex(search_string,1, mvcount(search_string)) | eval search_string = lineone . " | append [" . mvjoin(linetwo, "] | append [") . "] | outputlookup bookmark_lookup" , user="admin", _time = now(), message="Cleared Bookmark List in Splunk Security Essentials. Use search_string to restore" | fields - line* | collect index=_internal ] [| where showcase_name = "impossible" | outputlookup bookmark_lookup]] | append [| inputlookup bookmark_custom_lookup| multireport [| eval create="| makeresults | eval _time = " . _time . ", showcase_name=\\"" . showcase_name . "\\", description=\\"" . description . "\\", datasource=\\"" . datasource . "\\", journey=\\"" . journey . "\\", status=\\"" . status . "\\", user=\\"" . coalesce(user, "") . "\\"" | stats values(create) as search_string  | eval lineone = mvindex(search_string, 0), linetwo = coalesce(mvindex(search_string,1, mvcount(search_string)),"") | eval search_string = lineone . " | append [" . mvjoin(linetwo, "] | append [") . "] | outputlookup bookmark_custom_lookup" , user="admin", _time = now(), message="Custom Content List in Splunk Security Essentials. Use search_string to restore" | fields - line* | collect index=_internal ] [| where showcase_name = "impossible" | outputlookup bookmark_custom_lookup]]' + "</pre>")
    
                    failureClearModal.footer.append( $('<button>').addClass('mlts-modal-submit').attr({
                        type: 'button',
                        'data-dismiss': 'modal'
                    }).addClass('btn btn-primary mlts-modal-submit').attr("id", "saveNewFilters").text('Okay').on('click', function() {
                        failureClearModal.hide()
                    }))
                    failureClearModal.show()
    
                })
                resetSearch.on('search:fail', function(properties) {
    
                    var failureClearModal = new Modal('failClear', {
                        title: 'Unable to Clear History',
                        destroyOnHide: true,
                        type: 'wide'
                    });
                    $(failureClearModal.$el).on("hide", function() {
                        // Not taking any action on hide, but you can if you want to!
                    })
    
                    failureClearModal.body.addClass('mlts-modal-form-inline').append("<p>Failed to Clear History! The query itself is below:</p><pre>" + '| makeresults | append [| inputlookup bookmark_lookup| multireport [| eval create="| makeresults | eval _time = " . _time . ", showcase_name=\\"" . showcase_name . "\\", status=\\"" . status . "\\", user=\\"" . coalesce(user, "") . "\\"" | stats values(create) as search_string | eval lineone = mvindex(search_string, 0), linetwo = mvindex(search_string,1, mvcount(search_string)) | eval search_string = lineone . " | append [" . mvjoin(linetwo, "] | append [") . "] | outputlookup bookmark_lookup" , user="admin", _time = now(), message="Cleared Bookmark List in Splunk Security Essentials. Use search_string to restore" | fields - line* | collect index=_internal ] [| where showcase_name = "impossible" | outputlookup bookmark_lookup]] | append [| inputlookup bookmark_custom_lookup| multireport [| eval create="| makeresults | eval _time = " . _time . ", showcase_name=\\"" . showcase_name . "\\", description=\\"" . description . "\\", datasource=\\"" . datasource . "\\", journey=\\"" . journey . "\\", status=\\"" . status . "\\", user=\\"" . coalesce(user, "") . "\\"" | stats values(create) as search_string  | eval lineone = mvindex(search_string, 0), linetwo = coalesce(mvindex(search_string,1, mvcount(search_string)),"") | eval search_string = lineone . " | append [" . mvjoin(linetwo, "] | append [") . "] | outputlookup bookmark_custom_lookup" , user="admin", _time = now(), message="Custom Content List in Splunk Security Essentials. Use search_string to restore" | fields - line* | collect index=_internal ] [| where showcase_name = "impossible" | outputlookup bookmark_custom_lookup]]' + "</pre>")
    
                    failureClearModal.footer.append( $('<button>').addClass('mlts-modal-submit').attr({
                        type: 'button',
                        'data-dismiss': 'modal'
                    }).addClass('btn btn-primary mlts-modal-submit').attr("id", "saveNewFilters").text('Okay').on('click', function() {
                        failureClearModal.hide()
                    }))
                    failureClearModal.show()
    
                })

            }))
            confirmClearModal.show()



            

        })

    }
);


function doToggle(element) {
    if ($("#expand-" + element).find("i").attr("class") == "icon-chevron-down") {
        $("#description-" + element).css("display", "none")
        $("#expand-" + element).find("i").attr("class", "icon-chevron-right")
    } else {
        $("#description-" + element).css("display", "table-row")
            //$("#row-" + element).after($("#description-" + element))

        $("#expand-" + element).find("i").attr("class", "icon-chevron-down")
            //$("#expand-" + element).find("img")[0].src = $("#expand-" + element).find("img")[0].src.replace("downarrow", "uparrow")
        $("#description-" + element).find("td").css("border-top", 0)
    }

}

function addCustom(){

    var newCustomModal = new Modal('newCustom', {
        title: 'Add Custom Content',
        destroyOnHide: true,
        type: 'wide'
    });
    var dataSources = ""
    var myKeys = Object.keys(window.allDataSources).sort()
    for(var i = 0; i < myKeys.length; i++){
        if(myKeys[i] != "Other")
            dataSources += '<option value="' + myKeys[i] + '">' + myKeys[i] + '</option>'
    }
    dataSources += '<option value="Other">Other</option>'
    var myBody = $('<div id="addCustomDiv"></div>')
    myBody.append(  $('<label for="customName">Name</label><input name="customName" id="customName" type="text" />'),
                    $('<label for="customJourney">Journey</label><select name="customJourney" id="customJourney"><option value="Stage_1">Stage 1</option><option value="Stage_2">Stage 2</option><option value="Stage_3">Stage 3</option><option value="Stage_4">Stage 4</option><option value="Stage_5">Stage 5</option><option value="Stage_6">Stage 6</option></select>'),
                    $('<label for="customStatus">Status</label><select name="customStatus" id="customStatus"><option value="bookmarked">Bookmarked</option><option value="needData">Awaiting Data</option><option value="inQueue">Ready for Deployment</option><option value="issuesDeploying">Deployment Issues</option><option value="needsTuning">Needs Tuning</option><option value="successfullyImplemented">Successfully Implemented</option></select>'),
                    $('<label for="customDatasource">Data Source</label><select name="customDatasource" id="customDatasource">' + dataSources + '</select>'),
                    $('<label for="customDescription">Description</label><textarea name="customDescription" id="customDescription" />'))

    $(newCustomModal.$el).on("hide", function() {
        // Not taking any action on hide, but you can if you want to!
    })

    newCustomModal.body.addClass('mlts-modal-form-inline').append("<p>Warning: This functionality is in beta.</p>", myBody)

        newCustomModal.footer.append($('<button>').addClass('mlts-modal-cancel').attr({
            type: 'button',
            'data-dismiss': 'modal'
        }).addClass('btn btn-default mlts-modal-cancel').text('Cancel'), $('<button>').addClass('mlts-modal-submit').attr({
        type: 'button',
        'data-dismiss': 'modal'
    }).addClass('btn btn-primary mlts-modal-submit').attr("id", "saveNewFilters").text('Add').on('click', function() {

        require(["/static/app/Splunk_Security_Essentials/components/data/sendTelemetry.js"], function(Telemetry) {
            Telemetry.SendTelemetryToSplunk("bookmarkChange", { "status": "addedCustomEntry"})
        })
        var record = {_time: (new Date).getTime() / 1000, journey: $("#customJourney").val(), showcase_name: $("#customName").val(), status: $("#customStatus").val(), datasource: $("#customDatasource").val(), description: $("#customDescription").val(), user: Splunk.util.getConfigValue("USERNAME") }
        var newkey
        $.ajax({
            url: '/en-US/splunkd/__raw/servicesNS/nobody/Splunk_Security_Essentials/storage/collections/data/bookmark_custom',
            type: 'POST',
            contentType: "application/json",
            async: false,
            data: JSON.stringify(record),
            success: function(returneddata) { newkey = returneddata }
        })

        var newObj = new Object()
        newObj.name = "Custom: " + record.showcase_name
        newObj.bookmark_status = record.status
        newObj.datasource = record.datasource
        newObj.journey = record.journey
        newObj._key = newkey
        newObj.description = record.description + "<br />Added on " + (new Date()).toISOString().split('T')[0] + " by " + record.user
        var shortName = newObj.name.replace(/ /g, "_").replace(/[^a-zA-Z0-9_]/g, "")
        window.ShowcaseInfo['summaries'][shortName] = newObj
        window.ShowcaseInfo['roles']['default']['summaries'].push(shortName)
        addItem(newObj, shortName)
        updateDataSourceBlock()
    }))
    newCustomModal.show()
}

$("#addCustomLink").click(function(){
    addCustom()
})


$("#restorebookmarkLink").find("a").attr("href", "/app/Splunk_Security_Essentials/search?q=search%20index%3D_internal%20Splunk%20Security%20Essentials%20use%20search_string%20to%20restore%20message%3D*%20search_string%3D*%20user%3D*%20%7C%20table%20_time%20user%20message%20search_string&display.page.search.mode=smart&earliest=-90d%40d&latest=now")
$("#restorebookmarkLink").find("a").attr("_target", "blank")

function noContentMessage(){
    $("#bottomTextBlock").css("background-color", "white")
    $("#bottomTextBlock").css("text-align", "center")
    $("#bottomTextBlock").html("<h3>No Content Bookmarked</h3><p>Please visit the <a href=\"contents\">Security Content page</a> to view the content in Splunk Security Essentials, and bookmark what you find useful.</p>")
    $("#dataSourcePanel").html("")
}
function contentMessage(){
    $("#bottomTextBlock").html('<div class="printandexporticons"><a href="#" id="printUseCaseIcon" onclick="doPrint(); return false;"><i class="icon-print icon-no-underline" style="font-size: 16pt;" /> Print Page </a>&nbsp;&nbsp;<a href="#" id="downloadUseCaseIcon" onclick="DownloadAllUseCases(); return false;"><i class="icon-export" style="font-size: 16pt;" /> Export Content List </a></div>')
    $("#bottomTextBlock").css("background-color","#eee")
    $("#bottomTextBlock").css("text-align", "right")
    
}
function addItem(summary, showcaseName){

        //console.log("Adding Item", summary, showcaseName)
        
             summary.dashboard = summary.dashboard || ""
             dashboardname = summary.dashboard || ""
             if (dashboardname.indexOf("?") > 0) {
                 dashboardname = dashboardname.substr(0, dashboardname.indexOf("?"))
             }
             example = summary.name
             //panelStart = "<div id=\"rowDescription\" class=\"dashboard-row dashboard-rowDescription splunk-view\">        <div id=\"panelDescription\" class=\"dashboard-cell last-visible splunk-view\" style=\"width: 100%;\">            <div class=\"dashboard-panel clearfix\" style=\"min-height: 0px;\"><h2 class=\"panel-title empty\"></h2><div id=\"view_description\" class=\"fieldset splunk-view editable hide-label hidden empty\"></div>                                <div class=\"panel-element-row\">                    <div id=\"elementdescription\" class=\"dashboard-element html splunk-view\" style=\"width: 100%;\">                        <div class=\"panel-body html\"> <div id=\"contentDescription\"> "
             //panelEnd =  "</div></div>                    </div>                </div>            </div>        </div>    </div>"
             var demo = ""
             var live = ""
             var accel = ""
             if (1 == 1) {
                 exampleText = ""
                 exampleList = $('<span></span>')
                     //console.log("ShowcaseInfo: New Title", document.title)
                 if (typeof summary.examples != "undefined") {
                     exampleText = summary.examples.length > 1 ? '<b>Examples:</b>' : '<b>Example:</b>';
                     exampleList = $('<ul class="example-list"></ul>');

                     summary.examples.forEach(function(example) {
                         var showcaseURLDefault = summary.dashboard;
                         if (summary.dashboard.indexOf("?") > 0) {
                             showcaseURLDefault = summary.dashboard.substr(0, summary.dashboard.indexOf("?"))
                         }

                         var url = showcaseURLDefault + '?ml_toolkit.dataset=' + example.name;
                         if (example.label == "Demo Data") {
                             demo = example.name
                         }
                         if (example.label == "Live Data") {
                             live = example.name
                         }
                         if (example.label == "Accelerated Data") {
                             accel = example.name
                         }
                         //exampleList.append($('<li></li>').text(example.label));
                         exampleList.append($('<li></li>').append($('<a></a>').attr('href', url).attr("target", "_blank").attr("class", "external drilldown-link").append(example.label)));

                     });
                 }

                     var tablebookmarked = ((summary.bookmark_status == "bookmarked") ? "Yes" : "")
                     var tableawaitingdata = ((summary.bookmark_status == "needData") ? "Yes" : "")
                     var tablereadyfordeploy = ((summary.bookmark_status == "inQueue") ? "Yes" : "")
                     var tabledeploymentissues = ((summary.bookmark_status == "issuesDeploying") ? "Yes" : "")
                     var tableneedstuning = ((summary.bookmark_status == "needsTuning") ? "Yes" : "")
                     var tablesuccess = ((summary.bookmark_status == "successfullyImplemented") ? "Yes" : "")




                     var bookmarkWidget = ""


                     if (typeof forSearchBuilder == "undefined" || forSearchBuilder != true) {
                         bookmarkWidget = '<i class="icon-gear" title="Change Status" onclick=\'createbookmarkBox(this, "' + summary.name + '"); return false;\' style=" height: 16pt; font-size: 20pt;;" />'

                         window.createbookmarkBox = function(obj, name) {
                       //     console.log("click - Running with", obj, name, obj.outerHTML)
                            



                             var boxHTML = $('<div id="box-' + name.replace(/ /g, "_").replace(/[^a-zA-Z0-9_]/g, "") + '" style="background-color: white; position: absolute; border: 1px gray solid; padding: 7px; width: 210px; height: 225px;"></div>').append('<i class="icon-close" onclick="$(this).parent().remove()" style="float: right;"></i>', "<h5 style=\"padding-top: 0px;padding-bottom: 5px; margin: 0; \">Change Status</h5>")
                             var unmarkBox = $('<p style="margin: 0; cursor: pointer"> <a href="#" onclick="return false;">Remove from List</a></p>')
                             unmarkBox.click(function() {
                                 setbookmarkStatus(name, "none")
                                    
                                for(var i = 0; i < ShowcaseInfo.roles.default.summaries.length; i++){
                                    if(typeof ShowcaseInfo.summaries[ShowcaseInfo.roles.default.summaries[i]] != "undefined"){
                                        if(ShowcaseInfo.summaries[ShowcaseInfo.roles.default.summaries[i]].name.replace(/^Custom: /, "") == name.replace(/^Custom: /, "")){
                                            removeRow( ShowcaseInfo.roles.default.summaries[i])
                                        }
                                    }
                                }
                                 $("td:contains(" + name + ")").parent().find(":contains(Yes)").text("")
                                 $("#box-" + name.replace(/ /g, "_").replace(/[^a-zA-Z0-9_]/g, "")).html('<i class="icon-check" style="font-size: 80pt; line-height: 150px; color: darkgreen"></i>')
                                 $("#box-" + name.replace(/ /g, "_").replace(/[^a-zA-Z0-9_]/g, "")).css("text-align", "center")
                                 setTimeout(function() {
                                     $("#box-" + name.replace(/ /g, "_").replace(/[^a-zA-Z0-9_]/g, "")).remove()
                                 }, 1000)
                             })
                             var bookmarkedBox = $('<p style="margin: 0; cursor: pointer"><a href="#" onclick="return false;">Bookmarked</a></p>')
                             bookmarkedBox.click(function() {
                                 setbookmarkStatus(name, "bookmarked")
                                 $("td:contains(" + name + ")").parent().find(":contains(Yes)").text("")
                                 $("td:contains(" + name + ")").parent().find(".tablebookmarked").text("Yes")
                                 $("#box-" + name.replace(/ /g, "_").replace(/[^a-zA-Z0-9_]/g, "")).html('<i class="icon-check" style="font-size: 80pt; line-height: 150px; color: darkgreen"></i>')
                                 $("#box-" + name.replace(/ /g, "_").replace(/[^a-zA-Z0-9_]/g, "")).css("text-align", "center")
                                 setTimeout(function() {
                                     $("#box-" + name.replace(/ /g, "_").replace(/[^a-zA-Z0-9_]/g, "")).remove()
                                 }, 1000)
                             })
                             var hrBox = $("<hr style=\"margin-top: 10px; margin-bottom: 10px; padding: 0;\" ><h5 style=\"padding-top: 0px;padding-bottom: 5px;margin: 0;\">(Optional) Status Detail</h5>")
                             var needDataBox = $('<p style="margin: 0; cursor: pointer"><a href="#" onclick="return false;">Awaiting Data</a></p>')
                             needDataBox.click(function() {
                                 setbookmarkStatus(name, "needData")
                                 $("td:contains(" + name + ")").parent().find(":contains(Yes)").text("")
                                 $("td:contains(" + name + ")").parent().find(".tableawaitingdata").text("Yes")
                                 $("#box-" + name.replace(/ /g, "_").replace(/[^a-zA-Z0-9_]/g, "")).html('<i class="icon-check" style="font-size: 80pt; line-height: 150px; color: darkgreen"></i>')
                                 $("#box-" + name.replace(/ /g, "_").replace(/[^a-zA-Z0-9_]/g, "")).css("text-align", "center")
                                 setTimeout(function() {
                                     $("#box-" + name.replace(/ /g, "_").replace(/[^a-zA-Z0-9_]/g, "")).remove()
                                 }, 1000)
                             })
                             var inQueueBox = $('<p style="margin: 0; cursor: pointer"><a href="#" onclick="return false;">Ready for Deployment</a></p>')
                             inQueueBox.click(function() {
                                 setbookmarkStatus(name, "inQueue")
                                 $("td:contains(" + name + ")").parent().find(":contains(Yes)").text("")
                                 $("td:contains(" + name + ")").parent().find(".tablereadyfordeploy").text("Yes")
                                 $("#box-" + name.replace(/ /g, "_").replace(/[^a-zA-Z0-9_]/g, "")).html('<i class="icon-check" style="font-size: 80pt; line-height: 150px; color: darkgreen"></i>')
                                 $("#box-" + name.replace(/ /g, "_").replace(/[^a-zA-Z0-9_]/g, "")).css("text-align", "center")
                                 setTimeout(function() {
                                     $("#box-" + name.replace(/ /g, "_").replace(/[^a-zA-Z0-9_]/g, "")).remove()
                                 }, 1000)
                             })
                             var issuesDeployingBox = $('<p style="margin: 0; cursor: pointer"><a href="#" onclick="return false;">Deployment Issues</a></p>')
                             issuesDeployingBox.click(function() {
                                 setbookmarkStatus(name, "issuesDeploying")
                                 $("td:contains(" + name + ")").parent().find(":contains(Yes)").text("")
                                 $("td:contains(" + name + ")").parent().find(".tabledeploymentissues").text("Yes")
                                 $("#box-" + name.replace(/ /g, "_").replace(/[^a-zA-Z0-9_]/g, "")).html('<i class="icon-check" style="font-size: 80pt; line-height: 150px; color: darkgreen"></i>')
                                 $("#box-" + name.replace(/ /g, "_").replace(/[^a-zA-Z0-9_]/g, "")).css("text-align", "center")
                                 setTimeout(function() {
                                     $("#box-" + name.replace(/ /g, "_").replace(/[^a-zA-Z0-9_]/g, "")).remove()
                                 }, 1000)
                             })
                             var needsTuningBox = $('<p style="margin: 0; cursor: pointer"><a href="#" onclick="return false;">Needs Tuning</a></p>')
                             needsTuningBox.click(function() {
                                 setbookmarkStatus(name, "needsTuning")
                                 $("td:contains(" + name + ")").parent().find(":contains(Yes)").text("")
                                 $("td:contains(" + name + ")").parent().find(".tableneedstuning").text("Yes")
                                 $("#box-" + name.replace(/ /g, "_").replace(/[^a-zA-Z0-9_]/g, "")).html('<i class="icon-check" style="font-size: 80pt; line-height: 150px; color: darkgreen"></i>')
                                 $("#box-" + name.replace(/ /g, "_").replace(/[^a-zA-Z0-9_]/g, "")).css("text-align", "center")
                                 setTimeout(function() {
                                     $("#box-" + name.replace(/ /g, "_").replace(/[^a-zA-Z0-9_]/g, "")).remove()
                                 }, 1000)
                             })
                             var successfullyImplementedBox = $('<p style="margin: 0; cursor: pointer"><a href="#" onclick="return false;">Successfully Implemented</a></div>')
                             successfullyImplementedBox.click(function() {
                                 setbookmarkStatus(name, "successfullyImplemented")
                                 $("td:contains(" + name + ")").parent().find(":contains(Yes)").text("")
                                 $("td:contains(" + name + ")").parent().find(".tablesuccess").text("Yes")
                                 $("#box-" + name.replace(/ /g, "_").replace(/[^a-zA-Z0-9_]/g, "")).html('<i class="icon-check" style="font-size: 80pt; line-height: 150px; color: darkgreen"></i>')
                                 $("#box-" + name.replace(/ /g, "_").replace(/[^a-zA-Z0-9_]/g, "")).css("text-align", "center")
                                 setTimeout(function() {
                                     $("#box-" + name.replace(/ /g, "_").replace(/[^a-zA-Z0-9_]/g, "")).remove()
                                 }, 1000)
                             })
                             
                             if(name.indexOf("Custom: ") == 0 ){
                                boxHTML.append(bookmarkedBox, hrBox, needDataBox, inQueueBox, issuesDeployingBox, needsTuningBox, successfullyImplementedBox)
                             }else{
                                boxHTML.append(unmarkBox, bookmarkedBox, hrBox, needDataBox, inQueueBox, issuesDeployingBox, needsTuningBox, successfullyImplementedBox)
                             }
                             var pos = $(obj).offset()
                             var leftPos = pos.left + 15
                             var topPos = pos.top
                             if (leftPos + 200 > $(window).width()) {
                                 leftPos = leftPos - 195;
                                 topPos = topPos + 20;
                             }

                             $(document).keyup(function(e) {

                                 if (e.keyCode === 27)
                                     if (document.getElementById('box-' + name.replace(/ /g, "_").replace(/[^a-zA-Z0-9_]/g, "")) != null) {
                                         $('#box-' + name.replace(/ /g, "_").replace(/[^a-zA-Z0-9_]/g, "")).remove()
                                     }

                             });
                             $(document).mouseup(function(e) {
                                 var container = $('#box-' + name.replace(/ /g, "_").replace(/[^a-zA-Z0-9_]/g, ""))

                                 // if the target of the click isn't the container nor a descendant of the container
                                 if (!container.is(e.target) && container.has(e.target).length === 0) {
                                     container.remove();
                                 }
                             });
                        //     console.log("Adding in boxhtml", boxHTML)
                             $("body").append(boxHTML)
                             $("#" + 'box-' + name.replace(/ /g, "_").replace(/[^a-zA-Z0-9_]/g, "")).css({ top: topPos, left: leftPos })



                         }
                         window.setbookmarkStatus = function(name, status) {
                             
                             $("#row-print-" + toHex(name)).html(BookmarkStatus[status])
                             name = name.replace(/^Custom: /, "")
                             require(["/static/app/Splunk_Security_Essentials/components/data/sendTelemetry.js"], function(Telemetry) {
                                Telemetry.SendTelemetryToSplunk("bookmarkChange", { "status": status, "name": name })
                                })
                             for(var i = 0; i < ShowcaseInfo.roles.default.summaries.length; i++){
                                if(typeof ShowcaseInfo.summaries[ShowcaseInfo.roles.default.summaries[i]] != "undefined"){
                                    if(ShowcaseInfo.summaries[ShowcaseInfo.roles.default.summaries[i]].name.replace(/^Custom: /, "") == name.replace(/^Custom: /, "")){
                                         ShowcaseInfo.summaries[ShowcaseInfo.roles.default.summaries[i]].bookmark_status = status
                                    }
                                 }
                             }

                             var record = { _time: (new Date).getTime() / 1000, showcase_name: name, status: status, user: Splunk.util.getConfigValue("USERNAME") }

                             $.ajax({
                                 url: '/en-US/splunkd/__raw/servicesNS/nobody/Splunk_Security_Essentials/storage/collections/data/bookmark',
                                 type: 'POST',
                                 contentType: "application/json",
                                 async: true,
                                 data: JSON.stringify(record)
                             })
                             updateDataSourceBlock()
                         }
         



                     var rowStatus = "<td style=\"text-align: center\" class=\"tablebookmarked\" id=\"" + toHex(example + "demo") + "\">" + tablebookmarked + "</td>"
                     rowStatus += "<td style=\"text-align: center\" class=\"tableawaitingdata\" id=\"" + toHex(example + "live") + "\">" + tableawaitingdata + "</td>"
                     rowStatus += "<td style=\"text-align: center\" class=\"tablereadyfordeploy\" id=\"" + toHex(example + "accel") + "\">" + tablereadyfordeploy + "</td>"
                     rowStatus += "<td style=\"text-align: center\" class=\"tabledeploymentissues\" id=\"" + toHex(example + "live") + "\">" + tabledeploymentissues + "</td>"
                     rowStatus += "<td style=\"text-align: center\" class=\"tableneedstuning\" id=\"" + toHex(example + "accel") + "\">" + tableneedstuning + "</td>"
                     rowStatus += "<td style=\"text-align: center\" class=\"tablesuccess\" id=\"" + toHex(example + "accel") + "\">" + tablesuccess + "</td>"


                     var description = "" 
                     if(typeof summary.isCustom == "undefined" || summary.isCustom == false){
                        // This is copied from ProcessSummaryUI


                        //var Template = "<div class=\"detailSectionContainer expands\" style=\"display: block; border: black solid 1px; padding-top: 0; \"><h2 style=\"background-color: #F0F0F0; line-height: 1.5em; font-size: 1.2em; margin-top: 0; margin-bottom: 0;\"><a href=\"#\" class=\"dropdowntext\" style=\"color: black;\" onclick='$(\"#SHORTNAMESection\").toggle(); if($(\"#SHORTNAME_arrow\").attr(\"class\")==\"icon-chevron-right\"){$(\"#SHORTNAME_arrow\").attr(\"class\",\"icon-chevron-down\")}else{$(\"#SHORTNAME_arrow\").attr(\"class\",\"icon-chevron-right\")} return false;'>&nbsp;&nbsp;<i id=\"SHORTNAME_arrow\" class=\"icon-chevron-right\"></i> TITLE</a></h2><div style=\"display: none; padding: 8px;\" id=\"SHORTNAMESection\">"
                        var Template = "<table id=\"SHORTNAME_table\" class=\"dvexpand table table-chrome\"><thead><tr><th class=\"expands\"><h2 style=\"line-height: 1.5em; font-size: 1.2em; margin-top: 0; margin-bottom: 0;\"><a href=\"#\" class=\"dropdowntext\" style=\"color: black;\" onclick='$(\"#SHORTNAMESection\").toggle(); if($(\"#SHORTNAME_arrow\").attr(\"class\")==\"icon-chevron-right\"){$(\"#SHORTNAME_arrow\").attr(\"class\",\"icon-chevron-down\"); $(\"#SHORTNAME_table\").addClass(\"expanded\"); $(\"#SHORTNAME_table\").removeClass(\"table-chrome\");  $(\"#SHORTNAME_table\").find(\"th\").css(\"border-top\",\"1px solid darkgray\");  }else{$(\"#SHORTNAME_arrow\").attr(\"class\",\"icon-chevron-right\");  $(\"#SHORTNAME_table\").removeClass(\"expanded\");  $(\"#SHORTNAME_table\").addClass(\"table-chrome\"); } return false;'>&nbsp;&nbsp;<i id=\"SHORTNAME_arrow\" class=\"icon-chevron-right\"></i> TITLE</a></h2></th></tr></thead><tbody><tr><td style=\"display: none; border-top-width: 0;\" id=\"SHORTNAMESection\">"

                        var areaText = ""
                        if (typeof summary.category != "undefined") {
                            areaText = "<p><h2>Category</h2>" + summary.category.split("|").join(", ") + "</p>"
                        }
                        var usecaseText = ""
                        if (typeof summary.category != "undefined") {
                            usecaseText = "<p><h2>Use Case</h2>" + summary.usecase.split("|").join(", ") + "</p>"
                        }

                        var showSPLText = ""
                        var knownFPText = ""
                        if (typeof summary.knownFP != "undefined" && summary.knownFP != "") {
                            knownFPText = Template.replace(/SHORTNAME/g, "knownFP").replace("TITLE", "Known False Positives") + summary.knownFP + "</td></tr></table>" // "<h2>Known False Positives</h2><p>" + summary.knownFP + "</p>"
                        }

                        var howToImplementText = ""
                        if (typeof summary.howToImplement != "undefined" && summary.howToImplement != "") {
                            howToImplementText = Template.replace(/SHORTNAME/g, "howToImplement").replace("TITLE", "How to Implement") + summary.howToImplement + "</td></tr></table>" // "<h2>How to Implement</h2><p>" + summary.howToImplemement + "</p>"
                        }

                        var eli5Text = ""
                        if (typeof summary.eli5 != "undefined" && summary.eli5 != "") {
                            eli5Text = Template.replace(/SHORTNAME/g, "eli5").replace("TITLE", "Detailed Search Explanation") + summary.eli5 + "</td></tr></table>" // "<h2>Detailed Search Explanation</h2><p>" + summary.eli5 + "</p>"
                        }


                        var SPLEaseText = ""
                        if (typeof summary.SPLEase != "undefined" && summary.SPLEase != "") {
                            SPLEaseText = "<h2>SPL Difficulty</h2><p>" + summary.SPLEase + "</p>"
                        }


                        var operationalizeText = ""
                        if (typeof summary.operationalize != "undefined" && summary.operationalize != "") {
                            operationalizeText = Template.replace(/SHORTNAME/g, "operationalize").replace("TITLE", "How To Respond") + summary.operationalize + "</td></tr></table>" // "<h2>Handle Alerts</h2><p>" + summary.operationalize + "</p>"
                        }

                        var relevance = ""
                        if (typeof summary.relevance != "undefined" && summary.relevance != "") {
                            relevance = "<h2>Security Impact</h2><p>" + summary.relevance + "</p>" // "<h2>Handle Alerts</h2><p>" + summary.operationalize + "</p>"
                        }


                        var descriptionText = "<h2>Description</h2>" + summary.description // "<h2>Handle Alerts</h2><p>" + summary.operationalize + "</p>"
                        var alertVolumeText = "<h2>Alert Volume</h2>"



                        //alertVolumeText += "</div></div>"

                        //relevance = summary.relevance ? "<p><h2>Security Impact</h2>" +  + "</p>" : ""

                        per_instance_help = ""
                    
                    
                        panelStart = "<div id=\"rowDescription\" class=\"dashboard-row dashboard-rowDescription splunk-view\">        <div id=\"panelDescription\" class=\"dashboard-cell last-visible splunk-view\" style=\"width: 100%;\">            <div class=\"dashboard-panel clearfix\" style=\"min-height: 0px;\"><h2 class=\"panel-title empty\"></h2><div id=\"view_description\" class=\"fieldset splunk-view editable hide-label hidden empty\"></div>                                <div class=\"panel-element-row\">                    <div id=\"elementdescription\" class=\"dashboard-element html splunk-view\" style=\"width: 100%;\">                        <div class=\"panel-body html\"> <div id=\"contentDescription\"> "
                        panelEnd = "</div></div>                    </div>                </div>            </div>        </div>    </div>"



                        var fullSolutionText = ""
                        if (typeof summary.fullSolution != "undefined") {
                            fullSolutionText += "<br/><h2>Relevant Splunk Premium Solution Capabilities</h2><button class=\"btn\" onclick=\"triggerModal(window.fullSolutionText); return false;\">Find more Splunk content for this Use Case</button>"

                        }

                        var otherSplunkCapabilitiesText = ""

                        var supportingImagesText = ""
                        if (typeof summary.images == "object" && typeof summary.images.length == "number" && summary.images.length > 0) {
                            supportingImagesText = "<table id=\"SHORTNAME_table\" class=\"dvexpand table table-chrome\"><thead><tr><th class=\"expands\"><h2 style=\"line-height: 1.5em; font-size: 1.2em; margin-top: 0; margin-bottom: 0;\"><a href=\"#\" class=\"dropdowntext\" style=\"color: black;\" onclick='$(\"#SHORTNAMESection\").toggle(); if($(\"#SHORTNAME_arrow\").attr(\"class\")==\"icon-chevron-right\"){$(\"#SHORTNAME_arrow\").attr(\"class\",\"icon-chevron-down\"); $(\"#SHORTNAME_table\").addClass(\"expanded\"); $(\"#SHORTNAME_table\").removeClass(\"table-chrome\");  $(\"#SHORTNAME_table\").find(\"th\").css(\"border-top\",\"1px solid darkgray\");  }else{$(\"#SHORTNAME_arrow\").attr(\"class\",\"icon-chevron-right\");  $(\"#SHORTNAME_table\").removeClass(\"expanded\");  $(\"#SHORTNAME_table\").addClass(\"table-chrome\"); } ; window.DoImageSubtitles(); return false;'>&nbsp;&nbsp;<i id=\"SHORTNAME_arrow\" class=\"icon-chevron-right\"></i> TITLE</a></h2></th></tr></thead><tbody><tr><td style=\"display: none; border-top-width: 0;\" id=\"SHORTNAMESection\">"
                            supportingImagesText = supportingImagesText.replace(/SHORTNAME/g, "supportingImages").replace("TITLE", "Screenshots")
                            var images = ""
                            for (var i = 0; i < summary.images.length; i++) {

                                images += "<img class=\"screenshot\" setwidth=\"650\" zoomin=\"true\" src=\"" + summary.images[i].path + "\" title=\"" + summary.images[i].label + "\" />"
                            }
                            supportingImagesText += images
                            supportingImagesText += "</td></tr></table>"

                            var DoImageSubtitles = function(numLoops) {
                                if (typeof numLoops == "undefined")
                                    numLoops = 1
                                var doAnotherLoop = false
                       //         console.log("Starting the Subtitle..")
                                $(".screenshot").each(function(count, img) {
                           //         console.log("got a subtitle", img)

                                    if (typeof $(img).css("width") != "undefined" && parseInt($(img).css("width").replace("px")) > 10 && typeof $(img).attr("processed") == "undefined") {
                                        var width = "width: " + $(img).css("width")

                                        var myTitle = ""
                                        if (typeof $(img).attr("title") != "undefined" && $(img).attr("title") != "") {
                                            myTitle = "<p style=\"color: gray; display: inline-block; clear:both;" + width + "\"><center><i>" + $(img).attr("title") + "</i></center>"

                                        }
                                        $(img).attr("processed", "true")
                                        if (typeof $(img).attr("zoomin") != "undefined" && $(img).attr("zoomin") != "") {
                              //              console.log("Handling subtitle zoom...", width, $(img).attr("zoomin"), $(img).attr("setWidth"), (typeof $(img).attr("zoomin") != "undefined" && $(img).attr("zoomin") != ""))
                                            if (typeof $(img).attr("setwidth") != "undefined" && parseInt($(img).css("width").replace("px")) > parseInt($(img).attr("setwidth"))) {
                                                width = "width: " + $(img).attr("setwidth") + "px"
                                            }
                                            $(img).replaceWith("<div style=\"display: inline-block; margin:10px; border: 1px solid lightgray;" + width + "\"><a href=\"" + $(img).attr("src") + "\" target=\"_blank\">" + img.outerHTML + "</a>" + myTitle + "</div>")
                                        } else {
                                            ($(img)).replaceWith("<div style=\"display: block; margin:10px; border: 1px solid lightgray;" + width + "\">" + img.outerHTML + myTitle + "</div>")
                                        }

                                    } else {
                                        doAnotherLoop = true
                                 //       console.log("Analyzing image: ", $(img).css("width"), $(img).attr("processed"), $(img))
                                    }
                                })
                                if (doAnotherLoop && numLoops < 30) {
                                    numLoops++;
                                    setTimeout(function() { DoImageSubtitles(numLoops) }, 500)
                                }
                            }
                            window.DoImageSubtitles = DoImageSubtitles


                        }

                        var Stage = "<h2><a target=\"_blank\" class=\"external drilldown-icon\" href=\"journey?stage=" + summary.journey.replace(/Stage_/g, "") + "\">" + summary.journey.replace(/_/g, " ") + "</a></h2> "

                        var datasourceText = ""
                        if (typeof summary.datasources == "undefined" && summary.datasource != "undefined") {
                            summary.datasources = summary.datasource
                        }
                        if (typeof summary.datasources != "undefined") {
                            datasources = summary.datasources.split("|")
                            if (datasources.length > 0 && datasourceText == "") {
                                datasourceText = "<h2>Data Sources</h2>"
                            }
                            for (var i = 0; i < datasources.length; i++) {
                                var link = datasources[i].replace(/[^\w\- ]/g, "")
                                var localDescription = datasources[i]
                                datasourceText += "<div class=\"coredatasource\"><a target=\"_blank\" href=\"data_source?datasource=" + link + "\">" + localDescription + "</a></div>"
                            }
                            datasourceText += "<br/><br/>"
                        }



                        var mitreText = ""
                        if (typeof summary.mitre != "undefined" && summary.mitre != "") {
                            mitre = summary.mitre.split("|")
                            if (mitre.length > 0 && mitreText == "") {
                                mitreText = "<h2><a href=\"https://attack.mitre.org/wiki/Main_Page\" target=\"_blank\">MITRE ATT&CK</a> Tactics</h2>"
                            }
                            for (var i = 0; i < mitre.length; i++) {
                                mitreText += "<div class=\"mitre\">" + mitre[i] + "</div>"
                            }
                            mitreText += "<br/><br/>"
                        }

                        var killchainText = ""
                        if (typeof summary.killchain != "undefined" && summary.killchain != "") {
                            killchain = summary.killchain.split("|")
                            if (killchain.length > 0 && killchainText == "") {
                                killchainText = "<h2><a href=\"https://www.lockheedmartin.com/us/what-we-do/aerospace-defense/cyber/cyber-kill-chain.html\" target=\"_blank\">Kill Chain</a> Phases</h2>"
                            }
                            for (var i = 0; i < killchain.length; i++) {
                                killchainText += "<div class=\"killchain\">" + killchain[i] + "</div>"
                            }
                            killchainText += "<br/><br/>"
                        }

                        var cisText = ""
                        if (typeof summary.cis != "undefined") {
                            cis = summary.cis.split("|")
                            for (var i = 0; i < cis.length; i++) {
                                cisText += "<div class=\"cis\">" + cis[i] + "</div>"
                            }
                            cisText += "<br/><br/>"
                        }

                        var technologyText = ""
                        if (typeof summary.technology != "undefined") {
                            technology = summary.technology.split("|")
                            for (var i = 0; i < technology.length; i++) {
                                technologyText += "<div class=\"technology\">" + technology[i] + "</div>"
                            }
                            technologyText += "<br/><br/>"
                        }
                        var YouTubeText = ""
                        if (typeof summary.youtube != "undefined") {
                            YouTubeText = Template.replace(/SHORTNAME/g, "youtube").replace("TITLE", "Search Explanation - Video")
                            YouTubeText += '<div class="auto-resizable-iframe"><div><iframe src="' + summary.youtube + '" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>'
                            YouTubeText += "</div></div><br/><br/></td></tr></table>"
                        }
                        
                        var box1 = '<div style="overflow: hidden; padding: 10px; margin: 0px; width: 63%; min-width:500px; min-height: 250px; display: table-cell; border: 1px solid darkgray;">' + usecaseText + areaText + relevance + alertVolumeText + SPLEaseText + '</div>'
                        
                        var box2 = '<div style="overflow: hidden; padding: 10px; margin: 0px; width: 33%; min-width:250px; min-height: 250px; display: table-cell; border: 1px solid darkgray; border-left: 0">' + Stage + mitreText + killchainText + cisText + technologyText + datasourceText + '</div>'
                        if(typeof summary.isCustom != "undefined"){
                            box1 = ""
                            box2 = box2.replace(/border[^;"]*/, "").replace(/padding[^;"]*/, "")
                        }
                 //       console.log("Here was my summary", summary)
                        
                        description = panelStart + descriptionText + '<br/><div style=" display: table;">' + box1 + box2 + '</div><br/>' + otherSplunkCapabilitiesText + howToImplementText + eli5Text + YouTubeText + knownFPText + operationalizeText + supportingImagesText + showSPLText + per_instance_help + panelEnd
                        
                    


                    // End copied content

                    }else{
                        description = "<h2>Description</h2><p>" + summary.description + "</p>"
                        description += "<h2>Journey Stage</h2><p><a target=\"_blank\" class=\"external drilldown-icon\" href=\"journey?stage=" + summary.journey.replace(/\D/g, "") + "\">" + summary.journey.replace(/_/g, " ") + "</a></p>"

                        var datasourceText = ""
                        if (typeof summary.datasources == "undefined" && summary.datasource != "undefined") {
                            summary.datasources = summary.datasource
                        }
                        if (typeof summary.datasources != "undefined") {
                            datasources = summary.datasources.split("|")
                            if (datasources.length > 0 && datasourceText == "") {
                                datasourceText = "<h2>Data Sources</h2>"
                            }
                            for (var i = 0; i < datasources.length; i++) {
                                var link = datasources[i].replace(/[^\w\- ]/g, "")
                                var localDescription = datasources[i]
                                datasourceText += "<div class=\"coredatasource\"><a target=\"_blank\" href=\"data_source?datasource=" + link + "\">" + localDescription + "</a></div>"
                            }
                            datasourceText += "<br/><br/>"
                        }

                        description += datasourceText

                        description += '<table class="editCustomUseCaseIcons" style="border: 1px solid #eee"><tr><td><a href="#" style="font-color: #555" onclick="editCustom(\'' + showcaseName + '\'); return false;"><i class="icon-pencil" /> Edit</a></td><td><a href="#" style="font-color: #555" onclick="deleteCustomConfirmation(\'' + showcaseName + '\'); return false;"><i class="icon-close" /> Delete</a></td></tr></table>'
                    }

                     $("#main_table_body").append("<tr  class=\"titleRow\" id=\"row-" + toHex(example) + "\" class=\"dvbanner\"><td class=\"tableexpand\" class=\"downarrow\" id=\"expand-" + toHex(example) + "\"><a href=\"#\" onclick=\"doToggle('" + toHex(example) + "'); return false;\"><i class=\"icon-chevron-right\" /></a></td><td class=\"name\"><div></div><a href=\"#\" onclick=\"doToggle('" + toHex(example) + "'); return false;\">" + summary.name + "</a></td><td class=\"tableChangeStatus\" style=\"text-align: center\">" + bookmarkWidget + "</td>" + rowStatus + "</tr>")


                     $("#main_table_body").append("<tr class=\"descriptionRow\" id=\"description-" + toHex(example) + "\" style=\"display: none;\"><td colspan=\"8\">" + description + "</td></tr>")
                     var status_display = BookmarkStatus[summary.bookmark_status]
                     var SPL = $("<div class=\"donotbreak\"></div>")
                     if(typeof summary.examples == "object" && summary.examples.length > 0){
                         SPL.append("<h2>SPL for " + summary.name + "</h2>")
                         for(var i = 0; i < summary.examples.length; i++){
                             if(typeof examples[ summary.examples[i].name ] != "undefined"){
                                //SPL += "<div><h3>" + summary.examples[i].label + "</h3>" + examples[ summary.examples[i].name ].linebylineSPL + "</div>"
                                var localexample = $("<div class=\"donotbreak\"></div>").append( $("<h3>" + summary.examples[i].label + "</h3>"), $(examples[ summary.examples[i].name ].linebylineSPL) )
                                SPL.append(localexample)
                             }
                             
                         }
                   //      console.log("Got this result", summary.name, SPL)
                     }
                     var printableimage = $("")
                     if(typeof summary.printable_image != "undefined"){
                        printableimage = $("<div class=\"donotbreak\" style=\"margin-top: 15px;\"><h2>Screenshot of Demo Data</h2></div>").append($('<img class="printonly" />').attr("src", summary.printable_image))
                        
                     }
                     $("#bookmark_printable_table").append($("<h1>" + summary.name + "</h1><h2>Status</h2><p id=\"row-print-" + toHex(example) + "\">" + status_display + "</p>" + "<h2>App</h2><p id=\"row-print-" + toHex(example) + "\">" + summary.displayapp + "</p>" + $(description.replace(/display: none/g, "")).find("#contentDescription").html()), SPL, printableimage)
                     contentMessage()
                 }


             }

}


var JourneyStageNames = ["N/A", "Collection", "Normalization", "Expansion", "Enrichment", "Automation and Orchestration", "Advanced Detection", "Other"]

var prettyDescriptions = {
    "usecase": {
        "Security Monitoring": "The foundation of security, looking for common activities from common malware and attackers.",
        "Advanced Threat Detection": "Focused on detecting advanced persistent threats, experienced and motivated attackers, and nation-state actors.",
        "Compliance": "Provides assistance in ensuring that organizations are implementing all required monitoring for the regulatory environment.",
        "Insider Threat": "Detect internal employees who have gone rogue, and are looking to hurt the company, defraud the company, or steal from customers.",
        "Application Security": "Monitor application logs to detect signs that a web application is being directly attacked."
    }
}

var allFilters = [{ //This is from the list of all filters for the modal, not for the default!
    "fieldName": "journey",
    "displayName": "Journey",
    "type": "search",
    "export": "yes",
    "itemSort": ["Stage_1", "Stage_2", "Stage_3", "Stage_4", "Stage_5", "Stage_6"], //JourneyAdjustment
    "style": "height: 1.75em;",
    "width": "250px",
    "ulStyle": "column-count: 1;",
    "manipulateDisplay": function(label) {
        //console.log("Manipulating label..", label)
        label = label.replace("_", " ")
        if (typeof JourneyStageNames[parseInt(label.replace("Stage ", ""))] != "undefined") {
            label = label + " - " + JourneyStageNames[parseInt(label.replace("Stage ", ""))]
        }
        return label
    },
    "tooltip": "Splunk's Security Journey maps examples to relative technical maturity of a Splunk deployment, letting newcomers focus on the basics and advanced users target their needs."
}, //This is from the list of all filters for the modal, not for the default!
{ //This is from the list of all filters for the modal, not for the default!
    "fieldName": "usecase",
    "displayName": "Security Use Case",
    "type": "search",
    "export": "yes",
    "itemSort": ["Security Monitoring", "Compliance", "Advanced Threat Detection", "Incident Investigation & Forensics", "Incident Response", "SOC Automation", "Insider Threat", "Fraud Detection", "Application Security", "Other"],
    "style": "height: 1.75em; width: 225px;",
    "headerStyle": "width: 225px",
    "width": "225px",
    "ulStyle": "column-count: 1;",
    "tooltip": "Shows the high level use case of an example."
}, //This is from the list of all filters for the modal, not for the default!
{ //This is from the list of all filters for the modal, not for the default!
    "fieldName": "category",
    "displayName": "Category",
    "type": "search",
    "export": "yes",
    "style": "width:220px; padding-bottom: 2px; display: inline-block",
    "headerStyle": "width: 240px",
    "width": "240px",
    "ulStyle": "column-count: 1 !important;",
    "tooltip": "Shows the more detailed category of an example."
}, { //This is from the list of all filters for the modal, not for the default!
    "fieldName": "datasource",
    "displayName": "Data Sources",
    "type": "search",
    "export": "yes",
    "style": "width:250px; padding-bottom: 2px; display: inline-block",
    "headerStyle": "width: 550px",
    "width": "250px",
    "ulStyle": "column-count: 2;",
    "tooltip": "The data sources that power ths use cases. These are mapped to individual technologies."
}, //This is from the list of all filters for the modal, not for the default!
{ //This is from the list of all filters for the modal, not for the default!
    "fieldName": "highlight",
    "displayName": "Recommended",
    "type": "exact",
    "width": "150px",
    "export": "yes",
    "style": " padding-bottom: 2px; width: 150px;",
    "ulStyle": "column-count: 1;",
    "tooltip": "Recommended searches are those that come highly recommended by Splunk's Security SMEs."
}, //This is from the list of all filters for the modal, not for the default!
{ //This is from the list of all filters for the modal, not for the default!
    "fieldName": "alertvolume",
    "displayName": "Alert Volume",
    "type": "exact",
    "width": "120px",
    "export": "yes",
    "itemSort": ["Low", "Medium", "High", "None"],
    "style": "height: 1.75em; display: inline-block; width: 120px;",
    "ulStyle": "column-count: 1;",
    "tooltip": "Shows whether an example is expected to generate a high amount of noise, or should be high confidence. "
}, { //This is from the list of all filters for the modal, not for the default!
    "fieldName": "domain",
    "displayName": "Domain",
    "type": "exact",
    "export": "yes",
    "style": "height: 1.75em; width: 175px;",
    "width": "175px",
    "ulStyle": "column-count: 1;",
    "tooltip": "What high level area of security does this apply to, such as Endpoint, Access, or Network."
}, //This is from the list of all filters for the modal, not for the default!
/*  {//This is from the list of all filters for the modal, not for the default!
      "fieldName": "released",
      "displayName": "Released",
      "type": "exact",
      "width": "180px",
      "style": "height: 1.75em; width: 180px;",
      "ulStyle": "column-count: 1;",
      "tooltip": "A little used filter, shows when the example was first released."
  },//This is from the list of all filters for the modal, not for the default! */
{ //This is from the list of all filters for the modal, not for the default!
    "fieldName": "mitre",
    "displayName": "Mitre ATT&CK Tactic",
    "type": "search",
    "export": "yes",
    "itemSort": ["Persistence", "Privilege Escalation", "Defense Evasion", "Credential Access", "Discovery", "Lateral Movement", "Execution", "Collection", "Exfiltration", "Command and Control"],
    "style": "height: 1.75em; width: 200px;",
    "headerStyle": "width: 200px;",
    "width": "200px",
    "ulStyle": "column-count: 1;",
    "tooltip": "MITRE’s Adversarial Tactics, Techniques, and Common Knowledge (ATT&CK™) is a curated knowledge base and model for cyber adversary behavior, reflecting the various phases of an adversary’s lifecycle and the platforms they are known to target. ATT&CK is useful for understanding security risk against known adversary behavior, for planning security improvements, and verifying defenses work as expected. <br /><a href=\"https://attack.mitre.org/wiki/Main_Page\">Read More...</a>"
}, //This is from the list of all filters for the modal, not for the default!
{ //This is from the list of all filters for the modal, not for the default!
    "fieldName": "killchain",
    "displayName": "Kill Chain Phase",
    "type": "search",
    "width": "200px",
    "export": "yes",
    "itemSort": ["Reconnaissance", "Weaponization", "Delivery", "Exploitation", "Installation", "Command and Control", "Actions on Objective"],
    "style": "height: 1.75em; width: 200px;",
    "headerStyle": "width: 200px;",
    "ulStyle": "column-count: 1;",
    "tooltip": "Developed by Lockheed Martin, the Cyber Kill Chain® framework is part of the Intelligence Driven Defense® model for identification and prevention of cyber intrusions activity. The model identifies what the adversaries must complete in order to achieve their objective. The seven steps of the Cyber Kill Chain® enhance visibility into an attack and enrich an analyst’s understanding of an adversary’s tactics, techniques and procedures.<br/><a href=\"https://www.lockheedmartin.com/us/what-we-do/aerospace-defense/cyber/cyber-kill-chain.html\">Read More...</a>"
}, //This is from the list of all filters for the modal, not for the default!
{ //This is from the list of all filters for the modal, not for the default!
    "fieldName": "hasSearch",
    "displayName": "Search Included",
    "type": "exact",
    "export": "yes",
    "width": "180px",
    "style": "height: 1.75em; width: 180px;",
    "ulStyle": "column-count: 1;",
    "tooltip": "This filter will let you include only those searches that come with Splunk Security Essentials (and aren't from Premium Apps)"
}, //This is from the list of all filters for the modal, not for the default!
{ //This is from the list of all filters for the modal, not for the default!
    "fieldName": "SPLEase",
    "displayName": "SPL Difficulty",
    "type": "exact",
    "export": "yes",
    "width": "180px",
    "style": "height: 1.75em; width: 180px;",
    "itemSort": ["Basic", "Medium", "Hard", "Advanced", "Accelerated"],
    "ulStyle": "column-count: 1;",
    "tooltip": "If you are using Splunk Security Essentials to learn SPL, you can filter here for the easier or more difficult SPL."
}, //This is from the list of all filters for the modal, not for the default!
{ //This is from the list of all filters for the modal, not for the default!
    "fieldName": "displayapp",
    "displayName": "Example Source",
    "type": "search",
    "export": "yes",
    "style": " padding-bottom: 2px; width: 300px;",
    "ulStyle": "column-count: 1;",
    "tooltip": "The source of the search, whether it is Splunk Enterprise Security, UBA, or Splunk Security Essentials"
}, //This is from the list of all filters for the modal, not for the default!
{ //This is from the list of all filters for the modal, not for the default!
    "fieldName": "advancedtags",
    "displayName": "Advanced",
    "type": "search",
    "width": "180px",
    "style": "height: 1.75em; width: 180px;",
    "ulStyle": "column-count: 1;",
    "tooltip": "A catch-all of several other items you might want to filter on."
}, //This is from the list of all filters for the modal, not for the default!
{ //This is from the list of all filters for the modal, not for the default!
    "fieldName": "bookmark_display",
    "displayName": "Wish List",
    "type": "search",
    "export": "no",
    "width": "180px",
    "style": "height: 1.75em; width: 180px;",
    "ulStyle": "column-count: 1;",
    "itemSort": ["Not on Wish List", "Waiting on Data", "Ready for Deployment", "Needs Tuning", "Issues Deploying", "Successfully Implemented"],
    "tooltip": "Examples you are tracking"
} //This is from the list of all filters for the modal, not for the default!
];
window.allFilters = allFilters;



function DownloadAllUseCases() {
    var myDownload = []
    var myCSV = ""
    var myHeader = ["Name", "Description", "Wish List Status"]
    for (var filterCount = 0; filterCount < allFilters.length; filterCount++) {
        if (typeof allFilters[filterCount].export != "undefined" && allFilters[filterCount].export == "yes")
            myHeader.push(allFilters[filterCount].displayName)

    }
    myDownload.push(myHeader)
    myCSV += myHeader.join(",") + "\n"
    for (var i = 0; i < ShowcaseInfo.roles.default.summaries.length; i++) {
        var row = ['"' + ShowcaseInfo.summaries[ShowcaseInfo.roles.default.summaries[i]]['name'].replace(/"/g, '""') + '"', '"' + ShowcaseInfo.summaries[ShowcaseInfo.roles.default.summaries[i]]['description'].replace(/"/g, '""').replace(/<br[^>]*>/g, " ") + '"']
        
        row.push('"' + statusToShowcase( ShowcaseInfo.summaries[ShowcaseInfo.roles.default.summaries[i]]['bookmark_status']) + '"')
        for (var filterCount = 0; filterCount < allFilters.length; filterCount++) {
            if (typeof allFilters[filterCount].export != "undefined" && allFilters[filterCount].export == "yes") {
                var line = ShowcaseInfo.summaries[ShowcaseInfo.roles.default.summaries[i]][allFilters[filterCount].fieldName] || "";
                if (allFilters[filterCount].type == "search")
                    line = line.replace(/\|/g, ", ")
                if (typeof allFilters[filterCount].manipulateDisplay != "undefined")
                    line = allFilters[filterCount].manipulateDisplay(line)

                row.push('"' + line.replace(/"/g, '""') + '"')
            }
        }
        myDownload.push(row)
        myCSV += row.join(",") + "\n"
    }
    var filename = "Splunk_Security_Use_Cases.csv"

    var blob = new Blob([myCSV], { type: 'text/csv;charset=utf-8;' });
    if (navigator.msSaveBlob) { // IE 10+
        navigator.msSaveBlob(blob, filename);
    } else {
        var link = document.createElement("a");
        if (link.download !== undefined) { // feature detection
            // Browsers that support HTML5 download attribute
            var url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
}

$("#downloadUseCaseIcon").click(function() { DownloadAllUseCases(); return false; })


function statusToShowcase(key){
    switch (key) {
        case "needData":
            return "Waiting on Data"
            break;
        case "inQueue":
            return "Ready for Deployment"
            break;
        case "bookmarked":
            return "Bookmarked"
            break;
        case "needsTuning":
            return "Needs Tuning"
            break;
        case "issuesDeploying":
            return "Issues Deploying"
            break;
        case "successfullyImplemented":
            return "Successfully Implemented"
            break;
        default: 
            return ""
    }
}

function updateDataSourceBlock(){
    var content = new Object()
    var fullcontent = new Object()
    
        // while we are here, let's also update all of those counts..
    $("text.single-result").text("0")
                    
    for(var i = 0; i < ShowcaseInfo.roles.default.summaries.length; i++){
        var sources = ShowcaseInfo.summaries[ShowcaseInfo.roles.default.summaries[i]].datasource.split(/\|/)
        for(var g = 0; g < sources.length; g++){
            if(typeof content[sources[g]] == "undefined"){
                content[sources[g]] = $("<ul></ul>")
                fullcontent[sources[g]] = []
            }

            content[sources[g]].append("<li>" + ShowcaseInfo.summaries[ShowcaseInfo.roles.default.summaries[i]].name + "</li>")
            fullcontent[sources[g]].push(ShowcaseInfo.roles.default.summaries[i])
        }
        // while we are here, let's also update all of those counts..
        if(typeof ShowcaseInfo.summaries[ShowcaseInfo.roles.default.summaries[i]].isCustom != "undefined" && ShowcaseInfo.summaries[ShowcaseInfo.roles.default.summaries[i]].isCustom == true)
            $("#customSearches").find("text").text(parseInt($("#customSearches").find("text").text()) + 1)
        if($("#" + ShowcaseInfo.summaries[ShowcaseInfo.roles.default.summaries[i]].bookmark_status).find("text").length>0)
            $("#" + ShowcaseInfo.summaries[ShowcaseInfo.roles.default.summaries[i]].bookmark_status).find("text").text(parseInt($("#" + ShowcaseInfo.summaries[ShowcaseInfo.roles.default.summaries[i]].bookmark_status).find("text").text()) + 1)
    }
    //console.log("Full Content!", fullcontent)
    var contentlist = Object.keys(content).sort()
    var final = $("<div></div>")
    var tableversion = "<table class=\"table printonly table-chrome\" style=\"\"><thead><tr><th>Data Source</th><th>Use Cases</th><th>Categories</th><th>Description</th></tr></thead><tbody>"
    
    for(var i = 0; i < contentlist.length; i++){
        final.append($('<div style="width: 250px; display: inline-block; border: 1px gray solid; background-color: white; padding: 5px; margin: 10px;"></div>').append("<b>" + contentlist[i] + "</b>", content[contentlist[i]]))
        var description = fullcontent[contentlist[i]].length + " use cases selected"
        var usecaselist = new Object()
        var usecases = ""
        var categorylist = new Object()
        var categories = ""
        for(var g = 0; g < fullcontent[contentlist[i]].length; g++){
            var localusecases = ShowcaseInfo.summaries[ fullcontent[contentlist[i]][g] ].usecase.split("|")
            var localcategories = ShowcaseInfo.summaries[ fullcontent[contentlist[i]][g] ].category.split("|")
            for(var h=0; h < localusecases.length; h++){
                usecaselist[ localusecases[h]  ] = 1
            }
            for(var h=0; h < localcategories.length; h++){
                categorylist[ localcategories[h]  ] = 1
            }
            
        }
        for( var g = 0; g < Object.keys(usecaselist).length; g++){
           // console.log("Running full content with ", Object.keys(usecaselist)[g ])
            if(usecases != "")
                usecases += "<br />" 
            if(typeof prettyDescriptions['usecase'][ Object.keys(usecaselist)[g] ] != "undefined")
                usecases += Object.keys(usecaselist)[g] + ": " + prettyDescriptions['usecase'][  Object.keys(usecaselist)[g] ]
            else
                usecases += Object.keys(usecaselist)[g]
        }
        for( var g = 0; g < Object.keys(categorylist).length; g++){
           // console.log("Running full content with ", Object.keys(categorylist)[g ])
            if(categories != "")
                categories += ", " 
            categories += Object.keys(categorylist)[g]
        }
        
        tableversion += "<tr><td>" + contentlist[i] + "</td><td>" + usecases + "</td><td>" + categories + "</td><td>" + description + "</td></tr>"
    }
    tableversion += "</tbody></table>"
    $("#dataSourcePanel").html($("<div></div>").append($("<div></div>").append($("<h2 class=\"printonly\">Data Sources Required</h2>")).append( $(tableversion))).append( $("<div></div>").append($("<h2 class=\"printonly\">Use Cases for Data Sources</h2>")).append( $(final) ) ) ) 
   // console.log("Full Content table version", tableversion)
    

}

function deleteCustom(id){
    if(typeof ShowcaseInfo.summaries[id] != "undefined"){
      //  console.log("Deleting example", id, ShowcaseInfo.summaries[id])
        var key = ShowcaseInfo.summaries[id]._key
        $.ajax({
            url: '/en-US/splunkd/__raw/servicesNS/nobody/Splunk_Security_Essentials/storage/collections/data/bookmark_custom/' + key,
            type: 'DELETE',
            async: true
        })
        removeRow(id)
        updateDataSourceBlock()
    }else{
      //  console.log("Could not find id to delete", id, ShowcaseInfo)
    }
}

function removeRow(id){
    //console.log("Removing row for", id, ShowcaseInfo.summaries[id],ShowcaseInfo.summaries[id].name, $("td:contains(" + ShowcaseInfo.summaries[id].name + ")"))
    var uiid = $("td:contains(" + ShowcaseInfo.summaries[id].name + ").name").parent().attr("id").replace(/row\-/, "")
    $("#row-" + uiid).remove()
    $("#description-" + uiid).remove()
    if($("#main_table_body tr").length == 0){
        noContentMessage()
    }
    delete window.ShowcaseInfo.summaries[id]
    window.ShowcaseInfo.roles.default.summaries.splice( window.ShowcaseInfo.roles.default.summaries.indexOf(id), 1 )
}


function editCustom(id){
    
    var summary = ShowcaseInfo.summaries[id]
    if(typeof summary != "undefined"){
      //  console.log("Popping edit dialog for id", id, ShowcaseInfo.summaries[id])
        var key = ShowcaseInfo.summaries[id]._key
        var editCustomModal = new Modal('editCustom', {
            title: 'Edit Custom Content',
            destroyOnHide: true,
            type: 'wide'
        });
        var dataSources = ""
        var myKeys = Object.keys(window.allDataSources).sort()
        for(var i = 0; i < myKeys.length; i++){
            if(myKeys[i] != summary.datasource){
                dataSources += '<option value="' + myKeys[i] + '">' + myKeys[i] + '</option>'
            }else{
                dataSources += '<option selected value="' + myKeys[i] + '">' + myKeys[i] + '</option>'
            }
        }
        
        var stagesSelected = ["","","","","","",""]
        stagesSelected[parseInt(summary.journey.replace(/\D/g, ""))] = "selected "

        var statusSelected = new Object();
        statusSelected['bookmarked'] = statusSelected['needData'] = statusSelected['inQueue'] = statusSelected['issuesDeploying'] = statusSelected['needsTuning'] = statusSelected['successfullyImplemented'] = ""
        statusSelected[summary.bookmark_status] = "selected "

        var myBody = $('<div id="addCustomDiv"></div>')
        myBody.append(  $('<label for="customName">Name</label><input name="customName" id="customName" type="text" value="' + summary.name.replace(/^Custom: /, "") + '" />'),
                        $('<label for="customJourney">Journey</label><select name="customJourney" id="customJourney"><option ' + stagesSelected[1] + 'value="Stage_1">Stage 1</option><option ' + stagesSelected[2] + 'value="Stage_2">Stage 2</option><option ' + stagesSelected[3] + 'value="Stage_3">Stage 3</option><option ' + stagesSelected[4] + 'value="Stage_4">Stage 4</option><option ' + stagesSelected[5] + 'value="Stage_5">Stage 5</option><option ' + stagesSelected[6] + 'value="Stage_6">Stage 6</option></select>'),
                        $('<label for="customStatus">Status</label><select name="customStatus" id="customStatus"><option ' + statusSelected['bookmarked'] + 'value="bookmarked">Bookmarked</option><option ' + statusSelected['needData'] + 'value="needData">Awaiting Data</option><option ' + statusSelected['inQueue'] + 'value="inQueue">Ready for Deployment</option><option ' + statusSelected['issuesDeploying'] + 'value="issuesDeploying">Deployment Issues</option><option ' + statusSelected['needsTuning'] + 'value="needsTuning">Needs Tuning</option><option ' + statusSelected['successfullyImplemented'] + 'value="successfullyImplemented">Successfully Implemented</option></select>'),
                        $('<label for="customDatasource">Data Source</label><select name="customDatasource" id="customDatasource">' + dataSources + '</select>'),
                        $('<label for="customDescription">Description</label><textarea name="customDescription" id="customDescription">' + summary.description + '</textarea>'))
    
        $(editCustomModal.$el).on("hide", function() {
            // Not taking any action on hide, but you can if you want to!
        })
    
        editCustomModal.body.addClass('mlts-modal-form-inline').append(myBody)
    
        editCustomModal.footer.append($('<button>').addClass('mlts-modal-cancel').attr({
                type: 'button',
                'data-dismiss': 'modal'
            }).addClass('btn btn-default mlts-modal-cancel').text('Cancel'), $('<button>').addClass('mlts-modal-submit').attr({
            type: 'button',
            'data-dismiss': 'modal'
        }).addClass('btn btn-primary mlts-modal-submit').attr("id", "saveNewFilters").text('Change').on('click', function() {
            
          //  console.log("Making Changes to id", id, ShowcaseInfo.summaries[id])
            require(["/static/app/Splunk_Security_Essentials/components/data/sendTelemetry.js"], function(Telemetry) {
                Telemetry.SendTelemetryToSplunk("bookmarkChange", { "status": "changedCustomEntry"})
            })
            var record = {_time: (new Date).getTime() / 1000, journey: $("#customJourney").val(), showcase_name: $("#customName").val(), status: $("#customStatus").val(), datasource: $("#customDatasource").val(), description: $("#customDescription").val(), user: Splunk.util.getConfigValue("USERNAME") }
            var newkey;
            $.ajax({
                url: '/en-US/splunkd/__raw/servicesNS/nobody/Splunk_Security_Essentials/storage/collections/data/bookmark_custom',
                type: 'POST',
                contentType: "application/json",
                async: false,
                data: JSON.stringify(record),
                success: function(returneddata) { newkey = returneddata }
            })
            deleteCustom(id)
            var newObj = new Object()
            newObj.name = "Custom: " + record.showcase_name
            newObj.bookmark_status = record.status
            newObj.datasource = record.datasource
            newObj.journey = record.journey
            newObj._key = newkey
            newObj.description = record.description + "<br />Edited on " + (new Date()).toISOString().split('T')[0] + " by " + record.user
            var shortName = newObj.name.replace(/ /g, "_").replace(/[^a-zA-Z0-9_]/g, "")
            window.ShowcaseInfo['summaries'][shortName] = newObj
            window.ShowcaseInfo['roles']['default']['summaries'].push(shortName)
            addItem(newObj, shortName)
            updateDataSourceBlock()
            $("#customSearches").find("text").text(parseInt($("#customSearches").find("text").text()) + 1)
        }))
        editCustomModal.show()
    }else{
       // console.log("Couldn't find id to edit", id, ShowcaseInfo)
    }
}
function doPrint(){
    //$("#main_table_body tr[id]").css("display", "table-row")
    //$(".dvexpand tr").css("display", "table-row")
    //$(".dvexpand td").css("display", "table-cell")
    
    window.print();  
}


function deleteCustomConfirmation(id){
    
    var summary = ShowcaseInfo.summaries[id]
    if(typeof summary != "undefined"){
       // console.log("Popping delete confirmation dialog for id", id, ShowcaseInfo.summaries[id])
        var key = ShowcaseInfo.summaries[id]._key
        var editCustomModal = new Modal('deleteCustom', {
            title: 'Confirm?',
            destroyOnHide: true,
            type: 'wide'
        });
        var myBody = $('<p>Are you sure you want to delete?</p>')
        
        $(editCustomModal.$el).on("hide", function() {
            // Not taking any action on hide, but you can if you want to!
        })
    
        editCustomModal.body.addClass('mlts-modal-form-inline').append(myBody)
    
        editCustomModal.footer.append($('<button>').addClass('mlts-modal-cancel').attr({
                type: 'button',
                'data-dismiss': 'modal'
            }).addClass('btn btn-default mlts-modal-cancel').text('Cancel'), $('<button>').addClass('mlts-modal-submit').attr({
            type: 'button',
            'data-dismiss': 'modal'
        }).addClass('btn btn-primary mlts-modal-submit').attr("id", "saveNewFilters").text('Delete').on('click', function() {
            deleteCustom(id)
        }))
        editCustomModal.show()
    }else{
      //  console.log("Couldn't find id to edit", id, ShowcaseInfo)
    }
}


function formatDate(date) {
    var monthNames = [
      "January", "February", "March",
      "April", "May", "June", "July",
      "August", "September", "October",
      "November", "December"
    ];
  
    var day = date.getDate();
    var monthIndex = date.getMonth();
    var year = date.getFullYear();
  
    return day + ' ' + monthNames[monthIndex] + ' ' + year;
  }

$.when(addingIndividualContent).then(function(){
   // console.log("I got this")
    
        var newElement  = $("#row1").clone().attr("id", "intropage").addClass("printonly")
        newElement.find(".panel-body").html('<!--<h1 class="printonly">Use Case Overview</h1>--><img src="/splunkd/__raw/servicesNS/admin/Splunk_Security_Essentials/static/appIcon_2x.png" style="position: absolute; right: 10px; top: -40px; display: block;" /><div id="intropageblock" style="margin-top: 200px;"><h1>Summary of Bookmarked Content</h1><h2>Prepared ' + formatDate(new Date()) + '</h2><h2 style="margin-top: 200px;">Table of Contents</h3><ol><li>Use Case Overview</li><li>Data Sources</li><li>Use Cases for Data Sources</li><li>Content Detail<ul id="usecasetoc"></ul></li></ol> </div>')
        newElement.insertBefore("#row1")
        
        $("#bookmark_printable_table").find("h1").each(function(count, obj){
         //   console.log("Adding", $(obj).html())
            $("#usecasetoc").append("<li>" + $(obj).html() + "</li>")
        })
        $("#row1").addClass("breakbeforethis")
        
    
    
})






function loadSPL(){
    $.ajax({ url: '/static/app/Splunk_Security_Essentials/components/data/sampleSearches/showcase_simple_search.json', async: true, success: function(returneddata) { 
        var objects = Object.keys(returneddata)
        for(var i = 0; i < objects.length; i++){
            examples[objects[i]] = returneddata[objects[i]]
            examples[objects[i]].file = "showcase_simple_search"
            examples[objects[i]].searchString = examples[objects[i]].value
            examples[objects[i]].linebylineSPL = "<pre>" + examples[objects[i]].searchString + "</pre>"
            var linebylineSPL = examples[objects[i]].searchString.split(/\n/)
            if(typeof examples[objects[i]].description != "undefined" && linebylineSPL.length>0){
                var myTable = "<table class=\"linebylinespl\">"
                for(var g = 0; g < linebylineSPL.length; g++){
                    myTable += "<tr>" + '<td class="splside">' + linebylineSPL[g] + '</td>' + '<td class="docside">' + (examples[objects[i]].description[g] || "") + '</td></tr>'
                }
                myTable += "</table>"
                examples[objects[i]].linebylineSPL = myTable
            }
        }
    } });
    $.ajax({ url: '/static/app/Splunk_Security_Essentials/components/data/sampleSearches/showcase_standard_deviation.json', async: true, success: function(returneddata) { 
        var objects = Object.keys(returneddata)
        for(var i = 0; i < objects.length; i++){
            examples[objects[i]] = returneddata[objects[i]]
            examples[objects[i]].file = "showcase_standard_deviation"
            examples[objects[i]].searchString = examples[objects[i]].value + '\n| stats count as num_data_samples max(eval(if(_time >= relative_time(now(), "-1d@d"), \'$outlierVariableToken$\',null))) as \'$outlierVariableToken$\' avg(eval(if(_time<relative_time(now(),"-1d@d"),\'$outlierVariableToken$\',null))) as avg stdev(eval(if(_time<relative_time(now(),"-1d@d"),\'$outlierVariableToken$\',null))) as stdev by \'$outlierVariableSubjectToken$\' \n| eval upperBound=(avg+stdev*$scaleFactorToken$) \n | where \'$outlierVariableToken$\' > upperBound'
            examples[objects[i]].searchString = examples[objects[i]].searchString.replace(/\$outlierVariableToken\$/g, examples[objects[i]].outlierVariable).replace(/\$outlierVariableSubjectToken\$/g, examples[objects[i]].outlierVariableSubject).replace(/\$scaleFactorToken\$/g, examples[objects[i]].scaleFactor).replace(/\</g, "&lt;").replace(/\>/g, "&gt;").replace(/\n\s*/g, "\n")
            examples[objects[i]].linebylineSPL = "<pre>" + examples[objects[i]].searchString + "</pre>"
            var linebylineSPL = examples[objects[i]].searchString.split(/\n/)
            if(typeof examples[objects[i]].description != "undefined" && linebylineSPL.length>0){
                examples[objects[i]].description.push("calculate the mean, standard deviation and most recent value", "Calculate the upper boundary (X standard deviations above the average)", "Filter where where the most recent result is above the upper boundary")
                var myTable = "<table class=\"linebylinespl\">"
                for(var g = 0; g < linebylineSPL.length; g++){
                    myTable += "<tr>" + '<td class="splside">' + linebylineSPL[g] + '</td>' + '<td class="docside">' + (examples[objects[i]].description[g] || "") + '</td></tr>'
                }
                myTable += "</table>"
                examples[objects[i]].linebylineSPL = myTable
            }
            

            
        }
    } });

    $.ajax({ url: '/static/app/Splunk_Security_Essentials/components/data/sampleSearches/showcase_first_seen_demo.json', async: true, success: function(returneddata) { 
        var objects = Object.keys(returneddata)
        for(var i = 0; i < objects.length; i++){
            examples[objects[i]] = returneddata[objects[i]]
            examples[objects[i]].file = "showcase_first_seen_demo"
            examples[objects[i]].searchString = examples[objects[i]].value + '\n| stats earliest(_time) as earliest latest(_time) as latest  by $outlierValueTracked1Token$, $outlierValueTracked2Token$ \n| where earliest >= relative_time(now(), \"-1d@d\")'
            examples[objects[i]].searchString = examples[objects[i]].searchString.replace(/\$outlierValueTracked1Token\$/g, examples[objects[i]].outlierValueTracked1).replace(/\$outlierValueTracked2Token\$/g, examples[objects[i]].outlierValueTracked2).replace(/\</g, "&lt;").replace(/\>/g, "&gt;").replace(/\n\s*/g, "\n")
            examples[objects[i]].linebylineSPL = "<pre>" + examples[objects[i]].searchString + "</pre>"
            var linebylineSPL = examples[objects[i]].searchString.split(/\n/)
            if(typeof examples[objects[i]].description != "undefined" && linebylineSPL.length>0){
                examples[objects[i]].description.push("Here we use the stats command to calculate what the earliest and the latest time is that we have seen this combination of fields.", "Now we look to see if the earliest time we saw this event was in the last day (aka, brand new).")
                var myTable = "<table class=\"linebylinespl\">"
                for(var g = 0; g < linebylineSPL.length; g++){
                    myTable += "<tr>" + '<td class="splside">' + linebylineSPL[g] + '</td>' + '<td class="docside">' + (examples[objects[i]].description[g] || "") + '</td></tr>'
                }
                examples[objects[i]].linebylineSPL = myTable
                myTable += "</table>"
           //     console.log("I got this:", examples[objects[i]].linebylineSPL)
            }
        }
    } });
}