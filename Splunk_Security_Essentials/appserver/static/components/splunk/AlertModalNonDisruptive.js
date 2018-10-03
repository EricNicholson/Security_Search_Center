'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

define(['models/shared/Application', 'models/search/Report', 'splunkjs/mvc/sharedmodels', 'components/splunk/Master'], function (AppModel, ReportModel, SharedModels, AlertDialog) {
    return function AlertModal() {
        var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
        // console.log("I have interim control of the world", options)
        _classCallCheck(this, AlertModal);

        if (options.model == null) {
            options.model = {
                user: SharedModels.get('user'),
                serverInfo: SharedModels.get('serverInfo')
            };

            // we can't use the AppModel from SharedModels because it sets the "page" parameter to the current page
            // this is problematic because AlertDialog sets "request.ui_dispatch_view" to the "page" parameter
            // this in turn causes sets the Triggered Alert url to point back at the assistant, which can't load saved alert results
            // to combat this, we create our own AppModel and override its "page" parameter to always point at the search page, which can handle saved alert results
            var sharedAppModel = SharedModels.get('app');

            options.model.application = new AppModel({
                owner: sharedAppModel.get('owner'),
                root: sharedAppModel.get('root'),
                locale: sharedAppModel.get('locale'),
                app: sharedAppModel.get('app'),
                page: 'search'
            });
        }

        if (options.model.report == null) {
            options.model.report = new ReportModel();
            options.model.report.entry.content.set('search', options.searchString);
            options.model.report.entry.content.set('dispatch.earliest_time', "-1d@d");
            options.model.report.entry.content.set('cron_schedule', "33 0 * * *");
            options.model.report.entry.content.set('cronType', "daily");

        }

        if (options.showSearch == null) options.showSearch = true;

        if (options.onHiddenRemove == null) options.onHiddenRemove = true;

        return new AlertDialog(options);
    };
});
