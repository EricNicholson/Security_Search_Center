define([
    'jquery',
    'underscore',
    'backbone',
    'app/views/Component/TableRowExpanderView',
    'app/util/util'
], function ($,
             _,
             Backbone,
             TableRowExpanderView,
             Util
) {

    return TableRowExpanderView.extend({

        queryBuilder: function(rowData) {
            var search = 'index=jenkins host="' + rowData.values[5] + '" job_name="' + rowData.values[6] + '" build_number<=' + rowData.values[7]
                + ' testsuite.testcase{}.testname="' + rowData.values[0] + '" | `expand_testcase` | search testname="' + rowData.values[0]
                + '" | sort - build_number | head 10 | sort build_number '
                + '| eval result=if(isnotnull(errordetails), \"Failed\", if(skipped==\"true\", \"Skipped\", \"Passed\"))';
            return search;
        },

        getRenderData: function(result) {
            var that = this;
            var result_str = "";
            _.each(result, function(obj){
                if (obj.result == "Passed") {
                    var result_class = "fa fa-check-circle-o passed-case";
                } else if (obj.result == "Failed") {
                    var result_class = "fa fa-times-circle-o failed-case";
                } else {
                    var result_class = "fa fa-pause-circle-o skipped-case";
                }
                result_str += '<a title="#' + obj.build_number + '"class="new_test_result" host="' + obj.host + '" job="' + obj.job_name + '" build="' + obj.build_number + '" classname="' + obj.classname + '" testname="' + obj.testname + '"><i class="' + result_class + '" aria-hidden="true"></i></a>';
            });

            var data = {prior_result: result_str};
            if (result[result.length-1].errordetails) {
                data['error_details'] = Util.wordWrap(result[result.length-1].errordetails, 200).replace(/&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;").replace(/"/g, "&quot;").replace(/\n/g, "<br>");
            }
            if (result[result.length-1].errorstacktrace) {
                data['stacktrace'] = Util.wordWrap(result[result.length-1].errorstacktrace, 200).replace(/&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;").replace(/"/g, "&quot;").replace(/\n/g, "<br>");;
            }
            if (result[result.length-1].skipped_message) {
                data['skipped_message'] = Util.wordWrap(result[result.length-1].skipped_message, 200).replace(/&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;").replace(/"/g, "&quot;").replace(/\n/g, "<br>");;
            }
            return [data];
        }
    });
});
