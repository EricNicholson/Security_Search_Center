define([
    'jquery',
    'underscore',
    'backbone',
    'contrib/text!app/templates/BuildTestsTemplate.html',
    'splunkjs/mvc',
    'splunkjs/mvc/simplesplunkview',
    'splunkjs/mvc/searchmanager',
    'splunkjs/mvc/chartview',
    'splunkjs/mvc/tableview',
    'splunkjs/mvc/timerangeview',
    'splunkjs/mvc/dropdownview',
    'splunkjs/mvc/resultslinkview',
    'app/util/app_info',
    'app/util/util'
], function (
    $,
    _,
    Backbone,
    BuildTestsTemplate,
    mvc,
    SimpleSplunkView,
    SearchManager,
    ChartView,
    TableView,
    TimeRangeView,
    DropdownView,
    ResultsLinkView,
    AppInfo,
    Util
) {
    var eval_result='eval pass=case(isnotnull(errordetails), 0, skipped=="true", 0, true(), 1), fail=if(isnotnull(errordetails), 1, 0), skip=if(skipped=="true", 1, 0)'
    return SimpleSplunkView.extend({
        className: 'build-tests-view',
        output_mode: 'json',

        createView: function() {
            var template = _.template(BuildTestsTemplate);
            this.$el.html(template());
            return true;
        },

        formatData: function(data) {
            return data[0];
        },

        updateView: function(viz, data) {
            var template = _.template('<li class="test-summary-total"> \
                <i class="fa fa-list-ul fa-fw" aria-hidden="true"></i> \
                <%= total%> \
            </li> \
            <li class="test-summary-failed"> \
                <i class="fa fa-times fa-fw" aria-hidden="true"></i> \
                <%= fail%> failed \
            </li> \
            <li class="test-summary-failed"> \
                <i class="fa fa-exclamation fa-fw" aria-hidden="true"></i> \
                <%= skip%> skipped \
            </li> \
            <li class="test-summary-duration"> \
                <i class="fa fa-clock-o fa-fw" aria-hidden="true"></i> \
                <%= duration%> \
            </li>');

            var duration = data['test_summary.duration'];
            var pass = parseInt(data['test_summary.passes']);
            var fail = parseInt(data['test_summary.failures']);
            var skip = parseInt(data['test_summary.skips']);

            if (!data.hasOwnProperty('test_summary.duration')) {
                duration = 0;
                pass = 0;
                fail = 0;
                skip = 0;
            }

            this.$el.find('.tests-summary').html(template({
                total: Util.numberToString(pass + fail + skip, 'test'),
                fail: Util.numberToString(fail, 'test'),
                skip: Util.numberToString(skip, 'test'),
                duration: Util.durationToString(duration)
            }));

            var host = data['host'];
            var job = data['job_name'];
            var build = data['build_number'];

            var timeTrandInput=this.options.tabId+"_timetrend_input"
            var trendTestTimeRange = mvc.Components.getInstance(timeTrandInput);
            if (!trendTestTimeRange) {
                trendTestTimeRange = new TimeRangeView({
                    id: timeTrandInput,
                    preset: "Last 24 hours",
                    value:  mvc.tokenSafe('$' + this.options.tabId + '_timetrend$'),
                    el: this.$el.find('.build-tests-timerange')
                }).render();
            }
            // Chart type selector
            var testsChartTypeSelector = mvc.Components.getInstance(this.options.tabId + '-tests-view-dropdown');
            if (!testsChartTypeSelector) {
                testsChartTypeSelector = new DropdownView({
                    id: this.options.tabId + '-tests-view-dropdown',
                    default: 'overall-trend',
                    choices: [
                        {label: 'Overall trend', value: 'overall-trend'},
                        {label: 'Failure trend', value: 'failure-trend'},
                        {label: 'Runtime distribution', value: 'duration-distribution'},
                        {label: 'Test case by class', value: 'test-case-by-class'}
                    ],
                    showClearButton: false,
                    el: this.$el.find('.build-tests-view-selector')
                }).render();
            }

            var testsChartSettings = {
                'overall-trend': {
                    search: 'index=jenkins_statistics event_tag=job_event type=completed host="' + host + '" job_name="' + job + '" build_number<=' + build + ' | head 1000 | stats  max(test_summary.passes) as "Passed" max(test_summary.failures) as "Failed" max(test_summary.skips) as "Skipped" by build_number',
                    settings: {
                        type: 'area',
                        'charting.areaFillOpacity': 1.0,
                        'charting.chart.stackMode': 'stacked',
                        'charting.axisTitleX.text': 'Build',
                        'charting.axisTitleY.text': 'Count'
                    },
                    drilldown: "'?host=' + encodeURIComponent(host) + '&job=' + encodeURIComponent(job) + '&build=' + encodeURIComponent(e.value)"
                },
                'failure-trend': {
                    search: 'index=jenkins_statistics event_tag=job_event type=completed host="' + host + '" job_name="' + job + '" build_number<=' + build + ' | head 1000 | stats max(test_summary.failures) as "Failed" by build_number',
                    settings: {
                        type: 'area',
                        'charting.chart.stackMode': 'default',
                        'charting.axisTitleX.text': 'Build',
                        'charting.axisTitleY.text': 'Count'
                    },
                    drilldown: "'?host=' + encodeURIComponent(host) + '&job=' + encodeURIComponent(job) + '&build=' + encodeURIComponent(e.value) + '&custom=' + encodeURIComponent('result=Failed')"
                },
                'duration-distribution': {
                    search: 'index=jenkins host="' + host + '" job_name="' + job + '" build_number<="' + build + '" |head 1000| `expand_testcase` | chart count by duration bins=80',
                    settings: {
                        type: 'column',
                        'charting.chart.stackMode': 'default',
                        'charting.axisTitleX.text': 'Duration (seconds)',
                        'charting.axisTitleY.text': 'Count'
                    },
                    drilldown: "'?host=' + encodeURIComponent(host) + '&job=' + encodeURIComponent(job) + '&build=' + encodeURIComponent(build) + '&custom=' + encodeURIComponent('duration>=' + (e.value.indexOf('-') > 0 ? e.value.substring(0, e.value.indexOf('-')) : e.value))"
                },
                'test-case-by-class': {
                    search: 'index=jenkins host="' + host + '" job_name="' + job + '" build_number<="' + build + '" |head 1000| `expand_testcase`|'+eval_result+'| stats sum(pass) as Passed, sum(fail) as Failed, sum(skip) as Skipped by classname',
                    settings: {
                        type: 'column',
                        'charting.chart.stackMode': 'stacked',
                        'charting.axisTitleX.text': 'Class Name',
                        'charting.axisTitleY.text': 'Count'
                    },
                    drilldown: "'?host=' + encodeURIComponent(host) + '&job=' + encodeURIComponent(job) + '&build=' + encodeURIComponent(build) + '&custom=' + encodeURIComponent('classname=\"' + e.value + '\" result=' + e.name2)"
                }
            }

            var testsSearchManager = mvc.Components.getInstance(this.options.tabId + '-tests-trend-search');
            if (!testsSearchManager) {
                testsSearchManager = new SearchManager({
                    id: this.options.tabId + '-tests-trend-search',
                    preview: false,
                    cache: false,
                    // search: testsChartSettings['overall-trend']['search'],
                    autostart: true,
                    earliest_time:"$"+this.options.tabId+"_timetrend.earliest_time$",
                    latest_time:"$"+this.options.tabId+"_timetrend.latest_time$",
                    status_buckets: 0
                },{tokens: true});
            }
            testsSearchManager.settings.set("search", testsChartSettings['overall-trend']['search']);
            testsSearchManager.startSearch();

            var testsChartView = mvc.Components.getInstance(this.options.tabId + '-tests-trend-view');
            if (!testsChartView) {
                testsChartView = new ChartView({
                    id: this.options.tabId + '-tests-trend-view',
                    managerid: this.options.tabId + '-tests-trend-search',
                    type: 'area',
                    'charting.areaFillOpacity': 1.0,
                    'charting.chart.stackMode': 'stacked',
                    'charting.chart.nullValueMode': 'zero',
                    'charting.legend.placement': 'top',
                    'charting.axisLabelsX.integerUnits': true,
                    'charting.axisLabelsY.integerUnits': true,
                    "charting.fieldColors": "{Passed: 0x339933, Skipped: 0xf2b827, Failed: 0xaa0000}",
                    'charting.axisTitleX.text': 'Build',
                    'charting.axisTitleY.text': 'Count',
                    el: this.$el.find('.build-tests-trend-view')
                }).render();

                // Instantiate the results link view
                new ResultsLinkView({
                    managerid: this.options.tabId + '-tests-trend-search',
                }).render().$el.appendTo(this.$el.find('.build-tests-trend-view'));
            }

            testsChartView.on("click:chart", function (e) {
                e.preventDefault();
                var drilldownUrl = AppInfo.get_app_url_prefix() + '/test_analysis' + eval(testsChartSettings[testsChartTypeSelector.val()].drilldown);
                window.open(drilldownUrl, '_blank');
            });

            testsChartTypeSelector.on('change', function(e) {
                testsSearchManager.settings.unset('search');
                testsSearchManager.settings.set('search', testsChartSettings[e]['search']);
                testsSearchManager.startSearch();
                for (var setting in testsChartSettings[e]['settings']) {
                        testsChartView.settings.unset(setting);
                        testsChartView.settings.set(setting, testsChartSettings[e]['settings'][setting]);
                }
            });

            // if (fail > 0) {
            //     this.$el.find('.build-tests-failure-section h3').html('Test failures');
            //
            //     if (!mvc.Components.getInstance(this.options.tabId + '-tests-failure-search')) {
            //         new SearchManager({
            //             id: this.options.tabId + '-tests-failure-search',
            //             preview: false,
            //             cache: false,
            //             search: 'index=jenkins host="' + host + '" job_name="' + job + '" build_number=' + build +
            //             '| `expand_testcase`|'+eval_result+' |search fail>0 | eval duration=round(duration, 2) | table testname failedsince duration | rename testname as "Test name" failedsince as "Failing since build" duration as "Duration (sec)"'
            //         });
            //     }
            //
            //     var failedCaseTable = mvc.Components.getInstance(this.options.tabId + '-tests-failure-table');
            //     if (!failedCaseTable) {
            //         failedCaseTable = new TableView({
            //             id: this.options.tabId + '-tests-failure-table',
            //             managerid: this.options.tabId + '-tests-failure-search',
            //             pageSize: '10',
            //             pagerPosition: 'top',
            //             el: this.$el.find('.build-tests-failure-table'),
            //             drilldown: "row",
            //             drilldownRedirect: false,
            //         }).render();
            //
            //         // Instantiate the results link view
            //         new ResultsLinkView({
            //             managerid: this.options.tabId + '-tests-failure-search'
            //         }).render().$el.appendTo(this.$el.find('.build-tests-failure-table'));
            //     }
            //
            //     failedCaseTable.on("click:row", function (e) {
            //         var drilldownUrl = AppInfo.get_app_url_prefix() + '/test_analysis?host=' + encodeURIComponent(host) + '&job=' + encodeURIComponent(job) + '&build=' + encodeURIComponent(build) + '&custom=' + encodeURIComponent('testname="' + e.data["row.Test name"] + '"');
            //         window.open(drilldownUrl, '_blank');
            //     });
            // }

            var reportUrl = AppInfo.get_app_url_prefix() + '/test_analysis?host=' + encodeURIComponent(host) + '&job=' + encodeURIComponent(job) + '&build=' + encodeURIComponent(build);

            var html = '<a class="btn btn-primary btn-small" href="' + reportUrl + '" target="_blank" >Test Analyzer > </a>';

            this.$el.find('.test-results-report').html(html);
        },

        displayMessage: function(info) {
            return this;
        }
    });
});
