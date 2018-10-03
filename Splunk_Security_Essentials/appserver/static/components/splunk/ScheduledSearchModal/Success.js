'use strict';

define(['underscore', 'module', 'views/Base', 'views/shared/FlashMessages', 'views/shared/Modal'], function (_, module, BaseView, FlashMessagesView, ModalView) {
    return BaseView.extend({
        moduleId: module.id,
        className: ModalView.CLASS_NAME,
        /**
         *
         */
        initialize: function initialize(options) {
            BaseView.prototype.initialize.apply(this, arguments);
            this.children.flashMessages = new FlashMessagesView({ model: this.model.report });
            this.listenTo(this.model.report, 'change:' + this.model.report.idAttribute, this.render);
        },
        render: function render() {
            this.$el.html(ModalView.TEMPLATE);
            this.$(ModalView.HEADER_TITLE_SELECTOR).text('Model Training Has Been Scheduled');

            this.$(ModalView.BODY_SELECTOR).text('You may now view your model or return to the assistant.');
            this.children.flashMessages.render().prependTo(this.$(ModalView.BODY_SELECTOR));

            var routeToSavedSearch = '/' + this.model.application.get('locale') + '/app/' + this.model.application.get('app') + '/report?s=' + this.model.report.id;

            this.$(ModalView.FOOTER_SELECTOR).append(ModalView.BUTTON_CONTINUE);
            this.$(ModalView.FOOTER_SELECTOR).append($('<a href="' + routeToSavedSearch + '" class="btn btn-primary modal-btn-primary">').text('View Scheduled Training'));

            this.$el.removeClass('fade'); // TODO: this shouldn't be necessary

            return this;
        }
    });
});
