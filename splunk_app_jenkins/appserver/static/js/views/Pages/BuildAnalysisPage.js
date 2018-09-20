/*global define*/
define([
    'jquery',
    'underscore',
    'backbone',
    'clipboard',
    'contrib/text!app/templates/BuildAnalysisTemplate.html',
    'contrib/text!app/templates/BuildDetailTemplate.html',
    'splunkjs/mvc',
    'splunkjs/mvc/searchmanager',
    'splunkjs/mvc/postprocessmanager',
    'splunkjs/mvc/singleview',
    'splunkjs/mvc/timelineview',
    'splunkjs/mvc/timerangeview',
    'splunkjs/mvc/headerview',
    'splunkjs/mvc/tableview',
    'splunkjs/mvc/textinputview',
    'splunkjs/mvc/searchbarview',
    'splunkjs/mvc/eventsviewerview',
    'splunkjs/mvc/chartview',
    'splunkjs/mvc/resultslinkview',
    'splunkjs/mvc/dropdownview',
    'app/views/Component/BuildTestsView',
    'app/views/Component/BuildHistoryView',
    'app/views/Component/BuildLogView',
    'app/views/Component/BuildAnalysisTableRowExpanderView',
    'app/views/Component/LogsFilterDialog',
    'app/util/app_info',
    'app/routers/AppRouter',
    'util/router_utils',
    'app/config/BuildAnalysisCfg',
    'app/config/BuildDetailCfg',
    'app/util/util'
], function (
    $,
    _,
    Backbone,
    Clipboard,
    BuildAnalysisTemplate,
    BuildDetailTemplate,
    mvc,
    SearchManager,
    PostProcessManager,
    SingleView,
    TimelineView,
    TimeRangeView,
    HeaderView,
    TableView,
    TextInputView,
    SearchBarView,
    EventsViewer,
    ChartView,
    ResultsLinkView,
    DropdownView,
    BuildTestsView,
    BuildHistoryView,
    BuildLogView,
    BuildAnalysisTableRowExpanderView,
    LogsFilterDialog,
    AppInfo,
    AppRouter,
    Router_utils,
    BuildAnalysisCfg,
    BuildDetailCfg,
    Util
) {
    return Backbone.View.extend({
        router: null,
        pageParams: null,
        buildTabs: [{tabId: 'builds'}],
        events: {
            "click a.build-analysis-tab": "showBuildAnalysisTab",
            "click a.build-info-tab": "showBuildInfoTab"
        },

        fillFilterbyParams: function (params) {

            if (params.hasOwnProperty('build_parameters')) {
                mvc.Components.get('build_analysis_buildparameters').val(decodeURIComponent(params['build_parameters']));
            }
            if (params.hasOwnProperty('status')) {
                mvc.Components.get('build_analysis_status').val(decodeURIComponent(params['status']));
            }
        },

        showBuildAnalysisTab: function(event) {
            var type = $(event.currentTarget).attr('type');
            if (type == 'builds') {
                this.showTab(0);
            } else if (type == 'build-info') {
                var tabId = $(event.currentTarget).attr('tabId');
                var tabIndex = this._getTabIndexById(tabId);
                this.showTab(tabIndex, this.buildTabs[tabIndex]['bookmark']);
            }
        },

        showBuildInfoTab: function(event) {
            var tabId = $(event.currentTarget).attr('tabId');
            var content = $(event.currentTarget).attr('content');
            this.showTab(this._getTabIndexById(tabId), content);
        },

        initialize: function () {

            var that = this;

            this.$el.append(_.template(BuildAnalysisTemplate));
            this.page = "build_analysis";

            this.router = new AppRouter({
                changeUrl: function (params) {
					var viewType = params['type']
                    // Show particular build
                    if (viewType == 'build') {
                        var host = decodeURIComponent(params['host']);
                        var job = decodeURIComponent(params['job']);
                        var build = decodeURIComponent(params['build']);
                        var bookmark = params.hasOwnProperty('bookmark') ? decodeURIComponent(params['bookmark']) : null;
                        that.createNewBuildTab(host, job, build, null, bookmark);
                    }else if (viewType == 'list') {
                        that.fillFilterbyParams(params);
                        // that.pageParams = params;
                    }else{
						_.each(params, function (elementVal, elementId) {
							console.log("elementId is: " + elementId);
							var inputEle = mvc.Components.get(elementId);
							if (inputEle) {
								inputEle.val(decodeURIComponent(elementVal));
							}
						});
                    }
					//update time
					if (params.hasOwnProperty('earliest_time') || params.hasOwnProperty('latest_time')) {
						var user_earitest_time = params['earliest_time'] || '-1d';
						var user_latest_time = params['latest_time'] || 'now';
						console.log(user_earitest_time)
                        timeRangeInput=mvc.Components.get('builds-timerange')
						if (timeRangeInput.settings && timeRangeInput.settings.get("preset")) {
							//debugger;
							timeRangeInput.settings.set("preset", null);
						}
						timeRangeInput.val({
							earliest_time: user_earitest_time,
							latest_time: user_latest_time
						});
					}
                }
            });
            // Backbone.History.started is a boolean value indicating whether it has already been called.
            // 6.3.9 throws: Uncaught Error: Backbone.history has already been started
			if (!Backbone.History.started) {
				Router_utils.start_backbone_history();
			}
            this.baseUrl = Util.getAbsoluteUrl('build_analysis');
            var clipboard = new Clipboard('.clipboard-btn', {
                text: function(trigger) {
                    var tabId = $(trigger).attr('build-tab-id');
                    return that.generateTabUrl(tabId);
                }
            });

            clipboard.on('success', function(e) {
                e.clearSelection();
                $(e.trigger).attr('data-original-title', 'Copied!').tooltip('show');
            });

            clipboard.on('error', function(e) {
                $(e.trigger).attr('data-original-title', 'Press Ctrl+C to copy').tooltip('show');
            });

            // Instantiate components
            $(".build-analysis-title").text(BuildAnalysisCfg.title);
            $(".build-analysis-description").text(BuildAnalysisCfg.description);

            var prefix = this.page;
            var defaultTokenModel = mvc.Components.getInstance("default", {create: true});
            defaultTokenModel.set({"earliest_time":"@d"})
            var tokens = Util.addFilter(BuildAnalysisCfg.entity, ".build-analysis #filterset", prefix);
            that.createTooltip();
            //use cached value for jenkins master
            _(["Jenkins Master", "Job"]).each(function (label, index) {
                var eleId=Util.getElementId(label, prefix)
				Util.useLocalCache(eleId);
			});

            var filterString = tokens[0];
            var jobResultToken = tokens[1];

            var buildsSearch = new SearchManager({
                id: "builds-search",
                preview: true,
                cache: false,
                //TODO should use job_started_at but not _time to cac job_duration for in progress job
                search: 'index=jenkins_statistics event_tag="job_event" ' + filterString +
                    '| dedup host build_url sortby -_time  ' +
                    '| search ' + jobResultToken +
                    '`utc_to_local_time(job_started_at)`' +
                    '| convert timeformat="%Y-%m-%d %H:%M:%S" mktime(job_started_at) as epocTime ' +
                    '| eval job_duration = if(isnull(job_duration), now() - epocTime, job_duration)' +
                    '| eval Duration = tostring(job_duration,"duration")' +
                    '| eval job_result=if(type="started", "INPROGRESS", job_result)' +
                    '| sort -job_started_at' +
                    '| table host job_name build_number job_started_at node  Duration job_result' +
                    '| rename host as "Jenkins Master" job_name as Job build_number as Build ' +
				    'job_started_at as StartTime node as "Jenkins Slave" job_result as Status',
                latest_time:  "$latest_time$",
                earliest_time:  "$earliest_time$",
                status_buckets: 300
            }, {tokens: true});

            var buildsTimerange = new TimeRangeView({
                id: "builds-timerange",
                managerid: "builds-search",
                preset: "Today",
                el: $("#buildstimerangeview")
            }).render();


            // Update the search manager when the time range changes
            buildsTimerange.on("change", function() {
                 var timeToken=buildsTimerange.val()
                defaultTokenModel.set(timeToken)
            });
            Util.useLocalCache(buildsTimerange)
            var buildsTimeline = new TimelineView({
                id: "builds-timeline",
                managerid: "builds-search",
                minimize: true,
                el: $("#buildstimelineview")
            }).render();

            // Update the search manager when the timeline changes
            buildsTimeline.on("change", function() {
                var timeToken=buildsTimeline.val()
                defaultTokenModel.set(timeToken)
            });

            var buildsTableView = new TableView({
                id: "builds-table",
                managerid: "builds-search",
                drilldown: "row",
                drilldownRedirect: false,
                el: $("#buildstable"),
                pageSize: 15,
                pagerPosition: "bottom"
            });

            buildsTableView.on("click:row", function (e) {
                that.createNewBuildTab(
                    e.data["row.Jenkins Master"],
                    e.data["row.Job"],
                    e.data["row.Build"],
                    e.data["row.Status"]
                );
            });

            that.addTableExpander(buildsTableView, BuildAnalysisCfg.expandInfo, buildsTableView.id);
            Util.addColumnRender(buildsTableView, "Status");
            buildsTableView.render();

            // Instantiate the results link view
            new ResultsLinkView({
                managerid: "builds-search"
            }).render().$el.appendTo($("#buildstable"));

            //Double-click to remove build detail tab
            $('.nav-tabs').on("dblclick", "a", function () {
                var tabId = $(this).attr('tabId');
                if (tabId != 'builds') {
                    that.deleteTab(tabId);
                    Util.unselectText();
                }
            });
        },

        addTableExpander: function (TableView, expandInfo, manager_id_prefix) {
            var expansionRender = new BuildAnalysisTableRowExpanderView({
                expandInfo: expandInfo,
                manager_id_prefix : manager_id_prefix
            });
            TableView.addRowExpansionRenderer(expansionRender);
        },

        createNewBuildTab: function (host, job, build, result, bookmark) {
            var tabIndex = this._getTabIndex(host, job, build);
            var tabInfo = this.buildTabs[tabIndex];
            var content = 'history';

            if (bookmark) {
                content = bookmark;
            }

            if (tabInfo == null) {
                tabIndex = this._newTabInfo(host, job, build);
                tabInfo = this.buildTabs[tabIndex];

                var tab_title_template = '<li id="<%= token%>-li" <% if (active) { %> class="active" <% } %>><a class="build-analysis-tab" type="build-info" tabId="<%= token%>"><%= title%></a></li>';
                var tab_content_template = BuildDetailTemplate;

                $(".nav-tabs").append(_.template(tab_title_template, {title: '#' + build, token: tabInfo['tabId'], active: true}));
                $(".tab-content").append(_.template(tab_content_template, {token: tabInfo['tabId'], active: true}));

                $('#' + tabInfo['tabId'] + '-build-status').html('<div class="status-ribbon LOADING"><h2 class="status-ribbon-heading">Loading build result ...</h2></div>');

                if (result) {
                    // if result is passed in parameter, thus not searching it for performance improvement
                    //draw result icon
                    var result_class = result;

                    var status_render_dict = BuildAnalysisCfg.status_render_dict;

                    if (!status_render_dict.hasOwnProperty(result_class)) {
                        result_class = 'UNKNOWN';
                    }

                    $('#' + tabInfo['tabId'] + '-build-status').html('<div class="status-ribbon"><h2 class="status-ribbon-heading"></h2></div>');

                    $('#' + tabInfo['tabId'] + '-build-status').find('.status-ribbon').addClass(result_class);
                    $('#' + tabInfo['tabId'] + '-build-status').find('.status-ribbon-heading').append('<i class="fa '
                        + status_render_dict[result_class].icon + ' fa-fw"/>#' + build + ' ' + status_render_dict[result_class].text + ' for ' + job);
                } else {
                    //if result is not passed in parameter.
                    var buildResultSearch = new SearchManager({
                        preview: false,
                        cache: false,
                        latest_time: mvc.tokenSafe("$latest_time$"),
                        earliest_time: mvc.tokenSafe("$earliest_time$"),
                        search: 'index=jenkins_statistics event_tag="job_event" host="' + host + '" job_name="' + job + '" build_number="' + build +
                        '" | head 1 | eval job_result=if(type="started", "INPROGRESS", job_result) | table job_result'
                    });

                    var buildResult = buildResultSearch.data('results');
                    buildResult.on('data', function() {
                        var result_class = buildResult.data().rows[0][0];

                        var status_render_dict  = BuildAnalysisCfg.status_render_dict;

                        if (!status_render_dict.hasOwnProperty(result_class)) {
                            result_class = 'UNKNOWN';
                        }

                        $('#' + tabInfo['tabId'] + '-build-status').html('<div class="status-ribbon"><h2 class="status-ribbon-heading"></h2></div>');

                        $('#' + tabInfo['tabId'] + '-build-status').find('.status-ribbon').addClass(result_class);
                        $('#' + tabInfo['tabId'] + '-build-status').find('.status-ribbon-heading').append('<i class="fa '
                            + status_render_dict[result_class].icon + ' fa-fw"/>#' + build + ' ' + status_render_dict[result_class].text + ' for ' + job);
                    });
                }

            } else {
                content = tabInfo['bookmark'];
            }

            this.showTab(tabIndex, content);
        },

        showTab: function(tabIndex, content) {
            var tabInfo = this.buildTabs[tabIndex];
            var tabId = tabInfo['tabId'];

            $('.nav-tabs li').removeClass('active');
            $('#' + tabId + '-li').addClass('active');
            $('.tab-content div.tab-pane').removeClass('active');
            $('#' + tabId + '-tab').addClass('active');

            if (tabId == 'builds' || tabInfo['bookmark'] == content) {
                return ;
            }

            tabInfo['bookmark'] = content;

            if (content == 'tests') {
                this.renderBuildTests(tabIndex);
            } else if (content == 'logs') {
                this.renderBuildLogs(tabIndex);
            } else if (content == 'summary') {
                this.renderBuildSummary(tabIndex);
            } else {
                //go to history tab by default
                this.renderBuildHistory(tabIndex);
            }
        },

        deleteTab: function(tabId) {
            $('#' + tabId + '-li').remove();
            $('#' + tabId + '-tab').remove();
            var tabIndex = this._getTabIndexById(tabId);
            this.buildTabs.splice(tabIndex, 1);
            if (tabIndex >= this.buildTabs.length) {
                tabIndex = this.buildTabs.length - 1;
            }
            this.showTab(tabIndex, this.buildTabs[tabIndex]['bookmark']);
        },

        renderBuildSummary: function(tabIndex) {

            var tabInfo = this.buildTabs[tabIndex];
            var tabId = tabInfo['tabId'];
            var host = tabInfo['host'];
            var job = tabInfo['job'];
            var build = tabInfo['build'];

            $('#' + tabId + '-panel-content-title').html(BuildDetailCfg.buildSummary.title + '  <a class="btn clipboard-btn" build-tab-id="' + tabId + '"><i class="fa fa-clipboard" aria-hidden="true"></i></a>');
            $(".build-content-description").text(BuildDetailCfg.buildSummary.description);
            this.createTooltip();

            this.initBuildTabRender(tabId, 'summary');

            if (this.buildTabs[tabIndex]['summaryRendered']) {
                return ;
            }

            this.buildTabs[tabIndex]['summaryRendered'] = true;

            new SearchManager({
                id: tabId + "-build-summary-search",
                preview: false,
                cache: false,
                latest_time: mvc.tokenSafe("$latest_time$"),
                earliest_time: mvc.tokenSafe("$earliest_time$"),
                search: 'index=jenkins_statistics host="' + host + '" job_name="'+ job + '" build_number="' + build + '"' + '| head 1 ' +
                '| fields host job_name build_number job_type node trigger_by upstream type job_result scm branch revision scm_url job_started_at queue_time job_duration' +
                ' `utc_to_local_time(job_started_at)` ' +
                '| convert timeformat="%Y-%m-%d %H:%M:%S" mktime(job_started_at) as epocTime ' +
                '| eval job_duration = if(isnull(job_duration), now() - epocTime, job_duration)' +
                '| eval job_duration = tostring(job_duration,"duration")' +
                '| eval queue_time = tostring(queue_time,"duration")' +
                '| transpose | search column != _* column != epocTime column!="local_time_zone" "row 1"!="" | sort column' +
                '| rename column as "Variable Name" "row 1" as Value'
            });

            var buildSummaryTable =  new TableView({
                id: tabId + "-build-summary-search-table",
                managerid: tabId + "-build-summary-search",
                pageSize: "15",
                pagerPosition: "bottom",
                drilldown: "none",
                drilldownRedirect: false,
                el: $('#' + tabId + '-summary-content .build-summary-content .panel-body'),
            }).render();

            var CustomIconRenderer = TableView.BaseCellRenderer.extend({
                canRender: function (cell) {
                    var patt = new RegExp('a href');
                    return cell.field === 'Value' && patt.test(cell.value)
                },
                render: function ($td, cell) {
                    $td.append(cell.value);
                    $td.find("a").attr("target","_blank")
                }
            });

            buildSummaryTable.table.addCellRenderer(new CustomIconRenderer());

            var formatFiledNameRender = TableView.BaseCellRenderer.extend({
                canRender: function (cell) {
                    return cell.field === 'Variable Name'
                },
                render: function ($td, cell) {
                    var value = cell.value.replace(/_/g,' ');
                    var upperValue = Util.wordUpperCase(value);
                    $td.text(upperValue)
                }
            });

            buildSummaryTable.table.addCellRenderer(new formatFiledNameRender());

            // Instantiate the results link view
            new ResultsLinkView({
                managerid: tabId + "-build-summary-search"
            }).render().$el.appendTo($('#' + tabId + '-summary-content .build-summary-content .panel-body'));

            //env variable
            var envVariableSearch = new SearchManager({
                id: tabId + "-env-variable-summary-search",
                preview: false,
                cache: false,
                search: 'index=jenkins_statistics host="' + host + '" job_name="'+ job + '" build_number="' + build + '"' + '| head 1 ' +
                    '| spath output=metadata path="metadata"' +
                    '| mvexpand metadata | fields metadata.* |rename metadata.* as * ' +
                    '| transpose | search column != _* "row 1"!="" | sort column ' +
                    '| rename column as "Variable Name" "row 1" as Value',
                latest_time: "$latest_time$",
                earliest_time: "$earliest_time$"
            }, {tokens: true});

            var envVariableSearchResult = envVariableSearch.data('results');
            envVariableSearchResult.on('data', function() {
                if(envVariableSearchResult.hasData()){
                    $('#' + tabId + '-summary-content .build-env-content').show();
                    var buildEnvTable = new TableView({
                        id: tabId + "-env-variable-summary-search-table",
                        managerid: tabId + "-env-variable-summary-search",
                        pageSize: "15",
                        pagerPosition: "bottom",
                        drilldown: "none",
                        drilldownRedirect: false,
                        el: $('#' + tabId + '-summary-content .build-env-content .panel-body')
                    }).render();

                    buildEnvTable.table.addCellRenderer(new formatFiledNameRender());

                    // Instantiate the results link view
                    new ResultsLinkView({
                        managerid: tabId + "-env-variable-summary-search"
                    }).render().$el.appendTo($('#' + tabId + '-summary-content .build-env-content .panel-body'));

                }
            });

            //Change log
            var changeLogSearch = new SearchManager({
                id: tabId + "-change-log-search",
                preview: false,
                cache: false,
                latest_time: mvc.tokenSafe("$latest_time$"),
                earliest_time: mvc.tokenSafe("$earliest_time$"),
                search: 'index=jenkins_statistics host="' + host + '" job_name="'+ job + '" build_number="' + build + '"' + '| head 1 ' +
                '| rex field=changelog{} "(?<CommitTime>\\d+)\\s+commit:(?<Commit>.+)\\s+author:(?<Author>.+)\\s+message:(?<Message>.+)" max_match=0 ' +
                '| eval fields = mvzip(mvzip(mvzip(Commit, Author), Message),CommitTime) ' +
                '| table _time fields' +
                '| mvexpand fields ' +
                '| rex field=fields "(?<Commit>.+),(?<Author>.+),(?<Message>.+),(?<CommitTime>\\d+)" ' +
                '|fieldformat CommitTime = strftime(CommitTime/1000, "%F %T")' +
                '| sort -CommitTime' +
                '| table CommitTime Commit Author Message'
            });

            var changeLogSearchResult = changeLogSearch.data('results');

            changeLogSearchResult.on('data', function() {
                if(changeLogSearchResult.hasData()){
                    $('#' + tabId + '-summary-content .change-log-content').show();
                    new TableView({
                        id: tabId + "-change-log-search-table",
                        managerid: tabId + "-change-log-search",
                        pageSize: "15",
                        pagerPosition: "bottom",
                        drilldown: "none",
                        drilldownRedirect: false,
                        el: $('#' + tabId + '-summary-content .change-log-content .panel-body')
                    }).render();

                    new ResultsLinkView({
                        managerid: tabId + "-change-log-search",
                    }).render().$el.appendTo($('#' + tabId + '-summary-content .change-log-content .panel-body'));

                }
            });
        },

        renderBuildTests: function(tabIndex) {

            var tabInfo = this.buildTabs[tabIndex];
            var tabId = tabInfo['tabId'];
            var host = tabInfo['host'];
            var build_url = tabInfo['build_url'];

            $('#' + tabId + '-panel-content-title').html(BuildDetailCfg.buildTests.title + '  <a class="btn clipboard-btn" build-tab-id="' + tabId + '"><i class="fa fa-clipboard" aria-hidden="true"></i></a>');
            $(".build-content-description").text(BuildDetailCfg.buildTests.description);
            this.createTooltip();

            this.initBuildTabRender(tabId, 'tests');

            if (this.buildTabs[tabIndex]['testsRendered']) {
                return ;
            }
            this.buildTabs[tabIndex]['testsRendered'] = true;

            new SearchManager({
                id: tabId + '-tests-search',
                preview: false,
                cache: false,
                search: 'index=jenkins_statistics host="' + host + '" build_url="'+ build_url+'" | fields host job_name build_number test_summary.*',
                latest_time: "$latest_time$",
                earliest_time: "$earliest_time$",
            }, {tokens: true});

            new BuildTestsView({
                managerid: tabId + '-tests-search',
                el: $('#' + tabId + '-tests-content'),
                tabId: tabId
            }).render();
        },

        renderBuildLogs: function(tabIndex) {
            var tabInfo = this.buildTabs[tabIndex];
            var tabId = tabInfo['tabId'];
            var host = tabInfo['host'];
            var build_url = tabInfo['build_url'];

            this.initBuildTabRender(tabId, 'logs');

            var logFilterDlg = mvc.Components.getInstance('#' + tabId + "-logs-filter-dlg");
            // if(logFilterDlg != undefined){
            //     $('#' + tabId + '-panel-content-title').text("Build Artifacts of " + logFilterDlg.dropdown.val());
            // }else {
            //     $('#' + tabId + '-panel-content-title').text(BuildDetailCfg.buildLog.title);
            // }

            $('#' + tabId + '-panel-content-title').html('Logs and Artifacts  <a class="btn clipboard-btn" build-tab-id="' + tabId + '"><i class="fa fa-clipboard" aria-hidden="true"></i></a>');
            this.createTooltip();

            $(".build-content-description").text(BuildDetailCfg.buildLog.description);

            if (this.buildTabs[tabIndex]['logsRendered']) {
                return ;
            }
            this.buildTabs[tabIndex]['logsRendered'] = true;


            var logsBaseSearch = 'index=jenkins_console host="' + host + '" source="'+ build_url + 'console"';
            var logsFilteredSearch = "reverse| rename _raw as Event| table _time, Event";

             new SearchManager({
                id: tabId + '-logs-search',
                managerid: tabId + '-logs-search',
                search: logsBaseSearch + '|' + logsFilteredSearch,
                latest_time: "$latest_time$",
                earliest_time: "$earliest_time$",
            }, {tokens: true});


            new BuildLogView({
                parent_view: this,
                managerid: tabId + '-logs-search',
                el: $('#' + tabId + '-logs-content'),
                tabInfo: tabInfo
            }).render();
        },

        renderBuildHistory: function(tabIndex) {
            var tabInfo = this.buildTabs[tabIndex];
            var tabId = tabInfo['tabId'];
            var host = tabInfo['host'];
            var job = tabInfo['job'];
            var build = tabInfo['build'];

            this.initBuildTabRender(tabId, 'history');

            var title = BuildDetailCfg.buildHistory.title;
            $('#' + tabId + '-panel-content-title').html(title + '  <a class="btn clipboard-btn" build-tab-id="' + tabId + '"><i class="fa fa-clipboard" aria-hidden="true"></i></a>');
            $(".build-content-description").text(BuildDetailCfg.buildHistory.description);
            this.createTooltip();

            if (this.buildTabs[tabIndex]['historyRendered']) {
                return ;
            }

            this.buildTabs[tabIndex]['historyRendered'] = true;
            var testTimeRagenId=tabId + "-trend-test-time"
            var trendTestTimeRange = mvc.Components.getInstance(testTimeRagenId);
            if (!trendTestTimeRange) {
                new TimeRangeView({
                    id: testTimeRagenId,
                    preset: "Last 24 hours",
                    value:  mvc.tokenSafe('$' + tabId + '_build_time$'),
                    el: $('#' + tabId + '-trend-job-timerange')
                }).render();
            }

            var trendJobCount = mvc.Components.getInstance(tabId + "-trend-job-count");
            if(!trendJobCount) {
                new DropdownView({
                    id: tabId + "-trend-job-count",
                    default: '25',
                    choices: [
                        {value: '10', label: '10'},
                        {value: '25', label: '25'},
                        {value: '50', label: '50'},
                        {value: '100', label: '100'},
                        {value: '250', label: '250'}
                    ],
                    value: mvc.tokenSafe('$' + tabId + 'token_trend_job_count$'),
                    el: $('#' + tabId + '-trend-job-count')
                }).render();
            }

            new SearchManager({
                id: tabId + '-history-builds-time-search',
                preview: false,
                cache: false,
                search: 'index=jenkins_statistics host="' + host + '" event_tag = job_event job_name="' + job + '"' + ' build_number <=' + build + ' type = "completed" |  sort - build_number ' +
                ' | head ' + '$' + tabId + 'token_trend_job_count$' +
                ' |eval build_number = "#" + build_number ' +
                ' |chart max(job_duration) AS "Build Time", max(queue_time) AS "Queue Time" over build_number',
                latest_time: "$" + tabId + '_build_time.latest_time$',
                earliest_time: "$" + tabId + '_build_time.earliest_time$',
            }, {tokens: true});

            new BuildHistoryView({
                managerid: tabId + '-history-builds-time-search',
                el: $('#' + tabId + '-history-content'),
                tabInfo: tabInfo
            }).render();

        },

        initBuildTabRender: function(tabId, content) {
            $('#' + tabId + '-tab h2').removeClass('active');
            $('#' + tabId + '-tab').find('#sidebar-' + content).addClass('active');
            $('#' + tabId + '-tab .panel-content').removeClass('active');
            $('#' + tabId + '-' + content + '-content').addClass('active');
        },

        _getTabIndex: function(host, job, build) {
            for (var i = 0; i < this.buildTabs.length; ++i) {
                if (this.buildTabs[i]['host'] == host && this.buildTabs[i]['job'] == job && this.buildTabs[i]['build'] == build) {
                    return i;
                }
            }
            return null;
        },

        _getTabIndexById: function(tabId) {
            for (var i = 0; i < this.buildTabs.length; ++i) {
                if (this.buildTabs[i]['tabId'] == tabId) {
                    return i;
                }
            }
            //go to builds page for invalid tabId
            return 0;
        },

        _newTabInfo: function(host, job, build) {
            var tabId = _.uniqueId('build');

            var tabInfo = {
                tabId: tabId,
                host: host,
                job: job,
                build: build,
                summaryRendered: false,
                testsRendered: false,
                logsRendered: false,
                historyRendered: false,
                bookmark: ''
            };
			var build_url;
			if (!job.startsWith("job/")) {
				build_url = "job/"+job.replace(/\//g, "/job/") + "/" + build + "/"
			} else {
				build_url = job + build + "/";
			}
			tabInfo["build_url"] = build_url;
            this.buildTabs.push(tabInfo);

            return this.buildTabs.length - 1;
        },

        generateTabUrl: function(tabId) {
            var tabIndex = this._getTabIndexById(tabId);
            var host = this.buildTabs[tabIndex]['host'];
            var job = this.buildTabs[tabIndex]['job'];
            var build = this.buildTabs[tabIndex]['build'];
            var bookmark = this.buildTabs[tabIndex]['bookmark'];

            var url_param = '?type=build';
            if (host) {
                url_param += url_param == '' ? '?' : '&';
                url_param += 'host=' + encodeURIComponent(host);
            }

            if (job) {
                url_param += url_param == '' ? '?' : '&';
                url_param += 'job=' + encodeURIComponent(job);
            }

            if (build) {
                url_param += url_param == '' ? '?' : '&';
                url_param += 'build=' + encodeURIComponent(build);
            }

            if (bookmark) {
                url_param += url_param == '' ? '?' : '&';
                url_param += 'bookmark=' + encodeURIComponent(bookmark);
            }

            return this.baseUrl + url_param;
        },

        createTooltip: function() {
            $('#build_analysis_buildparameters .filter-tooltip').css("visibility","visible");

            $('#build_analysis_buildparameters .filter-tooltip').tooltip({
                container: "body",
                html: true,
                title: '<div style="text-align:left;">' +
                'Jenkins build can have many parameters or injected parameters. This field can be used to further filter the results.For example:' +
                '<ul>' +
                "<li>metadata.browser=fire*</li>" +
                "<li>metadata.product=splunk metadata.scm_repo.scm=git</li>" +
                "<li>build_number>6*</li>" +
                "</ul></div>"
            });

            $('.clipboard-btn').tooltip({
                trigger: 'manual',
                placement: 'bottom',
                container: 'body'
            });

            $('.clipboard-btn').mouseleave(function() {
                $(this).tooltip('hide');
            });
        }
    });
});
