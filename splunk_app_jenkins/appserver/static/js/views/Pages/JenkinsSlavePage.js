/*global define*/
define([
    'jquery',
    'underscore',
    'backbone',
    'clipboard',
    'contrib/text!app/templates/JenkinsSlaveTemplate.html',
    'contrib/text!app/templates/JenkinsSlaveDetailTemplate.html',
    'splunkjs/mvc',
    'splunkjs/mvc/searchmanager',
    'splunkjs/mvc/postprocessmanager',
    'splunkjs/mvc/dropdownview',
    'splunkjs/mvc/multidropdownview',
    'splunkjs/mvc/singleview',
    'splunkjs/mvc/tableview',
    'splunkjs/mvc/textinputview',
    'splunkjs/mvc/chartview',
    'splunkjs/mvc/timerangeview',
    'splunkjs/mvc/searchbarview',
    'splunkjs/mvc/resultslinkview',
    'app/lib/calendarheatmap/calendarheatmap',
    'app/util/app_info',
    'app/routers/AppRouter',
    'util/router_utils',
    'app/util/util'
], function (
    $,
    _,
    Backbone,
    Clipboard,
    JenkinsSlaveTemplate,
    JenkinsSlaveDetailTemplate,
    mvc,
    SearchManager,
    PostProcessManager,
    DropdownView,
    MultiDropdownView,
    SingleView,
    TableView,
    TextInputView,
    ChartView,
    TimeRangeView,
    SearchBarView,
    ResultsLinkView,
    CalendarHeatmap,
    AppInfo,
    AppRouter,
    Router_utils,
    Util
) {

    return Backbone.View.extend({
        router: null,
        tabs: [],

        events: {
            'click a.jenkins-slaves-tab': 'clickSlavesTab',
            'dblclick a.jenkins-slaves-tab': 'dblclickSlavesTab',
            'click a.slave-info-tab': 'clickSlaveInfoTab'
        },

        clickSlavesTab: function(event) {
            event.preventDefault();
            var tabId = $(event.currentTarget).attr('tabid');
            var tabIndex = this.getTabIndexById(tabId);
            this.showTab(tabIndex);
        },

        dblclickSlavesTab: function(event) {
            event.preventDefault();
            var tabId = $(event.currentTarget).attr('tabid');
            var tabIndex = this.getTabIndexById(tabId);
            this.deleteTab(tabIndex);
            Util.unselectText();
        },

        clickSlaveInfoTab: function(event) {
            event.preventDefault();
            var tabId = $(event.currentTarget).attr('tabId');
            var tabIndex = this.getTabIndexById(tabId);
            var content = $(event.currentTarget).attr('content');
            this.showTab(tabIndex, content);
        },

        initialize: function () {
            var that = this;
            this.$el.html(_.template(JenkinsSlaveTemplate));

            this.initRouter();

            var clipboard = new Clipboard('.clipboard-btn', {
                text: function(trigger) {
                    var tabId = $(trigger).attr('slave-tab-id');
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

            //
            new SearchManager({
                id: 'jenkins-master-search',
                search: '|`jenkins_host_list`',
                earliest_time: "-7d"
            });

            var hostFilter = new MultiDropdownView({
                id: 'jenkins-master-select',
                managerid: 'jenkins-master-search',
                labelField: 'host',
                valueField: 'host',
                el: $('#jenkins-master-filter'),
                width: 500
            }).render();

            $('.master-filter-tooltip').tooltip({
                container: 'body',
                placement: 'right',
                html: true,
                title: 'Select one or multiple Jenkins masters. Jenkins slaves of these masters will display. All Jenkins masters are selected when this input is blank.'
            });

            // Filters
            var nodeFilter = new TextInputView({
                el: $("#jenkins-slave-filter"),
            }).render();

            $('.slave-filter-tooltip').tooltip({
                container: 'body',
                placement: 'right',
                html: true,
                title: 'Enter search string to filter Jenkins slaves by their name. Wildcard * is added before and after the search string automatically.'
            });

            //
            var labelFilter = new TextInputView({
                el: $("#jenkins-slave-label-filter")
            }).render();

            $('.slave-label-filter-tooltip').tooltip({
                container: 'body',
                placement: 'right',
                html: true,
                title: 'Enter search string to filter Jenkins slaves by their label. Wildcard * is added before and after the search string automatically.'
            });

            //
            new SearchManager({
                id: 'jenkins-slaves-table-search',
                earliest_time: "-1h",
                search: mvc.tokenSafe('index="jenkins_statistics" $host_filter$ $node_filter$ $label_filter$ event_tag="slave"' +
                    '|dedup host node_name sortby -_time ' +
                    '|search status="updated" AND num_executors>0 ' +
                    '|rex field=SwapSpaceMonitor ".*?Memory:(?\<Memory\>[^\\s]+)" |rex field=SwapSpaceMonitor ".*?Swap:(?\<Swap\>[^\\s]+)"' +
                    '|eval OnlineTime = strftime(strptime(connect_time,"%Y-%m-%dT%H:%M:%SZ"),"%c")' +
                    '|rename node_name as "Jenkins Slave",is_online as Online, num_executors as Executors, ArchitectureMonitor as Architecture ClockMonitor as Clock ResponseTimeMonitor as ResponseTime label as Label host as "Jenkins Master" url as "Slave URL"' +
                    '|eval Busy=if(is_idle=="false","true","false")|table "Jenkins Master" "Jenkins Slave" "Architecture" "Clock" "ResponseTime" "Swap" "Memory" Busy Online Executors Label "Slave URL"'),
                    });

            var slavesTable = new TableView({
                managerid: 'jenkins-slaves-table-search',
                pageSize: 15,
                pagerPosition: 'bottom',
                drilldown: 'row',
                drilldownRedirect: false,
                el: $('#slaves-view')
            }).render();

            Util.addJenkinsSlaveCustomIconRenderer(slavesTable);

            // Instantiate the results link view
            new ResultsLinkView({
                managerid: 'jenkins-slaves-table-search'
            }).render().$el.appendTo($('#slaves-view'));

            slavesTable.on("click:row", function (e) {
                var master = e.data['row.Jenkins Master'];
                var slave = e.data['row.Jenkins Slave'];
                for (var i = 0; i < that.tabs.length; ++i) {
                    if (that.tabs[i]['master'] == master && that.tabs[i]['slave'] == slave) {
                        that.showTab(i, that.tabs[i]['bookmark']);
                        return ;
                    }
                }
                that.createSlaveTab(master, slave);
            });

            var defaultNamespace = mvc.Components.getInstance("default");

            //Set filters
            defaultNamespace.set('host_filter', '');
            defaultNamespace.set('node_filter', '');
            defaultNamespace.set('label_filter', '');

            hostFilter.on('change', function() {
                var searchFilter;
                var hostList = hostFilter.val();
                if (typeof hostList == "undefined" || hostList.length == 0) {
                    searchFilter = '';
                } else {
                    searchFilter = 'host="' + hostList.join('" OR host="') + '"';
                }
                defaultNamespace.set('host_filter', searchFilter);
            });
            Util.useLocalCache(hostFilter)
            nodeFilter.on('change', function() {
                var searchFilter;
                var node = nodeFilter.val();
                if (typeof node == "undefined" || node.trim().length == 0) {
                    searchFilter = '';
                } else {
                    searchFilter = 'node_name="*' + node.trim() + '*"';
                }
                defaultNamespace.set('node_filter', searchFilter);
            });

            labelFilter.on('change', function() {
                var searchFilter;
                var label = labelFilter.val();
                if (typeof label == "undefined" || label.trim().length == 0) {
                    searchFilter = '';
                } else {
                    searchFilter = 'label="*' + label.trim() + '*"';
                }
                defaultNamespace.set('label_filter', searchFilter);
            });

            // build distribution view
            var distTypeSelector = new DropdownView({
                default: 'by-name',
                choices: [
                    {label: 'By Name', value: 'by-name'},
                    {label: 'By Label', value: 'by-label'}
                ],
                showClearButton: false,
                el: '.build-dist-group-filter'
            }).render();

            var distCountSelector = new DropdownView({
                default: '50',
                choices: [
                    {label: 'Top 20', value: '20'},
                    {label: 'Top 50', value: '50'}
                ],
                showClearButton: false,
                el: '.build-dist-bar-count-filter'
            }).render();

            var buildDistTimerange = new TimeRangeView({
                preset: "Today",
                el: $('.build-dist-on-slaves-timerange')
            }).render();

            var buildDistSearch = new SearchManager({
                id: 'build-dist-on-slaves-search',
                preview: true,
                cache: false,
                search: mvc.tokenSafe('index=jenkins_statistics event_tag=slave status="updated" $host_filter$ $node_filter$ $label_filter$ ' +
                    '| dedup host node_name sortby -_time | fields host node_name label | rename node_name as node | join type=left host node [search index=jenkins_statistics event_tag=job_event ' +
                    '| dedup host build_url sortby -_time  | stats count as ct by host node | fields host node ct] | eval ct=if(isnull(ct),0,ct) | stats sum(ct) as st by $category_type$ | sort - st | head $slave_number$ | table $category_type$ st | rename $category_type$ as "$category_type_label$" st as "Number of Builds"')
            });

            var buildDistChart = new ChartView({
                managerid: 'build-dist-on-slaves-search',
                type: 'bar',
                "charting.legend.placement": "top",
                "charting.axisLabelsY.integerUnits": true,
                drilldown: "none",
                drilldownRedirect: false,
                el: $('#builds-dist-view'),
                height: 1000
            }).render();

            // Instantiate the results link view
            new ResultsLinkView({
                managerid: 'build-dist-on-slaves-search'
            }).render().$el.appendTo($('#builds-dist-view'));

            defaultNamespace.set('category_type', 'node');
            defaultNamespace.set('category_type_label', 'Slave Name');
            defaultNamespace.set('slave_number', 50);

            distTypeSelector.on("change", function (e) {
                var type = distTypeSelector.val();

                if (type == 'by-label') {
                    defaultNamespace.set('category_type', 'label');
                    defaultNamespace.set('category_type_label', 'Slave Label');
                } else {
                    defaultNamespace.set('category_type', 'node');
                    defaultNamespace.set('category_type_label', 'Slave Name');
                }
            });

            distCountSelector.on("change", function (e) {
                var count = distCountSelector.val();
                defaultNamespace.set('slave_number', count);
                buildDistChart.settings.set('height', count * 20)
            });

            buildDistTimerange.on("change", function() {
                buildDistSearch.settings.set(buildDistTimerange.val());
            });


        },

        initRouter: function() {
            var that = this;
            this.router = new AppRouter({
                changeUrl: function (params) {
                    if (params.master && params.slave) {
                        that.createSlaveTab(params.master, params.slave, params.bookmark);
                    }
                }
            });
            
            // Backbone.History.started is a boolean value indicating whether it has already been called.
            // 6.3.9 throws: Uncaught Error: Backbone.history has already been started
			if (!Backbone.History.started) {
				Router_utils.start_backbone_history();
			}
            this.baseUrl = Util.getAbsoluteUrl('jenkins_slave');
        },

        createSlaveTab: function(master, slave, bookmark) {
            var tabId = _.uniqueId('slave');
            var tabIndex = this.tabs.length;
            this.tabs[tabIndex] = {
                tabId: tabId,
                master: master,
                slave: slave,
                bookmark: bookmark === undefined ? 'builds' : bookmark,
                buildHistoryRendered: false
            };

            var tab_title_template = '<li id="<%= token%>-li" <% if (active) { %> class="active" <% } %>><a class="jenkins-slaves-tab" tabId="<%= token%>"><%= title%></a></li>';
            var tab_content_template = JenkinsSlaveDetailTemplate;

            $('.nav-tabs').append(_.template(tab_title_template, {token: tabId, title: slave, active: true}));
            $('.tab-content').append(_.template(tab_content_template, {token: tabId, master: master, slave: slave, active: true}));

            this.showTab(tabIndex, this.tabs[tabIndex]['bookmark']);
        },

        showTab: function(tabIndex, content) {
            $('.nav-tabs li').removeClass('active');
            $('.tab-content div.tab-pane').removeClass('active');
            if (tabIndex == -1) {
                $('#slaves-li').addClass('active');
                $('#slaves-tab').addClass('active');
            } else {
                var tabId = this.tabs[tabIndex]['tabId'];
                $('#' + tabId + '-li').addClass('active');
                $('#' + tabId + '-tab').addClass('active');
                this.tabs[tabIndex]['bookmark'] = content;
                if (content == 'builds') {
                    this.renderBuildHistory(tabIndex);
                } else if (content == 'connection') {
                    this.renderConnectionHistory(tabIndex);
                } else if (content == 'log') {
                    this.renderSlaveLog(tabIndex);
                }
            }
        },

        deleteTab: function(tabIndex) {
            if (tabIndex != -1) {
                var tabId = this.tabs[tabIndex]['tabId'];
                $('#' + tabId + '-li').remove();
                $('#' + tabId + '-tab').remove();
                this.tabs.splice(tabIndex, 1);
                if (tabIndex >= this.tabs.length) {
                    tabIndex = this.tabs.length - 1;
                }
                this.showTab(tabIndex, tabIndex == -1 ? undefined : this.tabs[tabIndex]['bookmark']);
            }
        },

        initSlaveTabRender: function(tabIndex) {
            var tabId = this.tabs[tabIndex]['tabId'];
            var content = this.tabs[tabIndex]['bookmark'];
            $('#' + tabId + '-tab h2').removeClass('active');
            $('#' + tabId + '-tab #sidebar-' + content).addClass('active');
            $('#' + tabId + '-tab .panel-content').removeClass('active');
            $('#' + tabId + '-' + content + '-content').addClass('active');
        },

        renderBuildHistory: function(tabIndex) {
            this.initSlaveTabRender(tabIndex);

            if (this.tabs[tabIndex]['buildHistoryRendered']) {
                return ;
            }
            this.tabs[tabIndex]['buildHistoryRendered'] = true;

            var tabId = this.tabs[tabIndex]['tabId'];
            var master = this.tabs[tabIndex]['master'];
            var slave = this.tabs[tabIndex]['slave'];

            var timerange = new TimeRangeView({
                id: tabId + "slave-build-history-timerange",
                preset: "Last 24 hours",
                el: $('#' + tabId + '-builds-content .slave-build-history-timerange')
            }).render();

            var slaveBuildHistorySearch = new SearchManager({
                id: tabId + '-build-history-search',
                preview: false,
                cache: false,
                earliest_time: "-24h@h",
                latest_time: "now",
                search: 'index=jenkins_statistics host="' + master + '" event_tag=job_event node="' + slave + '" ' +
                '| dedup build_url sortby -_time ' +
                ' `utc_to_local_time(job_started_at)` ' +
                '| convert timeformat="%Y-%m-%d %H:%M:%S" mktime(job_started_at) as epocTime ' +
                '| eval job_duration = if(isnull(job_duration), now() - epocTime, job_duration)' +
                '| eval Duration = tostring(job_duration,"duration") ' +
                '| eval job_result=if(type="started", "INPROGRESS", job_result) | fields *'
            });

            timerange.on("change", function() {
                slaveBuildHistorySearch.settings.set(timerange.val());
            });

            new PostProcessManager({
                id: tabId + '-build-history-chart-search',
                managerid: tabId + '-build-history-search',
                search: ' | timechart count by job_result'
            });

            new ChartView({
                managerid: tabId + '-build-history-chart-search',
                type: 'column',
                "charting.fieldColors": "{SUCCESS: 0xa2cc3e," +
                "UNSTABLE: 0xd99f0d, " +
                "FAILURE: 0xd6563c," +
                "INPROGRESS:0xf2b827," +
                "NOT_BUILT:0xad6704," +
                "ABORTED: 0x1e93c6}",
                "charting.chart.stackMode": "stacked",
                "charting.axisTitleX.visibility" : "collapsed",
                "charting.chart.columnSpacing": 27,
                "charting.legend.placement": "top",
                el: $('#' + tabId + '-builds-content .slave-build-history-chart')
            }).render();

            // Instantiate the results link view
            new ResultsLinkView({
                managerid: tabId + '-build-history-chart-search'
            }).render().$el.appendTo($('#' + tabId + '-builds-content .slave-build-history-chart'));

            new PostProcessManager({
                id: tabId + '-build-history-table-search',
                managerid: tabId + '-build-history-search',
                search: '|sort -job_started_at| table job_name build_number job_started_at Duration job_result | rename job_name as Job build_number as Build job_started_at as "Start Time" job_result as Status'
            });

            var buildHistoryTableView = new TableView({
                managerid: tabId + '-build-history-table-search',
                drilldown: 'row',
                drilldownRedirect: false,
                el: $('#' + tabId + '-builds-content .slave-build-history-table'),
                pageSize: 10,
                pagerPosition: "bottom"
            });

            // Instantiate the results link view
            new ResultsLinkView({
                managerid: tabId + '-build-history-table-search'
            }).render().$el.appendTo($('#' + tabId + '-builds-content .slave-build-history-table'));

            buildHistoryTableView.on("click:row", function (e) {
                var url = AppInfo.get_app_url_prefix() + '/build_analysis?type=build&host=' + encodeURIComponent(master) + '&job=' + encodeURIComponent(e.data['row.Job']) + '&build=' + encodeURIComponent(e.data['row.Build']);
                window.open(url, '_blank');
            });

            Util.addColumnRender(buildHistoryTableView, "Status");

        },

        renderConnectionHistory: function(tabIndex) {
            var that = this;
            this.initSlaveTabRender(tabIndex);

            if (this.tabs[tabIndex]['slaveConnectionRendered']) {
                return ;
            }
            this.tabs[tabIndex]['slaveConnectionRendered'] = true;
            var tabId = this.tabs[tabIndex]['tabId'];
            var master = this.tabs[tabIndex]['master'];
            var slave = this.tabs[tabIndex]['slave'];

            var slaveConnectionTimerange = new TimeRangeView({
                id: tabId + "slave-build-connection-timerange",
                managerid : tabId + "-slave-connection-search",
                preset: "Last 24 hours",
                el: $('#' + tabId + '-connection-content .slave-build-connection-timerange')
            }).render();

            var slaveConnetcionManager = new SearchManager({
                id : tabId + "-slave-connection-search",
                earliest_time: "-24h@h",
                latest_time: "now",
                search: 'index=jenkins_statistics host="' + master + '" node_name="' + slave +  '" event_tag="slave" event_src="monitor"' +
                '|eval connecting=if(is_online="true",1,0) | timechart span=1h min(connecting) as connecting|fillnull '
            });

            slaveConnectionTimerange.on("change", function() {
                slaveConnetcionManager.settings.set(slaveConnectionTimerange.val());

            });

            new CalendarHeatmap({
                id : tabId + "-slave-connection-heatmap",
                managerid:  tabId + "-slave-connection-search",
                domain:  "day",
                subDomain: "x_hour",
                // width: 700,
                tabId: tabId,
                master: master,
                slave: slave,
                el: $('#' + tabId + '-connection-content .slave-build-connection-map')
            }).render();
            // slaveOfflineReasonSearch.data('results').on('data', function() {
            //     that.addCustomIconRenderer(slaveOfflineReasonTable);
            // });
        },

        renderSlaveLog: function(tabIndex) {
            this.initSlaveTabRender(tabIndex);

            if (this.tabs[tabIndex]['slaveLogRendered']) {
                return ;
            }
            this.tabs[tabIndex]['slaveLogRendered'] = true;

            var tabId = this.tabs[tabIndex]['tabId'];
            var master = this.tabs[tabIndex]['master'];
            var slave = this.tabs[tabIndex]['slave'];


            var searchPrefixForSlaveNode = 'index="jenkins_console" host="'+ master + '" source="computer/' + encodeURIComponent(slave) + '/log" ';
            var searchSuffixForSlaveNode = '|sort -_time |table _time _raw | rename _raw as Message';

            var searchPrefixForMasterNode = 'index="jenkins_console" host="'+ master + '" level=* source ="logger://*" ';
            var searchSuffixForMasterNode = '|sort -_time |eval Message=log_source+", ".message | rename level as LogLevel | table _time,LogLevel,Message';

            var searchPrefix = searchPrefixForSlaveNode;
            var searchSuffix = searchSuffixForSlaveNode;

            var regex=/master/;
            if (regex.exec(slave)){
                searchPrefix = searchPrefixForMasterNode;
                searchSuffix = searchSuffixForMasterNode;
            }

            var slaveLogManager = new SearchManager({
                id: tabId + '-slave-logs-search',
                earliest_time: "-7d",
                preview: false,
                cache: false,
                search: searchPrefix + searchSuffix,
                refresh: 120
            });

            var slaveLogSearchbar = new SearchBarView({
                id : tabId + "-slave-logs-searchbar",
                managerid: tabId + '-slave-logs-search',
                timerange_earliest_time: '-7d',
                default: '*',
                el: $('#' + tabId + '-log-content .slave-build-log-searchbar')
            }).render();

            new TableView({
                id :  tabId + "-slave-logs-table",
                managerid: tabId + '-slave-logs-search',
                pageSize: 20,
                pagerPosition: 'bottom',
                drilldown: 'none',
                el: $('#' + tabId + '-log-content .slave-build-log-table')
            }).render();

            // Instantiate the results link view
            new ResultsLinkView({
                managerid: tabId + '-slave-logs-search'
            }).render().$el.appendTo($('#' + tabId + '-log-content .slave-build-log-table'));

            slaveLogSearchbar.on("change", function() {
                slaveLogManager.set("search", searchPrefix + slaveLogSearchbar.val() + searchSuffix);
            });

            slaveLogSearchbar.timerange.on("change", function() {
                slaveLogManager.search.set(slaveLogSearchbar.timerange.val());
            });

        },

        getTabIndexById: function(tabId) {
            for (var i = 0; i < this.tabs.length; ++i) {
                if (this.tabs[i]['tabId'] == tabId) {
                    return i;
                }
            }
            return -1;
        },

        generateTabUrl: function(tabId) {
            var tabIndex = this.getTabIndexById(tabId);
            var tabId = this.tabs[tabIndex]['tabId'];
            var master = this.tabs[tabIndex]['master'];
            var slave = this.tabs[tabIndex]['slave'];
            var bookmark = this.tabs[tabIndex]['bookmark'];
            //
            var url_param = '';

            if (master) {
                url_param += url_param == '' ? '?' : '&';
                url_param += 'master=' + encodeURIComponent(master);
            }

            if (slave) {
                url_param += url_param == '' ? '?' : '&';
                url_param += 'slave=' + encodeURIComponent(slave);
            }

            if (bookmark) {
                url_param += url_param == '' ? '?' : '&';
                url_param += 'bookmark=' + encodeURIComponent(bookmark);
            }

            return this.baseUrl + url_param;
        },
    });
});
