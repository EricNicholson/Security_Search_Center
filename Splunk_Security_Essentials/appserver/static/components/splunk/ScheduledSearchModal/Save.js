'use strict';

define(['underscore', 'module', 'backbone', 'views/Base', 'views/shared/controls/ControlGroup', 'views/shared/FlashMessages', 'views/shared/Modal', 'views/shared/ScheduleSentence', 'views/shared/timerangepicker/dialog/Master'], function (_, module, Backbone, BaseView, ControlGroup, FlashMessagesView, ModalView, ScheduleSentenceView, TimeRangePickerDialog) {
    return BaseView.extend({
        moduleId: module.id,
        className: ModalView.CLASS_NAME,
        /**
         *
         * @param options
         * @param options.searchString
         */
        initialize: function initialize(options) {
            var _this = this;

            BaseView.prototype.initialize.apply(this, arguments);

            this.children.flashMessages = new FlashMessagesView({
                model: {
                    report: this.model.report,
                    cron: this.model.cron
                }
            });

            this.children.nameField = new ControlGroup({
                controlType: 'Text',
                controlClass: 'controls-block',
                controlOptions: {
                    modelAttribute: 'name',
                    model: this.model.report.entry.content,
                    placeholder: 'Title'
                },
                label: 'Title'
            });

            this.children.descriptionField = new ControlGroup({
                controlType: 'Textarea',
                controlClass: 'controls-block',
                controlOptions: {
                    modelAttribute: 'description',
                    model: this.model.report.entry.content,
                    placeholder: 'Optional'
                },
                label: 'Description'
            });

            this.children.scheduleSentenceView = new ScheduleSentenceView({
                model: {
                    cron: this.model.cron,
                    application: this.model.application
                },
                lineOneLabel: 'Schedule',
                popdownOptions: {
                    attachDialogTo: '.modal:visible',
                    scrollContainer: '.modal:visible .modal-body:visible'
                }
            });

            this.children.timeRangeControl = $('<a>').addClass('btn btn-default').append($('<span>').addClass('mlts-time-label').text('Time Range'), $('<span>').addClass('mlts-time-label-icon')).on('click', function () {
                _this.toggleTimeRangePicker();
            });

            this.children.timeRangeControlGroup = $('<div>').addClass('control-group').append($('<label>').addClass('control-label').text('Time Range'), $('<div>').addClass('controls controls-block').append(this.children.timeRangeControl));

            this.children.timeRangePickerView = new TimeRangePickerDialog({
                model: {
                    timeRange: this.model.timeRange,
                    user: this.model.user,
                    appLocal: this.model.appLocal,
                    application: this.model.application
                },
                collection: this.collection,
                showPresetsRealTime: false,
                showCustomRealTime: false,
                showCustomDate: false,
                showCustomDateTime: false,
                showPresetsAllTime: true,
                enableCustomAdvancedRealTime: false,
                appendSelectDropdownsTo: '.modal:visible'
            });

            this.model.timeRange.on('applied', function () {
                _this.model.report.entry.content.set({
                    'dispatch.earliest_time': _this.model.timeRange.get('earliest'),
                    'dispatch.latest_time': _this.model.timeRange.get('latest')
                });

                _this.setTimeRangeLabel();
            });
        },
        events: $.extend({}, ModalView.prototype.events, {
            'click .btn-primary': function clickBtnPrimary(e) {
                e.preventDefault();

                this.model.cron.validate();

                this.model.report.entry.content.set('cron_schedule', this.model.cron.getCronString());

                if (this.model.cron.isValid()) {
                    this.model.report.save({}, {
                        data: {
                            app: this.model.application.get('app'),
                            owner: this.model.application.get('owner')
                            // owner: ((permissions === splunkd_utils.USER) ? app.get('owner') : splunkd_utils.NOBODY)
                        },
                        success: function (model, response) {
                            this.model.report.trigger('saveSuccess');
                        }.bind(this)
                    });
                }
            }
        }),
        setTimeRangeLabel: function setTimeRangeLabel() {
            var timeRangeLabel = this.model.timeRange.generateLabel(this.collection);
            this.children.timeRangeControl.find('span.mlts-time-label').text(timeRangeLabel);
        },
        toggleTimeRangePicker: function toggleTimeRangePicker() {
            var addClass = void 0,
                removeClass = void 0;

            // using this check instead of .is(':visible') to allow it to work even when the modal is hidden
            if (this.children.timeRangePickerView.$el.css('display') === 'none') {
                this.children.timeRangePickerView.$el.show();
                addClass = 'icon-triangle-up-small';
                removeClass = 'icon-triangle-down-small';
            } else {
                this.children.timeRangePickerView.$el.hide();
                addClass = 'icon-triangle-down-small';
                removeClass = 'icon-triangle-up-small';
            }

            this.children.timeRangeControl.find('span.mlts-time-label-icon').addClass(addClass).removeClass(removeClass);
        },
        render: function render() {
            var width = 700;

            this.$el.html(ModalView.TEMPLATE);

            this.$el.css({
                width: width,
                'margin-left': -width / 2
            });

            this.$(ModalView.HEADER_TITLE_SELECTOR).text('Schedule Model Training');

            this.$(ModalView.FOOTER_SELECTOR).append(ModalView.BUTTON_CANCEL);
            this.$(ModalView.FOOTER_SELECTOR).append($('<a href="#" class="btn btn-primary modal-btn-primary">').text('Schedule'));

            this.$(ModalView.BODY_SELECTOR).append('<div class="form">');

            this.children.flashMessages.render().appendTo(this.$(ModalView.BODY_FORM_SELECTOR));
            this.children.nameField.render().appendTo(this.$(ModalView.BODY_FORM_SELECTOR));
            this.children.descriptionField.render().appendTo(this.$(ModalView.BODY_FORM_SELECTOR));
            this.children.scheduleSentenceView.render().appendTo(this.$(ModalView.BODY_FORM_SELECTOR));

            this.children.timeRangeControlGroup.appendTo(this.$(ModalView.BODY_FORM_SELECTOR));

            this.setTimeRangeLabel();

            this.children.timeRangePickerView.render().appendTo(this.$(ModalView.BODY_FORM_SELECTOR));

            this.toggleTimeRangePicker();

            this.$el.removeClass('fade'); // TODO: this shouldn't be necessary

            return this;
        }
    });
});
