'use strict';

// set the runtime environment, which controls cache busting
var runtimeEnvironment = 'production';

// set the build number, which is the same one being set in app.conf
var build = '1470296870945';

// get app and page names
var pathComponents = location.pathname.split('?')[0].split('/');
var appName = 'Splunk_Security_Essentials';
var pageIndex = pathComponents.indexOf(appName);
var pageName = pathComponents[pageIndex + 1];

// path to the root of the current app
var appPath = "../app/" + appName;

// This code is originally from setRequireConfig.es6 and is injected into runPageScript.es6 and every visualization.es6 file using @setRequireConfig.es6@

var requireConfigOptions = {
    paths: {
        // app-wide path shortcuts
        "components": appPath + "/components",
        "vendor": appPath + "/vendor",
        "Options": appPath + "/components/data/parameters/Options",

        // requirejs loader modules
        "text": appPath + "/vendor/text/text",
        "json": appPath + "/vendor/json/json",
        "css": appPath + "/vendor/require-css/css",

        // jquery shims
        "jquery-ui-slider": appPath + "/vendor/jquery-ui-slider/jquery-ui.min",

        // highcharts shims
        "highcharts-amd": appPath + "/vendor/highcharts/highcharts.amd",
        "highcharts-more": appPath + "/vendor/highcharts/highcharts-more.amd",
        "highcharts-downsample": appPath + "/vendor/highcharts/modules/highcharts-downsample.amd",
        "no-data-to-display": appPath + "/vendor/highcharts/modules/no-data-to-display.amd",

        // srcviewer shims
        "prettify": appPath + "/vendor/prettify/prettify",
        "showdown": appPath + "/vendor/showdown/showdown",
        "codeview": appPath + "/vendor/srcviewer/codeview"
    },
    shim: {
        "jquery-ui-slider": {
            deps: ["css!" + appPath + "/vendor/jquery-ui-slider/jquery-ui.min.css"]
        }
    },
    config: {
        "Options": {
            // app-wide options
            "options": {
                "appName": 'Splunk_Security_Essentials',
                // the number of points that's considered "large" - how each plot handles this is up to it
                "plotPointThreshold": 1000,
                "maxSeriesThreshold": 1000,
                "smallLoaderScale": 0.4,
                "largeLoaderScale": 1,
                "highchartsValueDecimals": 2,
                "defaultModelName": "default_model_name",
                "defaultRoleName": "default",
                "dashboardHistoryTablePageSize": 5
            }
        }
    }
};

require.config(requireConfigOptions);

// End of setRequireConfig.es6

// path to the script for the current page
var scriptPath = "components/pages/" + pageName;

var requireModules = ["jquery", "splunkjs/ready!", "components/controls/PreviousValueStore", "css!" + appPath + "/style/app", "css!" + appPath + "/style/" + pageName];

var additionalConfigOptions = {
    config: {}
};

// console.log("Page Name", pageName, pageName.indexOf("contents"))
if (pageName.indexOf("contents") == 0) {
    // console.log("Before", requireModules)
    requireModules.push('components/pages/contents')
    // console.log("After", requireModules)
}
if (pageName.indexOf("home") == 0) {
    // console.log("Before", requireModules)
    requireModules.push('components/pages/landing')
    // console.log("After", requireModules)
}

if(typeof localStorage[appName + '-PageViews'] == "undefined"){
    localStorage[appName + '-PageViews'] = 1
}else{
    localStorage[appName + '-PageViews'] = parseInt(localStorage[appName + '-PageViews']) + 1
}

// additional config options and require modules for showcases
if (pageName.indexOf("showcase_") >= 0) {
    requireModules.push( 'components/data/sampleSearches/SampleSearchLoader', scriptPath);

    additionalConfigOptions.config['components/data/sampleSearches/SampleSearchLoader'] = {
        pageName: pageName
    };
}

// additional config options and require modules for showcases
if (pageName == "data_foundation") {
    requireModules.push( '/static/app/' + appName + '/components/pages/data_foundation.js');

}

additionalConfigOptions.urlArgs = "bust=" + (runtimeEnvironment === 'develop' ? Date.now() : build);

require.config(additionalConfigOptions);
// console.log("ReallyAfter", requireModules)
    // run page script
require(requireModules, function() {
    require(['splunkjs/mvc/simplexml/controller', "components/controls/DependencyChecker", "components/data/parameters/RoleStorage"], function(DashboardController, DependencyChecker, RoleStorage) {
        DashboardController.onReady(function() {
            DashboardController.onViewModelLoad(function() {

                RoleStorage.updateMenu();
            });
        });
    });
});