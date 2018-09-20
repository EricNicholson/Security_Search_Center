/**
 * Created by jshao on 7/25/16.
 */
/*global define*/
define([
], function (
) {
    return {
            "title" : "Build Analysis",
            "description": "Configure filters to return Jenkins builds matching that criteria. Click on the desired record to get detailed results about that build.",
            "entity": [
                {
                    "label": "Jenkins Master",
                    "field": "host",
                    "type": "MultiDropdownView",
                    "search": "|`jenkins_host_list`"
                },
                {
                    "label": "Jenkins Slave",
                    "field": "node",
                    "type": "DropdownView",
                    "search": "index=jenkins_statistics $token_%prefix%_host$ |stats count by node|table node",
                    "addDefaultChoice" : true
                },
                {
                    "label": "Job",
                    "field": "job_name",
                    "search": "index=jenkins_statistics $token_%prefix%_host$ $token_%prefix%_node$" +
                    "|stats count by job_name|table job_name",
                    "type": "DropdownView",
                    "addDefaultChoice" : true
                },
                {
                    "label": "Build",
                    "field": "build_number",
                    "type": "DropdownView",
                    "addDefaultChoice" : true,
                    "search":"index=jenkins_statistics $token_%prefix%_host$ $token_%prefix%_node$ " +
                    "$token_%prefix%_job_name$|stats count by build_number|table build_number"
                },
                {
                    "label": "Build Parameters",
                    "type": "TextInputView"
                },
                {
                    "label": "Status",
                    "field": "job_result",
                    "type": "MultiDropdownView",
                    "search": "index=jenkins_statistics| stats count by job_result" +
                    "| eval job_result = if (isnull(job_result), \"INPROGRESS\", job_result) |table job_result",
                }
            ],
            "expandInfo": {
                "search": {
                    "prefix": 'index=jenkins_statistics event_tag=job_event (type=completed OR type=started) ',
                    "suffix": '|dedup host build_url sortby -_time|fields _raw',
                    "fields": [
                        {
                            "field": "host",
                            "label": "Jenkins Master"
                        },
                        {
                            "field": "job_name",
                            "label": "Job"
                        },
                        {
                            "field": "build_number",
                            "label": "Build"
                        }

                    ]
                },
                "entity": [
                    {
                        "field": "trigger_by",
                        "label": "Trigger By"
                    },
                    {
                        "field": "scm",
                        "label": "SCM"
                    },
                    {
                        "field": 'scm_url',
                        "label": "SCM_URL"
                    },
                    {
                        "field": "upstream",
                        "label": "UpStream"
                    },
                    {
                        "field": 'branch',
                        "label": "Branch"
                    },
                    {
                        "field": 'revision',
                        "label": "Revision"
                    },
                    {
                        "field": "queue_time",
                        "label": "QueueTime",
                        'type': "seconds"
                    },
                    {
                        "field": "job_duration",
                        "label": "Duration",
                        'type': "seconds"
                    },
                    {
                        "field": "test_summary",
                        "label": "Test Summary"
                    },
                    {
                        "field": "coverage",
                        "label": "Code Coverage"
                    },
                    {
                        "field": "stages",
                        "label": "Pipeline Stage"
                    }
                ]
            },
		"status_render_dict": {
			FAILURE: {text: 'was failed', icon: 'fa-times-circle', color:'text-error'},
			UNSTABLE: {text: 'was unstable', icon: 'fa-exclamation-circle', color: 'text-warning'},
			SUCCESS: {text: 'was successful', icon: 'fa-check-circle', color:'text-success'},
			ABORTED: {text: 'was aborted', icon: 'fa-minus-circle', color:'text-muted'},
			INPROGRESS: {text: 'is running', icon: 'fa-refresh fa-spin', color:'text-success'},
			UNKNOWN: {text: 'result is unknown', icon: 'fa-question-circle', color:'text-warning'}
		}
    }

});