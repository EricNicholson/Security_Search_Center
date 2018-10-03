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
localStorage["splunk-security-essentials-maxconcurrentsearches"] = localStorage["splunk-security-essentials-maxconcurrentsearches"] || 5
window.hasAnyEverRun = false

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
        //AlertModal,
        // Modal,
        Ready //,
        //ShowcaseInfo
    ) {

        function KickItOff() {
            //window.SearchesInQueue = ["7c2072657374202f73657276696365732f617070732f6c6f63616c207c207365617263682064697361626c65643d30206c6162656c3d2255524c20546f6f6c626f7822207c20737461747320636f756e74"]
            for (var item in window.datacheck) {
                if (item.indexOf("-") == -1 && item.indexOf("t") == -1) {
                    $("#" + item).html("<img title=\"Loading\" src=\"/static//app/Splunk_Security_Essentials/images/general_images/loader.gif\">");
                    //          console.log("Loading...", item)
                }
            }
            $(".tableaccel:not(:first)").each(function(num, element) {
                if ($(element).find("img").length == 0) {
                    $(element).html('<a class="dvPopover" href="#" data-toggle="popover" title="Not Applicable" data-trigger="hover" data-content="We do not currently have a search that leverages the accelerated data.">' + "<span style=\"color: black;\" title=\"Not Applicable (no search present)\">N/A</span>" + '</a>');
                    $(element).find("a").popover()
                }
            })
            $("#percContainer").css("height", "15px")
            $("#percContainer").css("display", "inline-block")
            $("#KickItOffButton").attr("disabled", true)
            ProcessSearchQueue()
        }

        $(".fieldset").first().html('<div style="width: 70%; display: inline-block; float:left;"><p>In Splunk Security Essentials, every example has prerequisites defined, to help you know if a search will work in your environment. The Data Check dashboard is a tool to verify if the data sources exist for specific examples in Splunk Security Essentials. This does not automatically run the actual example searches, or add the searches to other applications such as Enterprise Security. When you click "Start Searches," about sixty searches will launch. The searches are highly efficient, so in most environments this entire load should take less than five minutes to run.  When you\'re ready to launch, just click \"Start Searches\" to the right.</p></div><div style="width: 30%; display: inline-block; float:right; text-align:center; vertical-align: center;"><button type="button" id="KickItOffButton" class="btn btn-primary"><i class="icon-play" /> Start Searches</button></div>')
        $("#KickItOffButton").click(function() { KickItOff() })
        var HTMLBlock = ""
        var unsubmittedTokens = mvc.Components.getInstance('default');
        var submittedTokens = mvc.Components.getInstance('submitted');
        var myDataset = "No dataset provided"

        window.datacheck = []
        var items = new Object
        appName = "Splunk_Security_Essentials"
        $.getJSON('/static/app/Splunk_Security_Essentials/components/data/sampleSearches/showcase_first_seen_demo.json', function(data) {
            items = Object.assign(items, data)
        })
        $.getJSON('/static/app/Splunk_Security_Essentials/components/data/sampleSearches/showcase_standard_deviation.json', function(data) {
            items = Object.assign(items, data)
        })
        $.getJSON('/static/app/Splunk_Security_Essentials/components/data/sampleSearches/showcase_simple_search.json', function(data) {
            items = Object.assign(items, data)
        })

        ShowcaseInfo = ""
        $("#main_content").append("<table style=\"\" id=\"main_table\" class=\"table table-chrome\" ><thead><tr class=\"dvbanner\"><th style=\"width: 20px;\" class=\"tableexpand\"><i class=\"icon-info\"></i></th><th>Example Content</th><th class=\"tabledemo\">Demo Data</th><th class=\"tablelive\">Live Data</th><th class=\"tableaccel\">Accelerated Data</th></th></thead><tbody id=\"main_table_body\"></tbody></table>")
        $.getJSON('/static/app/Splunk_Security_Essentials/components/data/ShowcaseInfo.json', function(data) {

            var ShowcaseInfo = data
                /*
                                var showcaseSummaries = ShowcaseInfo.summaries;

                                ShowcaseInfo.summaries.sort(function(a, b){
                                    
                                    if(showcaseSummaries[a].name < showcaseSummaries[b].name) return -1;
                                    if(showcaseSummaries[a].name > showcaseSummaries[b].name) return 1;
                                    return 0;
                                })
                                */



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
                // console.log("Processing summary", summary)

                dashboardname = summary.dashboard
                if (dashboardname.indexOf("?") > 0) {
                    dashboardname = dashboardname.substr(0, dashboardname.indexOf("?"))
                }
                example = undefined
                if (summary.dashboard.indexOf("=") > 0) {
                    example = summary.dashboard.substr(summary.dashboard.indexOf("=") + 1)
                }
                //panelStart = "<div id=\"rowDescription\" class=\"dashboard-row dashboard-rowDescription splunk-view\">        <div id=\"panelDescription\" class=\"dashboard-cell last-visible splunk-view\" style=\"width: 100%;\">            <div class=\"dashboard-panel clearfix\" style=\"min-height: 0px;\"><h2 class=\"panel-title empty\"></h2><div id=\"view_description\" class=\"fieldset splunk-view editable hide-label hidden empty\"></div>                                <div class=\"panel-element-row\">                    <div id=\"elementdescription\" class=\"dashboard-element html splunk-view\" style=\"width: 100%;\">                        <div class=\"panel-body html\"> <div id=\"contentDescription\"> "
                //panelEnd =  "</div></div>                    </div>                </div>            </div>        </div>    </div>"
                var demo = ""
                var live = ""
                var accel = ""
                if (typeof example != "undefined") {
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
                    if (summary.description.match(/<b>\s*Alert Volume:*\s*<\/b>:*\s*Very Low/)) {
                        summary.description = summary.description.replace(/<b>\s*Alert Volume:*\s*<\/b>:*\s*Very Low/, '<b>Alert Volume:</b> Very Low <a class="dvPopover" id="alertVolumetooltip" href="#" title="Alert Volume: Very Low" data-placement="right" data-toggle="popover" data-trigger="hover" data-content="An alert volume of Very Low indicates that a typical environment will rarely see alerts from this search, maybe after a brief period of tuning. This search should trigger infrequently enough that you could send it directly to the SOC as an alert, although you should also send it into a data-analysis based threat detection solution, such as Splunk UBA (or as a starting point, Splunk ES\'s Risk Framework)">(?)</a>')
                    } else if (summary.description.match(/<b>\s*Alert Volume:*\s*<\/b>:*\s*Low/)) {
                        summary.description = summary.description.replace(/<b>\s*Alert Volume:*\s*<\/b>:*\s*Low/, '<b>Alert Volume:</b> Low <a class="dvPopover" id="alertVolumetooltip" href="#" title="Alert Volume: Low" data-placement="right" data-toggle="popover" data-trigger="hover" data-content="An alert volume of Low indicates that a typical environment will occasionally see alerts from this search -- probably 0-1 alerts per week, maybe after a brief period of tuning. This search should trigger infrequently enough that you could send it directly to the SOC as an alert if you decide it is relevant to your risk profile, although you should also send it into a data-analysis based threat detection solution, such as Splunk UBA (or as a starting point, Splunk ES\'s Risk Framework)">(?)</a>')
                    } else if (summary.description.match(/<b>\s*Alert Volume:*\s*<\/b>:*\s*Medium/)) {
                        summary.description = summary.description.replace(/<b>\s*Alert Volume:*\s*<\/b>:*\s*Medium/, '<b>Alert Volume:</b> Medium <a class="dvPopover" id="alertVolumetooltip" href="#" title="Alert Volume: Medium" data-placement="right" data-toggle="popover" data-trigger="hover" data-content="An alert volume of Medium indicates that you\'re likely to see one to two alerts per day in a typical organization, though this can vary substantially from one organization to another. It is recommended that you feed these to an anomaly aggregation technology, such as Splunk UBA (or as a starting point, Splunk ES\'s Risk Framework)">(?)</a>')
                    } else if (summary.description.match(/<b>\s*Alert Volume:*\s*<\/b>:*\s*High/)) {
                        summary.description = summary.description.replace(/<b>\s*Alert Volume:*\s*<\/b>:*\s*High/, '<b>Alert Volume:</b> High <a class="dvPopover" id="alertVolumetooltip" href="#" title="Alert Volume: High" data-placement="right" data-toggle="popover" data-trigger="hover" data-content="An alert volume of High indicates that you\'re likely to see several alerts per day in a typical organization, though this can vary substantially from one organization to another. It is highly recommended that you feed these to an anomaly aggregation technology, such as Splunk UBA (or as a starting point, Splunk ES\'s Risk Framework)">(?)</a>')
                    } else if (summary.description.match(/<b>\s*Alert Volume:*\s*<\/b>:*\s*Very High/)) {
                        summary.description = summary.description.replace(/<b>\s*Alert Volume:*\s*<\/b>:*\s*Very High/, '<b>Alert Volume:</b> Very High <a class="dvPopover" id="alertVolumetooltip" href="#" title="Alert Volume: Very High" data-placement="right" data-toggle="popover" data-trigger="hover" data-content="An alert volume of Very High indicates that you\'re likely to see many alerts per day in a typical organization. You need a well thought out high volume indicator search to get value from this alert volume. Splunk ES\'s Risk Framework is a starting point, but is probably insufficient given how common these events are. IT is highly recommended that you either build correlation searches based on the output of this search, or leverage Splunk UBA with it\'s threat models to surface the high risk indicators.">(?)</a>')
                    } else {
                        summary.description = summary.description.replace(/(<b>\s*Alert Volume:.*?)(?:<\/p>)/, '$1 <a class="dvPopover" id="alertVolumetooltip" href="#" title="Alert Volume" data-placement="right" data-toggle="popover" data-trigger="hover" data-content="The alert volume indicates how often a typical organization can expect this search to fire. On the Very Low / Low side, alerts should be rare enough to even send these events directly to the SIEM for review. Oh the High / Very High side, your SOC would be buried under the volume, and you must send the events only to an anomaly aggregation and threat detection solution, such as Splunk UBA (or for a partial solution, Splunk ES\'s risk framework). To that end, *all* alerts, regardless of alert volume, should be sent to that anomaly aggregation and threat detection solution. More data, more indicators, should make these capabilites stronger, and make your organization more secure.">(?)</a>')
                    }
                    var per_instance_help = summary.help ? "<p><h3>" + summary.name + " Help</h3></p>" + summary.help : ""


                    if (dashboardname = "showcase_first_seen_demo") {

                    } else if (dashboardname = "showcase_standard_deviation") {

                    } else if (dashboardname = "showcase_simple_search") {

                    }
                    var demodisplay = ""
                    var livedisplay = ""
                    var acceldisplay = ""
                    if ((demo != "" && typeof items[demo] != "undefined" && typeof items[demo].prereqs == "object")) {
                        //demodisplay="<img style=\"height:22px; width:20px;\" src=\"/static/app/Splunk_Security_Essentials/images/general_images/loader.gif\">"
                    }
                    if ((live != "" && typeof items[live] != "undefined" && typeof items[live].prereqs == "object")) {
                        //livedisplay="<img style=\"height:22px; width:20px;\" src=\"/static/app/Splunk_Security_Essentials/images/general_images/loader.gif\">"
                    }
                    if ((accel != "" && typeof items[accel] != "undefined" && typeof items[accel].prereqs == "object")) {
                        //acceldisplay="<img style=\"height:22px; width:20px;\" src=\"/static/app/Splunk_Security_Essentials/images/general_images/loader.gif\">"
                    }

                    relevance = summary.relevance ? "<p><b>Security Impact:</b> <br />" + summary.relevance + "</p>" : ""

                    if ((demo != "" && typeof items[demo] != "undefined" && typeof items[demo].prereqs == "object") || (live != "" && typeof items[live] != "undefined" && typeof items[live].prereqs == "object") || (accel != "" && typeof items[accel] != "undefined" && typeof items[accel].prereqs == "object")) {


                        $("#main_table_body").append("<tr id=\"row-" + toHex(example) + "\" class=\"dvbanner\"><td class=\"tableexpand\" class=\"downarrow\" id=\"expand-" + toHex(example) + "\"><a href=\"#\" onclick=\"doToggle('" + toHex(example) + "'); return false;\"><i class=\"icon-chevron-right\" /></a></td><td class=\"name\"><a href=\"#\" onclick=\"doToggle('" + toHex(example) + "'); return false;\">" + summary.name + "</a></td><td class=\"tabledemo\" id=\"" + toHex(example + "demo") + "\">" + demodisplay + "</td><td class=\"tablelive\" id=\"" + toHex(example + "live") + "\">" + livedisplay + "</td><td class=\"tableaccel\" id=\"" + toHex(example + "accel") + "\">" + acceldisplay + "</td></tr>")
                        $("#main_table_body").append("<tr id=\"description-" + toHex(example) + "\" style=\"display: none;\"><td colspan=\"5\">" + "<b>Description:</b> " + summary.description + relevance + exampleText + "<ul>" + exampleList.html() + "</ul>" + "<div id=\"prereqs-" + toHex(example) + "\"></div></td></tr>")

                    }

                    if (demo != "" && typeof items[demo] != "undefined") {
                        if (typeof items[demo].prereqs != "undefined" && items[demo].prereqs.length > 0) {

                            runPreReqs(items[demo].prereqs, toHex(example + "demo"), "#prereqs-" + toHex(example), "Demo Data")
                            demo = "<img style=\"height:22px; width:20px;\" src=\"/static/app/Splunk_Security_Essentials/images/general_images/loader.gif\">"
                        } else {
                            demo = ""
                        }
                    }
                    if (live != "" && typeof items[live] != "undefined") {
                        if (typeof items[live].prereqs != "undefined" && items[live].prereqs.length > 0) {

                            runPreReqs(items[live].prereqs, toHex(example + "live"), "#prereqs-" + toHex(example), "Live Data")
                            live = "<img style=\"height:22px; width:20px;\" src=\"/static/app/Splunk_Security_Essentials/images/general_images/loader.gif\">"
                        } else {
                            live = ""
                        }
                    }
                    if (accel != "" && typeof items[accel] != "undefined") {
                        if (typeof items[accel].prereqs != "undefined" && items[accel].prereqs.length > 0) {

                            runPreReqs(items[accel].prereqs, toHex(example + "accel"), "#prereqs-" + toHex(example), "Accelerated Data")
                            accel = "<img style=\"height:22px; width:20px;\" src=\"/static/app/Splunk_Security_Essentials/images/general_images/loader.gif\">"
                        } else {
                            accel = ""
                        }
                    }

                }
            }



            $("#layout1").append(HTMLBlock) //#main_content
            $("#main_content").prepend('<div id="percContainer" style="width: 100%; display:none; height: 0px;"><div id="completeContainer" style="width:0%; display: inline-block; height: 100%; background-color: blue;"></div><div id="inProgressContainer" style="width:0%; display: inline-block; height: 100%; background-color: lightblue;"></div><div id="queueContainer" style="width:100%; display: inline-block; height: 100%; background-color: gray;"></div></div>')
            $(".dvbanner").css("font-size", "15px");
            $(".tabledemo").css("text-align", "center")
            $(".tablelive").css("text-align", "center")
            $(".tableaccel").css("text-align", "center")
            $(".panel-body").css("padding", "0px")
        });




        function runPreReqs(prereqs, element, div, label) {
            if (prereqs.length > 0) {


                $(div).append("<div id=\"row11\" class=\"dashboard-row dashboard-row1 splunk-view\">        <div id=\"panel11\" class=\"dashboard-cell last-visible splunk-view\" style=\"width: 100%;\">            <div class=\"dashboard-panel clearfix\" style=\"min-height: 0px;\"><h2 class=\"panel-title empty\"></h2><div id=\"view_22841\" class=\"fieldset splunk-view editable hide-label hidden empty\"></div>                                <div class=\"panel-element-row\">                    <div id=\"element11\" class=\"dashboard-element html splunk-view\" style=\"width: 100%;\">                        <div class=\"panel-body html\">                         <h3>" + label + "</h3>  <table class=\"table table-striped data_check_table\" id=\"data_check_table-" + element + "\" >                            <tr><td style=\"width: 25%\">Data Check</td><td style=\"text-align: center;\" style=\"width: 6%\">Status</td><td style=\"width: 9%\">Open in Search</td><td style=\"width: 60%\">Resolution (if needed)</td></tr>                            </table>                        </div>                    </div>                </div>            </div>        </div>    </div>")
                window.datacheck[element] = new Object
                for (var i = 0; i < prereqs.length; i++) {
                    window.datacheck[element][i] = new Object
                        // create table entry including unique id for the status
                    $("#data_check_table-" + element + " tr:last").after("<tr><td>" + prereqs[i].name + "</td><td style=\"text-align: center;\" id=\"data_check_test-" + element + "-" + i + "\"><img title=\"In Queue...\" src=\"/static//app/Splunk_Security_Essentials/images/general_images/queue_icon.png\"></td><td><a target=\"_blank\" href=\"/app/Splunk_Security_Essentials/search?q=" + encodeURI(prereqs[i].test) + "\">Open in Search</a></td><td>" + prereqs[i].resolution + "</td></tr>")
                    if (window.location.href.indexOf("debug=true") >= 0) {
                        param = "#data_check_test-" + element + "-" + i
                        $(param).append(" <a href=\"#\" onclick=\"runDebug('" + $(param).attr("id") + "'); return false\">(debug)</a>")
                    }

                    var searchHex = toHex(prereqs[i].test)

                    // test if search manager already exists
                    if (typeof window.datacheck[searchHex] == "undefined") {

                        //    console.log("Do need to create a search manager for ", toHex(prereqs[i].test), prereqs[i].test)
                        window.datacheck[searchHex] = new Object
                        window.datacheck[searchHex].registerResults = []
                        window.datacheck[searchHex].registerResults.push("data_check_test-" + element + "-" + i)
                        window.datacheck[searchHex].prereq = prereqs[i]
                        window.datacheck["data_check_test-" + element + "-" + i] = searchHex
                        window.SearchesInQueue.push(searchHex)
                            // create search manager

                        window.datacheck[searchHex].mainSearch = new SearchManager({
                            "id": searchHex,
                            "cancelOnUnload": true,
                            "latest_time": "",
                            "status_buckets": 0,
                            "earliest_time": "0",
                            "search": prereqs[i].test,
                            "app": appName,
                            "auto_cancel": 20,
                            //"auto_finalize_ec": 2000,
                            "max_time": prereqs[i].override_auto_finalize || 20,
                            "preview": true,
                            "runWhenTimeIsUndefined": false,
                            "autostart": false
                        }, { tokens: true, tokenNamespace: "submitted" });


                        window.datacheck[searchHex].myResults = window.datacheck[searchHex].mainSearch.data('results', { output_mode: 'json', count: 0 });

                        window.datacheck[searchHex].mainSearch.on('search:start', function(properties) {
                            for (var g = 0; g < window.datacheck[properties.content.request.label].registerResults.length; g++) {
                                var searchName = window.datacheck[properties.content.request.label].registerResults[g]
                                var matches = /.*?\-([^\-]*)\-(\d*)/.exec(searchName)
                                var element = matches[1]
                                var myCheckNum = matches[2]
                                document.getElementById("data_check_test-" + element + "-" + myCheckNum).innerHTML = "<img title=\"Loading\" src=\"/static//app/Splunk_Security_Essentials/images/general_images/loader.gif\">";
                                if (window.location.href.indexOf("debug=true") >= 0) {
                                    param = "#data_check_test-" + element + "-" + myCheckNum
                                    $(param).append(" <a href=\"#\" onclick=\"runDebug('" + $(param).attr("id") + "'); return false\">(debug)</a>")
                                }
                                // console.log("Data Check Failure code 3", searchName, myCheckNum, prereqs[myCheckNum])
                                doDataCheck(element)
                            }


                        });
                        window.datacheck[searchHex].mainSearch.on('search:error', function(properties) {
                            for (var g = 0; g < window.datacheck[properties.content.request.label].registerResults.length; g++) {
                                var searchName = window.datacheck[properties.content.request.label].registerResults[g]
                                var matches = /.*?\-([^\-]*)\-(\d*)/.exec(searchName)
                                var element = matches[1]
                                var myCheckNum = matches[2]
                                document.getElementById("data_check_test-" + element + "-" + myCheckNum).innerHTML = "<img title=\"Error\" src=\"/static//app/Splunk_Security_Essentials/images/general_images/err_ico.gif\">";
                                if (window.location.href.indexOf("debug=true") >= 0) {
                                    param = "#data_check_test-" + element + "-" + myCheckNum
                                    $(param).append(" <a href=\"#\" onclick=\"runDebug('" + $(param).attr("id") + "'); return false\">(debug)</a>")
                                }
                                //  console.log("Data Check Failure code 3", searchName, myCheckNum, prereqs[myCheckNum])
                                doDataCheck(element)
                            }


                        });
                        window.datacheck[searchHex].mainSearch.on('search:fail', function(properties) {
                            for (var g = 0; g < window.datacheck[properties.content.request.label].registerResults.length; g++) {
                                var searchName = window.datacheck[properties.content.request.label].registerResults[g]

                                var matches = /.*?\-([^\-]*)\-(\d*)/.exec(searchName)
                                var element = matches[1]
                                var myCheckNum = matches[2]
                                document.getElementById("data_check_test-" + element + "-" + myCheckNum).innerHTML = "<img title=\"Error\" src=\"/static//app/Splunk_Security_Essentials/images/general_images/err_ico.gif\">";
                                if (window.location.href.indexOf("debug=true") >= 0) {
                                    param = "#data_check_test-" + element + "-" + myCheckNum
                                    $(param).append(" <a href=\"#\" onclick=\"runDebug('" + $(param).attr("id") + "'); return false\">(debug)</a>")
                                }
                                //   console.log("Data Check Failure code 4", searchName, myCheckNum, prereqs[myCheckNum])
                                doDataCheck(element)
                            }
                        });
                        window.datacheck[searchHex].mainSearch.on('search:done', function(properties) {
                            var searchHex = properties.content.request.label
                                //  console.log("Got Results from Data Check Search", searchName, myCheckNum, properties);

                            if (window.datacheck[searchHex].mainSearch.attributes.data.resultCount == 0) {
                                //     console.log("No Results from Data Check Search", "data_check_test-" + element + "-" + myCheckNum, searchName, myCheckNum, properties);
                                for (var g = 0; g < window.datacheck[properties.content.request.label].registerResults.length; g++) {
                                    var searchName = window.datacheck[properties.content.request.label].registerResults[g]
                                    var matches = /.*?\-([^\-]*)\-(\d*)/.exec(searchName)
                                    var element = matches[1]
                                    var myCheckNum = matches[2]
                                    document.getElementById("data_check_test-" + element + "-" + myCheckNum).innerHTML = "<img title=\"Error\" src=\"/static//app/Splunk_Security_Essentials/images/general_images/err_ico.gif\">";

                                    if (window.location.href.indexOf("debug=true") >= 0) {
                                        param = "#data_check_test-" + element + "-" + myCheckNum
                                        $(param).append(" <a href=\"#\" onclick=\"runDebug('" + $(param).attr("id") + "'); return false\">(debug)</a>")
                                    }
                                    doDataCheck(element)
                                }
                                //     console.log("Data Check Failure code 1", preqreqs[myCheckNum])
                                return;
                            }

                            window.datacheck[searchHex].myResults.on("data", function(properties) {
                                //    console.log("Data Check -- her'es my check for myResults...", properties, searchHex)
                                var searchHex = properties.attributes.manager.id
                                for (var g = 0; g < window.datacheck[searchHex].registerResults.length; g++) {
                                    var searchName = window.datacheck[searchHex].registerResults[g]
                                    var matches = /.*?\-([^\-]*)\-(\d*)/.exec(searchName)
                                    var element = matches[1]
                                    var myCheckNum = matches[2]
                                    var data = window.datacheck[searchHex].myResults.data().results;
                                    //      console.log("Got Data from Data Check Search", data, myField, properties);
                                    var myField = window.datacheck[searchHex].prereq.field
                                    var status = false;
                                    if (typeof data[0][myField] !== "undefined") {
                                        status = true;
                                        if (typeof window.datacheck[searchHex].prereq.greaterorequalto !== "undefined") {
                                            if (data[0][myField] >= window.datacheck[searchHex].prereq.greaterorequalto) {
                                                status = true;
                                            } else {
                                                status = false;
                                            }
                                        }
                                    }

                                    if (status == true) {
                                        document.getElementById("data_check_test-" + element + "-" + myCheckNum).innerHTML = "<img title=\"Success\" src=\"/static//app/Splunk_Security_Essentials/images/general_images/ok_ico.gif\">";
                                        if (window.location.href.indexOf("debug=true") >= 0) {
                                            param = "#data_check_test-" + element + "-" + myCheckNum
                                            $(param).append(" <a href=\"#\" onclick=\"runDebug('" + $(param).attr("id") + "'); return false\">(debug)</a>")
                                        }
                                        //     console.log("Data Check success",searchName, myCheckNum, prereqs[myCheckNum])
                                    } else {
                                        document.getElementById("data_check_test-" + element + "-" + myCheckNum).innerHTML = "<img title=\"Error\" src=\"/static//app/Splunk_Security_Essentials/images/general_images/err_ico.gif\">";
                                        if (window.location.href.indexOf("debug=true") >= 0) {
                                            param = "#data_check_test-" + element + "-" + myCheckNum
                                            $(param).append(" <a href=\"#\" onclick=\"runDebug('" + $(param).attr("id") + "'); return false\">(debug)</a>")
                                        }
                                        //       console.log("Data Check Failure code 2",searchName, myCheckNum, prereqs[myCheckNum])
                                    }
                                    setTimeout(function() { checkItem(searchHex) }, 1000)
                                    doDataCheck(element)
                                }
                            });
                        });

                    } else {
                        //     console.log("Don't need to create a search manager for ", toHex(prereqs[i].test), prereqs[i].test)

                        window.datacheck["data_check_test-" + element + "-" + i] = searchHex
                        window.datacheck[toHex(prereqs[i].test)].registerResults.push("data_check_test-" + element + "-" + i)
                        checkItem(toHex(prereqs[i].test))

                    }



                }
            }
        }










        if ($(".dvTooltip").length > 0) { $(".dvTooltip").tooltip() }
        if ($(".dvPopover").length > 0) { $(".dvPopover").popover() }
        $(".dvbanner").css("font-size", "15px");

        //ProcessSearchQueue()
        $(".data_check_table").find("tr").each(function(num, blah) { $(blah).find("td").first().css("width", "20%") })
        $(".data_check_table").find("tr").each(function(num, blah) { $(blah).find("td").last().css("width", "65%") })

        unsubmittedTokens.set(myDataset.replace(/\W/g, ""), "Test");

        submittedTokens.set(unsubmittedTokens.toJSON());
    }
);

function ProcessSearchQueue() {
    if (window.SearchesInProgress.length > 0) {
        for (var i = 0; i < window.SearchesInProgress.length; i++) {
            curSearch = window.SearchesInProgress.shift()
            if (window.datacheck[curSearch].mainSearch && window.datacheck[curSearch].mainSearch.attributes && window.datacheck[curSearch].mainSearch.attributes.data && window.datacheck[curSearch].mainSearch.attributes.data.doneProgress != 1 && window.datacheck[curSearch].mainSearch.attributes.data.dispatchState != "DONE") {
                window.SearchesInProgress.push(curSearch)
            } else {
                window.SearchesComplete.push(curSearch)
            }
        }
    }

    if (window.SearchesInQueue.length > 0 && window.SearchesInProgress.length < localStorage["splunk-security-essentials-maxconcurrentsearches"]) {
        for (var i = 0; i < Math.min(localStorage["splunk-security-essentials-maxconcurrentsearches"] - window.SearchesInProgress.length, window.SearchesInQueue.length); i++) {
            var mySearch = window.SearchesInQueue.shift()
            window.SearchesInProgress.push(mySearch)
            window.datacheck[mySearch].mainSearch.startSearch()
            window.hasAnyEverRun = true
        }
    }
    var interval = 3000
    if (Math.max(window.SearchesInQueue.length, window.SearchesInProgress.length) > 0) {
        interval = 300
    } else if (window.hasAnyEverRun == false) {
        interval = 1000
    }
    var total = window.SearchesInQueue.length + window.SearchesComplete.length + window.SearchesInProgress.length
    $("#queueContainer").css("width", Math.round(100 * (window.SearchesInQueue.length / total)) + "%")
    $("#inProgressContainer").css("width", Math.round(100 * (window.SearchesInProgress.length / total)) + "%")
    $("#completeContainer").css("width", 100 - (Math.round(100 * (window.SearchesInQueue.length / total)) + Math.round(100 * (window.SearchesInProgress.length / total))) + "%")
    if (window.SearchesInQueue.length == 0 && window.SearchesInProgress.length == 0 && total > 0) {
        $("#completeContainer").html("Complete!")
        $("#completeContainer").css("color", "white")
        $("#completeContainer").css("text-align", "center")
        setTimeout(function() { $("#percContainer").css("display", "none") }, 2500)
    }
    setTimeout(function() { ProcessSearchQueue() }, interval)
}

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

function checkItem(searchHex) {
    // console.log("EXISITING -- Initialized checkItem with", searchHex)
    for (var g = 0; g < window.datacheck[searchHex].registerResults.length; g++) {
        if (typeof window.datacheck[searchHex].mainSearch.attributes.data != "undefined" && window.datacheck[searchHex].mainSearch.attributes.data.doneProgress == 1) {
            var matches = /.*?\-([^\-]*)\-(\d*)/.exec(window.datacheck[searchHex].registerResults[g])
            var element = matches[1]
            var myCheckNum = matches[2]
                //   console.log("EXISTING - already run", g,window.datacheck[searchHex], window.datacheck[searchHex].registerResults[g],  window.datacheck[searchHex].mainSearch.attributes.data)
            if (window.datacheck[searchHex].mainSearch.attributes.data.isFailed == 1 || window.datacheck[searchHex].mainSearch.attributes.data.resultCount == 0) {
                //        console.log("EXISTING - already failed", window.datacheck[searchHex].mainSearch.attributes.data)
                document.getElementById(window.datacheck[searchHex].registerResults[g]).innerHTML = "<img title=\"Error\" src=\"/static//app/Splunk_Security_Essentials/images/general_images/err_ico.gif\">";
                //console.log("Data Check Failure code 11",searchName, myCheckNum, prereqs[myCheckNum])
            } else {
                var data = window.datacheck[searchHex].myResults.data().results;
                var myField = window.datacheck[searchHex].prereq.field
                var status = false;
                //         console.log("Evaluating...", searchHex, window.datacheck[searchHex].registerResults[g], data[0][myField], window.datacheck[searchHex].prereq.greaterorequalto)
                if (typeof data[0][myField] !== "undefined") {
                    status = true;
                    if (typeof window.datacheck[searchHex].prereq.greaterorequalto !== "undefined") {
                        if (data[0][myField] >= window.datacheck[searchHex].prereq.greaterorequalto) {
                            status = true;
                        } else {
                            status = false;
                        }
                    }
                }

                if (status == true) {
                    document.getElementById("data_check_test-" + element + "-" + myCheckNum).innerHTML = "<img title=\"Success\" src=\"/static//app/Splunk_Security_Essentials/images/general_images/ok_ico.gif\">";
                    if (window.location.href.indexOf("debug=true") >= 0) {
                        param = "#data_check_test-" + element + "-" + myCheckNum
                        $(param).append(" <a href=\"#\" onclick=\"runDebug('" + $(param).attr("id") + "'); return false\">(debug)</a>")
                    }
                    //console.log("Data Check success",searchName, myCheckNum, prereqs[myCheckNum])
                } else {
                    document.getElementById("data_check_test-" + element + "-" + myCheckNum).innerHTML = "<img title=\"Error\" src=\"/static//app/Splunk_Security_Essentials/images/general_images/err_ico.gif\">";
                    if (window.location.href.indexOf("debug=true") >= 0) {
                        param = "#data_check_test-" + element + "-" + myCheckNum
                        $(param).append(" <a href=\"#\" onclick=\"runDebug('" + $(param).attr("id") + "'); return false\">(debug)</a>")
                    }
                    //console.log("Data Check Failure code 2",searchName, myCheckNum, prereqs[myCheckNum])
                }
                //console.log("EXISTING - already success", window.datacheck[searchHex].mainSearch.attributes.data)
                //document.getElementById(window.datacheck[searchHex].registerResults[g]).innerHTML = "<img title=\"Success\" src=\"/static//app/Splunk_Security_Essentials/images/general_images/ok_ico.gif\">";
                //console.log("Data Check success",searchName, myCheckNum, prereqs[myCheckNum])
            }
            doDataCheck(element)
        }
    }

}

function doDataCheck(element) {

    var status = "ok_ico.gif"
    $(".dvbanner").css("font-size", "15px");

    for (var i = 0; i < Object.keys(window.datacheck[element]).length; i++) {

        //console.log("Checking", element, i, $("#data_check_test-" + element + "-" + i).find("img")[0].src) 
        if (status == "err_ico.gif") {
            // Don't worry
        } else if ($("#data_check_test-" + element + "-" + i).find("img")[0].src.indexOf("err_ico.gif") > 0) {
            status = "err_ico.gif"
        } else if ($("#data_check_test-" + element + "-" + i).find("img")[0].src.indexOf("loader.gif") > 0) {
            status = "loader.gif"
        } else if ($("#data_check_test-" + element + "-" + i).find("img")[0].src.indexOf("queue_icon.png") > 0) {
            status = "loader.gif"
                //       console.log("Look, I should be a loader!", element, i, $("#data_check_test-" + element + "-" + i).find("img")[0].src)
        }
    }
    //console.log("Based on this, I have determined", status)
    var popover = '<a>'
    var title = ""
    if (status == "ok_ico.gif") {
        title = "Success"
        popover = '<a class="dvPopover" href="#" data-toggle="popover" title="' + title + '" data-trigger="hover" data-content="All of the prerequisite checks were complete for this search, so you should be able to run it in your environment. Click the expand icon on the right to find out more, or for a link to the search.">'
    }
    if (status == "loader.gif") {
        title = "Loading"
        popover = '<a class="dvPopover" href="#" data-toggle="popover" title="' + title + '" data-trigger="hover" data-content="One or more of the prerequisite checks are still running for this search. Click the expand icon on the right to find out more, or for a link to the search.">'
    }
    if (status == "err_ico.gif") {
        title = "Error"
        popover = '<a class="dvPopover" href="#" data-toggle="popover" title="' + title + '" data-trigger="hover" data-content="One of more of the prerequisite checks for this search failed. Click the expand icon on the right to find which failed, and how to remediate those.">'
    }
    if ($("#" + element).find("img")[0]) {
        //$("#" + element).find("img")[0].src = "/static/app/Splunk_Security_Essentials/images/general_images/" + status    
        $("#" + element).html(popover + "<img title=\"" + title + "\" src=\"/static/app/Splunk_Security_Essentials/images/general_images/" + status + "\" /></a>")
        $("#" + element).find("a").popover()
            //console.log("Setting #" + element, )
    }
    /*else{//} if(($("#data_check_test-" + element + "-" + i).find("img")[0].src.indexOf("queue_icon.gif")>0) && (window.SearchesInQueue.length>0)){
                                $("#" + element).html("<img style=\"height:22px; width:20px;\" src=\"/static/app/Splunk_Security_Essentials/images/general_images/" + status + "\">")
                            }*/
    //console.log("See?", $("#" + element).html())



}



function runDebug(element) {

    // console.log("Got Element", element)
    masterSearch = window.datacheck[element]
    if (window.datacheck[masterSearch].myResults && window.datacheck[masterSearch].myResults.data()) {
        window.datacheck[masterSearch].resultSet = window.datacheck[masterSearch].myResults.data().results
    }
    if (window.datacheck[masterSearch].mainSearch && window.datacheck[masterSearch].mainSearch.attributes) {
        window.datacheck[masterSearch].mainSearchAttributes = window.datacheck[masterSearch].mainSearch.attributes
    }
    if (window.datacheck[masterSearch].mainSearch && window.datacheck[masterSearch].mainSearch.attributes && window.datacheck[masterSearch].mainSearch.attributes.data) {
        window.datacheck[masterSearch].mainSearchAttributesData = window.datacheck[masterSearch].mainSearch.attributes.data
    }

    window.datacheck[masterSearch].callingDebug = $("#".element).html()
        //   console.log(window.datacheck[masterSearch].callingDebug)
    var myString = JSON.stringify(window.datacheck[masterSearch], null, 2);
    var confirmVizAlertModal = new Modal('debug-' + element, {
        title: 'View Debug',
        destroyOnHide: true,
        type: 'wide'
    });


    $(confirmVizAlertModal.$el).on("hide", function() {
        // Not taking any action on hide... 

    })
    // console.log("1", confirmVizAlertModal)
    // console.log("2", confirmVizAlertModal.body)
    var counter = 0
    confirmVizAlertModal.body.append($('<p>Here is the debug info</p><textarea style="width: 600px; height: 300px;" id="debugTextArea">' + myString + '</textarea>'));
    confirmVizAlertModal.body.addClass('mlts-modal-form-inline')
    confirmVizAlertModal.footer.append($('<button>').addClass('mlts-modal-submit').attr({
            type: 'button',
            'data-dismiss': 'modal'
        }).addClass('btn btn-primary mlts-modal-submit').text('Close').on('click', function() {

            // Not taking any action on Close


        })

    )



    confirmVizAlertModal.show();

}