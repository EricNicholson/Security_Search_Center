define([
    'jquery',
    'underscore',
    'backbone',
    'splunkjs/mvc',
    'splunkjs/mvc/simplesplunkview',
    'splunkjs/mvc/timerangeview',
    'splunkjs/mvc/searchmanager',
    'splunkjs/mvc/chartview',
    'splunkjs/mvc/tableview',
    'splunkjs/mvc/dropdownview',
    'splunkjs/mvc/resultslinkview',
    'app/views/Component/BuildAnalysisTableRowExpanderView',
    'app/views/Component/JenkinsDonutView',
    'app/util/util',
    'app/config/BuildDetailCfg'
], function (
    $,
    _,
    Backbone,
    mvc,
    SimpleSplunkView,
    TimeRangeView,
    SearchManager,
    ChartView,
    TableView,
    DropdownView,
    ResultsLinkView,
    BuildAnalysisTableRowExpanderView,
    JenkinsDonutView,
    Util,
    BuildDetailCfg
) {
    return SimpleSplunkView.extend({
        className: 'build-history-view',
        output_mode: 'json',


        createView: function() {
            return true;
        },

        formatData: function(data) {
            return data[0];
        },

        updateView: function(viz, data) {
            var tabInfo = this.options.tabInfo;
            var tabId = tabInfo['tabId'];
            var host = tabInfo['host'];
            var job = tabInfo['job'];
            var build = tabInfo['build'];

            $('#' + tabId + '-history-content .build-detail-loading-msg').hide()
            $('#' + tabId + '-history-time-trend .panel-head').text("Build Duration and Queue Time");
            if (!mvc.Components.getInstance(tabId + '-history-builds-time-analysis')) {
                new ChartView({
                    id: tabId + '-history-builds-time-analysis',
                    managerid:  tabId + '-history-builds-time-search',
                    type: 'column',
                    "charting.chart.stackMode": "stacked",
                    'charting.legend.placement': 'top',
                    'charting.axisLabelsY.integerUnits': true,
                    'charting.axisY.includeZero': true,
                    'charting.axisLabelsX.majorLabelStyle.rotation' : '-45',
                    'charting.axisTitleX.text': "Build Number",
                    'charting.axisTitleY.text': "time(seconds)",
                    el: $('#' + tabId + '-history-time-trend .panel-body')
                }).render();

                // Instantiate the results link view
                new ResultsLinkView({
                    managerid: tabId + '-history-builds-time-search'
                }).render().$el.appendTo($('#' + tabId + '-history-time-trend .panel-body'));
            }

            $('#' + tabId + '-history-result-trend .panel-head').text("Build Status History");
            var trendResultManager = mvc.Components.getInstance(tabId + '-history-result-search');
            if (!trendResultManager) {
                    trendResultManager = new SearchManager({
                    id: tabId + '-history-result-search',
                    preview: false,
                    cache: false,
                    latest_time: "now",
                    status_buckets: 300,
                    "charting.axisLabelsY.axisVisibility": 'hide',
                    search: mvc.tokenSafe('index=jenkins_statistics event_tag=job_event host="' + host + '" job_name="' + job + '"' + ' build_number <=' + build + ' type = "completed" |  sort - build_number ' +
                        ' | head ' + '$' + tabId + 'token_trend_job_count$' +
                        ' |eval build_number = "#" + build_number ' +
                         ' |chart count by build_number, job_result')
                });
            }

            if (!mvc.Components.getInstance(tabId + '-history-result-analysis')) {
                new ChartView({
                    id: tabId + '-history-result-analysis',
                    managerid: tabId + '-history-result-search',
                    type: 'column',
                    "charting.fieldColors": "{SUCCESS: 0xa2cc3e," +
                                            "UNSTABLE: 0xd99f0d, " +
                                            "FAILURE: 0xd6563c," +
                                            "INPROGRESS:0xf2b827," +
                                            "NOT_BUILT:0xad6704," +
                                            "ABORTED: 0x1e93c6}",
                    'charting.legend.placement': 'top',
                    "charting.chart.stackMode": "stacked",
                    'charting.axisTitleX.text': "Build Number",
                    'charting.axisLabelsX.majorLabelStyle.rotation' : '-45',
                    'charting.axisTitleY.visibility': 'collapsed',
                    'charting.axisLabelsY.majorLabelVisibility' : 'hide',
                el: $('#' + tabId + '-history-result-trend .panel-body')
                }).render();

                // Instantiate the results link view
                new ResultsLinkView({
                    managerid: tabId + '-history-result-search',
                }).render().$el.appendTo($('#' + tabId + '-history-result-trend .panel-body'));
            }

            var resultOverviewManager = mvc.Components.getInstance(tabId + '-history-result-overview-search');
            if (!resultOverviewManager) {
                resultOverviewManager = new SearchManager({
                    id: tabId + '-history-result-overview-search',
                    preview: false,
                    cache: false,
                    latest_time: "now",
                    status_buckets: 300,
                    latest_time: mvc.tokenSafe("$latest_time$"),
                    earliest_time:mvc.tokenSafe("$earliest_time$"),
                    "charting.axisLabelsY.axisVisibility": 'hide',
                    search: mvc.tokenSafe('index=jenkins_statistics event_tag=job_event host="' + host + '" job_name="'+ job + '"' + ' build_number <= ' + build + ' type = "completed" |  sort - build_number ' +
                            '| head ' + '$' + tabId + 'token_trend_job_count$' +
                            '| stats count by job_result ' +
                            '| sort - count')
                });
            }

            $('#' + tabId + '-history-result-overview .panel-head').text("Build Status Overview");

            if (!mvc.Components.getInstance(tabId + '-history-result-overview-donut')) {

                new JenkinsDonutView({
                    tabId: tabId,
                    id: tabId + '-history-result-overview-donut',
                    managerid: tabId + '-history-result-overview-search',
                    height: 350,
                    el: $('#' + tabId + '-history-result-overview .panel-body')
                }).render();

                // // Instantiate the results link view
                // new ResultsLinkView({
                //     managerid: tabId + '-history-result-overview-search'
                // }).render().$el.appendTo($('#' + tabId + '-history-result-overview .panel-body'));
            }
        },

        displayMessage: function(info) {
            return this;
        }
    });
});
