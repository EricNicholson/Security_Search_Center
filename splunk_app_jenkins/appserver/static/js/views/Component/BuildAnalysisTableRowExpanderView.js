/**
 * Created by jshao on 7/29/16.
 */
/*global define*/
define([
    'jquery',
    'underscore',
    'backbone',
    'app/views/Component/TableRowExpanderView',
    'app/config/BuildAnalysisCfg',
    'app/util/util'
], function ($,
             _,
             Backbone,
             TableRowExpanderView,
             BuildAnalysisCfg,
             Util
) {

    return TableRowExpanderView.extend({

        queryBuilder: function(rowData){
            var that = this;
            var queryOptions=that.options.expandInfo.search;
            var search_prefix = queryOptions.prefix;
            var search_suffix =  queryOptions.suffix;

            var search = "";
            _.each(queryOptions.fields, function(item){
                var label = item["label"];
                var index = _.indexOf(rowData.fields, label);
                search += item["field"] + ' = "' + rowData.values[index] + '" ';
            });

            return search_prefix + " " +  search + " " + search_suffix;
        },

        formatTestSummary: function(data){
            var testSummaryString = "";
            if (!data) {
                return testSummaryString;
            }

            var testSummaryTemplate = _.template('<div><%= passed %> passed</div>' +
                '<div><%= failed %> failed</div>' +
                '<div><%= skipped %> skipped</div>' +
                '<div><%= duration %></div>');

            var testSummaryString = testSummaryTemplate({
                passed: Util.numberToString(data['passes'], 'test'),
                failed: Util.numberToString(data['failures'], 'test'),
                skipped: Util.numberToString(data['skips'], 'test'),
                duration: Util.durationToString(data['duration'])
            });

            return testSummaryString;
        },
        formatCoverageSummary: function (data) {
            var coverageSummary = "";
            if (!data) {
                return coverageSummary;
            }
            var coverageTemplate=_.template("<div><%= metricName %> <%= percentage %>%</div>");
            _.each(data, function (metricValue, metricName) {
                coverageSummary =coverageSummary + coverageTemplate({"metricName":metricName, "percentage":metricValue})
            });
            return coverageSummary;
        },
        formatPipelineStage: function (data) {
            var pilelineStageSummary = "";
            if (!data) {
                return pilelineStageSummary;
            }
            var coverageTemplate = _.template("<% _.each(stages, function (stage) { %>" +
                "<div>" +
                "  <%= stage.name %>, <%=  durationToString(stage.duration) %>, " +
                "<span class='icon'><i class='fa <%=iconMap[stage.status].icon %> <%=iconMap[stage.status].color %>' /></span>" +
                "</div>" +
                "<%}) %>");
            console.log(coverageTemplate)
            return coverageTemplate({"stages": data, durationToString:Util.durationToString, iconMap:BuildAnalysisCfg.status_render_dict });
        },
        getRenderData: function(result){
            var that = this;
            var data = [];
            _.each(result, function(obj){
                var data_elem = {};
                var raw_in_json = $.parseJSON(obj["_raw"]);
                var expandEntity=that.options.expandInfo.entity;
                _.each(expandEntity, function(entity){
                    if(raw_in_json[entity["field"]] != undefined && entity["type"] == "seconds"){
                        data_elem[entity["field"]] = Util.durationToString(raw_in_json[entity["field"]])
                    }else if(entity["field"] == "test_summary"){
                        data_elem[entity["field"]] = that.formatTestSummary(raw_in_json["test_summary"]);
                    }else if(entity["field"] == "coverage"){
                        data_elem[entity["field"]] = that.formatCoverageSummary(raw_in_json["coverage"]);
                    }else if(entity["field"] == "stages"){
                        data_elem[entity["field"]] = that.formatPipelineStage(raw_in_json["stages"]);
                    }else {
                        data_elem[entity["field"]] = raw_in_json[entity["field"]];
                    }
                });
                data.push(data_elem);
            });
            return data;
        }
    });
});
