define([
    'jquery',
    'underscore',
    'backbone',
    'contrib/text!app/templates/BuildTestsTemplate.html',
    'splunkjs/mvc',
    'splunkjs/mvc/simplesplunkview',
    'splunkjs/mvc/searchmanager',
    'splunkjs/mvc/searchbarview',
    'splunkjs/mvc/chartview',
    'splunkjs/mvc/tableview',
    'splunkjs/mvc/dropdownview',
    'splunkjs/mvc/resultslinkview',
    'app/views/Component/LogsFilterDialog',
    'app/config/BuildDetailCfg'
], function (
    $,
    _,
    Backbone,
    BuildTestsTemplate,
    mvc,
    SimpleSplunkView,
    SearchManager,
    SearchBarView,
    ChartView,
    TableView,
    DropdownView,
    ResultsLinkView,
    LogsFilterDialog,
    BuildDetailCfg
) {
    return SimpleSplunkView.extend({
        className: 'build-log-view',
        output_mode: 'json',

        createView: function() {
            var tabInfo = this.options.tabInfo;
            var tabId = tabInfo['tabId'];
            var host = tabInfo['host'];
            var job = tabInfo['job'];
            var build_url = tabInfo["build_url"];

            new SearchBarView({
                id: '#' + tabId + "-logs-filter",
                timepicker: false,
                timerange_latest_time: mvc.tokenSafe("$latest_time$"),
                timerange_earliest_time: mvc.tokenSafe("$earliest_time$"),
                default: '*',
                el: $('#' + tabId + '-logs-searchbar')
            }).render();

            new TableView({
                id : '#' + tabId + "-logs-table",
                managerid: tabId + '-logs-search',
                pageSize: 20,
                pagerPosition: 'bottom',
                el: $('#' + tabId + '-logs-events'),
                drilldown: 'none'
            }).render();

            // Instantiate the results link view
            new ResultsLinkView({
                managerid: tabId + '-logs-search'
            }).render().$el.appendTo($('#' + tabId + '-logs-events'));

            new SearchManager({
                id: tabId + '-logs-artifact-list-search',
                preview: false,
                cache: false,
                search: 'index=jenkins_artifact host="' + host + '" source="' + build_url + '*"' +
                '| dedup source ' +
                '| eval build_url = "' + build_url + '"' +
                '| eval source = mvindex(split(source,build_url),1) | table source',
                latest_time: mvc.tokenSafe("$latest_time$"),
                earliest_time: mvc.tokenSafe("$earliest_time$")
            });

            this.dlg = new LogsFilterDialog({
                id: '#' + tabId + "-logs-filter-dlg",
                el: $('#' + tabId + '-tab .dialog-placeholder'),
                managerid: tabId + '-logs-artifact-list-search',
                updateLogs: function(logVal) {
                    var logsBaseSearch = "";
                    var logsFilteredSearch = "reverse|rename _raw as Event|table _time, Event";

                    if (logVal != BuildDetailCfg.buildLog.title){
                        logsBaseSearch = 'index=jenkins_artifact host="' + host + '" source="' + build_url + logVal + '"';
                        $('#' + tabId + '-panel-content-title').text("Build Artifacts of " + logVal);

                    }else {
                        logsBaseSearch = 'index=jenkins_console host="' + host + '" source="' + build_url + 'console"';
                        $('#' + tabId + '-panel-content-title').text(BuildDetailCfg.buildLog.title);
                    }

                    var logFilterSearchManager = mvc.Components.getInstance(tabId + '-logs-search');
                    var logFilter = mvc.Components.getInstance('#' + tabId + "-logs-filter");

                    logFilter.settings.set("value","*");
                    logFilterSearchManager.settings.unset('search');
                    logFilterSearchManager.settings.set('search', logsBaseSearch + ' | ' + logsFilteredSearch);
                }
            });

            mvc.Components.set('#' + tabId + "-logs-filter-dlg",this.dlg);
            this.dlg.render();

            return true;
        },

        formatData: function(data) {
            return data[0];
        },

        updateView: function(viz, data) {

            var tabInfo = this.options.tabInfo;
            var tabId = tabInfo['tabId'];
            var host = tabInfo['host'];
            var build_url = tabInfo["build_url"];

            var logFilterSearchManager = mvc.Components.getInstance(tabId + '-logs-search');
            var logFilter = mvc.Components.getInstance('#' + tabId + "-logs-filter");
            var logFilterDlg = mvc.Components.getInstance('#' + tabId + "-logs-filter-dlg");
            var dlg = this.dlg;

            logFilter.on('change', function () {
                var logsBaseSearch = "";

                if (logFilterDlg.dropdown.val() == BuildDetailCfg.buildLog.title) {
                    logsBaseSearch = 'index=jenkins_console host="'
                        + host + '" source="'
                        + build_url + 'console"';
                }
                else {
                    logsBaseSearch = 'index=jenkins_artifact host="'
                        + host + '" source="'
                        + build_url
                        + mvc.Components.getInstance('#' + tabId + "-logs-filter-dlg").dropdown.val() + '"';
                }

                var spl = logFilter.val().trim();
                if (!spl) {
                    spl = '*';
                }
                if (!spl.startsWith('search')) {
                    spl = 'search ' + spl;
                }

                spl += "| reverse| rename _raw as Event| table _time, Event";
                var logsFilteredSearch = spl;

                logFilterSearchManager.settings.unset('search');
                logFilterSearchManager.settings.set('search', logsBaseSearch + ' | ' + logsFilteredSearch);
            });

            logFilter.timerange.on('change', function () {
                logFilterSearchManager.set(logFilter.timerange.val());
            });

            $('#' + tabId + '-logs-filter').on('click', function () {
                dlg.modal();
            });
        },

        displayMessage: function(info) {
            return this;
        }
    });
});
