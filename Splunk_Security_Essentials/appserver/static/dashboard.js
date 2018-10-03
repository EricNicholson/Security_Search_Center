// init
var localStoragePreface = "sse"
window.diagObject = []

// generateDiag.js content moved over to dashboard.js

/* 
// removing console redirection, because it breaks IE 11
var console = window.console

function intercept(method) {
    var original = console[method]
    console[method] = function() {
        window.diagObject.push(arguments);
        if (original.apply) {
            // Do this for normal browsers
            original.apply(console, arguments);
        } else {
            // Do this for IE
            var message = Array.prototype.slice.apply(arguments).join(' ');
            original(message);
        }
    }
}
var methods = ['log', 'warn', 'error'];
for (var i = 0; i < methods.length; i++) {
    intercept(methods[i]);
}
 */

function collectDiag() {

    require([
        "jquery", "/static/app/Splunk_Security_Essentials/vendor/jszip/jszip.js", "/static/app/Splunk_Security_Essentials/vendor/FileSaver/FileSaver.js"
    ], function($, JSZip) {
        //console.log("JSZip Loaded", JSZip)
        var zip = new JSZip();

        var browserInfo = new Object()
        browserInfo.ua = navigator.userAgent;
        browserInfo.url = window.location.href;
        browserInfo.cookies = document.cookie;
        browserInfo.lang = navigator.language

        var searchManagers = new Object()
        for (var attribute in splunkjs.mvc.Components.attributes) {
            var sm = splunkjs.mvc.Components.getInstance(attribute)
            if (typeof sm != "undefined" && sm != null) {
                if (typeof sm.search != "undefined") {
                    searchManagers[attribute] = new Object()
                    searchManagers[attribute]['name'] = attribute
                    searchManagers[attribute]['lastError'] = sm.lastError
                    searchManagers[attribute]['attributes'] = sm.search.attributes
                }
            }
        }

        var local_configuration = window.$C

        var folder1 = zip.folder("diag-output-from-Splunk-Essentials");
        //folder1.file("console_log.json", JSON.stringify(window.diagObject, null, 4));
        folder1.file("browser_info.json", JSON.stringify(browserInfo, null, 4));
        folder1.file("search_managers.json", JSON.stringify(searchManagers, null, 4));
        folder1.file("localStorage.json", JSON.stringify(localStorage, null, 4));
        folder1.file("configuration.json", JSON.stringify(local_configuration, null, 4));
        folder1.file("tokens.json", JSON.stringify(splunkjs.mvc.Components.getInstance("submitted").attributes, null, 4));

        zip.generateAsync({ type: "blob" })
            .then(function(content) {
                // see FileSaver.js
                saveAs(content, "diag-output-from-Splunk-Essentials.zip");

            });
    })
}

var mylink = $("<a href=\"#\">Generate Essentials-only Diag</a>").click(function() {
    collectDiag()
    return false;
})
$('div[data-view="views/shared/splunkbar/help/Master"]').find("ul").append($("<li></li>").append(mylink))





/// Clear Demo Functionality


function clearDemo(){


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
        for( var key in localStorage){ 
            if(localStorage.hasOwnProperty(key) && key.indexOf(localStoragePreface + "-") == 0 && key.indexOf(localStoragePreface + "-metrics-") == -1){ 
                localStorage.removeItem(key)
            } 
        }

        alert("Success")


    })
    localStorage[localStoragePreface + '-splMode'] = "false"


}
var mylink = $("<a href=\"#\">Demos Only - Reset Everything</a>").click(function() {
    clearDemo()
    location.reload()
})
$('div[data-view="views/shared/splunkbar/help/Master"]').find("ul").append($("<li></li>").append(mylink) )



// Metrics 
if(typeof(localStorage[localStoragePreface + "-metrics-numViews"]) == "undefined" || localStorage[localStoragePreface + "-metrics-numViews"] == "undefined"){
    localStorage[localStoragePreface + "-metrics-numViews"] = 1
}else{
    localStorage[localStoragePreface + "-metrics-numViews"]++
}

var myPage = splunkjs.mvc.Components.getInstance("env").toJSON().page
if(window.location.search.indexOf("ml_toolkit.dataset") != -1 || window.location.search.indexOf("showcase=") != -1){
    // https://css-tricks.com/snippets/jquery/get-query-params-object/
    jQuery.extend({
        getQueryParameters : function(str) {
            return (str || document.location.search).replace(/(^\?)/,'').split("&").map(function(n){return n = n.split("="),this[n[0]] = n[1],this}.bind({}))[0];
        }
    });
    var queryParams = $.getQueryParameters();
    if(window.location.search.indexOf("ml_toolkit.dataset") != -1){
        myPage += " -- " + decodeURIComponent( queryParams['ml_toolkit.dataset'] )
    }else{
        myPage += " -- " + decodeURIComponent( queryParams['showcase'] )
    }
}
if(typeof(localStorage[localStoragePreface + "-metrics-pageViews"]) == "undefined" || localStorage[localStoragePreface + "-metrics-pageViews"] == "undefined"){
    var init = {}
    init[myPage] = 1
    localStorage[localStoragePreface + "-metrics-pageViews"] = JSON.stringify(init)
}else{
    var pageMetrics = JSON.parse(localStorage[localStoragePreface + "-metrics-pageViews"])
    if(typeof pageMetrics[myPage] == "undefined"){
        pageMetrics[myPage] = 1
    }else{
        pageMetrics[myPage]++
    }
    localStorage[localStoragePreface + "-metrics-pageViews"] = JSON.stringify(pageMetrics)
}


// Utility

function waitForEl(selector, callback){
    var poller1 = setInterval(function(){
        $jObject = jQuery(selector);
        if($jObject.length < 1){
            return;
        }
        clearInterval(poller1);
        callback($jObject)
    },20);
}