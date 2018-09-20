/*global define*/
define([
    'jquery',
    'underscore',
    'backbone',
    'bootbox',
    'contrib/text!app/templates/ConfigurationTemplate.html',
    'splunkjs/mvc',
    'splunkjs/mvc/utils',
    'splunkjs/mvc/searchmanager',
    'splunkjs/mvc/timerangeview',
    'splunkjs/mvc/tableview',
    'splunkjs/mvc/textinputview',
    'splunkjs/mvc/checkboxview',
    'splunkjs/mvc/checkboxgroupview',
    'splunkjs/mvc/chartview',
    'splunkjs/mvc/resultslinkview',
    'app/util/app_info',
    'app/util/util'
], function (
    $,
    _,
    Backbone,
    bootbox,
    ConfigurationTemplate,
    mvc,
    mvc_utils,
    SearchManager,
    TimeRangeView,
    TableView,
    TextInputView,
    CheckboxView,
    CheckboxGroupView,
    ChartView,
    ResultsLinkView,
    AppInfo,
    Util
) {
    return Backbone.View.extend({
        user_panels_search: null,

        events: {
            "click a.delete-panel": "deleteUserPanel",
            "click a.edit-panel": "editUserPanel"
        },

        deleteUserPanel: function(event) {
            var tokens = mvc.Components.get("default");
            var keyID = $(event.currentTarget).attr('key');
            var service = mvc.createService({ owner: "nobody" });

            service.get(
                "storage/collections/data/userpanel/" + keyID,
                null,
                function(err, response) {
                    var panel_name = response['data']['name'] || '';
                    bootbox.confirm('Delete the custom panel ' + panel_name + '?', function(result) {
                        if (result) {
                            tokens.set("key_id", "");
                            $('#add-custom-panel-button').text('Add Panel');
                            $('#cancel-custom-panel-button').attr('disabled', 'disabled');

                            service.del(
                                "storage/collections/data/userpanel/" + keyID,
                                null,
                                function(err, response) {
                                    user_panels_search.startSearch();
                                }
                            );
                        }
                    });
                }
            );

        },

        editUserPanel: function(event) {
            var tokens = mvc.Components.get("default");
            var keyID = $(event.currentTarget).attr('key');
            var service = mvc.createService({ owner: "nobody" });

            service.get(
                "storage/collections/data/userpanel/" + keyID,
                null,
                function(err, response) {
                    tokens.set("key_id",        response['data']['_key']);
                    tokens.set("panel_name",    response['data']['name']);
                    tokens.set("latest_time",   response['data']['time_latest']);
                    tokens.set("earliest_time", response['data']['time_earliest']);
                    tokens.set("job_filter",  response['data']['job_filter']);
                    var charts = [];
                    if (response['data']['build_status_chart']) {
                        charts.push('build-status');
                    }
                    if (response['data']['build_trends_chart']) {
                        charts.push('build-trends');
                    }
                    if (response['data']['test_trends_chart']) {
                        charts.push('test-trends');
                    }
                    tokens.set("chart_option",      charts);
                    tokens.set("custom_spl",        response['data']['custom_spl']);
                    tokens.set("refresh_frequency", response['data']['refresh_frequency']);
                }
            );

            $('#add-custom-panel-button').text('Update');
            $('#cancel-custom-panel-button').removeAttr('disabled');

        },

        initialize: function () {
            var that = this;
            var tokens = mvc.Components.get("default");
            tokens.set({"earliest_time":"@d"})
            this.$el.append(_.template(ConfigurationTemplate));

            new TextInputView({
                value: mvc.tokenSafe("$panel_name$"),
                el: $("#input-name")
            }).render();

            new TextInputView({
                value: mvc.tokenSafe("$job_filter$"),
                default: "",
                el: $("#input-job-filter")
            }).render();

            new CheckboxGroupView({
                value: mvc.tokenSafe("$chart_option$"),
                choices: [{label: "Build Status", value: "build-status"},
                          {label: "Build Trends", value: "build-trends"},
                          {label: "Test Trends",  value: "test-trends"}],
                default: ['build-status', 'build-trends', 'test-trends'],
                el: $("#input-chart-option")
            }).render();

            new TextInputView({
                value: mvc.tokenSafe("$custom_spl$"),
                el: $("#input-custom-spl")
            }).render();

            new TextInputView({
                value: mvc.tokenSafe("$refresh_frequency$"),
                el: $("#input-refresh-frequency")
            }).render();

            var timerange = new TimeRangeView({
                preset: "Today",
                earliest_time: mvc.tokenSafe("$earliest_time$"),
                latest_time: mvc.tokenSafe("$latest_time$"),
                el: $("#input-timerange")
            }).render();

            var job_search = new SearchManager({
                id: 'matched-jobs-search',
                search: mvc.tokenSafe('index=jenkins_statistics  event_tag="job_event" $job_filter$ | dedup host job_name | table host job_name | rename host as Master job_name as Job')
            });

            new TableView({
                managerid: 'matched-jobs-search',
                drilldown: 'none',
                el: $('#matched-jobs-table')
            }).render();

            // Instantiate the results link view
            new ResultsLinkView({
                managerid: 'matched-jobs-search',
            }).render().$el.appendTo($('#matched-jobs-table'));

            user_panels_search = new SearchManager({
                id: "user-panels-search",
                "search": " | inputlookup userpanel_lookup | eval  KeyID = _key | eval time_range=time_earliest + \":\" + time_latest | table KeyID, name, job_filter, time_range, build_status_chart, build_trends_chart, test_trends_chart, custom_spl refresh_frequency | rename KeyID as \"Action\" name as \"Panel Name\" job_filter as \"Job Filter\" time_range as \"Time Range\" build_status_chart as \"Build Status\" build_trends_chart as \"Build Trends\" test_trends_chart as \"Test Trends\" custom_spl as \"Custom SPL\" refresh_frequency as \"Refresh Frequency\""
            });

            // Use the BaseCellRenderer class to create a custom table cell renderer
            var UserPanelTableRender = TableView.BaseCellRenderer.extend({
                canRender: function(cellData) {
                    // This method returns "true" for the "range" field
                    return cellData.field === "Action" || cellData.field === "Build Status" || cellData.field === "Build Trends" || cellData.field === "Test Trends";
                },

                // This render function only works when canRender returns "true"
                render: function($td, cellData) {
                    if (cellData.field === "Action") {
                        var keyID = cellData.value;

                        $td.html('<a class="edit-panel" key="' + keyID + '"><i class="fa fa-pencil" aria-hidden="true"></i></a> <a class="delete-panel" key="' + keyID + '"><i class="fa fa-trash" aria-hidden="true"></i></a>');
                    } else {
                        if (cellData.value > 0) {
                            $td.html('<i class="fa fa-check" aria-hidden="true"></i>');
                        }
                    }
                }
            });


            var user_panel_table = new TableView({
                managerid: "user-panels-search",
                drilldown: "none",
                el: $("#user-panel-table")
            });
            user_panel_table.addCellRenderer(new UserPanelTableRender());
            user_panel_table.render();

            // Instantiate the results link view
            new ResultsLinkView({
                managerid: "user-panels-search",
            }).render().$el.appendTo($("#user-panel-table"));

            var service = mvc.createService({ owner: "nobody" });

            // Update the search manager when the time range changes
            timerange.on("change", function() {
                job_search.settings.set(timerange.val());
            });

            $('#add-custom-panel-button').click(function() {
                var keyID = tokens.get("key_id") || "";

                if ($.trim(tokens.get("panel_name")).length == 0) {
                    bootbox.alert('Please enter Panel Name');
                } else {
                    // Create a dictionary to store the field names and values
                    var record = {
                        "name": tokens.get("panel_name"),
                        "job_filter": tokens.get("job_filter"),
                        "time_earliest": tokens.get("earliest_time"),
                        "time_latest": tokens.get("latest_time"),
                        "build_status_chart": tokens.get("chart_option").indexOf('build-status') >= 0,
                        "build_trends_chart": tokens.get("chart_option").indexOf('build-trends') >= 0,
                        "test_trends_chart": tokens.get("chart_option").indexOf('test-trends') >= 0,
                        "custom_spl": $.trim(tokens.get("custom_spl")),
                        "refresh_frequency": tokens.get("refresh_frequency")
                    };

                    // Use the request method to send a REST POST request to the storage/collections/data/{collection}/ endpoint
                    service.request(
                        "storage/collections/data/userpanel/" + keyID,
                        "POST",
                        null,
                        null,
                        JSON.stringify(record),
                        {"Content-Type": "application/json"},
                        null);

                    user_panels_search.startSearch();

                    that.initInputTokens();
                    $('#add-custom-panel-button').text('Add Panel');
                    $('#cancel-custom-panel-button').attr('disabled', 'disabled');
                }
            });

            $('#cancel-custom-panel-button').click(function() {
                that.initInputTokens();
                $('#add-custom-panel-button').text('Add Panel');
                $('#cancel-custom-panel-button').attr('disabled', 'disabled');
            });

            this.initInputTokens();
            this.createTooltip();
        },

        initInputTokens: function() {
            var tokens = mvc.Components.get("default");

            tokens.set("key_id", "");
            tokens.set("panel_name", "");
            tokens.set("job_filter", "");
            tokens.set("earliest_time", "@d");
            tokens.set("latest_time", "now");
            tokens.set("chart_option", ["build-status", "build-trends", "test-trends"]);
            tokens.set("custom_spl", "");
            tokens.set("refresh_frequency", 5);
        },

        createTooltip: function() {
            $('.job-filter-tooltip').tooltip({
                container: "body",
                placement: "right",
                html: true,
                title: "<div style=\"text-align:left;\">Filter builds by query, for example:<ul><li>host=My_Jenkins_Master</li><li>host=master1 job_name=*unit_test*</li><li>job_name=*import_builds* (job_result=FAILURE OR job_result=ABORTED)</li><li>metadata.product=abc metadata.branch=release</li></ul></div>"
            });

            $('.custom-spl-filter-tooltip').tooltip({
                container: "body",
                placement: "right",
                html: true,
                title: "<div style=\"text-align:left;\">Customized chart by SPL, for example:<ul>" +
                "<li>eval Master=host | chart count by Master</li>" +
                "<li>Available fields: host, job_name, user, scm_url, node, test_summary.total, test_summary.failures, failures.passes</li>" +
                "</ul></div>"
            });
        }
    });
});
