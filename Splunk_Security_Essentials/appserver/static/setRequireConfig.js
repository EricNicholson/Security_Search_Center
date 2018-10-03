"use strict";

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
        "showdown": appPath + "/vendor/showdown/showdown" //,
            //"codeview": appPath + "/vendor/srcviewer/codeview"
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