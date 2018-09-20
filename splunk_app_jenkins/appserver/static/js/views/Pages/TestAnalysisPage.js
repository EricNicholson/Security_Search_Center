/*global define*/
define([
    'jquery',
    'underscore',
    'backbone',
    'bootstrap',
    'clipboard',
    'contrib/text!app/templates/TestAnalysisTemplate.html',
    'contrib/text!app/templates/TestDetailTemplate.html',
    'splunkjs/mvc',
    'splunkjs/mvc/searchmanager',
    'splunkjs/mvc/postprocessmanager',
    'splunkjs/mvc/timelineview',
    'splunkjs/mvc/timerangeview',
    'splunkjs/mvc/headerview',
    'splunkjs/mvc/tableview',
    'splunkjs/mvc/textinputview',
    'splunkjs/mvc/searchbarview',
    'splunkjs/mvc/dropdownview',
    'splunkjs/mvc/singleview',
    'splunkjs/mvc/chartview',
    'splunkjs/mvc/searchbarview',
    'splunkjs/mvc/resultslinkview',
    'app/views/Component/BuildTestsView',
    'app/views/Component/TestcaseAnalysisTableRowExpanderView',
    'app/util/app_info',
    'app/routers/AppRouter',
    'util/router_utils',
    'app/util/util'
], function (
    $,
    _,
    Backbone,
    bootstrap,
    Clipboard,
    TestAnalysisTemplate,
    TestDetailTemplate,
    mvc,
    SearchManager,
    PostProcessManager,
    TimelineView,
    TimeRangeView,
    HeaderView,
    TableView,
    TextInputView,
    SearchBarView,
    DropdownView,
    SingleView,
    ChartView,
    SearchBarView,
    ResultsLinkView,
    BuildTestsView,
    TestcaseAnalysisTableRowExpanderView,
    AppInfo,
    AppRouter,
    Router_utils,
    Util
) {
    return Backbone.View.extend({
        router: null,
        currTabId: null,
        tabIds: [],
        events: {
            'click a.add-report-tab': 'clickAddTab',
            'click a.test-report-tab': 'clickReportTab',
            'dblclick a.test-report-tab': 'dblclickReportTab',
            'click a.tab-link': 'switchTab',
            'click a.filter-mode-seletor': 'switchFilter',
            'click a.new_test_result': 'newTestResult'
        },

        clickAddTab: function(event) {
            event.preventDefault();
            this.createNewTestTab(null);
        },

        dblclickReportTab: function(event) {
            event.preventDefault();
            if (this.tabIds.length == 1) {
                return ;
            }
            var tabId = $(event.currentTarget).attr('tabId');
            this.deleteTab(tabId);
            Util.unselectText();
        },

        clickReportTab: function(event) {
            event.preventDefault();
            var tabId = $(event.currentTarget).attr('tabId');
            this.showTab(tabId);
        },

        switchTab: function(event) {
            event.preventDefault();
            var tabName = $(event.currentTarget).attr('tab-name');
            var testTabId = $(event.currentTarget).attr('test-tab-id');
            $('#' + testTabId + '-tab .tabs-pane').removeClass('active-pane');
            $('#' + testTabId + '-tab .tabs-pane.' + tabName + '-content').addClass('active-pane');
            $('#' + testTabId + '-tab .menu-item').removeClass('active-tab');
            $(event.currentTarget).parent().addClass('active-tab');
        },

        switchFilter: function(event) {
            event.preventDefault();
            var testTabId = $(event.currentTarget).attr('test-tab-id');
            $('#' + testTabId + '-tab .test-filter-container').toggle();
            $('#' + testTabId + '-tab .test-filter-container-advanced').toggle();
        },

        newTestResult: function(event) {
            event.preventDefault();
            var host = $(event.currentTarget).attr('host');
            var job = $(event.currentTarget).attr('job');
            var build = $(event.currentTarget).attr('build');
            var classname = $(event.currentTarget).attr('classname');
            var testname = $(event.currentTarget).attr('testname');

            var params = {};

            if (host) {
                params['host'] = host;
            }

            if (job) {
                params['job'] = job;
            }

            if (build) {
                params['build'] = build;
            }

            var custom = '';
            if (classname) {
                custom += 'classname="' + classname + '"';
            }
            if (testname) {
                custom += ' testname="' + testname + '"';
            }
            if (custom) {
                params['custom'] = custom;
            }
            this.createNewTestTab(params);
        },

        initialize: function () {
            var that = this;

            this.$el.append(_.template(TestAnalysisTemplate));

            this.URL_PREFIX = AppInfo.get_app_url_prefix();

            this.router = new AppRouter({
                changeUrl: function (params) {
                    if (params) {
                        if (params.hasOwnProperty('host')) {
                            mvc.Components.get(that.currTabId + "-host-dropdown").val(decodeURIComponent(params['host']));
                        }
                        if (params.hasOwnProperty('job')) {
                            mvc.Components.get(that.currTabId + "-job-dropdown").val(decodeURIComponent(params['job']));
                        }
                        if (params.hasOwnProperty('build')) {
                            mvc.Components.get(that.currTabId + "-build-dropdown").val(decodeURIComponent(params['build']));
                        }
                        if (params.hasOwnProperty('custom')) {
                            mvc.Components.get(that.currTabId + "-custom-textinput").val(decodeURIComponent(params['custom']));
                        }
                    }
                }
            });

            // Backbone.History.started is a boolean value indicating whether it has already been called.
            // 6.3.9 throws: Uncaught Error: Backbone.history has already been started
			if (!Backbone.History.started) {
				Router_utils.start_backbone_history();
			}
            this.baseUrl = Util.getAbsoluteUrl('test_analysis');

            this.createNewTestTab(null);

            var clipboard = new Clipboard('.clipboard-btn', {
                text: function(trigger) {
                    var tabId = $(trigger).attr('test-tab-id');
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
        },

        createNewTestTab: function (params) {

            var tabId = _.uniqueId('test');
            this.tabIds.push(tabId);
            this.currTabId = tabId;

            var tab_title_template = '<li id="<%= token%>-li" <% if (active) { %> class="active" <% } %>><a class="test-report-tab" tabId="<%= token%>"><%= title%></a></li>';
            var tab_content_template = TestDetailTemplate;

            $(_.template(tab_title_template, {title: 'untitled', token: tabId, active: true})).insertBefore('#add-report-li');
            $(".tab-content").append(_.template(tab_content_template, {token: tabId, active: true}));

            // Instantiate components
            var defaultNamespace = mvc.Components.getInstance("default");
            var timeToken = "test_time_" + tabId;
            var earliest_time_token="$"+timeToken+".earliest_time$";
            var latest_time_token="$"+timeToken+".latest_time$";

            var timerange = new TimeRangeView({
                preset: "Last 24 hours",
                value: mvc.tokenSafe("$" + timeToken + "$"),
                dialogOptions: {
                    'showPresets': true,
                    'showPresetsRealTime': false,
                    'showCustom': true,
                    'showCustomRealTime': false
                },
                el: $("#" + tabId + "-tab .test-timerange")
            }).render();

            var hostSearch = new SearchManager({
                id: tabId + "-host-search",
                search: "|`jenkins_host_list`",
                latest_time: latest_time_token,
                earliest_time: earliest_time_token,
            }, {tokens: true});

            var hostInput = new DropdownView({
                id: tabId + "-host-dropdown",
                managerid: tabId + "-host-search",
                showClearButton: false,
                labelField: "host",
                valueField: "host",
                el: $("#" + tabId + "-tab .host-filter"),
                width: 200
            }).render();

            var jobSearch = new SearchManager({
                id: tabId + "-job-search",
                search: "index=jenkins $" + tabId + "_host_filter$ | stats count by job_name | table job_name",
                latest_time: latest_time_token,
                earliest_time: earliest_time_token,
                status_buckets: 0
            }, {tokens: true});

            var jobInput = new DropdownView({
                id: tabId + "-job-dropdown",
                managerid: tabId + "-job-search",
                showClearButton: false,
                labelField: "job_name",
                valueField: "job_name",
                el: $("#" + tabId + "-tab .job-filter"),
                width: 250
            }).render();

            var buildSearch = new SearchManager({
                id: tabId + "-build-search",
                search: "index=jenkins $" + tabId + "_host_filter$ $" + tabId + "_job_filter$ |stats count by build_number " +
                "| sort - build_number |table build_number",
                latest_time: latest_time_token,
                earliest_time: earliest_time_token,
                status_buckets: 0
            }, {tokens: true});

            var buildInput = new DropdownView({
                id: tabId + "-build-dropdown",
                managerid: tabId + "-build-search",
                showClearButton: false,
                labelField: "build_number",
                valueField: "build_number",
                el: $("#" + tabId + "-tab .build-filter"),
                width: 200
            }).render();

            // Custom filter
            var customInput = new TextInputView({
                id: tabId + "-custom-textinput",
                el: $("#" + tabId + "-tab .custom-filter")
            }).render();
            defaultNamespace.set(tabId + '_custom_filter', '*');

            customInput.on('change', function() {
                var searchFilter;
                if (typeof customInput.val() == "undefined") {
                    searchFilter = '*';
                } else {
                    searchFilter = customInput.val();
                }
                defaultNamespace.set(tabId + '_custom_filter', searchFilter);
            });

            var advancedSearchBar = new SearchBarView({
                id: tabId + "-advanced-search-filter",
                el:  $("#" + tabId + "-tab .advanced-search-filter"),
                timerange: false
            }).render();


            hostInput.on('change', function() {
                var searchFilter;
                if (typeof hostInput.val() == "undefined") {
                    searchFilter = 'host=""';
                } else {
                    searchFilter = 'host="' + hostInput.val() + '"';
                }

                defaultNamespace.set(tabId + '_host_filter', searchFilter);
            });

            jobInput.on('change', function() {
                var searchFilter;
                if (typeof jobInput.val() == "undefined") {
                    searchFilter = 'job_name=""';
                } else {
                    searchFilter = 'job_name="' + jobInput.val() + '"';
                }

                // unset Build when job is changed
                buildInput.val(undefined);
                defaultNamespace.set(tabId + '_job_filter', searchFilter);
            });

            buildInput.on('change', function() {
                var searchFilter;
                if (typeof buildInput.val() == "undefined") {
                    searchFilter = 'build_number=""';
                } else {
                    searchFilter = 'build_number=' + buildInput.val();
                    $('a[tabid="' + tabId + '"]').html('#' + buildInput.val());
                }

                defaultNamespace.set(tabId + '_build_filter', searchFilter);
            });
			//use cached value for jenkins master and job, custom input
            var tabCount=this.tabIds.length;
			if (tabCount == 1) {
				//only use local cache for default tab
				_([timerange, hostInput, jobInput, customInput]).each(function (element, index) {
					Util.useLocalCache(element, "test_result_tab_" + tabCount + "_" + index);
				});
			}
            var testcaseSearch = new SearchManager({
                id: tabId + "-testcase-search",
                search: "index=jenkins $" + tabId + "_host_filter$ $" + tabId + "_job_filter$ $" + tabId + "_build_filter$ " +
                "| `expand_testcase` | eval result=if(isnotnull(errordetails), \"Failed\", if(skipped==\"true\", \"Skipped\", \"Passed\")) " +
                "| search $" + tabId + "_custom_filter$ | eval duration=round(duration, 2) " +
                "| table testname classname duration result failedsince host job_name build_number",
                latest_time: latest_time_token,
                earliest_time: earliest_time_token,
                status_buckets: 0
            }, {tokens: true});

            var testcaseResult = testcaseSearch.data('results');
            testcaseResult.on('data', function() {
                if(testcaseResult.hasData()){
                    $("#" + tabId + "-tab .test-results-description").show();
                }
            });

            new PostProcessManager({
                id: tabId + "-testcase-search-2",
                managerid: tabId + "-testcase-search",
                search: "sort result | eval result=result + \",\" + failedsince | rename testname as \"Test Name\" classname as \"Class Name\" duration as \"Duration (sec)\" result as \"Failing since build\""
            });

            var testcaseTable = new TableView({
                id: tabId + "-testcase-table",
                managerid: tabId + "-testcase-search-2",
                pageSize: "25",
                pagerPosition: "top",
                drilldown: "none",
                drilldownRedirect: false,
                el: $("#" + tabId + "-tab .testcase-table"),
            }).render();

            testcaseTable.addRowExpansionRenderer(new TestcaseAnalysisTableRowExpanderView({
                manager_id_prefix: tabId,
                expandInfo: {
                    entity: [
                        {field: "prior_result", label: "Prior 10 Results"},
                        {field: "skipped_message", label: "Skipped Message"},
                        {field: "error_details", label: "Error Detail"},
                        {field: "stacktrace", label: "Stacktrace"}
                    ]
                },
                latest_time:latest_time_token,
                earliest_time:earliest_time_token
            }));

            var TestcaseCellRender = TableView.BaseCellRenderer.extend({
                canRender: function (cell) {
                    return cell.field.startsWith('Failing');
                },

                render: function ($td, cell) {
                    var ICONS = {
                        Passed: 'fa fa-check-circle-o passed-case',
                        Failed: 'fa fa-times-circle-o failed-case',
                        Skipped: 'fa fa-pause-circle-o skipped-case'
                    };

                    var icon = '';
                    var result = cell.value.split(',')[0];
                    var failedsince = cell.value.split(',')[1];
                    var failedsince_str = '';
                    if (ICONS.hasOwnProperty(result)) {
                        icon = ICONS[result];
                        if (failedsince > 0) {
                            failedsince_str = ' #' + failedsince;
                        }
                    }

                    $td.addClass('icon').html(_.template('<i class="<%-icon%>" title="<%- result %>"></i><a class="failing-since-link new_test_result" host="' + hostInput.val() + '" job="' + jobInput.val() + '" build="<%- failedsince %>"><%- failedsince_str %></a>', {
                        icon: icon,
                        result: result,
                        failedsince: failedsince,
                        failedsince_str: failedsince_str
                    }));
                }
            });
            testcaseTable.table.addCellRenderer(new TestcaseCellRender());

            // Instantiate the results link view
            new ResultsLinkView({
                managerid: tabId + "-testcase-search-2"
            }).render().$el.appendTo($("#" + tabId + "-tab .testcase-table"));

            // Render defects tab
            var defectBasicSearch = new SearchManager({
                id: tabId + "-defects-search-base",
                search: "index=jenkins $" + tabId + "_host_filter$ $" + tabId + "_job_filter$ $" + tabId + "_build_filter$ | `expand_testcase` | eval result=if(isnotnull(errordetails), \"Failed\", if(skipped==\"true\", \"Skipped\", \"Passed\"))",
                latest_time: latest_time_token,
                earliest_time: earliest_time_token,
                status_buckets: 0
            }, {tokens: true});


            var defectSearch = new PostProcessManager({
                id: tabId + "-defects-search",
                managerid: tabId + "-defects-search-base",
                search: "stats count by errordetails | sort - count | rename errordetails as Error count as Count"
            });

            new PostProcessManager({
                id: tabId + "-defect-detail-search",
                managerid: tabId + "-defects-search-base",
                search: mvc.tokenSafe("search errordetails=\"$" + tabId + "_errordetails_filter$\" | eval duration=round(duration, 2) | table testname duration result | rename testname as \"Test Name\" duration as \"Duration\" result as \"Result\"")
            });

            var defectResult = defectSearch.data('results');
            defectResult.on('data', function() {
                if(defectResult.hasData()){
                    $("#" + tabId + "-tab .defects-tab-description").show();
                }
            });

            var defectsTableView = new TableView({
                id: tabId + "-defects-table",
                managerid: tabId + "-defects-search",
                pagerPosition: "top",
                pageSize: "20",
                el: $("#" + tabId + "-tab .test-defects-table"),
                wrap: true,
                drilldown: "row",
                drilldownRedirect: false
            }).render();

            defectsTableView.on("click:row", function (e) {
                var errorMsg = e['data']['row.Error'];
                var count = e['data']['row.Count'];
                defaultNamespace.set(tabId + '_errordetails_filter', Util.escapeSplunkSearch(errorMsg.length > 50 ? errorMsg.substring(0, 49) : errorMsg) + '*');
                if(errorMsg.length > 50) {
                    errorMsg = errorMsg.substring(0, 49) + "...";
                }
                $("#" + tabId + "-tab .tests-defect-title").text('* Failing test cases by: ' + errorMsg + ' (' + count + ').');
            });

            // Instantiate the results link view
            new ResultsLinkView({
                managerid: tabId + "-defects-search"
            }).render().$el.appendTo($("#" + tabId + "-tab .test-defects-table"));

            new TableView({
                id: tabId + "-defect-detail-table",
                managerid: tabId + "-defect-detail-search",
                pagerPosition: "top",
                pageSize: "20",
                el: $("#" + tabId + "-tab .test-defect-detail-table"),
                wrap: true,
                drilldown: "none",
                drilldownRedirect: false,
            }).render();

            // Instantiate the results link view
            new ResultsLinkView({
                managerid: tabId + "-defect-detail-search"
            }).render().$el.appendTo($("#" + tabId + "-tab .test-defect-detail-table"));


            //render test trends tab
            new SearchManager({
                id: tabId + '-test-trends-search',
                preview: false,
                cache: false,
                earliest_time:"$"+tabId+"_timetrend.earliest_time$",
                latest_time:"$"+tabId+"_timetrend.latest_time$",
                status_buckets: 0,
                search: "index=jenkins_statistics $" + tabId + "_host_filter$ $" + tabId + "_job_filter$ $" + tabId + "_build_filter$  | fields host job_name build_number test_summary.*"
            },{tokens: true});

            new BuildTestsView({
                managerid: tabId + '-test-trends-search',
                el: $("#" + tabId + "-tab .test-trends-info"),
                tabId: tabId
            }).render();

            this.createTooltip();

            this.showTab(tabId);

            if (params) {
                if (params.hasOwnProperty('host')) {
                    mvc.Components.get(this.currTabId + "-host-dropdown").val(params['host']);
                }
                if (params.hasOwnProperty('job')) {
                    mvc.Components.get(this.currTabId + "-job-dropdown").val(params['job']);
                }
                if (params.hasOwnProperty('build')) {
                    mvc.Components.get(this.currTabId + "-build-dropdown").val(params['build']);
                }
                if (params.hasOwnProperty('custom')) {
                    mvc.Components.get(this.currTabId + "-custom-textinput").val(params['custom']);
                }
            }
        },

        createTooltip: function() {
            $('.quick-filter-tooltip').tooltip({
                container: "body",
                placement: "right",
                html: true,
                title: "<div style=\"text-align:left;\">Filter test cases by query, for example:<ul><li>duration>10</li><li>classname=sample_class testname=test*</li><li>result=Passed OR result=Failed OR result=Skipped</li><li>errordetails=*IOException*</li></ul></div>"
            });

            $('.clipboard-btn').tooltip({
                trigger: 'manual',
                placement: 'bottom',
                container: 'body'
            });

            $('.clipboard-btn').mouseleave(function() {
                $(this).tooltip('hide');
            });
        },

        showTab: function(tabId) {
            $('.nav-tabs li').removeClass('active');
            $('#' + tabId + '-li').addClass('active');
            $('.tab-content div.tab-pane').removeClass('active');
            $('#' + tabId + '-tab').addClass('active');
        },

        deleteTab: function(tabId) {
            $('#' + tabId + '-li').remove();
            $('#' + tabId + '-tab').remove();

            var tabIndex = this.tabIds.indexOf(tabId);
            this.tabIds.splice(tabIndex, 1);
            if (tabIndex >= this.tabIds.length) {
                tabIndex = this.tabIds.length - 1;
            }
            this.currTabId = this.tabIds[tabIndex];
            this.showTab(this.currTabId);
        },

        generateTabUrl: function(tabId) {
            var host = mvc.Components.get(tabId + "-host-dropdown").val();
            var job = mvc.Components.get(tabId + "-job-dropdown").val();
            var build = mvc.Components.get(tabId + "-build-dropdown").val();
            var custom = mvc.Components.get(tabId + "-custom-textinput").val();

            var url_param = '';
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

            if (custom) {
                url_param += url_param == '' ? '?' : '&';
                url_param += 'custom=' + encodeURIComponent(custom);
            }

            return this.baseUrl + url_param;
        }
    });
});
