"use strict";

require([
        "jquery",
        "splunkjs/mvc",
        "splunkjs/mvc/utils",
        "splunkjs/mvc/tokenutils",
        "splunkjs/mvc/simplexml",
        "splunkjs/mvc/searchmanager",
        "splunkjs/ready!",
        "/static/app/Splunk_Security_Essentials/components/controls/BuildTile.js",
        "bootstrap.tooltip",
        "bootstrap.popover"
    ],
    function(
        $,
        mvc,
        utils,
        TokenUtils,
        DashboardController,
        SearchManager,
        Ready,
        BuildTile
    ) {

            var DoImageSubtitles = function(numLoops) {
                if (typeof numLoops == "undefined")
                    numLoops = 1
                var doAnotherLoop = false
                // console.log("Starting the Subtitle..")
                $(".screenshot").each(function(count, img) {
                    // console.log("got a subtitle", img)

                    if (typeof $(img).css("width") != "undefined" && parseInt($(img).css("width").replace("px")) > 10 && typeof $(img).attr("processed") == "undefined") {
                        var width = "width: " + $(img).css("width")

                        var myTitle = ""
                        if (typeof $(img).attr("title") != "undefined" && $(img).attr("title") != "") {
                            myTitle = "<p style=\"color: gray; display: inline-block; clear:both;" + width + "\"><center><i>" + $(img).attr("title") + "</i></center>"

                        }
                        $(img).attr("processed", "true")
                        if (typeof $(img).attr("zoomin") != "undefined" && $(img).attr("zoomin") != "") {
                            // console.log("Handling subtitle zoom...", width, $(img).attr("zoomin"), $(img).attr("setWidth"), (typeof $(img).attr("zoomin") != "undefined" && $(img).attr("zoomin") != ""))
                            if (typeof $(img).attr("setwidth") != "undefined" && parseInt($(img).css("width").replace("px")) > parseInt($(img).attr("setwidth"))) {
                                width = "width: " + $(img).attr("setwidth") + "px"
                            }
                            $(img).replaceWith("<div style=\"display: inline-block; margin:10px; border: 1px solid lightgray;" + width + "\"><a href=\"" + $(img).attr("src") + "\" target=\"_blank\">" + img.outerHTML + "</a>" + myTitle + "</div>")
                        } else {
                            ($(img)).replaceWith("<div style=\"display: block; margin:10px; border: 1px solid lightgray;" + width + "\">" + img.outerHTML + myTitle + "</div>")
                        }

                    } else {
                        doAnotherLoop = true
                        // console.log("Analyzing image: ", $(img).css("width"), $(img).attr("processed"), $(img))
                    }
                })
                if (doAnotherLoop && numLoops < 30) {
                    numLoops++;
                    setTimeout(function() { DoImageSubtitles(numLoops) }, 500)
                }
            }
            window.DoImageSubtitles = DoImageSubtitles
            
        $(".splunk-linklist-choices").css("width", "800px")
        $("#input1").css("width", "800px")
        $(".splunk-choice-input").css("padding-bottom", "0")

        var ShowcaseInfo = []
        $.ajax({ url: '/static/app/Splunk_Security_Essentials/components/data/ShowcaseInfo.json', async: false, success: function(returneddata) { ShowcaseInfo = returneddata } });

        // console.log("Here's my showcaseinfo", ShowcaseInfo)
        var unsubmittedTokens = mvc.Components.getInstance('default');
        var submittedTokens = mvc.Components.getInstance('submitted');
        var requestedShowcase = submittedTokens.get("showcase")
        // console.log("Comparing against", requestedShowcase)
        var chosenSummary
        for (var SummaryName in ShowcaseInfo['summaries']) {
            if (ShowcaseInfo['summaries'][SummaryName].name == requestedShowcase) {
                chosenSummary = ShowcaseInfo['summaries'][SummaryName]
                $("#usecasecontent").html(BuildTile.build_tile(ShowcaseInfo['summaries'][SummaryName], true))

                unsubmittedTokens.set("gotusecase", "I got it!");

                // 
                // https://127.0.0.1:8000/en-US/app/SplunkEnterpriseSecuritySuite/correlation_search_edit?search=Audit%20-%20Potential%20Gap%20in%20Data%20-%20Rule









                if(ShowcaseInfo['summaries'][SummaryName].app == "Splunk_App_for_Enterprise_Security"){
                    var sm = new SearchManager({
                        "id": "check_for_ES_Installed",
                        "latest_time": "now",
                        "status_buckets": 0,
                        "cancelOnUnload": true,
                        "earliest_time": "-24h@h",
                        "sample_ratio": null,
                        "search": "| rest splunk_server=local /services/apps/local | search disabled=0 title=\"SplunkEnterpriseSecuritySuite\" | stats count | appendcols [| rest splunk_server=local \"/services/saved/searches\" | search action.correlationsearch.label=\"" + chosenSummary.name + "\" | table title]",
                        "app": utils.getCurrentApp(),
                        "auto_cancel": 90,
                        "preview": true,
                        "tokenDependencies": {
                        },
                        "runWhenTimeIsUndefined": false
                    }, {tokens: true, tokenNamespace: "submitted"});

                    smResults = sm.data('results', { output_mode: 'json', count: 0 });

                    sm.on('search:done', function(properties) {
                        // console.log("Got Results from ES App Search", properties);
                        if(sm.attributes.data.resultCount == 0) {
                          return;
                        }       
                        smResults.on("data", function(properties) {
                            var data = smResults.data().results;
                            if(typeof data[0] != "undefined" && typeof data[0].count != "undefined" && data[0].count >0){
                                // console.log("They have ES Installed", chosenSummary)
                                var launchLink = $('<button style="float: right;" class="btn btn-primary">Open in ES <i class="icon-external" /></button>').click(function(){
                                    window.open(
                                        '/app/SplunkEnterpriseSecuritySuite/correlation_search_edit?search=' + data[0].title,
                                        '_blank'
                                        );
                                })
                                $("#content3 .html").prepend(launchLink)
                            }
                        });
                      });
                }








                if(ShowcaseInfo['summaries'][SummaryName].app == "Enterprise_Security_Content_Update"){
                    var sm = new SearchManager({
                        "id": "check_for_ESCU_Installed",
                        "latest_time": "now",
                        "status_buckets": 0,
                        "cancelOnUnload": true,
                        "earliest_time": "-24h@h",
                        "sample_ratio": null,
                        "search": "| rest splunk_server=local /services/apps/local | search disabled=0 title=\"DA-ESS-ContentUpdate\" | stats count",
                        "app": utils.getCurrentApp(),
                        "auto_cancel": 90,
                        "preview": true,
                        "tokenDependencies": {
                        },
                        "runWhenTimeIsUndefined": false
                    }, {tokens: true, tokenNamespace: "submitted"});

                    smResults = sm.data('results', { output_mode: 'json', count: 0 });

                    sm.on('search:done', function(properties) {
                        // console.log("Got Results from ESCU App Search", properties);
                        if(sm.attributes.data.resultCount == 0) {
                          return;
                        }       
                        smResults.on("data", function(properties) {
                            var data = smResults.data().results;
                            if(typeof data[0] != "undefined" && typeof data[0].count != "undefined" && data[0].count >0){
                                // console.log("They have ESCU Installed", chosenSummary)
                                $("#div_analytic_story_details").html("<table class=\"table table-chrome sse-analytic-stories\"><thead><tr><th>Story Name</th><th># of Detection Searches</th><th># of Investigative Searches</th><th># of Contextual Searches</th><th># of Supporting Searches</th><th>Description</th><th>Launch!</th></tr></thead><tbody id=\"tbody_analytic_story_details\"></tbody></table>")
                                
                                //var mySearchString = '| rest splunk_server=local /services/saved/searches | table title action.escu.full_search_name *story* | search action.escu.full_search_name="*' + chosenSummary.name + '" | head 1 | eval _raw="{\\"stories\\": " . \'action.escu.analytic_story\' . "}" | extract | rename stories{} as stories | mvexpand stories | map maxsearches=50 search="| rest splunk_server=local /services/saved/searches  | table title action.escu.full_search_name action.escu* | where \'action.escu.analytic_story\' LIKE \\"%$$stories$$%\\" | eval storyName=\\"$$stories$$\\"" | join storyName [| rest splunk_server=local /servicesNS/nobody/DA-ESS-ContentUpdate/properties/analytic_stories | eval stories=title | rex mode=sed "s/ /%20/g" field=title | map maxsearches=100 search="| rest splunk_server=local /servicesNS/nobody/DA-ESS-ContentUpdate/properties/analytic_stories/$$title$$/description | eval storyName=\\"$$stories$$\\"" | fields - splunk_server] | rename action.escu.* as * | stats count(eval(search_type="contextual")) as contextual_count count(eval(search_type="detection")) as detection_count count(eval(search_type="investigative")) as investigative_count count(eval(search_type="support")) as support_count values(value) as story_description by storyName'
                                var mySearchString = '| rest /services/configs/conf-analytic_stories splunk_server=local count=0 | search detection_searches="*' +  chosenSummary.name + '*" | spath input=detection_searches path={} output=det | spath input=investigative_searches path={} output=invs | spath input=contextual_searches path={} output=contx | spath input=support_searches path={} output=ss | stats last(description) as story_description, count(det) as detection_count, count(invs) as investigative_count, count(contx) as contextual_count, count(ss) as support_count by title | rename title as storyName'
                                // console.log("Here's my ESCU Search", mySearchString)
                                var storyDetailsm = new SearchManager({
                                    "id": "check_for_ESCU_Details",
                                    "latest_time": "now",
                                    "status_buckets": 0,
                                    "cancelOnUnload": true,
                                    "earliest_time": "-24h@h",
                                    "sample_ratio": null,
                                    "search": mySearchString,
                                    "app": utils.getCurrentApp(),
                                    "auto_cancel": 90,
                                    "preview": true,
                                    "tokenDependencies": {
                                    },
                                    "runWhenTimeIsUndefined": false
                                }, {tokens: true, tokenNamespace: "submitted"});
            
                                storyDetailssmResults = storyDetailsm.data('results', { output_mode: 'json', count: 0 });
            
                                storyDetailsm.on('search:done', function(properties) {
                                    // console.log("Got Results from ESCU Data Search", properties);
                                    if(storyDetailsm.attributes.data.resultCount > 0) {
                                        var unsubmittedTokens = mvc.Components.getInstance('default');
                                        var submittedTokens = mvc.Components.getInstance('submitted');
                                        unsubmittedTokens.set("analytic_story_details", "I got it!");
                                        submittedTokens.set(unsubmittedTokens.toJSON());
                                    }       
                                    storyDetailssmResults.on("data", function(properties) {
                                        var data = storyDetailssmResults.data().results;
                                        // console.log("Here's my data", data)

                                        for(var i = 0; i < data.length; i++){
                                            let storyName = data[i]['storyName']
                                            var launchLink = $('<button style="float: right;" class="btn btn-primary">Open in ESCU <i class="icon-external" /></button>').click(function(){
                                                window.open(
                                                    '/app/DA-ESS-ContentUpdate/analytic_story_details?form.analytic_story_name=' + storyName,
                                                    '_blank'
                                                  );
                                            })
                                            var tr = $('<tr><td>' + data[i].storyName + '</td><td>' + data[i].detection_count + '</td><td>' + data[i].investigative_count + '</td><td>' + data[i].contextual_count + '</td><td>' + data[i].support_count + '</td><td>' + data[i].story_description + '</td></tr>')
                                            tr.append($("<td>").append(launchLink))
                                            $("#tbody_analytic_story_details").append(tr)

                                        }
                                        
                                    });
                                });
            
                            }
                        });
                      });
                }

                if(typeof ShowcaseInfo['summaries'][SummaryName].gdprtext != "undefined" && ShowcaseInfo['summaries'][SummaryName].gdprtext != ""){

                    unsubmittedTokens.set("gotusecasedetails", "I got it!");
                    $("#usecasedetail").html(ShowcaseInfo['summaries'][SummaryName].gdprtext)
                }


                if(typeof ShowcaseInfo['summaries'][SummaryName].images != "undefined" && ShowcaseInfo['summaries'][SummaryName].images != ""){


                    var images = ""
                    for (var i = 0; i < ShowcaseInfo['summaries'][SummaryName].images.length; i++) {
                        images += "<img class=\"screenshot\" setwidth=\"650\" zoomin=\"true\" src=\"" + ShowcaseInfo['summaries'][SummaryName].images[i].path + "\" title=\"" + ShowcaseInfo['summaries'][SummaryName].images[i].label + "\" />"
                    }
                    
                    unsubmittedTokens.set("gotusecasescreenshots", "I got it!");
                    $("#usecasescreenshots").html(images)
                    setTimeout(function(){
                        DoImageSubtitles()
                    }, 300)


                }


                submittedTokens.set(unsubmittedTokens.toJSON());
                setTimeout(function() {
                    $("#panel1").css("width", "70%")
                    $("#panel2").css("width", "30%")
                }, 300)

            }
        }

    }
);