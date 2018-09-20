/*global define*/
define([
    'jquery',
    'underscore',
    'backbone',
    'contrib/text!app/templates/OverviewTemplate.html',
    'contrib/text!app/templates/UserPanelTemplate.html',
    'splunkjs/mvc',
    'splunkjs/mvc/searchmanager',
    'splunkjs/mvc/timerangeview',
    'splunkjs/mvc/tableview',
    'splunkjs/mvc/chartview',
    'splunkjs/mvc/resultslinkview',
    'app/config/OverviewCfg',
    'app/routers/AppRouter',
    'app/util/app_info',
    'app/util/util',
    'util/router_utils'
], function ($,
    _,
    Backbone,
    OverviewTemplate,
    UserPanelTemplate,
    mvc,
    SearchManager,
    TimeRangeView,
    TableView,
    ChartView,
    ResultsLinkView,
    OverviewCfg,
    AppRouter,
    AppInfo,
    Util,
    Router_utils
) {
    return Backbone.View.extend({
        router: null,

        initialize: function () {
            var that = this;

            this.$el.append(_.template(OverviewTemplate));
            this.page = "overview";

            this.router = new AppRouter({
                changeUrl: function (params) {
                    var elementId = Util.getElementId("Jenkins Master", "overview");

                    if (params.hasOwnProperty(elementId)) {
                        mvc.Components.get(elementId).val(decodeURIComponent(params[elementId]));
                    }
                }
            });

            // Backbone.History.started is a boolean value indicating whether it has already been called.
            // 6.3.9 throws: Uncaught Error: Backbone.history has already been started
			if (!Backbone.History.started) {
				Router_utils.start_backbone_history();
			}

            $(".panel-title").text(OverviewCfg.title);
            $(".panel-description").text(OverviewCfg.description);
            var defaultTokenModel = mvc.Components.getInstance("default", {create: true});
            defaultTokenModel.set({"earliest_time":"@d"})
            var prefix="overview";
            var tokens = Util.addFilter(OverviewCfg.entity, "#overview-panel #filterset", prefix);
            var filterString = tokens[0];
            //use cached value for jenkins master
            Util.useLocalCache(Util.getElementId("Jenkins Master", prefix));

            // Build daily distribution
            $("#overview-builds-title").text("Jenkins Build Status History");

            var buildDistributionManager = new SearchManager({
                id: 'overview-builds-daily-distribution-search',
                search: 'index=jenkins_statistics ' + filterString +
                ' event_tag=job_event' +
                ' (type=started OR type=completed)' +
                ' | dedup host build_url sortby -_time ' +
                ' | eval job_result=if(type="started", "INPROGRESS", job_result)' +
                ' | timechart count by job_result',
                latest_time: "$latest_time$",
                earliest_time: "$earliest_time$",
            }, {tokens: true});

            var buildDistribution = new ChartView({
                id: 'overview-builds-daily-distribution',
                managerid: 'overview-builds-daily-distribution-search',
                type: 'column',
                "charting.fieldColors": "{SUCCESS: 0xa2cc3e," +
                "UNSTABLE: 0xd99f0d, " +
                "FAILURE: 0xd6563c," +
                "INPROGRESS:0xf2b827," +
                "NOT_BUILT:0xad6704," +
                "ABORTED: 0x1e93c6}",
                "charting.chart.stackMode": "stacked",
                "charting.axisTitleX.visibility" : "collapsed",
                el: this.$el.find('.builds-daily-distribution .panel-body')
            }).render();

            // Instantiate the results link view
            new ResultsLinkView({
                managerid: 'overview-builds-daily-distribution-search',
            }).render().$el.appendTo($(".builds-daily-distribution .panel-body"));

            buildDistribution.on("click:legend", function (e) {
                e.preventDefault();

                var url = AppInfo.get_app_url_prefix() + '/build_analysis?type=list';
                window.open(url, '_blank');
            });

            buildDistribution.on("click:chart", function (e) {
                e.preventDefault();
                // var date = new Date(parseInt(e.value * 1000));
                // var earliest_day = date.getFullYear() + "-" + (date.getMonth()+1) + "-" + date.getDate() + " 00:00:00";
                // var earliest_time = Date.parse(new Date(earliest_day)) / 1000;
                // var latest_time = earliest_time + 86400;
                // var job_result = e.name2

                var url = AppInfo.get_app_url_prefix() + '/build_analysis?type=list';
                window.open(url, '_blank');
            });

            // Time range for build daily distribution
            var timerange = new TimeRangeView({
                 id: "overview-timerange",
                 preset: "Today",
                 dialogOptions: {'showPresets': true, 'showPresetsRealTime': false, 'showCustom': true, 'showCustomRealTime': false},
                 el: $("#timerange")
            }).render();

            // Update the search manager when the time range changes
            timerange.on("change", function() {
                defaultTokenModel.set(timerange.val())
            });
            Util.useLocalCache(timerange);
            // Builds table
            var overviewBuildManager = new SearchManager({
                id: "overview-builds-search",
                earliest_time: "$job_result_timerange.earliest_time$",
                latest_time: "$job_result_timerange.latest_time$",
                refresh: 180,
                search: 'index=jenkins_statistics ' + filterString +
                ' event_tag="job_event" ' +
                ' | dedup host build_url sortby -_time' +
                ' | eval job_result=if(type="started", "INPROGRESS", job_result)' +
                ' `utc_to_local_time(job_started_at)`' +
                ' | convert timeformat="%Y-%m-%d %H:%M:%S" mktime(job_started_at) as epocTime ' +
                ' | eval Duration = if(isnull(job_duration), "", tostring(job_duration,"duration"))' +
                ' | table host job_name build_number job_started_at Duration job_result' +
                ' | rename host as "Jenkins Master" job_name as Job build_number as Build job_started_at as StartTime job_result as Status'
            }, {tokens: true});

            var jobResultTable = new TableView({
                id: "overview-builds-table",
                managerid: "overview-builds-search",
                drilldown: "row",
                drilldownRedirect: false,
                el: $(".builds-info .panel-body"),
                pageSize: 10,
                pagerPosition: "bottom"
            });

            Util.addColumnRender(jobResultTable, "Status");
            jobResultTable.render();

            // Instantiate the results link view
            new ResultsLinkView({
                managerid: "overview-builds-search"
            }).render().$el.appendTo($(".builds-info .panel-body"));

            jobResultTable.on("click:row", function (e) {
                var host  = e.data["row.Jenkins Master"];
                var job   = e.data["row.Job"];
                var build = e.data["row.Build"]

                var url = AppInfo.get_app_url_prefix() + '/build_analysis?type=build'
                    + '&host='  + encodeURIComponent(host)
                    + '&job='   + encodeURIComponent(job)
                    + '&build=' + encodeURIComponent(build);
                window.open(url, '_blank');
            });

            var jobResultTimerange = new TimeRangeView({
                preset: "Today",
                value: mvc.tokenSafe("$job_result_timerange$"),
                dialogOptions: {'showPresets': true, 'showCustom': true, 'showCustomRealTime': true, 'showCustomRelative': true, 'showCustomDate': true, 'showCustomDateTime': true},
                el: $("#build-update-timerange")
            }).render();
            Util.useLocalCache(jobResultTimerange);
            // Create a service object using the Splunk SDK for JavaScript to send REST requests
            var service = mvc.createService({ owner: "nobody" });

            // Create user favorite panels
            service.get(
                "storage/collections/data/userpanel",
                null,
                function(err, response) {
                    var buildStatusSearch = [];
                    var buildTrendsSearch = [];
                    var testTrendsSearch = [];
                    var customSearch = [];

                    // If no user panels defined yet
                    if (response['data'].length == 0) {
                        var url = AppInfo.get_app_url_prefix() + '/configuration';
                        $('#userpanels').append("<hr/><div>");
                        _.each(_.range(4), function () {
                            $('#userpanels').append('<div class="add_panels_icon"><div class="cell-icon first-cell-icon">' +
                                '<div class="icon-add"><div class="icon-left">' +
                                '<svg><g>' +
                                '<line x1="0" y1="8" x2="16" y2="8"></line>' +
                                '<line x1="8" y1="16" x2="8" y2="0"></line>' +
                                '</g> </svg> ' +
                                '</div> <div class="icon-right"> <div class="add-custom-panels-link">Add Custom Panels</div> </div> </div></div></div>')
                        })
                        $('#userpanels').append("</div>");
                        $('.add_panels_icon').click(function() {
                            window.open(url, '_blank');
                        });
                    }
                    _.each(response['data'],function(userData,i){
                        var id = userData['_key'];
                        var name = userData['name'];
                        var latest_time =  userData['time_latest'];
                        var earliest_time = userData['time_earliest'];
                        var user_job_filter = userData['job_filter'] || '';
                        var job_filter = user_job_filter;
                        if (job_filter.indexOf("host=") == -1) { //user did not specify which jenkins master, use global host filter
                            job_filter=job_filter+" $token_overview_host$"
                        }
                        var build_status_chart = userData['build_status_chart'];
                        var build_trends_chart = userData['build_trends_chart'];
                        var test_trends_chart = userData['test_trends_chart'];
                        var custom_spl = userData['custom_spl'];
                        var refresh_frequency = parseInt(userData['refresh_frequency']) || 5;
                        if (refresh_frequency < 1) {
                            refresh_frequency = 1;
                        }
                        var refreshSec=refresh_frequency*60;
                        var timeToken="usr_panel_time_"+i;
                        var earliest_time_token="$"+timeToken+".earliest_time$"
                        var latest_time_token="$"+timeToken+".latest_time$"
                        defaultTokenModel.set(timeToken,{"latest_time":latest_time,"earliest_time":earliest_time})
                        var chart_count = build_status_chart + build_trends_chart + test_trends_chart + (custom_spl ? 1 : 0);
                        var chart_width = Math.floor(100 / chart_count) + '%';

                        $('#userpanels').append(_.template(UserPanelTemplate, {
                            'id': id,
                            'name': name
                        }));

                        // Build status
                        if (build_status_chart) {
                            buildStatusSearch.push(new SearchManager({
                                id: 'build-status-search-' + id,
                                latest_time: latest_time_token,
                                earliest_time: earliest_time_token,
                                search: 'index=jenkins_statistics event_tag="job_event" ' + job_filter + ' | dedup host build_url sortby -_time | eval job_result=if(type="started", "INPROGRESS", job_result) | table host job_name build_number job_result | rename host as "Jenkins Master" job_name as Job build_number as Build job_result as Status',
                                autostart: true,
                                refresh:refreshSec
                            },{tokens: true}));

                            var buildStatusTable = new TableView({
                                managerid: 'build-status-search-' + id,
                                drilldown: 'row',
                                drilldownRedirect: false,
                                el: $('#' + id + ' .build-status .panel-body')
                            });
                            Util.addColumnRender(buildStatusTable, "Status");
                            buildStatusTable.render();

                            // Instantiate the results link view
                            new ResultsLinkView({
                                managerid: 'build-status-search-' + id
                            }).render().$el.appendTo($('#' + id + ' .build-status .panel-body'));

                            buildStatusTable.on("click:row", function (e) {
                                var host  = e.data["row.Jenkins Master"];
                                var job   = e.data["row.Job"];
                                var build = e.data["row.Build"]

                                var url = AppInfo.get_app_url_prefix() + '/build_analysis?type=build'
                                    + '&host='  + encodeURIComponent(host)
                                    + '&job='   + encodeURIComponent(job)
                                    + '&build=' + encodeURIComponent(build);
                                window.open(url, '_blank');
                            });

                            $('#' + id + ' .build-status').css('width', chart_width);
                        } else {
                            $('#' + id + ' .build-status').css('display', 'none');
                            buildStatusSearch.push(null);
                        }

                        // Build trends
                        if (build_trends_chart) {
                            buildTrendsSearch.push(new SearchManager({
                                id: 'build-trends-search-' + id,
                                latest_time: latest_time_token,
                                earliest_time: earliest_time_token,
                                search: 'index=jenkins_statistics event_tag=job_event type=completed ' + job_filter + ' | dedup host build_url sortby -_time | timechart count by job_result',
                                autostart: true,
                                refresh:refreshSec
                            },{tokens: true}));

                            var build_trends_chart = new ChartView({
                                managerid: 'build-trends-search-' + id,
                                type: 'column',
                                "charting.legend.placement": "top",
                                "charting.fieldColors": "{SUCCESS: 0xa2cc3e," +
                                                        "UNSTABLE: 0xd99f0d, " +
                                                        "FAILURE: 0xd6563c," +
                                                        "INPROGRESS:0xf2b827," +
                                                        "NOT_BUILT:0xad6704," +
                                                        "ABORTED: 0x1e93c6}",
                                "charting.chart.stackMode": "stacked",
                                "charting.axisTitleX.visibility" : "collapsed",
                                el: $('#' + id + ' .build-trends .panel-body'),
                                height: 321
                            }).render();

                            // Instantiate the results link view
                            new ResultsLinkView({
                                managerid: 'build-trends-search-' + id
                            }).render().$el.appendTo($('#' + id + ' .build-trends .panel-body'));

                            build_trends_chart.on("click:chart", (function (build_parameters, index) {
                                return function (e) {
                                    e.preventDefault();
                                    console.log("Clicked chart: ", e); // Print event info to the console
                                    if(build_parameters.indexOf("host=")==-1){
                                        //append the host filter
                                        build_parameters+=" "+defaultTokenModel.get("token_overview_host");
                                    }
                                    var url = AppInfo.get_app_url_prefix() + '/build_analysis?type=list'
                                        + '&build_parameters=' + encodeURIComponent(build_parameters)
                                        + '&status=' + encodeURIComponent(e.name2)
                                        + '&earliest_time=' + defaultTokenModel.get(timeToken+'.earliest_time')
                                        + '&latest_time=' + defaultTokenModel.get(timeToken+'.latest_time');
                                    window.open(url, '_blank');
                                };

                            }) (user_job_filter, i));

                            $('#' + id + ' .build-trends').css('width', chart_width);
                        } else {
                            $('#' + id + ' .build-trends').css('display', 'none');
                            buildTrendsSearch.push(null);
                        }

                        // Test trends
                        if (test_trends_chart) {
                            testTrendsSearch.push(new SearchManager({
                                id: 'test-trends-search-' + id,
                                latest_time: latest_time_token,
                                earliest_time: earliest_time_token,
                                search: 'index=jenkins_statistics event_tag=job_event type=completed ' + job_filter + ' | timechart sum(test_summary.passes) as "Passed" sum(test_summary.failures) as "Failed" sum(test_summary.skips) as "Skipped"',
                                autostart: true,
                                refresh:refreshSec
                            },{tokens: true}));

                            new ChartView({
                                managerid: 'test-trends-search-' + id,
                                type: 'area',
                                "charting.legend.placement": "top",
                                "charting.chart.stackMode": "stacked",
                                "charting.areaFillOpacity": 1.0,
                                "charting.fieldColors": "{Passed: 0x339933, Skipped: 0xf2b827, Failed: 0xaa0000}",
                                "charting.axisTitleX.visibility" : "collapsed",
                                el: $('#' + id + ' .test-trends .panel-body'),
                                height: 321
                            }).render();

                            // Instantiate the results link view
                            new ResultsLinkView({
                                managerid: 'test-trends-search-' + id
                            }).render().$el.appendTo($('#' + id + ' .test-trends .panel-body'));

                            $('#' + id + ' .test-trends').css('width', chart_width);
                        } else {
                            $('#' + id + ' .test-trends').css('display', 'none');
                            testTrendsSearch.push(null);
                        }

                        // Custom search
                        if (custom_spl) {
                            if(!custom_spl.startsWith("eval") || !custom_spl.startsWith("stats") || !custom_spl.startsWith("where")){
                                //maybe a filter clause
                                custom_spl="search "+custom_spl
                            }
                            customSearch.push(new SearchManager({
                                id: 'custom-search-' + id,
                                latest_time: latest_time_token,
                                earliest_time: earliest_time_token,
                                search: 'index=jenkins_statistics event_tag="job_event" ' + job_filter + ' | dedup host build_url sortby -_time  |' + custom_spl,
                                autostart: true,
                                refresh:refreshSec
                            },{tokens: true}));

                            new ChartView({
                                managerid: 'custom-search-' + id,
                                el: $('#' + id + ' .custom-chart .panel-body'),
                                "charting.legend.placement": "top",
                                height: 321
                            }).render();

                            // Instantiate the results link view
                            new ResultsLinkView({
                                managerid: 'custom-search-' + id
                            }).render().$el.appendTo($('#' + id + ' .custom-chart .panel-body'));

                            $('#' + id + ' .custom-chart').css('width', chart_width);
                        } else {
                            $('#' + id + ' .custom-chart').css('display', 'none');
                            customSearch.push(null);
                        }

                        // Add timerange
                        new TimeRangeView({
                            latest_time: latest_time,
                            earliest_time: earliest_time,
                            value :mvc.tokenSafe("$"+timeToken+"$"),
                            el: $('#' + id + ' .user-panel-timerange')
                        }).render();
                    });

                }
            );


        }
    });
});
