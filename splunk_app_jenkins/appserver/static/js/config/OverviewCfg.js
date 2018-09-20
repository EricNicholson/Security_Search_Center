/**
 * Created by jshao on 7/25/16.
 */
/*global define*/
define([
], function (
) {
    return {
        "title": 'Overview ',
        "description": "Overview for build and Jenkins slave status",
        "earliest_time" : "-15d@d",
        "builds_description": "<span id='overview-build-status'><%= status%></span> builds <%= timerange%> , click job name to view job history",
        "daily_distribution_earliest_time" : "-15d@d",
        "entity": [
            {
                "label": "Jenkins Master",
                "field": "host",
                "type": "MultiDropdownView",
                "search": '|`jenkins_host_list`'
            }
        ],
    }
});
