'use strict';

function sendTelemetryForIntro(uc) {
    require(["components/data/sendTelemetry"], function(Telemetry) {
        Telemetry.SendTelemetryToSplunk("PageStatus", { "status": "selectedIntroUseCase", "useCase": uc })
    })
}

var Descriptions = new Object;
Descriptions["Insider Threat"] = "Insider threats come from current or former employees, contractors, or partners who have access to the corporate network and intentionally or accidentally exfiltrate, misuse or destroy sensitive data. They often have legitimate access to access and download sensitive material, easily evading traditional security products. Nothing to fear, Splunk can also help here."
Descriptions["Security Monitoring"] = "Security (continuous) monitoring enables you to analyze a continuous stream of near real-time snapshots of the state of risk to your security data, the network, endpoints, as well as cloud devices, systems and applications."
Descriptions["Compliance"] = "In nearly all environments, there are regulatory requirements of one form or another - when dealing with the likes of GDPR, HIPAA, PCI, SOC, and even the 20 Critical Security Controls, Splunk enables customers to create correlation rules and reports to identify threats to sensitive data or key employees and to automatically demonstrate compliance."
Descriptions["Application Security"] = "Application security is the use of software, hardware, and procedural methods to protect applications from threats. Whether detecting DDoS, SQL Injections, or monitoring for attacks against known or unknown vulnerabilities, Splunk has your critical applications covered."
Descriptions["Other"] = "This bucket is for additional content and examples that don't fall within the use cases listed, but still provide a lot of value."
Descriptions["Advanced Threat Detection"] = "An advanced threat (APT) is a set of stealthy and continuous computer hacking processes, often orchestrated by a person or persons targeting a specific entity. APTs usually targets either private organizations, states or both for business or political motives."

var Icons = new Object;
Icons["Insider Threat"] = "/static/app/Splunk_Security_Essentials/images/general_images/insider-icon.png"
Icons["Security Monitoring"] = "/static/app/Splunk_Security_Essentials/images/general_images/secmon-icon.png"
Icons["Compliance"] = "/static/app/Splunk_Security_Essentials/images/general_images/compliance-icon.png"
Icons["Application Security"] = "/static/app/Splunk_Security_Essentials/images/general_images/appsec-icon.png"
Icons["Other"] = "/static/app/Splunk_Security_Essentials/images/general_images/other-icon.png"
Icons["Advanced Threat Detection"] = "/static/app/Splunk_Security_Essentials/images/general_images/atd-icon.png"

function setLocalStorage(UseCase) {
    localStorage["sse-usecase-Multiple"] = "[\"" + UseCase.replace(/ /g, "_") + "\"]";
    localStorage["sse-usecase"] = UseCase.replace(/ /g, "_");
    if (typeof localStorage["sse-enabledFilters"] == "undefined") {
        localStorage["sse-enabledFilters"] = JSON.stringify(["journey", "usecase", "category", "datasource"])
    }
    if (localStorage["sse-enabledFilters"].indexOf("usecase") == -1) {
        var temp = JSON.parse(localStorage["sse-enabledFilters"])
        temp.unshift("usecase")
        localStorage["sse-enabledFilters"] = JSON.stringify(temp)
    }
    if (localStorage["sse-enabledFilters"].indexOf("journey") == -1) {
        var temp = JSON.parse(localStorage["sse-enabledFilters"])
        temp.push("journey")
        localStorage["sse-enabledFilters"] = JSON.stringify(temp)
    }

    window.location.href = "contents"
}

//console.log("Starting it")
require(['jquery', 'splunkjs/mvc/simplexml/controller', 'splunkjs/mvc/dropdownview', 'splunk.util', 'components/data/parameters/RoleStorage', 'Options', 'app/Splunk_Security_Essentials/components/controls/Modal', 'json!components/data/ShowcaseInfo.json', 'bootstrap.popover'], function($, DashboardController, DropdownView, SplunkUtil, RoleStorage, Options, Modal, ShowcaseInfo) {

    // console.log("Hey, I have a showcase...", ShowcaseInfo)
    window.ShowcaseInfo = ShowcaseInfo
    var CountByUseCase = new Object;
    var TotalUseCaseCount = 0
    Object.keys(window.ShowcaseInfo.summaries).forEach(function(ShowcaseName) {
        var ShowcaseSettings = ShowcaseInfo['summaries'][ShowcaseName]
        var UseCases = ShowcaseSettings['usecase'].split("|")
        TotalUseCaseCount++
        UseCases.forEach(function(UseCase) {
            if (typeof CountByUseCase[UseCase] == "undefined")
                CountByUseCase[UseCase] = 0
            CountByUseCase[UseCase]++

        })

    })
    $("#analyticCount").text(TotalUseCaseCount)
    var myContent = ""
    Object.keys(CountByUseCase).forEach(function(UseCase) {
        myContent += "<div class=\"UseCase\"><div class=\"UseCaseImg\"><img src=\"" + Icons[UseCase] + "\" /></div><div class=\"UseCaseDescription\"><h2><a href=\"#\" onclick='sendTelemetryForIntro(\"" + UseCase + "\"); setLocalStorage(\"" + UseCase + "\");'> " + UseCase + "</a></h2><h4>Featuring " + CountByUseCase[UseCase] + " Examples!</h4><p>" + Descriptions[UseCase] + "</p></div></div>\n"
    })
    // console.log("Rendereding", myContent)
    $("#ListOfUseCases").html(myContent)


})