require.config({
    paths: {
        'app': '../app/splunk_app_jenkins/js',
        'lib': '../app/splunk_app_jenkins/js/lib',
        'bootstrap': '../app/splunk_app_jenkins/bootstrap/js/bootstrap.min',
        'select2': '../app/splunk_app_jenkins/js/lib/select2-3.5.2',
        'd3': '../app/splunk_app_jenkins/js/lib/d3',
        'moment': '../app/splunk_app_jenkins/js/lib/moment',
        'clipboard': '../app/splunk_app_jenkins/js/lib/clipboard.min'
    }
});
require(['splunkjs/mvc/simplexml/ready!'], function(){
    require(['splunkjs/ready!'], function(){
        // The splunkjs/ready loader script will automatically instantiate all elements
        // declared in the dashboard's HTML.
    });
});
