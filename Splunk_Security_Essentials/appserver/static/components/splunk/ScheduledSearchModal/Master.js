'use strict';

define(['underscore', 'backbone', 'module', 'models/search/Report', 'models/shared/Cron', 'models/shared/TimeRange', 'views/shared/Modal', 'views/shared/MultiStepModal', 'splunkjs/mvc/sharedmodels', './Save', './Success'], function (_, Backbone, module, ReportModel, CronModel, TimeRangeModel, ModalView, MultiStepModal, SharedModels, SaveView, SuccessView) {
    return MultiStepModal.extend({
        moduleId: module.id,
        className: ModalView.CLASS_NAME,
        /**
         *
         * @param options
         * @param {string}  options.searchString
         * @param {string}  options.earliestTime
         * @param {string}  options.latestTime
         * @param {boolean} options.onHiddenRemove
         */
        initialize: function initialize() {
            var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

            MultiStepModal.prototype.initialize.apply(this, arguments);

            this.report = new ReportModel();
            this.cron = new CronModel();
            this.timeRange = new TimeRangeModel();

            if (options.onHiddenRemove == null) options.onHiddenRemove = true;

            if (options.searchString != null) {
                this.report.entry.content.set('search', options.searchString);
            }

            if (options.earliestTime != null) {
                this.timeRange.set('earliest', options.earliestTime);

                // a wordaround to allow custom ranges to display cleanly in the timerange picker
                if (options.latestTime == null) options.latestTime = 'now';
            }

            if (options.latestTime != null) {
                this.timeRange.set('latest', options.latestTime);
            }

            this.report.entry.content.set('is_scheduled', true);

            this.children.save = new SaveView({
                model: {
                    report: this.report,
                    cron: this.cron,
                    timeRange: this.timeRange,
                    application: SharedModels.get('app'),
                    appLocal: SharedModels.get('appLocal'),
                    user: SharedModels.get('user')
                },
                collection: SharedModels.get('times')
            });

            this.children.success = new SuccessView({
                model: {
                    report: this.report,
                    application: SharedModels.get('app')
                }
            });

            // applies the time range to the model using the handler in Save.es6
            this.timeRange.trigger('applied');

            this.listenTo(this.report, 'saveSuccess', function () {
                this.stepViewStack.setSelectedView(this.children.success);
                // this.children.success.focus();
            });
        },
        getStepViews: function getStepViews() {
            return [this.children.save, this.children.success];
        }
    });
});
