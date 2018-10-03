'use strict';

var splunk_metrics = function(){
    var app_id = undefined;
    return {
    trackEvent: function (eventType, data) {
        if(!window._splunk_metrics_events)
             return;
        var event = {data: data || {}, timestamp:  Date.now()};
        event['type'] = eventType;
        event['data']['app'] = app_id;
        window._splunk_metrics_events.push(event);
    },
    init(config,id){
        app_id = id;
        if (config) splunk_metrics.trackEvent('config',config)
        }
    }
}();

splunk_metrics.init({
	"logging" : true,
	//"devMode": true,
  }, "Splunk_Security_Essentials");

define(['jquery', 'module'], function ($, module) {
    var config = module.config();
    return {
        SendTelemetryToSplunk: function SendTelemetryToSplunk(component, input) {
			splunk_metrics.trackEvent(component,input);
		}
    };
});