'use strict';





define(['jquery', 'module', "components/data/sendTelemetry", "components/controls/BuildTile", 
"splunkjs/mvc/searchmanager",
"splunkjs/mvc/simplexml/element/chart",
"splunkjs/mvc/simplexml/element/map",
"splunkjs/mvc/simplexml/element/table",
"splunkjs/mvc/simplexml/element/single"], function($, module, Telemetry, BuildTile, SearchManager, ChartElement, MapElement, TableElement, SingleElement) {
    var config = module.config();
    return {
        process_chosen_summary: function process_chosen_summary(summary, sampleSearch, ShowcaseInfo, showcaseName) {


            //console.log("ShowcaseInfo: Got it!", summary, sampleSearch, showcaseName)
            if(typeof sampleSearch.label != "undefined" && sampleSearch.label.indexOf(" - Demo") > 0){
                var unsubmittedTokens = splunkjs.mvc.Components.getInstance('default');
                var submittedTokens = splunkjs.mvc.Components.getInstance('submitted');  
                unsubmittedTokens.set("demodata", "blank");
                submittedTokens.set(unsubmittedTokens.toJSON());
            }

            var DoImageSubtitles = function(numLoops) {
                if (typeof numLoops == "undefined")
                    numLoops = 1
                var doAnotherLoop = false
                //console.log("Starting the Subtitle..")
                $(".screenshot").each(function(count, img) {
                    //console.log("got a subtitle", img)

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
                        //console.log("Analyzing image: ", $(img).css("width"), $(img).attr("processed"), $(img))
                    }
                })
                if (doAnotherLoop && numLoops < 30) {
                    numLoops++;
                    setTimeout(function() { DoImageSubtitles(numLoops) }, 500)
                }
            }
            window.DoImageSubtitles = DoImageSubtitles

            Telemetry.SendTelemetryToSplunk("PageStatus", { "status": "exampleLoaded", "exampleName": summary.name, "searchName": sampleSearch.label })



            if (typeof $(".dashboard-header-title")[0] != "undefined") {
                $(".dashboard-header-description").html("Assistant: " + $(".dashboard-header-title").first().html())
                $(".dashboard-header-title").html("<a href=\"contents\">Security Content</a> / " + summary.name)

            } else {
                //$(".dashboard-header-description").html("Assistant: " + $(".dashboard-header-title").first().html() )  
                $(".dashboard-header h2").first().html(summary.name + " (Assistant: " + $(".dashboard-header h2").first().html() + ")")
            }
            //console.log("ShowcaseInfo: Original Title", document.title)
            document.title = summary.name + document.title.substr(document.title.indexOf("|") - 1)
            var exampleText = ""
            var exampleList = $('<span></span>')
                //console.log("ShowcaseInfo: New Title", document.title)
            if (typeof summary.examples != "undefined") {
                exampleText = $('<div id="exampleList" style="float: right"> View&nbsp;&nbsp;</div>')
                    //exampleText = '<div id="searchList" style="float: right; border: solid lightgray 1px; padding: 5px;"><a name="searchListAnchor" />' 
                    //exampleText += summary.examples.length > 1 ? '<h2 style="padding-top: 0;">Searches:</h2>' : '<h2 style="padding-top: 0;">Search:</h2>';
                    //exampleList = $('<ul class="example-list"></ul>');

                summary.examples.forEach(function(example) {
                    var showcaseURLDefault = summary.dashboard;
                    if (summary.dashboard.indexOf("?") > 0) {
                        showcaseURLDefault = summary.dashboard.substr(0, summary.dashboard.indexOf("?"))
                    }

                    var url = showcaseURLDefault + '?ml_toolkit.dataset=' + example.name;
                    if (example.name == sampleSearch.label) {
                        //exampleList.append($('<li></li>').append(example.label+ " (You are here)"));

                        exampleText.append($("<button></button>").addClass("selectedButton").text(example.label))
                    } else {
                        //exampleList.append($('<li></li>').append($('<a></a>').attr('href', url).append(example.label )));

                        exampleText.append($("<button></button>").text(example.label).click(function() { window.location.href = url }))
                    }
                });
                //exampleText += "<ul>" + exampleList.html() + "</ul></div>"
                exampleText.find("button").first().addClass("first")
                exampleText.find("button").last().addClass("last")
                //("Got my Example Text...", exampleText)
                if (summary.examples.length > 1) {
                    var content = "<span>Demo Data</span> You're looking at the <i>" + sampleSearch.label.replace(/^.*\- /, "") + "</i> search right now. Did you know that we have " + summary.examples.length + " searches for this example? <a style=\"color: white; font-weight: bold; text-decoration: underline\" href=\"#\" onclick=\"var jElement = $('#searchList'); $('html, body').animate({ scrollTop: jElement.offset().top});  jElement.addClass('searchListHighlight');setTimeout(function(){ jElement.removeClass('searchListHighlight'); },2000);return false;\">Scroll Up</a> to the top to see the other searches."

                    setTimeout(function() {
                        $("#searchLabelMessage").html(content)
                        //console.log("Setting the reference content to ", content)
                        
                    }, 1000)
                }


            }
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

            var showSPLButton = '<div id="showSPLMenu" />' // Show SPL Button
            // What follows is Advanced SPL Option
            var checkedtext = ""
            if (typeof localStorage['sse-splMode'] != "undefined" && localStorage['sse-splMode'] == "true")
                checkedtext = " checked"
            var showAdvancedMode = '<div style="width: 300px; margin-top: 15px;" class="filterItem"><label class="filterswitch"><input type="checkbox" id="enableAdvancedSPL" ' + checkedtext + '><span class="filterslider "></span></label><div style="display: inline;" class="filterLine">Enable Advanced SPL Mode</div></div> '
            
            if(typeof summary.hideSPLMode != "undefined" && summary.hideSPLMode == true){
                showAdvancedMode = ""
                $("#fieldset1").hide() // Search Bar
                $("#row11").hide() // Prereq 
            }

            var showSPLText = Template.replace(/SHORTNAME/g, "showSPL").replace("TITLE", "Show Search") 
            showSPLText += showSPLButton + showAdvancedMode + "</td></tr></table>"

            if(typeof summary.hideSearches != "undefined" && summary.hideSearches == true){
                showSPLText = "" // Hide the search accordian
                $("#fieldset1").hide() // hide  the search bar
                $("#row11").hide() // Prereq 
                for(var i = 2; i <= 10; i++){ //all of the dashboard panel 
                    $("#row" + i).hide()
                }
            }

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

            var gdprText = ""
            if (typeof summary.gdprtext != "undefined" && summary.gdprtext != "") {
                gdprText = Template.replace(/SHORTNAME/g, "gdprtext").replace("TITLE", "GDPR Relevance") + summary.gdprtext + "</td></tr></table>" // "<h2>Handle Alerts</h2><p>" + summary.operationalize + "</p>"
            }

            var relevance = ""
            if (typeof summary.relevance != "undefined" && summary.relevance != "") {
                relevance = "<h2>Security Impact</h2><p>" + summary.relevance + "</p>" // "<h2>Handle Alerts</h2><p>" + summary.operationalize + "</p>"
            }


            var descriptionText = "<h2>Description</h2>" // "<h2>Handle Alerts</h2><p>" + summary.operationalize + "</p>"
            var alertVolumeText = "<h2>Alert Volume</h2>"




            if (summary.alertvolume == "Very Low" || summary.description.match(/<b>\s*Alert Volume:*\s*<\/b>:*\s*Very Low/)) {
                alertVolumeText += 'Very Low <a class="dvPopover" id="alertVolumetooltip" href="#" title="Alert Volume: Very Low" data-placement="right" data-toggle="popover" data-trigger="hover" data-content="An alert volume of Very Low indicates that a typical environment will rarely see alerts from this search, maybe after a brief period of tuning. This search should trigger infrequently enough that you could send it directly to the SOC as an alert, although you should also send it into a data-analysis based threat detection solution, such as Splunk UBA (or as a starting point, Splunk ES\'s Risk Framework)">(?)</a>'
                descriptionText += summary.description.replace(/<b>\s*Alert Volume:*\s*<\/b>:*\s*Very Low/, '')
            } else if (summary.alertvolume == "Low" || summary.description.match(/<b>\s*Alert Volume:*\s*<\/b>:*\s*Low/)) {
                alertVolumeText += 'Low <a class="dvPopover" id="alertVolumetooltip" href="#" title="Alert Volume: Low" data-placement="right" data-toggle="popover" data-trigger="hover" data-content="An alert volume of Low indicates that a typical environment will occasionally see alerts from this search -- probably 0-1 alerts per week, maybe after a brief period of tuning. This search should trigger infrequently enough that you could send it directly to the SOC as an alert if you decide it is relevant to your risk profile, although you should also send it into a data-analysis based threat detection solution, such as Splunk UBA (or as a starting point, Splunk ES\'s Risk Framework)">(?)</a>'
                descriptionText += summary.description.replace(/<b>\s*Alert Volume:*\s*<\/b>:*\s*Low/, '')
            } else if (summary.alertvolume == "Medium" || summary.description.match(/<b>\s*Alert Volume:*\s*<\/b>:*\s*Medium/)) {
                alertVolumeText += 'Medium <a class="dvPopover" id="alertVolumetooltip" href="#" title="Alert Volume: Medium" data-placement="right" data-toggle="popover" data-trigger="hover" data-content="An alert volume of Medium indicates that you\'re likely to see one to two alerts per day in a typical organization, though this can vary substantially from one organization to another. It is recommended that you feed these to an anomaly aggregation technology, such as Splunk UBA (or as a starting point, Splunk ES\'s Risk Framework)">(?)</a>'
                descriptionText += summary.description.replace(/<b>\s*Alert Volume:*\s*<\/b>:*\s*Medium/, '')
            } else if (summary.alertvolume == "High" || summary.description.match(/<b>\s*Alert Volume:*\s*<\/b>:*\s*High/)) {
                alertVolumeText += 'High <a class="dvPopover" id="alertVolumetooltip" href="#" title="Alert Volume: High" data-placement="right" data-toggle="popover" data-trigger="hover" data-content="An alert volume of High indicates that you\'re likely to see several alerts per day in a typical organization, though this can vary substantially from one organization to another. It is highly recommended that you feed these to an anomaly aggregation technology, such as Splunk UBA (or as a starting point, Splunk ES\'s Risk Framework)">(?)</a>'
                descriptionText += summary.description.replace(/<b>\s*Alert Volume:*\s*<\/b>:*\s*High/, '')
            } else if (summary.alertvolume == "Very High" || summary.description.match(/<b>\s*Alert Volume:*\s*<\/b>:*\s*Very High/)) {
                alertVolumeText += 'Very High <a class="dvPopover" id="alertVolumetooltip" href="#" title="Alert Volume: Very High" data-placement="right" data-toggle="popover" data-trigger="hover" data-content="An alert volume of Very High indicates that you\'re likely to see many alerts per day in a typical organization. You need a well thought out high volume indicator search to get value from this alert volume. Splunk ES\'s Risk Framework is a starting point, but is probably insufficient given how common these events are. It is highly recommended that you either build correlation searches based on the output of this search, or leverage Splunk UBA with it\'s threat models to surface the high risk indicators.">(?)</a>'
                descriptionText += summary.description.replace(/<b>\s*Alert Volume:*\s*<\/b>:*\s*Very High/, '')
            } else {
                alertVolumeText += summary.description.replace(/(<b>\s*Alert Volume:.*?)<\/p>.*/, '$1 <a class="dvPopover" id="alertVolumetooltip" href="#" title="Alert Volume" data-placement="right" data-toggle="popover" data-trigger="hover" data-content="The alert volume indicates how often a typical organization can expect this search to fire. On the Very Low / Low side, alerts should be rare enough to even send these events directly to the SIEM for review. Oh the High / Very High side, your SOC would be buried under the volume, and you must send the events only to an anomaly aggregation and threat detection solution, such as Splunk UBA (or for a partial solution, Splunk ES\'s risk framework). To that end, *all* alerts, regardless of alert volume, should be sent to that anomaly aggregation and threat detection solution. More data, more indicators, should make these capabilites stronger, and make your organization more secure.">(?)</a>')
                descriptionText += summary.description.replace(/(<b>\s*Alert Volume:.*?)(?:<\/p>)/, '')
            }

            //alertVolumeText += "</div></div>"

            //relevance = summary.relevance ? "<p><h2>Security Impact</h2>" +  + "</p>" : ""

            per_instance_help = Template.replace(/SHORTNAME/g, "help").replace("TITLE", "Help")
            per_instance_help += $("h3:contains(How Does This Detection Work)").parent().html()
            per_instance_help += summary.help ? "<p><h3>" + summary.name + " Help</h3></p>" + summary.help : ""
            per_instance_help += "</td></tr></table>"
            $("#row1").hide() // Hide the basic search link
            $(".hide-global-filters").hide() // Hide the "Hide Filters" link
            panelStart = "<div id=\"rowDescription\" class=\"dashboard-row dashboard-rowDescription splunk-view\">        <div id=\"panelDescription\" class=\"dashboard-cell last-visible splunk-view\" style=\"width: 100%;\">            <div class=\"dashboard-panel clearfix\" style=\"min-height: 0px;\"><h2 class=\"panel-title empty\"></h2><div id=\"view_description\" class=\"fieldset splunk-view editable hide-label hidden empty\"></div>                                <div class=\"panel-element-row\">                    <div id=\"elementdescription\" class=\"dashboard-element html splunk-view\" style=\"width: 100%;\">                        <div class=\"panel-body html\"> <div id=\"contentDescription\"> "
            panelEnd = "</div></div>                    </div>                </div>            </div>        </div>    </div>"

            //console.log("Here's my summary!", summary)

            var relatedUseCasesText = ""
            if (typeof summary.relatedUseCases != "undefined" && summary.relatedUseCases.length > 0) {
                relatedUseCasesText = "<h2>Related Use Cases</h2>"
                var tiles = $('<ul class="showcase-list"></ul>')
                for (var i = 0; i < summary.relatedUseCases.length; i++) {
                    if (typeof ShowcaseInfo['summaries'][summary.relatedUseCases[i]] != "undefined")
                        tiles.append($("<li style=\"width: 230px; height: 320px\"></li>").append(BuildTile.build_tile(ShowcaseInfo['summaries'][summary.relatedUseCases[i]], true)))

                }
                relatedUseCasesText += '<ul class="showcase-list">' + tiles.html() + '</ul>'

            }

            var similarUseCasesText = ""
            if (typeof summary.similarUseCases != "undefined" && summary.similarUseCases.length > 0) {
                similarUseCasesText = "<h2>Similar Use Cases</h2><p>Sometimes Splunk will solve the same problem in multiple ways, based on greater requirements. What we can do with a simple example for one data source at Stage 1 of the Journey, we can do across all datasets at Stage 2, and with more impact at Stage 4. Here are other versions of the same underlying technique.</p>";
                var tiles = $('<ul class="showcase-list"></ul>')
                for (var i = 0; i < summary.similarUseCases.length; i++) {
                    if (typeof ShowcaseInfo['summaries'][summary.similarUseCases[i]] != "undefined")
                        tiles.append($("<li style=\"width: 230px; height: 320px\"></li>").append(BuildTile.build_tile(ShowcaseInfo['summaries'][summary.similarUseCases[i]], true)))

                }
                similarUseCasesText += '<ul class="showcase-list">' + tiles.html() + '</ul>'
              //  console.log("Here's my similar use cases..", similarUseCasesText)

            }


            var fullSolutionText = ""
            if (typeof summary.fullSolution != "undefined") {
                fullSolutionText += "<br/><h2>Relevant Splunk Premium Solution Capabilities</h2><button class=\"btn\" onclick=\"triggerModal(window.fullSolutionText); return false;\">Find more Splunk content for this Use Case</button>"

            }

            var otherSplunkCapabilitiesText = ""
            if (relatedUseCasesText != "" || similarUseCasesText != "" || fullSolutionText != "") {
                otherSplunkCapabilitiesText = Template.replace(/SHORTNAME/g, "fullSolution").replace("TITLE", "Related Splunk Capabilities") //<p><h2>Full Splunk Capabilities</h2></p>"
                otherSplunkCapabilitiesText += similarUseCasesText
                otherSplunkCapabilitiesText += relatedUseCasesText
                otherSplunkCapabilitiesText += fullSolutionText
                otherSplunkCapabilitiesText += "</td></tr></table>"
            }

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
                    var description = datasources[i]
                    datasourceText += "<div class=\"coredatasource\"><a target=\"_blank\" href=\"data_source?datasource=" + link + "\">" + description + "</a></div>"
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

            var box1 = '<div style="overflow: hidden; padding: 10px; margin: 0px; width: 63%; min-width:585px; min-height: 250px; display: table-cell; border: 1px solid darkgray;">' + usecaseText + areaText + relevance + alertVolumeText + SPLEaseText + '</div>'
            var box2 = '<div style="overflow: hidden; padding: 10px; margin: 0px; width: 33%; min-width:305px; min-height: 250px; display: table-cell; border: 1px solid darkgray; border-left: 0">' + Stage + mitreText + killchainText + cisText + technologyText + datasourceText + '</div>'

            description = panelStart + descriptionText + '<br/><div style=" display: table;">' + box1 + box2 + '</div><br/>' + gdprText + otherSplunkCapabilitiesText + howToImplementText + eli5Text + YouTubeText + knownFPText + operationalizeText + supportingImagesText + showSPLText + per_instance_help + panelEnd

            if (typeof $(".dashboard-header-description")[0] != "undefined") {
                $(".dashboard-header-description").parent().append($("<br/>" + description))
            } else {
                $(".dashboard-header .description").first().html(description)
            }
            $("#alertVolumetooltip").popover()
            $("#contentDescription").prepend('<div id="Tour" style="float: right" class="tour"><a class="external drilldown-link" style="color: white;" href="' + window.location.href + "&tour=" + showcaseName + "-tour" + '">Learn how to use this page</a></div>')
            $("#contentDescription").prepend(exampleText)

            $("#fullSolution_table th.expands").find("a").click(function(){  $(".contentstile").find("h3").each(function(a, b) { if ($(b).height() > 60) { $(b).text($(b).text().replace(/^(.{55}).*/, "$1...")) } })  })  
            if(typeof summary.autoOpen != "undefined"){
                $("#" + summary.autoOpen + " th.expands").find("a").trigger("click")
            }
            if(gdprText != ""){
                $("#gdprtext_table th.expands").find("a").trigger("click")
            }

            if(typeof summary.visualizations != "undefined"){
                var triggerSubtitles = false
                for(var i = 0; i < summary.visualizations.length; i++){
                    // console.log("Analyzing panle", summary.visualizations[i])
                    if(typeof summary.visualizations[i].panel != "undefined" && typeof summary.visualizations[i].type != "undefined"){
                        if(summary.visualizations[i].type == "HTML" && typeof summary.visualizations[i].html != "undefined"){
                            // console.log("Enabling panle", summary.visualizations[i].panel)
                            var unsubmittedTokens = splunkjs.mvc.Components.getInstance('default');
                            var submittedTokens = splunkjs.mvc.Components.getInstance('submitted');  
                            unsubmittedTokens.set(summary.visualizations[i].panel, "blank");
                            submittedTokens.set(unsubmittedTokens.toJSON());

                            $("#" +  summary.visualizations[i].panel).html(summary.visualizations[i].html )
                        }else if(summary.visualizations[i].type == "image" && typeof summary.visualizations[i].path != "undefined"){
                            // console.log("Enabling panle", summary.visualizations[i].panel)
                            var unsubmittedTokens = splunkjs.mvc.Components.getInstance('default');
                            var submittedTokens = splunkjs.mvc.Components.getInstance('submitted');  
                            unsubmittedTokens.set(summary.visualizations[i].panel, "blank");
                            submittedTokens.set(unsubmittedTokens.toJSON());
                            var style = "" 
                            if(typeof summary.visualizations[i].style != "undefined")
                                style = "style=\"" + summary.visualizations[i].style + "\""
                            var title = "" 
                            if(typeof summary.visualizations[i].title != "undefined")
                                title = "title=\"" + summary.visualizations[i].title + "\""
                            // console.log("Her'es my panle title", title)
                            $("#" +  summary.visualizations[i].panel).html("<img class=\"screenshot\" " + style + " src=\"" + summary.visualizations[i].path + "\" " + title + " />" )
                            triggerSubtitles = true
                        }else if(summary.visualizations[i].type == "viz"){
                            // console.log("Enabling panle", summary.visualizations[i].panel)
                            var unsubmittedTokens = splunkjs.mvc.Components.getInstance('default');
                            var submittedTokens = splunkjs.mvc.Components.getInstance('submitted');  
                            unsubmittedTokens.set(summary.visualizations[i].panel, "blank");
                            submittedTokens.set(unsubmittedTokens.toJSON());
                            $("#" +  summary.visualizations[i].panel).html("<div id=\"element" + summary.visualizations[i].panel + "\" />")
                            var SMConfig = {
                            "status_buckets": 0,
                            "cancelOnUnload": true,
                            "sample_ratio": null,
                            "app": "Splunk_Security_Essentials",
                            "auto_cancel": 90,
                            "preview": true,
                            "tokenDependencies": {
                            },
                            "runWhenTimeIsUndefined": false}
                            SMConfig.id = "search" + summary.visualizations[i].panel
                            SMConfig.search = summary.visualizations[i].search
                            /*new SearchManager({
                                "id": "search8",
                                "latest_time": "now",
                                "status_buckets": 0,
                                "cancelOnUnload": true,
                                "earliest_time": "-24h@h",
                                "sample_ratio": null,
                                "search": "| makeresults count=15 | streamstats count",
                                "app": utils.getCurrentApp(),
                                "auto_cancel": 90,
                                "preview": true,
                                "tokenDependencies": {
                                },
                                "runWhenTimeIsUndefined": false
                            }, {tokens: true, tokenNamespace: "submitted"});*/
                            var VizConfig = summary.visualizations[i].vizParameters
                            VizConfig.id = "element" + summary.visualizations[i].panel
                            VizConfig.managerid = "search" + summary.visualizations[i].panel
                            VizConfig.el = $("#element" + summary.visualizations[i].panel)
                            
                            // console.log("Got our panle SM Config", SMConfig)
                            // console.log("Got our panle Viz Config", VizConfig)
                            /*{
                                "id": "element2",
                                "charting.drilldown": "none",
                                "resizable": true,
                                "charting.chart": "area",
                                "managerid": "search2",
                                "el": $('#element2')
                            }*/
                            var SM = new SearchManager(SMConfig, {tokens: true, tokenNamespace: "submitted"});
                            // console.log("Got our panle SM", SM)
                            var Viz; 
                            if(summary.visualizations[i].vizType == "ChartElement"){
                                Viz = new ChartElement(VizConfig, {tokens: true, tokenNamespace: "submitted"}).render();
                            } else if(summary.visualizations[i].vizType == "SingleElement"){
                                Viz = new SingleElement(VizConfig, {tokens: true, tokenNamespace: "submitted"}).render();
                            } else if(summary.visualizations[i].vizType == "MapElement"){
                                Viz = new MapElement(VizConfig, {tokens: true, tokenNamespace: "submitted"}).render();
                            } else if(summary.visualizations[i].vizType == "TableElement"){
                                Viz = new TableElement(VizConfig, {tokens: true, tokenNamespace: "submitted"}).render();
                            }
                            // console.log("Got our panle Viz", Viz)
                            
                        }
                        if(typeof summary.visualizations[i].title != "undefined" && summary.visualizations[i].title != "") {
                            $("#element" + summary.visualizations[i].panel).parent().prepend('<h2 class="panel-title">' + summary.visualizations[i].title + '</h2>')
                        }




                    }
                }
                if(triggerSubtitles){
                    DoImageSubtitles()
                }
            }
            $("#enableAdvancedSPL").click(function(event) {
                if (event.target.checked == true) {
                    localStorage['sse-splMode'] = "true"
                    $(".mlts-panel-footer").show()
                    $("#fieldset1").show()
                    $("#row11").show()
                } else {
                    localStorage['sse-splMode'] = "false"
                    $(".mlts-panel-footer").hide()
                    $("#fieldset1").hide()
                    $("#row11").hide()
                }
            })
            if (typeof localStorage["sse-splMode"] == "undefined" || localStorage["sse-splMode"] == "false") {
                // console.log("SPL Mode is off, hiding everything")
                $(".mlts-panel-footer").hide()
                $("#fieldset1").hide()
                $("#row11").hide()
            }
            $(".dashboard-header").css("margin-bottom", "0")

            //$("<a href=\"" + window.location.href + "&tour=" + showcaseName + "-tour\"><div id=\"Tour\" class=\"tourbtn\" style=\"float: right; margin-right: 15px; margin-top: 5px; \">Launch Tour</div></a>").insertAfter("#searchList")

        }
    };
});

