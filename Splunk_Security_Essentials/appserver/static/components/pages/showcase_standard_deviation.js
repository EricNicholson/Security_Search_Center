"use strict";

/* This ultimately belongs in a separate file...*/
require(['jquery', 'splunkjs/mvc/simplexml/controller', 'components/controls/Modal'], function($, DashboardController, Modal) {

        var triggerModal = function(bodycontent) {
            var myModal = new Modal('MyModalID-irrelevant-unless-you-want-many', {
                title: 'Find Out More',
                destroyOnHide: true,
                type: 'wide'
            });

            $(myModal.$el).on("hide", function() {
                // Not taking any action on hide, but you can if you want to!
            })

            myModal.body.addClass('mlts-modal-form-inline')
                .append($(bodycontent));

            myModal.footer.append($('<button>').addClass('mlts-modal-submit').attr({
                type: 'button',
                'data-dismiss': 'modal'
            }).addClass('btn btn-primary mlts-modal-submit').text('Close').on('click', function() {
                // Not taking any action on Close... but I could!        
            }))
            myModal.show(); // Launch it!
        }
        window.triggerModal = triggerModal

    })
    /* END This ultimately belongs in a separate file...*/









var _templateObject = _taggedTemplateLiteral(["| loadjob $searchBarSearchJobIdToken$\n                                   | head 1\n                                   | transpose\n                                   | fields column\n                                   | search column != \"column\" AND column != \"_*\""], ["| loadjob $searchBarSearchJobIdToken$\n                                   | head 1\n                                   | transpose\n                                   | fields column\n                                   | search column != \"column\" AND column != \"_*\""]),
    _templateObject2 = _taggedTemplateLiteral(["| inputlookup ", "_lookup\n                                   | eval Actions=actions\n                                   | eval \"Search query\" = search_query,\n                                          \"Field to analyze\" = outlier_variable,\n                                          \"Threshold method\" = threshold_method,\n                                          \"Threshold multiplier\" = threshold_multiplier,\n                                          \"Sliding window\" = window_size,\n                                          \"Include current point\" = if(use_current_point == \"0\", \"false\", \"true\"),\n                                          \"# of outliers\" = outliers_count"], ["| inputlookup ", "_lookup\n                                   | eval Actions=actions\n                                   | eval \"Search query\" = search_query,\n                                          \"Field to analyze\" = outlier_variable,\n                                          \"Threshold method\" = threshold_method,\n                                          \"Threshold multiplier\" = threshold_multiplier,\n                                          \"Sliding window\" = window_size,\n                                          \"Include current point\" = if(use_current_point == \"0\", \"false\", \"true\"),\n                                          \"# of outliers\" = outliers_count"]);



function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _taggedTemplateLiteral(strings, raw) { return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

require(["jquery",
        "underscore",
        "splunkjs/mvc",
        "splunkjs/mvc/chartview",
        "splunkjs/mvc/dropdownview",
        "splunkjs/mvc/textinputview",
        "splunkjs/mvc/singleview",
        "splunkjs/mvc/checkboxview",
        "splunkjs/mvc/tableview",
        "splunkjs/mvc/utils",
        'splunkjs/mvc/visualizationregistry',
        'Options',
        "components/splunk/AlertModal",
        "components/splunk/Forms",
        "components/splunk/KVStore",
        'components/splunk/SearchBarWrapper',
        "components/splunk/Searches",
        "components/data/parameters/ParseSearchParameters",
        "components/data/formatters/compactTemplateString",
        "components/data/serializers/ShowcaseHistorySerializer",
        "components/controls/AssistantControlsFooter",
        "components/controls/AssistantPanel/Master",
        "components/controls/QueryHistoryTable",
        "components/controls/SearchStringDisplay",
        "components/controls/DrilldownLinker",
        "components/controls/Messages",
        "components/controls/Modal",
        "components/controls/Spinners",
        "components/controls/Tabs",
        "components/controls/ProcessSummaryUI",
        "components/data/sampleSearches/SampleSearchLoader",
        "components/data/validators/NumberValidator",
        "splunkjs/mvc/searchmanager",
        //"components/splunk/AlertModalNonDisruptive",
        'json!components/data/ShowcaseInfo.json',
        'bootstrap.tooltip',
        'bootstrap.popover'
    ],
    function(
        $,
        _,
        mvc,
        ChartView,
        DropdownView,
        TextInputView,
        SingleView,
        CheckboxView,
        TableView,
        utils,
        VisualizationRegistry,
        Options,
        AlertModal,
        Forms,
        KVStore,
        SearchBarWrapper,
        Searches,
        ParseSearchParameters,
        compact,
        ShowcaseHistorySerializer,
        AssistantControlsFooter,
        AssistantPanel,
        QueryHistoryTable,
        SearchStringDisplay,
        DrilldownLinker,
        Messages,
        Modal,
        Spinners,
        Tabs,
        ProcessSummaryUI,
        SampleSearchLoader,
        NumberValidator,
        SearchManager,
        //AlertModalNonDisruptive,
        ShowcaseInfo
    ) {

        var showcaseName = 'showcase_standard_deviation';
        $(".hideable").each(function(index, value) {
            var id = "random_id_" + Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5);
            $(value).attr("id", id);
            // console.log("setting div to id", $(value), id);
            $(value).parent().prepend("<p><a href=\"#\" onclick='$(\"#" + id + "\").toggle(); return false;'>Toggle Help</a></p>");
            $(value).toggle();
        })
        var appName = Options.getOptionByName('appName');

        var submitButtonText = 'Detect Spikes';

        var baseSearchString = null;
        var baseTimerange = null;

        // stores the current sample search, if applicable
        var currentSampleSearch = null;

        var isRunning = false;

        // stores whether or not the last value entered into a given control is valid
        var controlValidity = function() {
            var controlValidityStore = {};

            return {
                set: function set(id, value) {
                    controlValidityStore[id] = value;
                },
                /**
                 * Checks whether all entries in controlValidityStore are true
                 * @returns {boolean}
                 */
                getAll: function getAll() {
                    return Object.keys(controlValidityStore).every(function(validity) {
                        return controlValidityStore[validity];
                    });
                }
            };
        }();

        var historyCollectionId = showcaseName + "_history";

        var historySerializer = new ShowcaseHistorySerializer(historyCollectionId, {
            _time: null,
            search_query: null,
            earliest_time: null,
            latest_time: null,
            outlier_variable: null,
            threshold_method: null,
            threshold_multiplier: null,
            window_size: null,
            use_current_point: null,
            outliers_count: null
        }, function() {
            Searches.startSearch('queryHistorySearch');
        });

        // the possible searches and their descriptions, one per analysis function
        var outlierResultsSearchSettings = {
            'outlierSearchTypeAvgLatestStatsHistorical': {
                //search: ['| stats count as num_data_samples latest($outlierVariableToken|s$) as $outlierVariableToken|s$ avg($outlierVariableToken|s$) as avg stdev($outlierVariableToken|s$) as stdev by $outlierVariableSubjectToken$', '| eval lowerBound=(avg-stdev*$scaleFactorToken$), upperBound=(avg+stdev*$scaleFactorToken$)'],
                search: ['| eventstats max(_time) as maxtime | stats count as num_data_samples max(eval(if(_time >= relative_time(maxtime, "-1d@d"), \'$outlierVariableToken$\',null))) as $outlierVariableToken|s$ avg(eval(if(_time<relative_time(maxtime,"-1d@d"),\'$outlierVariableToken$\',null))) as avg stdev(eval(if(_time<relative_time(maxtime,"-1d@d"),\'$outlierVariableToken$\',null))) as stdev by $outlierVariableSubjectToken|s$', '| eval lowerBound=(avg-stdev*$scaleFactorToken$), upperBound=(avg+stdev*$scaleFactorToken$)'],
                description: ['calculate the mean, standard deviation and most recent value', 'calculate the bounds as a multiple of the standard deviation']
            },
            'outlierSearchTypeAvgLatestStatsRealtime': {
                search: ['| eval maxtime=now() | stats count as num_data_samples max(eval(if(_time >= relative_time(maxtime, "-1d@d"), \'$outlierVariableToken$\',null))) as $outlierVariableToken|s$ avg(eval(if(_time<relative_time(maxtime,"-1d@d"),\'$outlierVariableToken$\',null))) as avg stdev(eval(if(_time<relative_time(maxtime,"-1d@d"),\'$outlierVariableToken$\',null))) as stdev by $outlierVariableSubjectToken|s$', '| eval lowerBound=(avg-stdev*$scaleFactorToken$), upperBound=(avg+stdev*$scaleFactorToken$)'],
                description: ['calculate the mean, standard deviation and most recent value', 'calculate the bounds as a multiple of the standard deviation']
            }
        };

        var outlierFieldSearchStrings = {
            both: "| eval isOutlier=if(('$outlierVariableToken$' < lowerBound OR '$outlierVariableToken$' > upperBound) AND num_data_samples >=7, 1, 0)",
            above: "| eval isOutlier=if('$outlierVariableToken$' > upperBound AND num_data_samples >=7, 1, 0)",
            below: "| eval isOutlier=if('$outlierVariableToken$' < lowerBound AND num_data_samples >=7, 1, 0)",
            split: "| eval isOutlierUpper=if('$outlierVariableToken$' < lowerBound AND num_data_samples >=7, 1, 0), isOutlierLower=if('$outlierVariableToken$' > upperBound AND num_data_samples >=7, 1, 0)"
        };

        function setupSearches() {
            (function setupSearchBarSearch() {
                Searches.setSearch('searchBarSearch', {
                    targetJobIdTokenName: 'searchBarSearchJobIdToken',
                    onStartCallback: function onStartCallback() {
                        hideErrorMessage();
                        hidePanels();
                    },
                    onDoneCallback: function onDoneCallback(searchManager) {
                        DrilldownLinker.setSearchDrilldown(datasetPreviewTable.$el.prev('h3'), searchManager.search);
                        Searches.startSearch('outlierVariableSearch');
                        Searches.startSearch('outlierVariableSubjectSearch');
                    },
                    onErrorCallback: function onErrorCallback(errorMessage) {
                        Forms.clearChoiceViewOptions(outlierVariableControl);
                        Forms.clearChoiceViewOptions(outlierVariableSubjectControl);
                        showErrorMessage(errorMessage);
                        hidePanels();
                    }
                });
            })();

            (function setupOutlierVariableSearch() {
                Searches.setSearch("outlierVariableSearch", {
                    searchString: compact(_templateObject),
                    onStartCallback: function onStartCallback() {
                        hideErrorMessage();
                    },
                    onErrorCallback: function onErrorCallback(errorMessage) {
                        showErrorMessage(errorMessage);
                        hidePanels();
                    }
                });
            })();

            (function setupOutlierVariableSubjectSearch() {
                Searches.setSearch("outlierVariableSubjectSearch", {
                    searchString: compact(_templateObject),
                    onStartCallback: function onStartCallback() {
                        hideErrorMessage();
                    },
                    onErrorCallback: function onErrorCallback(errorMessage) {
                        showErrorMessage(errorMessage);
                        hidePanels();
                    }
                });
            })();

            (function setupOutlierResultsSearches() {
                Object.keys(outlierResultsSearchSettings).forEach(function(searchName) {
                    Searches.setSearch(searchName, {
                        autostart: false,
                        searchString: ['| loadjob $searchBarSearchJobIdToken$'].concat(outlierResultsSearchSettings[searchName].search, [outlierFieldSearchStrings.both]),
                        targetJobIdTokenName: 'outlierResultsSearchToken',
                        onStartCallback: function onStartCallback() {
                            hideErrorMessage();
                            updateForm(true);
                        },
                        onDoneCallback: function onDoneCallback() {
                            showPanels();
                        },
                        onDataCallback: function onDataCallback(data) {
                            var collection = {
                                _time: parseInt(new Date().valueOf() / 1000, 10),
                                search_query: baseSearchString,
                                earliest_time: baseTimerange.earliest_time,
                                latest_time: baseTimerange.latest_time,
                                outlier_variable: Forms.getToken('outlierVariableToken'),
                                threshold_method: Forms.getToken('outlierSearchTypeToken'),
                                threshold_multiplier: Forms.getToken('scaleFactorToken'),
                                window_size: 0, //Forms.getToken('windowedAnalysisToken') === 'StreamStats' ? Forms.getToken('windowSizeToken') : 0,
                                use_current_point: Forms.getToken('useCurrentPointToken')
                            };

                            historySerializer.persist(Searches.getSid(searchName), collection);

                            Searches.startSearch('outliersVizSearch')
                            Searches.startSearch('outliersVizSearchOutliersOnly');

                            var showOutliersOverTimeViz = false;

                            if (data != null && data.fields != null && data.rows != null && data.rows.length > 0) {
                                var timeIndex = data.fields.indexOf('_time');

                                // plotting the outliers count over time only makes sense on time-series data
                                if (timeIndex > -1 && data.rows[0][timeIndex] != null) {
                                    showOutliersOverTimeViz = true;
                                }
                            }

                            if (showOutliersOverTimeViz) {
                                Forms.setToken('showOutliersOverTimeToken', true);
                                Searches.startSearch('outliersOverTimeVizSearch');
                            } else {
                                Forms.unsetToken('showOutliersOverTimeToken');
                            }
                        },
                        onErrorCallback: function onErrorCallback(errorMessage) {
                            showErrorMessage(errorMessage);
                            hidePanels();
                        },
                        onFinallyCallback: function onFinallyCallback() {
                            updateForm(false);
                        }
                    });
                });
            })();

            (function setupResultsCountSearch() {
                var sharedSearchArray = ['| stats count'];

                var vizQueryArray = [];
                var vizQuerySearch = null;

                var vizOptions = DrilldownLinker.parseVizOptions({ category: 'singlevalue' });

                singleResultsPanel.openInSearchButton.on('click', function() {
                    window.open(DrilldownLinker.getUrl('search', vizQuerySearch, vizOptions), '_blank');
                });

                singleResultsPanel.showSPLButton.on('click', function() {
                    ('resultsCountSearchModal', 'Display the number of results', vizQueryArray, getFullSearchQueryComments().concat(['count the results']), baseTimerange, vizOptions);
                    //SearchStringDisplay.showSearchStringModal('resultsCountSearchModal', 'Display the number of results', vizQueryArray, getFullSearchQueryComments().concat(['count the results']), baseTimerange, vizOptions);
                });

                Searches.setSearch("resultsCountSearch", {
                    autostart: true,
                    targetJobIdTokenName: "resultsCountSearchToken",
                    searchString: ['| loadjob $outlierResultsSearchToken$'].concat(sharedSearchArray),
                    onStartCallback: function onStartCallback() {
                        Spinners.showLoadingOverlay(singleResultsPanel.viz.$el);

                        vizQueryArray = getFullSearchQueryArray().concat(sharedSearchArray);
                        vizQuerySearch = DrilldownLinker.createSearch(vizQueryArray, baseTimerange);

                        DrilldownLinker.setSearchDrilldown(singleResultsPanel.title, vizQuerySearch, vizOptions);
                    },
                    onFinallyCallback: function onFinallyCallback() {
                        Spinners.hideLoadingOverlay(singleResultsPanel.viz.$el);
                    }
                });
            })();


            (function setupEventCountCountSearch() {
                var sharedSearchArray = [' | eval totalcount = max(eventCount, resultCount, scanCount, \'performance.command.inputlookup.output_count\') | table totalcount '];

                var vizQueryArray = [];
                var vizQuerySearch = null;

                var vizOptions = DrilldownLinker.parseVizOptions({ category: 'singlevalue' });

                /*singleResultsPanel.openInSearchButton.on('click', function () {
                    window.open(DrilldownLinker.getUrl('search', vizQuerySearch, vizOptions), '_blank');
                });

                singleResultsPanel.showSPLButton.on('click', function () {
                    SearchStringDisplay.showSearchStringModal('resultsCountSearchModal', 'Display the number of results', vizQueryArray, getFullSearchQueryComments().concat(['count the results']), baseTimerange, vizOptions);
                });*/
                mysearch = Searches.getSearchManager("searchBarSearch");

                Searches.setSearch("eventCountCountSearch", {
                    autostart: true,
                    targetJobIdTokenName: "resultsCountSearchToken",

                    searchString: ['| rest /services/search/jobs | search sid=$searchBarSearchJobIdToken$ '].concat(sharedSearchArray),
                    onStartCallback: function onStartCallback() {
                        Spinners.showLoadingOverlay(singleResultsPanel.viz.$el);
                        vizQueryArray = getFullSearchQueryArray().concat(sharedSearchArray);
                        vizQuerySearch = DrilldownLinker.createSearch(vizQueryArray, baseTimerange);

                        /*DrilldownLinker.setSearchDrilldown(singleResultsPanel.title, vizQuerySearch, vizOptions);*/
                    },
                    onFinallyCallback: function onFinallyCallback() {
                        Spinners.hideLoadingOverlay(singleResultsPanel.viz.$el);
                    }
                });
            })();


            (function setupOutliersCountSearch() {
                var sharedSearchArray = ['| where isOutlier=1', '| stats count'];

                var vizQueryArray = [];
                var vizQuerySearch = null;

                var vizOptions = DrilldownLinker.parseVizOptions({ category: 'singlevalue' });

                singleOutliersPanel.openInSearchButton.on('click', function() {
                    window.open(DrilldownLinker.getUrl('search', vizQuerySearch, vizOptions), '_blank');
                });

                singleOutliersPanel.showSPLButton.on('click', function() {
                    ModifiedLaunchQuerySPL('outliersCountSearchModal', 'Display the number of outliers', vizQueryArray, getFullSearchQueryComments().concat(['show only outliers', 'count the outliers']), baseTimerange, vizOptions);
                    //SearchStringDisplay.showSearchStringModal('outliersCountSearchModal', 'Display the number of outliers', vizQueryArray, getFullSearchQueryComments().concat(['show only outliers', 'count the outliers']), baseTimerange, vizOptions);
                });

                Searches.setSearch("outliersCountSearch", {
                    autostart: true,
                    targetJobIdTokenName: "outliersCountSearchToken",
                    searchString: ['| loadjob $outlierResultsSearchToken$'].concat(sharedSearchArray),
                    onStartCallback: function onStartCallback() {
                        Spinners.showLoadingOverlay(singleOutliersPanel.viz.$el);

                        vizQueryArray = getFullSearchQueryArray().concat(sharedSearchArray);
                        vizQuerySearch = DrilldownLinker.createSearch(vizQueryArray, baseTimerange);

                        DrilldownLinker.setSearchDrilldown(singleOutliersPanel.title, vizQuerySearch, vizOptions);
                    },
                    onDataCallback: function onDataCallback(data) {
                        var countIndex = data.fields.indexOf('count');

                        if (data.rows.length > 0 && countIndex >= 0) {
                            var jobId = Searches.getSid(getCurrentSearchName());

                            var collection = {
                                outliers_count: data.rows[0][countIndex]
                            };

                            historySerializer.persist(jobId, collection);
                        }
                    },
                    onFinallyCallback: function onFinallyCallback() {
                        Spinners.hideLoadingOverlay(singleOutliersPanel.viz.$el);
                    }
                });
            })();

            (function setupOutliersVizSearch() {
                var sharedSearchArray = ['| table $outlierVariableSubjectToken|s$, num_data_samples, $outlierVariableToken|s$,  avg, lowerBound, upperBound, isOutlier'];

                var vizQuerySearch = null;
                var vizQueryArray = [];

                var outliersVizAlertModal = null;

                var vizOptions = DrilldownLinker.parseVizOptions({
                    category: 'custom',
                    type: appName + ".OutliersViz"
                });

                function openInSearch() {
                    //window.open(DrilldownLinker.getUrl('search', vizQuerySearch, vizOptions), '_blank');
                    window.open(DrilldownLinker.getUrl('search', vizQuerySearch), '_blank');
                }

                function showSPL(e) {
                    // adjust the modal title depending on whether or not the modal is from the plot or not
                    var modalTitle = outliersVizPanel.showSPLButton.first().is($(e.target)) ? 'Plot the outliers' : 'Calculate the outliers';

                    ModifiedLaunchQuerySPL('outliersVizSearchModal', modalTitle, vizQueryArray, getFullSearchQueryComments(), baseTimerange, vizOptions);
                    //SearchStringDisplay.showSearchStringModal('outliersVizSearchModal', modalTitle, vizQueryArray, getFullSearchQueryComments(), baseTimerange, vizOptions);
                }
                setTimeout(function() {
                    $("#showSPLMenu").append($("<button>Show SPL (Splunk Search Language)</button>").click(function() { ModifiedLaunchQuerySPL('SearchModal', 'Show Search Query', vizQueryArray, getFullSearchQueryComments(), baseTimerange, vizOptions); }))
                }, 1500)


                function scheduleAlert() {

                    require([
                        "jquery", "components/data/sendTelemetry"
                    ], function($, Telemetry) {
                        Telemetry.SendTelemetryToSplunk("PageStatus", { "status": "scheduleAlertStarted", "searchName": currentSampleSearch.label })
                    })
                    if (outliersVizAlertModal == null) {
                        (function() {
                            outliersVizAlertModal = new Modal('outliersVizAlertModal', {
                                title: 'Schedule an alert',
                                destroyOnHide: false,
                                type: 'wide'
                            });

                            var outlierSearchTypeControl = new DropdownView({
                                id: 'outliersVizAlertModalTypeControl',
                                el: $('<span>'),
                                labelField: 'label',
                                valueField: 'value',
                                showClearButton: false,
                                choices: [{ value: 'both', label: 'outside both thresholds' }, { value: 'above', label: 'above the upper threshold' }, { value: 'below', label: 'below the lower threshold' }]
                            }).render();

                            var outliersVizAlertModalValueControl = new TextInputView({
                                id: 'outliersVizAlertModalValueControl',
                                el: $('<span>')
                            }).render();

                            outliersVizAlertModal.body.addClass('mlts-modal-form-inline').append($('<p>').text('Alert me when the number of outliers '), outlierSearchTypeControl.$el, $('<p>').text('is greater than '), outliersVizAlertModalValueControl.$el);

                            outliersVizAlertModal.footer.append($('<button>').addClass('mlts-modal-cancel').attr({
                                type: 'button',
                                'data-dismiss': 'modal'
                            }).addClass('btn btn-default mlts-modal-cancel').text('Cancel'), $('<button>').attr({
                                type: 'button'
                            }).on('click', function() {
                                outliersVizAlertModal.removeAlert();

                                var minOutliersCount = outliersVizAlertModalValueControl.val();

                                var isValid = NumberValidator.validate(minOutliersCount, { min: 0 });

                                Messages.setFormInputStatus(outliersVizAlertModalValueControl, isValid);

                                if (isValid) {
                                    var searchString = Forms.parseTemplate(getFullSearchQueryArray(outlierSearchTypeControl.val()).join('') + " | search isOutlier=1");

                                    outliersVizAlertModal.hide();

                                    var alertModal = new AlertModal({
                                        searchString: searchString
                                    });

                                    window.saveSearchComplete_Deferral = $.Deferred()
                                    

                                    // console.log("About to set Params", window.actions)
                                    if (typeof window.actions.UBASeverity != "undefined" && window.actions.UBASeverity > 0 ) {
                                        // console.log("ParamBeingSet", window.actions.UBASeverity);
                                        alertModal.model.alert.entry.content.set('action.send2uba', "1");
                                        alertModal.model.alert.entry.content.set('action.send2uba.param.severity', window.actions.UBASeverity);
                                    }
                                    if (typeof window.actions.createNotable != "undefined" && window.actions.createNotable == 1) {
                                        var shouldContinue = false;

                                        $.ajax({
                                            type: "GET",
                                            url: "/en-US/splunkd/__raw/servicesNS/-/-/apps/local?count=0&output_mode=json",
                                            async: false,
                                            success: function(data, textStatus, xhr) {
                                                for(var i = 0; i < data.entry.length; i++){
                                                    if(data.entry[i].name == "SplunkEnterpriseSecuritySuite"){
                                                        shouldContinue = true;
                                                    }
                                                }
                                            }
                                        });
                                        // console.log("ParamGettingSet", shouldContinue)
                                        if(shouldContinue){
                                            // console.log("ParamBeingSet for createNotable", window.actions.createNotable);
                                            
                                            $.when(window.saveSearchComplete_Deferral).done(function(){

                                                setTimeout(function(){

                                                    // console.log("Firing on", $(".modal-body:contains(You can view your alert, or continue editing it.)") )
                                                    $(".modal-body:contains(You can view your alert, or continue editing it.)").css("min-height", "450px")
                                                    $(".modal-body:contains(You can view your alert, or continue editing it.)").html( '<p>You can view your alert, or continue editing it.</p><br /><h4>Enabling ES Correlation Search</h4><div id="ESCorrelationProcessing"></div>')
                                                    require(["/static/app/Splunk_Security_Essentials/vendor/spin/spin.min.js"], function(Spinner) {
                                                        new Spinner({ scale: 0.5, lines: 8, top: "10px", position: "relative" }).spin(document.getElementById('ESCorrelationProcessing'));
                                                    })

                                                }, 500)
                                                
                                                var searchName = dvtestalertmodal.model.alert.entry.content.attributes.name;
                                                setTimeout(function(){
                                                    // Instaniate the service object
    
                                                    var splunkWebHttp = new splunkjs.SplunkWebHttp();
                                                    var service = new splunkjs.Service(splunkWebHttp);
    
                                                    // Retrieve the saved search collection
                                                    var mySavedSearches = service.savedSearches({owner: $C['USERNAME'], app: "SplunkEnterpriseSecuritySuite"});
    
                                                        mySavedSearches.fetch(function(err, mySavedSearches) {
                                                        var mySavedSearch = mySavedSearches.item(searchName)
                                                        // console.log("Do I have a Web Upload?", searchName, mySavedSearch)
                                                        
                                                        // Modify the description and schedule the saved search
                                                        mySavedSearch.update({
                                                            "action.correlationsearch": 0,
                                                            "action.correlationsearch.enabled": 1,
                                                            'action.correlationsearch.label': currentSampleSearchLabel.replace(" - Demo", "").replace(" - Live", "").replace(" - Accelerated", ""),
                                                            'action.notable.param.security_domain': window.summary.domain.toLowerCase(),
                                                            'action.notable.param.rule_title': window.summary.name.toLowerCase(),
                                                            'action.correlationsearch.related_searches': '["Threat - ' + alertModal.model.alert.entry.content.get("name") + ' - Rule"]'
                                                       /*   DONE action.correlationsearch              = 0
                                                            DONE action.correlationsearch.enabled      = 1
                                                            DONE action.correlationsearch.label        = Threat Activity Detected
                                                            DONE action.email.sendresults              = 0
                                                            DONE action.notable                        = 1
                                                            DONE action.notable.param.security_domain  = threat
                                                            action.notable.param.severity         = low
                                                            action.notable.param.rule_title       = Threat Activity Detected ($threat_match_value$)
                                                            action.notable.param.rule_description = Threat activity ($threat_match_value$) was discovered in the "$threat_match_field$" field based on threat intelligence available in the $threat_collection$ collection
                                                            action.notable.param.nes_fields       = threat_match_field,threat_match_value
                                                            action.notable.param.drilldown_name   = View all threat activity involving $threat_match_field$="$threat_match_value$"
                                                            action.notable.param.drilldown_search = | from datamodel:"Threat_Intelligence"."Threat_Activity" | search threat_match_field="$threat_match_field$" threat_match_value="$threat_match_value$"
                                                            action.notable.param.default_status   =
                                                            action.notable.param.default_owner    =*/



                                                        }, function(empty,obj) {
                                                            setTimeout(function(){
                                                                // console.log("\n...properties were modified...",obj)
        
                                                                var url = "/en-US/splunkd/__raw" + obj.qualifiedPath + "/acl"
                                                                var data = 'perms.read=*&perms.write=admin&owner=' + $C['USERNAME'] + '&sharing=app'
                                                                // console.log("Working on a URL", url)
                                                                $.ajax({
                                                                    url: url,
                                                                    type: 'POST',
                                                                    async: false,
                                                                    data: data,
                                                                    success: function(){
                                                                        $("#ESCorrelationProcessing").html('ES Correlation Search Enabled! We recommend <a href="/app/SplunkEnterpriseSecuritySuite/correlation_search_edit?search=' + searchName + '">you click here</a> to continue editing the Notable Event to customize the display fields.')
                                                                    },
                                                                    error: function(){
                                                                        $("#ESCorrelationProcessing").html('Setting ES Correlation Search permissions failed! Look for your search in the ES App Saved Searches (not ES Content Management). Once you change the app permissions to share with App or All Apps, it will be viewable (and configurable) in ES Content Management.')
                                                                    }
                                                                })
                                                            }, 4000)
                                                        });
    
                                                    })
                                                    
                                                    // $(".modal:visible").find(".modal-body")
                                                            // Large_Web_Upload_try2
                                                        
    
                                                },5000)
                                                
                                            })
                                            alertModal.model.alert.entry.content.set('action.notable', 1);
                                            alertModal.model.alert.entry.content.set('action.correlationsearch', 0);
                                            alertModal.model.alert.entry.content.set('action.correlationsearch.enable', 1);
                                            alertModal.model.alert.entry.content.set('action.correlationsearch.label', currentSampleSearchLabel.replace(" - Demo", "").replace(" - Live", "").replace(" - Accelerated", ""));
                                            alertModal.model.alert.entry.content.set('action.notable.param.security_domain', window.summary.domain.toLowerCase());
                                            alertModal.model.alert.entry.content.set('action.notable.param.rule_title', window.summary.name.toLowerCase());
                                            alertModal.model.alert.entry.content.set('action.correlationsearch.related_searches', '["Threat - ' + alertModal.model.alert.entry.content.get("name") + ' - Rule"]');
                                       /*   DONE action.correlationsearch              = 0
                                            DONE action.correlationsearch.enabled      = 1
                                            DONE action.correlationsearch.label        = Threat Activity Detected
                                            DONE action.email.sendresults              = 0
                                            DONE action.notable                        = 1
                                            DONE action.notable.param.security_domain  = threat
                                            action.notable.param.severity         = low
                                            action.notable.param.rule_title       = Threat Activity Detected ($threat_match_value$)
                                            action.notable.param.rule_description = Threat activity ($threat_match_value$) was discovered in the "$threat_match_field$" field based on threat intelligence available in the $threat_collection$ collection
                                            action.notable.param.nes_fields       = threat_match_field,threat_match_value
                                            action.notable.param.drilldown_name   = View all threat activity involving $threat_match_field$="$threat_match_value$"
                                            action.notable.param.drilldown_search = | from datamodel:"Threat_Intelligence"."Threat_Activity" | search threat_match_field="$threat_match_field$" threat_match_value="$threat_match_value$"
                                            action.notable.param.default_status   =
                                            action.notable.param.default_owner    =*/

                                        }

                                    }
                                    if (typeof window.actions.createRisk != "undefined" && window.actions.createRisk == 1) {
                                        // console.log("ParamBeingSet", window.actions.createRisk);
                                        alertModal.model.alert.entry.content.set('action.risk', window.actions.createRisk);

                                        if (typeof window.actions.riskObject != "undefined") {
                                            // console.log("ParamBeingSet", window.actions.riskObject);
                                            alertModal.model.alert.entry.content.set('action.risk.param._risk_object', window.actions.riskObject);
                                        }
                                        if (typeof window.actions.riskObjectType != "undefined") {
                                            // console.log("ParamBeingSet", window.actions.riskObjectType);
                                            alertModal.model.alert.entry.content.set('action.risk.param._risk_object_type', window.actions.riskObjectType);
                                        }
                                        if (typeof window.actions.riskObjectScore != "undefined") {
                                            // console.log("ParamBeingSet", window.actions.riskObjectScore);
                                            alertModal.model.alert.entry.content.set('action.risk.param._risk_score', window.actions.riskObjectScore);
                                        }
                                    }
                                    alertModal.model.alert.on("saveSuccess", function(a, b, c){ window.saveSearchComplete_Deferral.resolve(a, b, c)})
                                    
                                    waitForEl(alertModal.el, function(){
                                        setTimeout(function(){

                                            alertModal.model.alert.cron.set({
                                                "cronType": "custom",
                                                "cron_schedule": "37 1 * * *",
                                                "dayOfWeek": "*",
                                                "dayOfMonth": "*",
                                                "hour": "1",
                                                "minute": "37",
                                                "month": "*"
                                            });

                                            // console.log("WWCD", currentSampleSearch)
                                            
                                            alertModal.model.alert.workingTimeRange.set("earliest", "-30d@d")
                                            alertModal.model.alert.workingTimeRange.set("latest", "@d")
                                            alertModal.model.alert.entry.content.set("name", currentSampleSearchLabel.replace(" - Demo", "").replace(" - Live", "").replace(" - Accelerated", "").replace(/ /g, "_", "g").replace(/#/g, "Num"));
                                            alertModal.model.alert.entry.content.set("description", "Generated by the Splunk Security Essentials app at " + (new Date().toUTCString()));


                                            alertModal.model.alert.entry.content.set('ui.scheduled.resultsinput', minOutliersCount);

                                        }, 100)
                                    })
                                    
                                    

                                    window.dvtestalertmodal = alertModal
                                    alertModal.render().appendTo($('body')).show();
                                    setTimeout(function() {
                                        $(".alert-save-as").find("a:contains(Save)").click(function() {
                                            require([
                                                "jquery", "components/data/sendTelemetry"
                                            ], function($, Telemetry) {
                                                Telemetry.SendTelemetryToSplunk("PageStatus", { "status": "scheduleAlertCompleted", "searchName": currentSampleSearch.label })
                                            })
                                        })
                                    }, 500)
                                } else {
                                    outliersVizAlertModal.setAlert('Alert count must be a positive number.');
                                }
                            }).addClass('btn btn-primary mlts-modal-submit').text('Next'));

                            outliersVizAlertModal.$el.on('show.bs.modal', function() {
                                outliersVizAlertModal.removeAlert();
                                Messages.setFormInputStatus(outliersVizAlertModalValueControl, true);

                                outlierSearchTypeControl.val('both');
                                outliersVizAlertModalValueControl.val(0);
                            });
                        })();
                    }

                    outliersVizAlertModal.show();
                }


                function scheduleHighCardinalityAlert() {

                    require([
                        "jquery", "components/data/sendTelemetry"
                    ], function($, Telemetry) {
                        Telemetry.SendTelemetryToSplunk("PageStatus", { "status": "scheduleAlertStarted", "type": "highCardinality", "searchName": currentSampleSearch.label })
                    })
                    if (outliersVizAlertModal == null) {
                        (function() {



                            confirmVizAlertModal = new Modal('outliersVizAlertModal', {
                                title: 'Schedule an alert',
                                destroyOnHide: false,
                                type: 'wide'
                            });


                            confirmVizAlertModal.body.addClass('mlts-modal-form-inline')
                                .append($('<p>You have selected to schedule a search that supports high cardinality datasets. Usually, this isn\'t required -- only for scenarios where you need to improve performance significantly, or where a simpler search would have millions of rows of cardinality.<br /><br />You should only move forward if you understand at least that summary indexing will result in extra data being stored (though it will not impact your license) and also that you will be scheduling two searches -- the first to generate the nightly summary data, the second to actually run the analysis.<br /><br /><input type="checkbox" id="iagree" onclick="$(\'.mlts-modal-submit\').first()[0].disabled=false;" /><span onclick=\"document.getElementById(\'iagree\').click(); \"> I understand</span></p>'));

                            confirmVizAlertModal.footer.append($('<button>').addClass('mlts-modal-cancel').attr({
                                type: 'button',
                                'data-dismiss': 'modal'
                            }).addClass('btn btn-default mlts-modal-cancel').text('Cancel'), $('<button>').attr({
                                type: 'button'
                            }).on('click', function() {


                                confirmVizAlertModal.hide();


                                // Parameter Collection MODAL



                                outliersVizAlertModal = new Modal('outliersVizAlertModal', {
                                    title: 'Schedule an alert',
                                    destroyOnHide: false,
                                    type: 'wide'
                                });

                                var outlierSearchTypeControl = new DropdownView({
                                    id: 'outliersVizAlertModalTypeControl',
                                    el: $('<span>'),
                                    labelField: 'label',
                                    valueField: 'value',
                                    showClearButton: false,
                                    choices: [{ value: 'both', label: 'outside both thresholds' }, { value: 'above', label: 'above the upper threshold' }, { value: 'below', label: 'below the lower threshold' }]
                                }).render();

                                var outliersVizAlertModalValueControl = new TextInputView({
                                    id: 'outliersVizAlertModalValueControl',
                                    el: $('<span>')
                                }).render();



                                var indexesSearch = new SearchManager({
                                    "id": "indexesSearch",
                                    "cancelOnUnload": true,
                                    "latest_time": "0",
                                    "sample_ratio": null,
                                    "status_buckets": 0,
                                    "earliest_time": "now",
                                    "search": "| rest /services/data/indexes | search disabled=0 title!=_* | table title | sort title | streamstats count | eval count=if(title=\"summary\",0,count) | sort count | fields - count",
                                    "app": utils.getCurrentApp(),
                                    "auto_cancel": 90,
                                    "preview": true,
                                    "runWhenTimeIsUndefined": false
                                }, { tokens: true });

                                var DropdownInput = require("splunkjs/mvc/simpleform/input/dropdown");
                                var indexesSearchTypeControl = new DropdownInput({
                                    "id": "indexesSearchTypeControl",
                                    "choices": [],
                                    "labelField": "title",
                                    "selectFirstChoice": true,
                                    "valueField": "title",
                                    "showClearButton": true,
                                    "searchWhenChanged": true,
                                    "managerid": "indexesSearch",
                                    "el": $('<span>')
                                }, { tokens: true }).render();

                                var TextInput = require("splunkjs/mvc/simpleform/input/text");
                                var SummaryUniqueName = new TextInput({
                                    "id": "SummaryUniqueName",
                                    "default": "",
                                    "el": $('<span>')
                                }, { tokens: true }).render();
                                SummaryUniqueName.on("load", function() {
                                    $(".mlts-modal-submit").last()[0].disabled = true
                                });
                                SummaryUniqueName.on("change", function(properties) {

                                    if (document.getElementById("SummaryUniqueName_Validation") == null) {
                                        $("#SummaryUniqueName").after("<div id=\"SummaryUniqueName_Validation\">Invalid</div>")
                                    }
                                    var Errors = new Array()
                                    if (properties.length < 8) {
                                        Errors.push("Name not long enough (" + properties.length + " characters). Performance will be better with at least 8 characters");
                                    }
                                    if (properties.search(/[^a-zA-Z0-9]/) > 0) {
                                        Errors.push("Invalid character detected. Only alphanumeric characters permitted (a-z, A-Z, 0-9).");
                                    }
                                    if (Errors.length > 0) {
                                        $(".mlts-modal-submit").last()[0].disabled = true
                                        document.getElementById("SummaryUniqueName_Validation").innerHTML = "<p>" + Errors.join("</p><p>") + "</p>"
                                    } else {
                                        $(".mlts-modal-submit").last()[0].disabled = false
                                        document.getElementById("SummaryUniqueName_Validation").innerHTML = "<p>Valid!</p>"
                                    }
                                });
                                SummaryUniqueName.on("keydown", function(properties) {

                                    if (document.getElementById("SummaryUniqueName_Validation") == null) {
                                        $("#SummaryUniqueName").after("<div id=\"SummaryUniqueName_Validation\">Invalid</div>")
                                    }
                                    var Errors = new Array()
                                    if (properties.length < 8) {
                                        Errors.push("Name not long enough (" + properties.length + " characters). Performance will be better with at least 8 characters");
                                    }
                                    if (properties.search(/[^a-zA-Z0-9]/) > 0) {
                                        Errors.push("Invalid character detected. Only alphanumeric characters permitted (a-z, A-Z, 0-9).");
                                    }
                                    if (Errors.length > 0) {
                                        $(".mlts-modal-submit").last()[0].disabled = true
                                        document.getElementById("SummaryUniqueName_Validation").innerHTML = "<p>" + Errors.join("</p><p>") + "</p>"
                                    } else {
                                        $(".mlts-modal-submit").last()[0].disabled = false
                                        document.getElementById("SummaryUniqueName_Validation").innerHTML = "<p>Valid!</p>"
                                    }
                                });


                                outliersVizAlertModal.body.addClass('mlts-modal-form-inline').append($('<p>').text('Alert me when the number of outliers '), outlierSearchTypeControl.$el, $('<p>').text('is greater than '), outliersVizAlertModalValueControl.$el, $('<br>'), $('<br>'), $('<p>').text("Choose the index that our summary indexed results will be stored in:"), indexesSearchTypeControl.$el, $('<br>'), $('<br>'), $('<p>').text("Choose the unique name that will identify these events -- alphanumeric, no spaces, no punctuation, at least 8 characters:"), SummaryUniqueName.$el, $("<button>Validate String</button>"));

                                outliersVizAlertModal.footer.append($('<button>').addClass('mlts-modal-cancel').attr({
                                    type: 'button',
                                    'data-dismiss': 'modal'
                                }).addClass('btn btn-default mlts-modal-cancel').text('Cancel'), $('<button>').attr({
                                    type: 'button'
                                }).on('click', function() {
                                    outliersVizAlertModal.removeAlert();

                                    var minOutliersCount = outliersVizAlertModalValueControl.val();

                                    var isValid = NumberValidator.validate(minOutliersCount, { min: 0 });

                                    Messages.setFormInputStatus(outliersVizAlertModalValueControl, isValid);

                                    if (isValid) {

                                        //// FIRST SEARCH MODAL 
                                        var searchString = baseSearchString + "| collect index=" + indexesSearchTypeControl.val() + " marker=\"UEBASPLMarker=" + SummaryUniqueName.val() + "\"" // Forms.parseTemplate(getFullSearchQueryArray(outlierSearchTypeControl.val()).join('') + " | search isOutlier=1");
                                        var secondSearchString = "index=" + indexesSearchTypeControl.val() + " UEBASPLMarker=" + SummaryUniqueName.val() + " " + Forms.parseTemplate(getFullSearchQueryArray(outlierSearchTypeControl.val()).slice(1).join(''))
                                        // console.log("showcase_standard_deviation.js: First search string for saving summary index approach", searchString)
                                        outliersVizAlertModal.hide();


                                        // console.log("showcase_standard_deviation.js: Second search string for saving summary index approach", secondSearchString);
                                        var alertModal = new AlertModalNonDisruptive({
                                            searchString: searchString
                                        });


                                        alertModal.model.alert.cron.set({
                                            "cronType": "custom",
                                            "cron_schedule": "37 1 * * *",
                                            "dayOfWeek": "*",
                                            "hour": "1",
                                            "minute": "37"
                                        });
                                        alertModal.model.alert.entry.content.set('action.track', "1");
                                        alertModal.model.alert.entry.content.set('continueindialog', "false");
                                        alertModal.model.alert.entry.content.set('alert.track', "1");

                                        alertModal.model.alert.workingTimeRange.set("earliest", "-1d@d")
                                        alertModal.model.alert.workingTimeRange.set("latest", "@d")
                                        alertModal.model.alert.entry.content.set("name", currentSampleSearch.label.replace(" - Demo", "").replace(" - Live", "").replace(" - Accelerated", "").replace(/ /g, "_", "g").replace(/#/g, "Num") + "-SummaryIndex");
                                        alertModal.model.alert.entry.content.set("description", "Generated by the Splunk Security Essentials app at " + (new Date().toUTCString()) + "\n\nThis search is the first half that will build a summary index. The second half will query that summary index to detect anomalous events.");

                                        //alertModal.model.alert.entry.content.set('action.send2uba', 1);

                                        //alertModal.model.alert.entry.content.set('action.send2uba.param.severity', window.setDesiredUBAAlarmSeverity);

                                        alertModal.model.alert.onComplete = function(properties) {


                                            // console.log("showcase_standard_deviation.js: Got the trigger to start my next one...")
                                            var secondAlertModal = new AlertModalNonDisruptive({
                                                searchString: secondSearchString
                                            });

                                            secondAlertModal.model.alert.entry.content.set('ui.scheduled.resultsinput', minOutliersCount);


                                            //secondAlertModal.model.alert.entry.content.set('action.send2uba', 1);
                                            //secondAlertModal.model.alert.entry.content.set('action.send2uba.param.severity', window.setDesiredUBAAlarmSeverity);

                                            // console.log("About to set Params", window.actions)
                                            if (typeof window.actions.createUBA != "undefined") {
                                                // console.log("ParamBeingSet", window.actions.createUBA);
                                                secondAlertModal.model.alert.entry.content.set('action.send2uba', window.actions.createUBA);
                                            }
                                            if (typeof window.actions.UBASeverity != "undefined") {
                                                // console.log("ParamBeingSet", window.actions.UBASeverity);
                                                secondAlertModal.model.alert.entry.content.set('action.send2uba.param.severity', window.actions.UBASeverity);
                                            }
                                            if (typeof window.actions.createNotable != "undefined" && window.actions.createNotable == 1) {
                                                // console.log("ParamBeingSet", window.actions.createNotable);
                                                secondAlertModal.model.alert.entry.content.set('action.notable', window.actions.createNotable);
                                            }
                                            if (typeof window.actions.createRisk != "undefined") {
                                                // console.log("ParamBeingSet", window.actions.createRisk);
                                                secondAlertModal.model.alert.entry.content.set('action.risk', window.actions.createRisk);
                                            }
                                            if (typeof window.actions.riskObject != "undefined") {
                                                // console.log("ParamBeingSet", window.actions.riskObject);
                                                secondAlertModal.model.alert.entry.content.set('action.risk.param._risk_object', window.actions.riskObject);
                                            }
                                            if (typeof window.actions.riskObjectType != "undefined") {
                                                // console.log("ParamBeingSet", window.actions.riskObjectType);
                                                secondAlertModal.model.alert.entry.content.set('action.risk.param._risk_object_type', window.actions.riskObjectType);
                                            }
                                            if (typeof window.actions.riskObjectScore != "undefined") {
                                                // console.log("ParamBeingSet", window.actions.riskObjectScore);
                                                secondAlertModal.model.alert.entry.content.set('action.risk.param._risk_score', window.actions.riskObjectScore);
                                            }
                                            // console.log("Here's my thing...", secondAlertModal, window.actions);
                                            secondAlertModal.model.alert.entry.content.set('continueindialog', "false");
                                            secondAlertModal.model.alert.entry.content.set('alert.track', "1");
                                            secondAlertModal.model.alert.entry.content.set('cronType', "daily");
                                            secondAlertModal.model.alert.entry.content.set('cron_schedule', "37 0 * * *");
                                            secondAlertModal.model.inmem.entry.content.set({
                                                'dispatch.earliest_time': "-1d@d",
                                                'dispatch.latest_time': "@d"
                                            });


                                            secondAlertModal.model.alert.cron.set({
                                                "cronType": "custom",
                                                "cron_schedule": "37 3 * * *",
                                                "dayOfWeek": "*",
                                                "hour": "1",
                                                "minute": "37"
                                            });

                                            secondAlertModal.model.alert.workingTimeRange.set("earliest", "-30d@d")
                                            secondAlertModal.model.alert.workingTimeRange.set("latest", "@d")
                                            secondAlertModal.model.alert.entry.content.set("name", currentSampleSearch.label.replace(" - Demo", "").replace(" - Live", "").replace(" - Accelerated", "").replace(/ /g, "_", "g").replace(/#/g, "Num") + "-AnomalyDetection");
                                            secondAlertModal.model.alert.entry.content.set("description", "Generated by the Splunk Security Essentials app at " + (new Date().toUTCString()) + "\n\nThis search is the second half that will query a summary index to detect anomalies. The first half will actually build out the summary index in the first place.");

                                            secondAlertModal.model.alert.onComplete = function() {

                                                require([
                                                    "jquery", "components/data/sendTelemetry"
                                                ], function($, Telemetry) {
                                                    Telemetry.SendTelemetryToSplunk("PageStatus", { "status": "scheduleAlertCompleted", "type": "highCardinality", "searchName": currentSampleSearch.label })
                                                })

                                                alertConfirmationModal = new Modal('alertConfirmationModal', {
                                                    title: 'Alert Scheduled',
                                                    destroyOnHide: false,
                                                    type: 'wide'
                                                });

                                                alertConfirmationModal.body.addClass('mlts-modal-form-inline').append("<p>Success!</p>\n<p>Both searches have been scheduled. By default, the AnomalyDetection search will wait for several days of baseline for each user before it actually triggers. This means that you shouldn't expect to see any alerts until we have several days of data in our summary index.</p>\n<p>If you would like to accelerate this, period, you can leverage the fill_summary_index.py script, that will backfill a summary index. (<a href=\"http://docs.splunk.com/Documentation/Splunk/latest/Knowledge/Managesummaryindexgapsandoverlaps#fill_summary_index.py_usage_and_commands\">docs</a>, <a href=\"https://gist.github.com/thinkerbot/1348568#file-summary_index-txt\">answers</a>)</p> ");

                                                alertConfirmationModal.footer.append($('<button>').addClass('mlts-modal-cancel').attr({
                                                    type: 'button',
                                                    'data-dismiss': 'modal'
                                                }).addClass('btn btn-default mlts-modal-cancel').text('Cancel'), $('<button>').attr({
                                                    type: 'button'
                                                }).on('click', function() {
                                                    alertConfirmationModal.hide()
                                                }).addClass('btn btn-primary mlts-modal-submit').text('Complete'));
                                                alertConfirmationModal.show() //render().appendTo($('body')).show();
                                            }
                                            secondAlertModal.render().appendTo($('body')).show();

                                        }


                                        alertModal.render().appendTo($('body')).show();







                                    } else {
                                        outliersVizAlertModal.setAlert('Alert count must be a positive number.');
                                    }
                                }).addClass('btn btn-primary mlts-modal-submit').text('Next'));

                                outliersVizAlertModal.$el.on('show.bs.modal', function() {
                                    outliersVizAlertModal.removeAlert();
                                    Messages.setFormInputStatus(outliersVizAlertModalValueControl, true);

                                    outlierSearchTypeControl.val('both');
                                    outliersVizAlertModalValueControl.val(0);
                                });
                                outliersVizAlertModal.show();
                            }).addClass('btn btn-primary mlts-modal-submit').text('Next'));





                        })();
                    }

                    //
                    confirmVizAlertModal.show();
                    if (document.getElementById("iagree").checked != true) {
                        $(".mlts-modal-submit").first()[0].disabled = true
                    }
                }


                window.scheduleHighCardinalityAlert = scheduleHighCardinalityAlert;






                function scheduleHighCardinalityAlertTesting() {
                    if (outliersVizAlertModal == null) {
                        (function() {


                            // console.log("Okay guys, I'm totally testing here...")








                            confirmVizAlertModal = new Modal('outliersVizAlertModal', {
                                title: 'Schedule an alert',
                                destroyOnHide: false,
                                type: 'wide'
                            });


                            confirmVizAlertModal.body.addClass('mlts-modal-form-inline')
                                .append($('<p>You have selected to schedule a search that supports high cardinality datasets. Usually, this isn\'t required -- only for scenarios where you need to improve performance significantly, or where a simpler search would have millions of rows of cardinality.<br /><br />You should only move forward if you understand at least that summary indexing will result in extra data being stored (though it will not impact your license) and also that you will be scheduling two searches -- the first to generate the nightly summary data, the second to actually run the analysis.<br /><br /><input type="checkbox" id="iagree" onclick="$(\'.mlts-modal-submit\').first()[0].disabled=false;" /> <span onclick=\"document.getElementById(\'iagree\').click(); \">I understand</span></p>'));

                            confirmVizAlertModal.footer.append($('<button>').addClass('mlts-modal-cancel').attr({
                                type: 'button',
                                'data-dismiss': 'modal'
                            }).addClass('btn btn-default mlts-modal-cancel').text('Cancel'), $('<button>').attr({
                                type: 'button'
                            }).on('click', function() {


                                confirmVizAlertModal.hide();


                                // Parameter Collection MODAL



                                outliersVizAlertModal = new Modal('outliersVizAlertModal', {
                                    title: 'Schedule an alert',
                                    destroyOnHide: false,
                                    type: 'wide'
                                });

                                var outlierSearchTypeControl = new DropdownView({
                                    id: 'outliersVizAlertModalTypeControl',
                                    el: $('<span>'),
                                    labelField: 'label',
                                    valueField: 'value',
                                    showClearButton: false,
                                    choices: [{ value: 'both', label: 'outside both thresholds' }, { value: 'above', label: 'above the upper threshold' }, { value: 'below', label: 'below the lower threshold' }]
                                }).render();

                                var outliersVizAlertModalValueControl = new TextInputView({
                                    id: 'outliersVizAlertModalValueControl',
                                    el: $('<span>')
                                }).render();



                                var indexesSearch = new SearchManager({
                                    "id": "indexesSearch",
                                    "cancelOnUnload": true,
                                    "latest_time": "0",
                                    "sample_ratio": null,
                                    "status_buckets": 0,
                                    "earliest_time": "now",
                                    "search": "| rest /services/data/indexes | search disabled=0 title!=_* | table title | sort title | streamstats count | eval count=if(title=\"summary\",0,count) | sort count | fields - count",
                                    "app": utils.getCurrentApp(),
                                    "auto_cancel": 90,
                                    "preview": true,
                                    "runWhenTimeIsUndefined": false
                                }, { tokens: true });

                                var DropdownInput = require("splunkjs/mvc/simpleform/input/dropdown");
                                var indexesSearchTypeControl = new DropdownInput({
                                    "id": "indexesSearchTypeControl",
                                    "choices": [],
                                    "labelField": "title",
                                    "selectFirstChoice": true,
                                    "valueField": "title",
                                    "showClearButton": true,
                                    "searchWhenChanged": true,
                                    "managerid": "indexesSearch",
                                    "el": $('<span>')
                                }, { tokens: true }).render();

                                var TextInput = require("splunkjs/mvc/simpleform/input/text");
                                var SummaryUniqueName = new TextInput({
                                    "id": "SummaryUniqueName",
                                    "default": "",
                                    "el": $('<span>')
                                }, { tokens: true }).render();
                                SummaryUniqueName.on("load", function() {
                                    $(".mlts-modal-submit").last()[0].disabled = true
                                });
                                SummaryUniqueName.on("change", function(properties) {

                                    if (document.getElementById("SummaryUniqueName_Validation") == null) {
                                        $("#SummaryUniqueName").after("<div id=\"SummaryUniqueName_Validation\">Invalid</div>")
                                    }
                                    var Errors = new Array()
                                    if (properties.length < 8) {
                                        Errors.push("Name not long enough (" + properties.length + " characters). Performance will be better with at least 8 characters");
                                    }
                                    if (properties.search(/[^a-zA-Z0-9]/) > 0) {
                                        Errors.push("Invalid character detected. Only alphanumeric characters permitted (a-z, A-Z, 0-9).");
                                    }
                                    if (Errors.length > 0) {
                                        $(".mlts-modal-submit").last()[0].disabled = true
                                        document.getElementById("SummaryUniqueName_Validation").innerHTML = "<p>" + Errors.join("</p><p>") + "</p>"
                                    } else {
                                        $(".mlts-modal-submit").last()[0].disabled = false
                                        document.getElementById("SummaryUniqueName_Validation").innerHTML = "<p>Valid!</p>"
                                    }
                                });
                                SummaryUniqueName.on("keydown", function(properties) {

                                    if (document.getElementById("SummaryUniqueName_Validation") == null) {
                                        $("#SummaryUniqueName").after("<div id=\"SummaryUniqueName_Validation\">Invalid</div>")
                                    }
                                    var Errors = new Array()
                                    if (properties.length < 8) {
                                        Errors.push("Name not long enough (" + properties.length + " characters). Performance will be better with at least 8 characters");
                                    }
                                    if (properties.search(/[^a-zA-Z0-9]/) > 0) {
                                        Errors.push("Invalid character detected. Only alphanumeric characters permitted (a-z, A-Z, 0-9).");
                                    }
                                    if (Errors.length > 0) {
                                        $(".mlts-modal-submit").last()[0].disabled = true
                                        document.getElementById("SummaryUniqueName_Validation").innerHTML = "<p>" + Errors.join("</p><p>") + "</p>"
                                    } else {
                                        $(".mlts-modal-submit").last()[0].disabled = false
                                        document.getElementById("SummaryUniqueName_Validation").innerHTML = "<p>Valid!</p>"
                                    }
                                });


                                outliersVizAlertModal.body.addClass('mlts-modal-form-inline').append($('<p>').text('Alert me when the number of outliers '), outlierSearchTypeControl.$el, $('<p>').text('is greater than '), outliersVizAlertModalValueControl.$el, $('<br>'), $('<br>'), $('<p>').text("Choose the index that our summary indexed results will be stored in:"), indexesSearchTypeControl.$el, $('<br>'), $('<br>'), $('<p>').text("Choose the unique name that will identify these events -- alphanumeric, no spaces, no punctuation, at least 8 characters:"), SummaryUniqueName.$el, $("<button>Validate String</button>"));

                                outliersVizAlertModal.footer.append($('<button>').addClass('mlts-modal-cancel').attr({
                                    type: 'button',
                                    'data-dismiss': 'modal'
                                }).addClass('btn btn-default mlts-modal-cancel').text('Cancel'), $('<button>').attr({
                                    type: 'button'
                                }).on('click', function() {
                                    outliersVizAlertModal.removeAlert();

                                    var minOutliersCount = outliersVizAlertModalValueControl.val();

                                    var isValid = NumberValidator.validate(minOutliersCount, { min: 0 });

                                    Messages.setFormInputStatus(outliersVizAlertModalValueControl, isValid);

                                    if (isValid) {

                                        //// FIRST SEARCH MODAL 
                                        var searchString = baseSearchString + "| collect index=" + indexesSearchTypeControl.val() + " marker=\"UEBASPLMarker=" + SummaryUniqueName.val() + "\"" // Forms.parseTemplate(getFullSearchQueryArray(outlierSearchTypeControl.val()).join('') + " | search isOutlier=1");
                                        var secondSearchString = "index=" + indexesSearchTypeControl.val() + " UEBASPLMarker=" + SummaryUniqueName.val() + " " + Forms.parseTemplate(getFullSearchQueryArray(outlierSearchTypeControl.val()).slice(1).join(''))
                                        // console.log("showcase_standard_deviation.js: First search string for saving summary index approach", searchString)
                                        outliersVizAlertModal.hide();


                                        // console.log("showcase_standard_deviation.js: Second search string for saving summary index approach", secondSearchString);
                                        var alertModal = new AlertModalNonDisruptive({
                                            searchString: searchString
                                        });

                                        alertModal.model.alert.entry.content.set('ui.scheduled.resultsinput', minOutliersCount);
                                        alertModal.model.alert.entry.content.set('continueindialog', "false");
                                        alertModal.model.alert.entry.content.set('alert.track', "1");
                                        alertModal.model.alert.entry.content.set('cronType', "daily");
                                        alertModal.model.alert.entry.content.set('cron_schedule', "37 0 * * *");
                                        alertModal.model.inmem.entry.content.set({
                                            'dispatch.earliest_time': "-1d@d",
                                            'dispatch.latest_time': "@d"
                                        });
                                        //alertModal.model.alert.entry.content.set('action.send2uba', 1);
                                        alertModal.model.alert.entry.content.set('dispatch.earliest_time', "-1d@d");
                                        alertModal.model.alert.entry.content.set('dispatch.latest_time', "@d");
                                        //alertModal.model.alert.entry.content.set('action.send2uba.param.severity', window.setDesiredUBAAlarmSeverity);

                                        alertModal.model.alert.onComplete = function() {
                                            // console.log("showcase_standard_deviation.js: Got the trigger to start my next one...")
                                            var secondAlertModal = new AlertModalNonDisruptive({
                                                searchString: secondSearchString
                                            });

                                            secondAlertModal.model.alert.entry.content.set('ui.scheduled.resultsinput', minOutliersCount);


                                            secondAlertModal.model.alert.entry.content.set('action.send2uba', 1);
                                            secondAlertModal.model.alert.entry.content.set('action.send2uba.param.severity', window.setDesiredUBAAlarmSeverity);
                                            secondAlertModal.model.alert.entry.content.set('dispatch.earliest_time', "-30d@d");
                                            secondAlertModal.model.alert.entry.content.set('dispatch.latest_time', "@d");
                                            secondAlertModal.render().appendTo($('body')).show();

                                        }


                                        alertModal.render().appendTo($('body')).show();







                                    } else {
                                        outliersVizAlertModal.setAlert('Alert count must be a positive number.');
                                    }
                                }).addClass('btn btn-primary mlts-modal-submit').text('Next'));

                                outliersVizAlertModal.$el.on('show.bs.modal', function() {
                                    outliersVizAlertModal.removeAlert();
                                    Messages.setFormInputStatus(outliersVizAlertModalValueControl, true);

                                    outlierSearchTypeControl.val('both');
                                    outliersVizAlertModalValueControl.val(0);
                                });
                                outliersVizAlertModal.show();
                            }).addClass('btn btn-primary mlts-modal-submit').text('Next'));





                        })();
                    }

                    //
                    confirmVizAlertModal.show();
                    if (document.getElementById("iagree").checked != true) {
                        $(".mlts-modal-submit").first()[0].disabled = true
                    }
                }











                assistantControlsFooter.controls.openInSearchButton.on('click', openInSearch);
                assistantControlsFooter.controls.showSPLButton.on('click', showSPL);
                //assistantControlsFooter.scheduleHighCardinalityAlertButton.on('click', scheduleHighCardinalityAlert);

                outliersVizPanel.openInSearchButton.on('click', openInSearch);
                outliersVizPanel.showSPLButton.on('click', showSPL);


                outliersTablePanel.openInSearchButton.on('click', openInSearch);
                outliersTablePanel.showSPLButton.on('click', showSPL);
                //outliersTablePanel.scheduleHighCardinalityAlertButton.on('click', scheduleHighCardinalityAlert);

                outliersVizPanel.scheduleAlertButton.on('click', scheduleAlert);
                //outliersVizPanel.scheduleHighCardinalityAlertButton.on('click', scheduleHighCardinalityAlertTesting);

                singleOutliersPanel.scheduleAlertButton.on('click', scheduleAlert);

                Searches.setSearch('outliersVizSearch', {
                    autostart: false, // this doesn't autostart on purpose, to prevent the chart from flickering when the user changes the "Field to predict" but doesn't actually run the search
                    searchString: ['| loadjob $outlierResultsSearchToken$| search isOutlier=1'].concat(sharedSearchArray),
                    onStartCallback: function onStartCallback() {
                        Spinners.showLoadingOverlay(outliersVizPanel.viz.$el);
                        Messages.removeAlert(outliersVizPanel.message, true);

                    },
                    onDoneCallback: function onDoneCallback() {
                        vizQueryArray = getFullSearchQueryArray().concat(sharedSearchArray);
                        vizQuerySearch = DrilldownLinker.createSearch(vizQueryArray, baseTimerange);

                        DrilldownLinker.setSearchDrilldown(outliersTablePanel.title, vizQuerySearch);
                        DrilldownLinker.setSearchDrilldown(outliersVizPanel.title, vizQuerySearch, vizOptions);
                    },
                    onDataCallback: function onDataCallback(data) {
                        if (data != null && data.fields != null && data.rows != null && data.rows.length > 0) {
                            (function() {
                                var tableFields = data.fields;
                                var timeIndex = tableFields.indexOf('_time');

                                var outlierVariableToken = Forms.getToken('outlierVariableToken');
                                var outlierVariableIndex = tableFields.indexOf(outlierVariableToken);

                                var nonNumeric = data.rows.every(function(row) {
                                    return isNaN(parseFloat(row[outlierVariableIndex]));
                                });

                                if (nonNumeric) {
                                    Messages.setAlert(outliersVizPanel.message, "All values in \"" + outlierVariableToken + "\" are non-numeric. You may be able to analyze this data in the \"Detect Categorical Outliers\" assistant.", 'error', 'alert-inline', true);
                                }

                                // if the data isn't time-series, remove the _time column from the table
                                if (timeIndex === -1 || data.rows[0][timeIndex] == null) tableFields.splice(timeIndex, 1);

                                outliersTablePanel.viz.settings.set('fields', tableFields);
                            })();
                        }
                    },
                    onErrorCallback: function onErrorCallback() {
                        Messages.removeAlert(outliersVizPanel.message, true);
                    },
                    onFinallyCallback: function onFinallyCallback() {
                        Spinners.hideLoadingOverlay(outliersVizPanel.viz.$el);

                        vizQueryArray = getFullSearchQueryArray().concat(sharedSearchArray);

                    }
                });



                Searches.setSearch('outliersVizSearchOutliersOnly', {
                    autostart: false, // this doesn't autostart on purpose, to prevent the chart from flickering when the user changes the "Field to predict" but doesn't actually run the search
                    searchString: ['| loadjob $outlierResultsSearchToken$ '].concat(sharedSearchArray),
                    onStartCallback: function onStartCallback() {
                        Spinners.showLoadingOverlay(outliersVizPanel.viz.$el);
                        Messages.removeAlert(outliersVizPanel.message, true);
                    },
                    onDoneCallback: function onDoneCallback() {
                        vizQueryArray = getFullSearchQueryArray().concat(sharedSearchArray);
                        vizQuerySearch = DrilldownLinker.createSearch(vizQueryArray, baseTimerange);

                        DrilldownLinker.setSearchDrilldown(outliersTablePanel.title, vizQuerySearch);
                        DrilldownLinker.setSearchDrilldown(outliersVizPanel.title, vizQuerySearch, vizOptions);
                    },
                    onDataCallback: function onDataCallback(data) {
                        if (data != null && data.fields != null && data.rows != null && data.rows.length > 0) {
                            (function() {
                                var tableFields = data.fields;
                                var timeIndex = tableFields.indexOf('_time');

                                var outlierVariableToken = Forms.getToken('outlierVariableToken');
                                var outlierVariableIndex = tableFields.indexOf(outlierVariableToken);

                                var nonNumeric = data.rows.every(function(row) {
                                    return isNaN(parseFloat(row[outlierVariableIndex]));
                                });

                                if (nonNumeric) {
                                    Messages.setAlert(outliersVizPanel.message, "All values in \"" + outlierVariableToken + "\" are non-numeric. You may be able to analyze this data in the \"Detect Categorical Outliers\" assistant.", 'error', 'alert-inline', true);
                                }

                                // if the data isn't time-series, remove the _time column from the table
                                if (timeIndex === -1 || data.rows[0][timeIndex] == null) tableFields.splice(timeIndex, 1);

                                outliersTablePanel.viz.settings.set('fields', tableFields);
                            })();
                        }
                    },
                    onErrorCallback: function onErrorCallback() {
                        Messages.removeAlert(outliersVizPanel.message, true);
                    },
                    onFinallyCallback: function onFinallyCallback() {
                        Spinners.hideLoadingOverlay(outliersVizPanel.viz.$el);
                    }
                });
            })();

            (function setupOutliersOverTimeVizSearch() {
                var sharedSearchArray = ['| timechart sum(isOutlierUpper), sum(isOutlierLower)'];

                var vizQueryArray = [];
                var vizQuerySearch = null;

                var vizOptions = DrilldownLinker.parseVizOptions({
                    category: 'charting',
                    type: 'column'
                });

                vizOptions['display.visualizations.charting.chart.stackMode'] = 'stacked';

                outliersOverTimeVizPanel.openInSearchButton.on('click', function() {
                    window.open(DrilldownLinker.getUrl('search', vizQueryArray, vizOptions), '_blank');
                });

                outliersOverTimeVizPanel.showSPLButton.on('click', function() {
                    ModifiedLaunchQuerySPLSearchStringDisplay.showSearchStringModal('outliersOverTimeVizSearchModal', 'Plot the outlier count over time', vizQueryArray, getFullSearchQueryComments().concat(['plot the outlier count over time']), baseTimerange, vizOptions);
                    SearchStringDisplay.showSearchStringModal('outliersOverTimeVizSearchModal', 'Plot the outlier count over time', vizQueryArray, getFullSearchQueryComments().concat(['plot the outlier count over time']), baseTimerange, vizOptions);
                });

                Searches.setSearch('outliersOverTimeVizSearch', {
                    autostart: false,
                    searchString: ['| loadjob $outlierResultsSearchToken$'].concat([outlierFieldSearchStrings.split], sharedSearchArray),
                    onStartCallback: function onStartCallback() {
                        Spinners.showLoadingOverlay(outliersOverTimeVizPanel.viz.$el);

                        vizQueryArray = getFullSearchQueryArray('split').concat(sharedSearchArray);
                        vizQuerySearch = DrilldownLinker.createSearch(vizQueryArray, baseTimerange);

                        DrilldownLinker.setSearchDrilldown(outliersOverTimeVizPanel.title, vizQuerySearch, vizOptions);
                    },
                    onFinallyCallback: function onFinallyCallback() {
                        Spinners.hideLoadingOverlay(outliersOverTimeVizPanel.viz.$el);
                    }
                });
            })();
        }

        (function setupQueryHistorySearch() {
            Searches.setSearch('queryHistorySearch', {
                searchString: compact(_templateObject2, showcaseName)
            });
        })();

        function getCurrentSearchName() {
            var string = 'outlierSearchType' + Forms.getToken('outlierSearchTypeToken') + Forms.getToken('windowedAnalysisToken');
            if (Forms.getToken("useCurrentPointToken") == true) {
                string += "Historical";
            } else {
                string += "Realtime";
            }
            return string;
        }

        function submitForm() {
            // the controlValidity.getAll() check is intentionally made here so that the user can try to submit the form even with empty fields
            // the submission will fail and they'll see the appropriate errors
            if (!assistantControlsFooter.getDisabled() && controlValidity.getAll()) {
                //currentSampleSearch = null;

                if (typeof currentSampleSearch != "undefined" && currentSampleSearch != null && currentSampleSearch.outlierVariable == null && currentSampleSearch.outlierVariableSubject == null) currentSampleSearch = null;

                Object.keys(outlierResultsSearchSettings).forEach(function() {
                    return Searches.cancelSearch;
                });

                Searches.startSearch(getCurrentSearchName());
            }
        }

        /**
         * gets the current full search query as an array, where array[0] is the search bar search
         * @param {string} [outliersFilterType='both'] Whether to report points "above", "below", or "both" as outliers
         * @returns {Array}
         */
        function getFullSearchQueryArray() {
            var outliersFilterType = arguments.length <= 0 || arguments[0] === undefined ? 'both' : arguments[0];

            var fullSearchQueryArray = [];
            var outlierResultsSearchQuery = outlierResultsSearchSettings[getCurrentSearchName()];

            if (baseSearchString != null && outlierResultsSearchQuery != null) {
                fullSearchQueryArray[0] = baseSearchString;

                for (var i = 0; i < outlierResultsSearchQuery.search.length; i++) {
                    fullSearchQueryArray[i + 1] = outlierResultsSearchQuery.search[i];
                }

                fullSearchQueryArray.push(outlierFieldSearchStrings[outliersFilterType]);
            }

            return fullSearchQueryArray;
        }

        function getFullSearchQueryComments() {
            return [null].concat(outlierResultsSearchSettings[getCurrentSearchName()].description, ['values outside the bounds are outliers']);
        }

        var updateForm = function updateForm(newIsRunningValue) {
            // optionally set a new value for isRunning
            if (newIsRunningValue != null) isRunning = newIsRunningValue;

            outlierVariableControl.settings.set('disabled', isRunning);
            outlierVariableSubjectControl.settings.set('disabled', isRunning);
            outlierSearchTypeControl.settings.set('disabled', isRunning);
            scaleFactorControl.settings.set('disabled', isRunning);

            if (isRunning) {
                assistantControlsFooter.setDisabled(true);
                assistantControlsFooter.controls.submitButton.text('Detecting Outliers...');
            } else {
                var outlierVariableToken = Forms.getToken('outlierVariableToken');
                var fieldsValid = outlierVariableToken != null && outlierVariableToken.length > 0;

                assistantControlsFooter.setDisabled(!fieldsValid);

                assistantControlsFooter.controls.submitButton.text(submitButtonText);
                $("button:contains(Show SPL)")[0].disabled = false
                $("button:contains(Show SPL)").first().unbind("click")
                $("button:contains(Show SPL)").first().click(function() { window.dvtestLaunchQuery() });

            }
        };

        function showErrorMessage(errorMessage) {
            var errorDisplay$El = $("#errorDisplay");
            Messages.setAlert(errorDisplay$El, errorMessage, undefined, undefined, true);
        }

        function hideErrorMessage() {
            var errorDisplay$El = $("#errorDisplay");
            Messages.removeAlert(errorDisplay$El, true);
        }

        function showPanels() {
            Forms.setToken('showResultPanelsToken', true);
        }

        function hidePanels() {
            Forms.unsetToken('showResultPanelsToken');
        }





        function runPreReqs(prereqs) {
            if (prereqs.length > 0) {
                window.datacheck = []
                // console.log("Got " + prereqs.length + " prereqs!");
                $("<div id=\"row11\" class=\"dashboard-row dashboard-row1 splunk-view\">        <div id=\"panel11\" class=\"dashboard-cell last-visible splunk-view\" style=\"width: 100%;\">            <div class=\"dashboard-panel clearfix\" style=\"min-height: 0px;\"><h2 class=\"panel-title empty\"></h2><div id=\"view_22841\" class=\"fieldset splunk-view editable hide-label hidden empty\"></div>                                <div class=\"panel-element-row\">                    <div id=\"element11\" class=\"dashboard-element html splunk-view\" style=\"width: 100%;\">                        <div class=\"panel-body html\">                            <table class=\"table table-striped\" id=\"data_check_table\" >                            <tr><td>Data Check</td><td>Status</td><td>Open in Search</td><td>Resolution (if needed)</td></tr>                            </table>                        </div>                    </div>                </div>            </div>        </div>    </div>").insertBefore($(".fieldset").first())
                for (var i = 0; i < prereqs.length; i++) {
                    window.datacheck[i] = new Object
                        // create table entry including unique id for the status
                    $("#data_check_table tr:last").after("<tr><td>" + prereqs[i].name + "</td><td id=\"data_check_test" + i + "\"><img title=\"Checking...\" src=\"/static//app/Splunk_Security_Essentials/images/general_images/loader.gif\"></td><td><a target=\"_blank\" href=\"/app/Splunk_Security_Essentials/search?q=" + encodeURI(prereqs[i].test) + "\">Open in Search</a></td><td>" + prereqs[i].resolution + "</td></tr>")

                    // create search manager

                    window.datacheck[i].mainSearch = new SearchManager({
                        "id": "data_check_search" + i,
                        "cancelOnUnload": true,
                        "latest_time": "",
                        "status_buckets": 0,
                        "earliest_time": "0",
                        "search": prereqs[i].test,
                        "app": appName,
                        "auto_cancel": 90,
                        "preview": true,
                        "runWhenTimeIsUndefined": false
                    }, { tokens: true, tokenNamespace: "submitted" });


                    window.datacheck[i].myResults = window.datacheck[i].mainSearch.data('results', { output_mode: 'json', count: 0 });

                    window.datacheck[i].mainSearch.on('search:error', function(properties) {
                        var searchName = properties.content.request.label
                        var myCheckNum = searchName.substr(17, 20)
                        document.getElementById("data_check_test" + myCheckNum).innerHTML = "<img title=\"Error\" src=\"/static//app/Splunk_Security_Essentials/images/general_images/err_ico.gif\">";
                        $("#row11").css("display", "block")
                        // console.log("Data Check Failure code 3", searchName, myCheckNum, prereqs[myCheckNum])

                    });
                    window.datacheck[i].mainSearch.on('search:fail', function(properties) {

                        var searchName = properties.content.request.label
                        var myCheckNum = searchName.substr(17, 20)
                        document.getElementById("data_check_test" + myCheckNum).innerHTML = "<img title=\"Error\" src=\"/static//app/Splunk_Security_Essentials/images/general_images/err_ico.gif\">";
                        $("#row11").css("display", "block")
                        // console.log("Data Check Failure code 4", searchName, myCheckNum, prereqs[myCheckNum])

                    });
                    window.datacheck[i].mainSearch.on('search:done', function(properties) {
                        var searchName = properties.content.request.label
                        var myCheckNum = searchName.substr(17, 20)

                        // console.log("Got Results from Data Check Search", searchName, myCheckNum, properties);

                        if (window.datacheck[myCheckNum].mainSearch.attributes.data.resultCount == 0) {
                            document.getElementById("data_check_test" + myCheckNum).innerHTML = "<img title=\"Error\" src=\"/static//app/Splunk_Security_Essentials/images/general_images/err_ico.gif\">";
                            // console.log("Data Check Failure code 1", searchName, myCheckNum)
                            return;
                        }

                        window.datacheck[myCheckNum].myResults.on("data", function(properties) {

                            var searchName = properties.attributes.manager.id
                            var myCheckNum = searchName.substr(17, 20)
                            var data = window.datacheck[myCheckNum].myResults.data().results;

                            status = false;
                            if (typeof data[0][prereqs[myCheckNum].field] !== "undefined") {
                                status = true;
                                if (typeof prereqs[myCheckNum].greaterorequalto !== "undefined") {
                                    if (data[0][prereqs[myCheckNum].field] >= prereqs[myCheckNum].greaterorequalto) {
                                        status = true;
                                    } else {
                                        status = false;
                                    }
                                }
                            }

                            if (status == "true") {
                                document.getElementById("data_check_test" + myCheckNum).innerHTML = "<img title=\"Success\" src=\"/static//app/Splunk_Security_Essentials/images/general_images/ok_ico.gif\">";
                                // console.log("Data Check success", searchName, myCheckNum, prereqs[myCheckNum])
                            } else {
                                document.getElementById("data_check_test" + myCheckNum).innerHTML = "<img title=\"Error\" src=\"/static//app/Splunk_Security_Essentials/images/general_images/err_ico.gif\">";
                                $("#row11").css("display", "block")
                                // console.log("Data Check Failure code 2", searchName, myCheckNum, prereqs[myCheckNum])
                            }

                        });
                    });

                }
            }
        }


        function setCurrentSampleSearch(sampleSearch) {
            var oldDataSetting = false
            if(sampleSearch.label.indexOf(" - Demo")>0){
                oldDataSetting = true
            }
            currentSampleSearch = _.extend({}, {
                outlierSearchType: 'Avg',
                scaleFactor: 2,
                useCurrentPoint: oldDataSetting
            }, sampleSearch);
            // console.log("sampleSearchConfig", currentSampleSearch)
            var isWindowed = 0; //currentSampleSearch.windowSize != null && currentSampleSearch.windowSize > 0;

            outlierSearchTypeControl.val(currentSampleSearch.outlierSearchType);

            scaleFactorControl.val(currentSampleSearch.scaleFactor);

            //windowedAnalysisCheckboxControl.val(isWindowed);

            //windowSizeControl.val(isWindowed ? currentSampleSearch.windowSize : 0);

            currentPointCheckboxControl.val(currentSampleSearch.useCurrentPoint);
            var earliest = currentSampleSearch.earliestTime
            var latest = currentSampleSearch.latestTime
            window.currentSampleSearchLabel = currentSampleSearch.label
            if (currentSampleSearch.value.match(/^\s*\|\s*inputlookup/)) {
                earliest = 0
                latest = "now"
            } else {
                earliest = "-30d@d"
                latest = "@d"
            }
            // console.log("showcase Time Range Settings...", earliest, latest, currentSampleSearch.value, currentSampleSearch.value.match(/^\s*\|\s*inputlookup/))
            searchBarControl.setProperties(currentSampleSearch.value, earliest, latest);
            window.actions = new Object();
            for (var param in currentSampleSearch) {
                if (param.indexOf("actions_") != -1) {
                    newfield = param.substr(8, 100)
                    window.actions[newfield] = currentSampleSearch[param]
                    // console.log("Found an Action config", param, param.indexOf("actions_"), newfield, param.substr(8, 100), window.actions[newfield])
                }
            }
            window.actions.createUBA = window.actions.createUBA || 1
            if (window.actions.createUBA == 1) {
                window.actions.UBASeverity = window.actions.UBASeverity || 5;
            }
            if (window.actions.createRisk == 1) {
                window.actions.riskObjectType = window.actions.riskObjectType || "system";
                window.actions.riskObject = window.actions.riskObject || currentSampleSearch.outlierVariableSubject;
                window.actions.riskObjectScore = window.actions.riskObjectScore || 10;


            }


            // outlierVariable is the only part of the sample search that has to be set asynchronously
            // if it's null, we can remove the sample search now

            if (typeof currentSampleSearch.prereqs !== 'undefined') {
                // console.log("Running my prereqs..", currentSampleSearch.prereqs)
                    /*require(["components/data/parameters/HandlePreRequisites"], function(HandlePreRequisites, currentSampleSearch){
                        HandlePreRequisites.runPreReqs(currentSampleSearch.prereqs)    
                    })*/
                runPreReqs(currentSampleSearch.prereqs)

            }










            var DoCheck = function() {
                // console.log("ShowcaseInfo..: - Checking ShowcaseInfo", ShowcaseInfo, showcaseName)
                if (window.location.href.match(/app\/Splunk_Security_Essentials\/showcase_standard_deviation\/?$/)) {
                    //  process_chosen_summary(ShowcaseInfo.summaries["showcase_standard_deviation_generic"], "generic")
                } else if (window.location.href.match(/app\/Splunk_Security_Essentials\/showcase_first_seen_demo\/?$/)) {
                    //  process_chosen_summary(ShowcaseInfo.summaries["showcase_first_seen_generic"], "generic")
                } else if (window.location.href.match(/app\/Splunk_Security_Essentials\/showcase_simple_search\/?$/)) {
                    //  process_chosen_summary(ShowcaseInfo.summaries["showcase_simple_search"], "generic")
                } else {
                    for (var summary in ShowcaseInfo.summaries) {
                        summary = ShowcaseInfo.summaries[summary]
                        dashboardname = summary.dashboard
                        if (dashboardname.indexOf("?") > 0) {
                            dashboardname = dashboardname.substr(0, dashboardname.indexOf("?"))
                        }
                        if (typeof summary.examples != "undefined" && dashboardname == showcaseName) {
                            for (var example in summary.examples) {
                                if (summary.examples[example].name == sampleSearch.label) {
                                    window.summary = summary
                                    ProcessSummaryUI.process_chosen_summary(summary, sampleSearch, ShowcaseInfo, showcaseName)
                                }

                            }
                        }
                    }
                }
            }


            var Loop = function() {
                if (typeof ShowcaseInfo != "undefined" && typeof ShowcaseInfo.summaries != "undefined") {
                    DoCheck()
                } else {
                    setTimeout(function() { Loop() }, 200)
                }
            }

            Loop()



            if (typeof currentSampleSearch.cardinalityTest !== "undefined") {
                // console.log("We have a cardinalityTest set!", currentSampleSearch.cardinalityTest)
                $("button:contains(Show SPL)").first().after("<button class=\"btn btn-default mlts-show-spl\" id=\"cardinalityCheckerButton\">Check Cardinality</button>" + '<a class="dvPopover" href="#" data-toggle="popover" title="What is Cardinality?" data-trigger="hover" data-content="Cardinality is a measure of how many different values there are for a field. If you\'re tracking employees at your company, we could use the stats command to determine the distinct count (dc) to see that dc(employeeID) might be 100,000, dc(First_Name) might be 10,000, and dc(Age_In_Years) might be 50. If you\'re creating a 100 day baseline per employeeId, that is 10 Million Rows that Splunk needs to handle in memory, but if you\'re creating it per age of the employee, it\'s only 5000. For higher cardinalities, Splunk performance will be better if you create a daily summary index. Check the cardinality of your dataset to find out if you should pursue that, by clicking the Check Cardinality button.">What is Cardinality?</a>')
                $(".dvPopover").popover()
                $("#cardinalityCheckerButton").click(function() {
                    $(".fieldset:contains(Detect Spikes)").first().after("<div id=\"row11\" class=\"dashboard-row dashboard-row15 splunk-view\">        <div id=\"panel15\" class=\"dashboard-cell last-visible splunk-view\" style=\"width: 100%;\">            <div class=\"dashboard-panel clearfix\" style=\"min-height: 0px;\"><h2 class=\"panel-title empty\">Cardinality Check</h2><div id=\"view_cardinality\" class=\"fieldset splunk-view editable hide-label hidden empty\"></div>                     <div class=\"panel-element-row\">                    <div id=\"element15\" class=\"dashboard-element html splunk-view\" style=\"width: 100%;\">                        <div class=\"panel-body html\">                  <a onclick=\"$('#main_cardinality').toggle(); return false;\" href=\"#\">Toggle Cardinality</a><div id=\"main_cardinality\">                   <h3>Cardinality Check</h3>   <div id=\"searchBarCardinalityControl\"></div><div id=\"searchCardinalityControlsControl\"></div> <div style=\"width:48%; float: left;\" id=\"cardinalitydatasample\"></div>  <div style=\"width:48%; float: right;\" id=\"cardinalitysummary\"></div>                                               </div>                    </div>                </div>            </div>      </div>  </div>    </div>")
                    // console.log("Trying some stuff here.. ", currentSampleSearch)
                    document.getElementById("cardinalityCheckerButton").disabled = true





                    var SearchBarCardinalitySearchManager = new SearchManager({
                        "id": "SearchBarCardinalitySearchManager",
                        "cancelOnUnload": true,
                        "latest_time": "now",
                        "status_buckets": 0,
                        "earliest_time": "-30d@d",
                        "search": currentSampleSearch.cardinalityTest,
                        "app": utils.getCurrentApp(),
                        "auto_cancel": 9000,
                        "preview": true,
                        "runWhenTimeIsUndefined": false,
                        "autostart": true
                    }, { tokens: true, tokenNamespace: "submitted" });
                    var SearchbarView = require("splunkjs/mvc/searchbarview");
                    var mysearchbar = new SearchbarView({
                        id: "searchBarCardinalityControl",
                        managerid: "SearchBarCardinalitySearchManager",
                        el: $("#searchBarCardinalityControl")
                    }).render();



                    var SearchBarCardinalityTable = new TableView({
                        "id": "SearchBarCardinalityTable",
                        "dataOverlayMode": "none",
                        "drilldown": "cell",
                        "rowNumbers": "false",
                        "wrap": "true",
                        "rows": 5,
                        "managerid": "SearchBarCardinalitySearchManager",
                        "el": $('#cardinalitydatasample')
                    }, { tokens: true }).render();


                    var mainSearch = splunkjs.mvc.Components.getInstance("SearchBarCardinalitySearchManager");
                    var myResults = mainSearch.data('results', { output_mode: 'json', count: 0 });

                    mainSearch.on('search:done', function(properties) {
                        // clear div elements of previous result
                        document.getElementById('cardinalitysummary').innerHTML = "";
                        // console.log("Got Results from Cardinality Search", myResults);

                        myResults.on("data", function() {
                            var data = myResults.data().results;
                            // console.log("Here are my results: ", data)
                            var totalData = 0;
                            for (var i = 0; i < data.length; i++) {
                                totalData += parseInt(data[i].count);
                            }
                            var cardinalityRisk = "";
                            if (totalData < 2000000) {
                                cardinalityRisk = "<p>For your data, a cardinality of " + totalData + " presents a <b>low risk</b>. Without overanalyzing your search or your environment, the simple approach above can be leveraged. You can always leverage Summary Indexing for greater acceleration.</p>"
                            } else if (totalData < 4000000) {
                                cardinalityRisk = "<p>For your data, a cardinality of " + totalData + " presents a <b>medium performance risk</b>. Without overanalyzing your search or your environment, the simple approach above can be leveraged if you're only going to run this search during off hours, but you may want to avoid it for more frequent runtimes. In those scenarios, you can leverage Summary Indexing for greater acceleration.</p>"
                            } else {
                                cardinalityRisk = "<p>For your data, a cardinality of " + totalData + " presents a <b>high performance risk</b>. Without overanalyzing your search or your environment, the simple approach above can be leveraged if you're only going to run this search weekly during off hours, but you may want to avoid it for more frequent runtimes. In those scenarios, you can leverage Summary Indexing for greater acceleration.</p>"
                            }
                            var myString = "<h4>Search Complete</h4><p>Cardinality for the above search was found to be " + totalData + ". Cardinality refers to how many unique data points there are. Suppose that we are counting some number per user per day for a 300,000 person company. If we have a 3 day baseline, that means we store 900k entries in memory while we are calculating. But 3 days is insufficient for a baseline. With a 30 day baseline, that jumps to 9M entries in memory. For a 100 day baseline, 30M. Splunk his a limit to how much can be stored in memory. In most scenarios, Splunk tends to perform best with 2M to 4M rows in memory (with only a few fields). Searches above this will work, but they'll just be slower. So it's fine if you run it once per day at midnight, but less so if you run it during the day.</p>";
                            var scheduleHighCardinalityAlertString = "" // "<br /><br /><button class=\"btn btn-default\" notonclick=\"scheduleHighCardinalityAlert()\">High Cardinality Alerts Disabled for Splunk 7 (Working on Fix)</button>";
                            document.getElementById('cardinalitysummary').innerHTML = myString + "\n" + cardinalityRisk; //+ scheduleHighCardinalityAlertString;
                            //document.getElementById("ldapqueryexample").innerHTML = data[0].value;  

                        });
                    });


                    mainSearch.on('search:progress', function(properties) {
                        // clear div elements of previous result
                        document.getElementById('cardinalitysummary').innerHTML = "";
                        // console.log("Got Results from Cardinality in progress Search", myResults, properties);
                        //console.log("Tentative Results...", myResults._data.results)
                        var myString = "<h4>Search In Progress</h4>";
                        document.getElementById('cardinalitysummary').innerHTML = myString;

                    });



                })
            }

            if (currentSampleSearch.outlierVariable == null && currentSampleSearch.outlierVariableSubject == null) currentSampleSearch = null;

        }





        // ModifiedLaunchQuerySPL('outliersVizSearchModal', modalTitle, vizQueryArray, getFullSearchQueryComments(), baseTimerange, vizOptions)
        var ModifiedLaunchQuerySPL = function(modalName, modalTitle, vizQueryArray, vizQueryComments, baseTimerange, vizOptions) {
            vizQueryArray = getFullSearchQueryArray();
            vizQueryComments = getFullSearchQueryComments()
            // console.log("Here's the query..", vizQueryArray, vizQueryComments, currentSampleSearch)
                //Time to break apart the base string, but only if we actually have a description.
            if (typeof currentSampleSearch.description != "undefined" && currentSampleSearch.description.length > 0) {
                lineOneComponents = vizQueryArray[0].split("\n")
                vizQueryArray.splice(0, 1)
                vizQueryComments.splice(0, 1)
                for (var i = lineOneComponents.length - 1; i >= 0; i--) {
                    if (currentSampleSearch.description.length > i) {
                        vizQueryArray.unshift(lineOneComponents[i])
                        vizQueryComments.unshift(currentSampleSearch.description[i])
                    } else {
                        vizQueryArray.unshift(lineOneComponents[i])
                        vizQueryComments.unshift("")
                    }
                }
            }
            SearchStringDisplay.showSearchStringModal(modalName, modalTitle, vizQueryArray, vizQueryComments, baseTimerange, vizOptions);

            var tableheight = $("#" + modalName).find("table").height()
            var modalheight = $("#" + modalName).height()
            var windowheight = $(window).height()
            if (tableheight != modalheight) {
                if (tableheight > modalheight && tableheight < windowheight - 100) {
                    $("#" + modalName).height(tableheight + 60)
                } else if (tableheight > modalheight) {
                    $("#" + modalName).height(windowheight - 100)
                    $("#" + modalName).css("overflow", "scroll")
                }

            }
            // console.log("Logic around modal height..", "Tableheight: " + tableheight, "Modalheight: " + modalheight, "Window height: ", windowheight, "finalHeight (similar to modal): " + $("#" + modalName).height())

            require([
                "jquery", "components/data/sendTelemetry"
            ], function($, Telemetry) {
                Telemetry.SendTelemetryToSplunk("PageStatus", { "status": "SPLViewed", "searchName": currentSampleSearch.label })
            })
        }








        var tabsControl = function() {
            return new Tabs($('#dashboard-form-tabs'), $('#dashboard-form-controls'));
        }();

        var searchBarControl = function() {
            return new SearchBarWrapper({
                "id": "searchBarControl",
                "managerid": "searchBarSearch",
                "el": $("#searchBarControl"),
                "autoOpenAssistant": false
            }, {
                "id": "searchControlsControl",
                "managerid": "searchBarSearch",
                "el": $("#searchControlsControl")
            }, function() {
                Forms.clearChoiceView(outlierVariableControl, true);
                Forms.clearChoiceView(outlierVariableSubjectControl, true);
                Forms.unsetToken('outlierVariableToken');

                var searchBarSearch = Searches.getSearchManager("searchBarSearch");

                baseSearchString = this.searchBarView.val();
                baseTimerange = this.searchBarView.timerange.val();

                searchBarSearch.settings.unset("search");
                searchBarSearch.settings.set("search", baseSearchString);
                searchBarSearch.search.set(baseTimerange);


                window.dvtestLaunchQuery = function() {
                    vizQueryArray = getFullSearchQueryArray();
                    ModifiedLaunchQuerySPL('outliersVizSearchModal', "View SPL", vizQueryArray, getFullSearchQueryComments(), baseTimerange, {});
                    //SearchStringDisplay.showSearchStringModal('outliersVizSearchModal', "View SPL" , vizQueryArray, getFullSearchQueryComments(), baseTimerange, {});
                }

                updateForm();
            });
        }();

        // target variable control

        var outlierVariableControl = function() {
            var outlierVariableControl = new DropdownView({
                "id": "outlierVariableControl",
                "managerid": "outlierVariableSearch",
                "el": $("#outlierVariableControl"),
                "labelField": "column",
                "valueField": "column",
                showClearButton: false
            });

            outlierVariableControl.on('datachange', function() {
                if (currentSampleSearch != null) {
                    var choices = Forms.getChoiceViewChoices(outlierVariableControl);
                    // console.log("BTW -- from variablecontrol...", currentSampleSearch)
                    if (choices.indexOf(currentSampleSearch.outlierVariable) >= 0) {
                        outlierVariableControl.val(currentSampleSearch.outlierVariable);
                    } else {
                        // if the outlier variable can't be selected, we can remove the sample search since it's no longer relevant
                        currentSampleSearch.outlierVariable = null;
                    }
                    if (currentSampleSearch.outlierVariable == null && currentSampleSearch.outlierVariableSubject == null) currentSampleSearch = null;
                }
            });

            outlierVariableControl.on('change', function(value) {
                Forms.setToken("outlierVariableToken", value);

                updateForm();

                if (currentSampleSearch.autostart !== false) {
                    assistantControlsFooter.controls.submitButton.trigger('submit');
                } else {
                    // if the sample search isn't auto-running, we want to remove it since it's no longer relevant
                    //currentSampleSearch = null;
                }
            });

            outlierVariableControl.render();

            return outlierVariableControl;
        }();

        var outlierVariableSubjectControl = function() {
            var outlierVariableSubjectControl = new DropdownView({
                "id": "outlierVariableSubjectControl",
                "managerid": "outlierVariableSubjectSearch",
                "el": $("#outlierVariableSubjectControl"),
                "labelField": "column",
                "valueField": "column",
                showClearButton: false
            });

            outlierVariableSubjectControl.on('datachange', function() {

                // console.log("BTW -- from variablesubjectcontrol...", currentSampleSearch)
                if (currentSampleSearch != null) {

                    var choices = Forms.getChoiceViewChoices(outlierVariableSubjectControl);

                    if (choices.indexOf(currentSampleSearch.outlierVariableSubject) >= 0) {
                        outlierVariableSubjectControl.val(currentSampleSearch.outlierVariableSubject);
                    } else {
                        // if the outlier variable can't be selected, we can remove the sample search since it's no longer relevant
                        currentSampleSearch.outlierVariableSubject = null;
                    }
                    if (currentSampleSearch.outlierVariable == null && currentSampleSearch.outlierVariableSubject == null) currentSampleSearch = null;
                }
            });

            outlierVariableSubjectControl.on('change', function(value) {
                Forms.setToken("outlierVariableSubjectToken", value);

                updateForm();
                /*
                            if (currentSampleSearch.autostart !== false) {
                                assistantControlsFooter.controls.submitButton.trigger('submit');
                            } else {
                                // if the sample search isn't auto-running, we want to remove it since it's no longer relevant
                                currentSampleSearch = null;
                            }*/
            });

            outlierVariableSubjectControl.render();

            return outlierVariableSubjectControl;
        }();

        // analysis function control

        var outlierSearchTypeControl = function() {
            var outlierSearchTypeControl = new DropdownView({
                id: 'outlierSearchTypeControl',
                el: $('#outlierSearchTypeControl'),
                labelField: 'label',
                valueField: 'value',
                showClearButton: false,
                choices: [{ value: 'Avg', label: 'Standard Deviation' }] //, { value: 'MAD', label: 'Median Absolute Deviation' }, { value: 'IQR', label: 'Interquartile Range' }]
            });

            outlierSearchTypeControl.on("change", function(value) {
                Forms.setToken("outlierSearchTypeToken", value);
            });

            outlierSearchTypeControl.render();

            return outlierSearchTypeControl;
        }();

        // outlier scale factor control

        var scaleFactorControl = function() {
            var scaleFactorControl = new TextInputView({
                id: 'scaleFactorControl',
                el: $('#scaleFactorControl')
            });

            controlValidity.set(scaleFactorControl.id, false);

            scaleFactorControl.on('change', function(value) {
                var numValue = parseFloat(value);
                if (isNaN(numValue) || numValue < 0) {
                    controlValidity.set(scaleFactorControl.id, false);
                    Messages.setTextInputMessage(this, 'Multiplier must be a number greater than zero.');
                } else {
                    controlValidity.set(scaleFactorControl.id, true);
                    Messages.removeTextInputMessage(this);
                    Forms.setToken('scaleFactorToken', value);
                }

                updateForm();
            });

            scaleFactorControl.render();

            return scaleFactorControl;
        }();

        Forms.setToken('windowedAnalysisToken', 'LatestStats'); //DV
        Forms.setToken('useCurrentPointToken', true);


        var currentPointCheckboxControl = function() {
            var currentPointCheckboxControl = new CheckboxView({
                id: 'currentPointCheckboxControl',
                el: $('#currentPointCheckboxControl'),
                value: true
            });

            currentPointCheckboxControl.on('change', function(useCurrent) {
                //updateWindowSizeControlValidity(); #DV

                Forms.setToken('useCurrentPointToken', useCurrent);
            });

            currentPointCheckboxControl.render();

            return currentPointCheckboxControl;
        }();

        var assistantControlsFooter = function() {
            var assistantControlsFooter = new AssistantControlsFooter($('#assistantControlsFooter'), submitButtonText);

            assistantControlsFooter.controls.submitButton.on('submit', function() {
                submitForm();
            });

            return assistantControlsFooter;
        }();

        var queryHistoryPanel = new QueryHistoryTable($('#queryHistoryPanel'), 'queryHistorySearch', historyCollectionId, ['Actions', '_time', 'Search query', 'Field to analyze', 'Threshold method', 'Threshold multiplier', 'Sliding window', 'Include current point', '# of outliers'], submitButtonText, function(params, autostart) {
            var sampleSearch = {
                value: params.data['row.search_query'],
                earliestTime: params.data['row.earliest_time'],
                latestTime: params.data['row.latest_time'],
                outlierVariable: params.data['row.outlier_variable'],
                outlierSearchType: params.data['row.threshold_method'],
                scaleFactor: params.data['row.threshold_multiplier'],
                windowSize: params.data['row.window_size'],
                // Splunk searches map boolean true to "1" and boolean false to "0"
                // defaulting to true instead of false here because this value didn't exist in early history entries
                useCurrentPoint: params.data['row.use_current_point'] !== "0",
                autostart: autostart
            };

            setCurrentSampleSearch(sampleSearch);
            tabsControl.activate('newOutliers');
        });

        setTimeout(function() {
            //$("button:contains(Show SPL)").first().after("<button class=\"btn btn-default mlts-show-spl\" id=\"highCardinalityExternal\">High Cardinality / High Scale Alert Disabled for Splunk 7 (Working on Fix)</button>");
            //$("#highCardinalityExternal").click(window.scheduleHighCardinalityAlert) DV Splunk 7 Bug
            //console.log("DVTEST3", $("#highCardinalityExternal"), window.scheduleHighCardinalityAlert, $("#highCardinalityExternal").click())
        }, 3000);
        var singleOutliersPanel = function() {
            return new AssistantPanel($('#singleOutliersPanel'), 'Outlier(s)', SingleView, {
                id: 'singleOutliersViz',
                managerid: 'outliersCountSearch',
                underLabel: 'Outlier(s)'
            }, { footerButtons: { scheduleAlertButton: true } });
        }();

        var singleResultsPanel = function() {
            return new AssistantPanel($('#singleResultsPanel'), 'Total Result(s)', SingleView, {
                id: 'singleResultsViz',
                managerid: 'resultsCountSearch',
                underLabel: 'Total Result(s)'
            });
        }();


        var singleEventCountPanel = function() {
            return new AssistantPanel($('#singleEventCountPanel'), 'Raw Event(s)', SingleView, {
                id: 'singleEventCountViz',
                managerid: 'eventCountCountSearch',
                underLabel: 'Raw Event(s)'
            }, { footerButtons: { scheduleAlertButton: false, openInSearchButton: false, showSPLButton: false } });
        }();


        var outliersVizPanel = function() {
            //var vizName = 'OutliersViz';
            //var OutliersViz = VisualizationRegistry.getVisualizer(appName, vizName);

            return new AssistantPanel($('#outliersPanel'), 'Outliers Only', TableView, {
                id: 'outliersViz',
                managerid: 'outliersVizSearch'
            }, { footerButtons: { /*scheduleHighCardinalityAlertButton: true, */ scheduleAlertButton: true } });

        }();

        var outliersOverTimeVizPanel = function() {
            return new AssistantPanel($('#outliersOverTimePanel'), 'Outlier Count Over Time', ChartView, {
                id: 'outliersOverTimeViz',
                managerid: 'outliersOverTimeVizSearch',
                type: 'column',
                'charting.legend.placement': 'bottom',
                'charting.chart.stackMode': 'stacked'
            });
        }();

        var datasetPreviewTable = function() {
            return new TableView({
                id: 'datasetPreviewTable',
                el: $('#datasetPreviewPanel'),
                managerid: 'searchBarSearch'
            });
        }();

        var outliersTablePanel = function() {
            return new AssistantPanel($('#outliersTablePanel'), 'All Data', TableView, {
                id: 'outliersTable',
                managerid: 'outliersVizSearchOutliersOnly',
                sortKey: 'isOutlier',
                sortDirection: 'desc',
                fields: '*'
            });
        }();

        // update validity for the initial state of the window size controls
        //updateWindowSizeControlValidity(); DV

        // set up the searches
        setupSearches();




        // load canned searches from URL bar parameters
        (function setInputs() {
            var searchParams = ParseSearchParameters(showcaseName);

            if (searchParams.mlToolkitDataset != null) {
                SampleSearchLoader.getSampleSearchByLabel(searchParams.mlToolkitDataset).then(setCurrentSampleSearch);
            } else {
                setCurrentSampleSearch(searchParams);
            }
        })();
        if ($(".dvTooltip").length > 0) { $(".dvTooltip").tooltip() }
        if ($(".dvPopover").length > 0) { $(".dvPopover").popover() }


        // disable the form on initial load
        setTimeout(updateForm, 0);

        function startSearchASAP() {
            // console.log("Starting searches..", getCurrentSearchName())
            if (typeof splunkjs.mvc.Components.getInstance(getCurrentSearchName()) == "undefined" || typeof splunkjs.mvc.Components.getInstance(getCurrentSearchName()).attributes.data == "undefined") {
                setTimeout(function() {
                    startSearchASAP()
                }, 500)
            }
            if (typeof splunkjs.mvc.Components.getInstance(getCurrentSearchName()) != "undefined" && typeof splunkjs.mvc.Components.getInstance(getCurrentSearchName()).attributes.data == "undefined")
                mvc.Components.getInstance(getCurrentSearchName()).startSearch()


        }
        startSearchASAP()
    });