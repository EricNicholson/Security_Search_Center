define(
    [
        'jquery',
        'underscore',
        'backbone',
        'module',
        'models/ACLReadOnly',
        'models/services/data/ui/Manager',
        'collections/services/data/ui/ModAlerts',
        'collections/shared/ModAlertActions',
        'views/Base',
        'views/shared/Modal',
        'views/shared/FlashMessages',
        'views/shared/alertcontrols/dialogs/shared/Settings',
        'views/shared/alertcontrols/dialogs/shared/triggerconditions/Master',
        'views/shared/alertcontrols/dialogs/shared/triggeractions/Master',
        'util/pdf_utils',
        'util/splunkd_utils'
        
    ],
    function(
        $,
        _,
        Backbone,
        module,
        ACLReadOnlyModel,
        ManagerViewModel,
        ModAlertsUICollection,
        ModAlertActionsCollection,
        BaseView,
        ModalView,
        FlashMessagesView,
        SettingsView,
        TriggerConditionsView,
        TriggerActionsView,
        pdfUtils,
        splunkd_utils
    ){
    return BaseView.extend({
        moduleId: module.id,
        /**
         * @param {Object} options {
         *     model: {
         *         alert: <models.search.Alert>,
         *         user: <models.services.admin.User>,
         *         application: <models.Application>,
         *         serverInfo: <models.services.server.ServerInfo>
         *     }
         * }
         */
        initialize: function() {
            BaseView.prototype.initialize.apply(this, arguments);
            
            //deferrs
            this.deferredPdfAvailable = pdfUtils.isPdfServiceAvailable();

            var alertActionsManagerModel = new ManagerViewModel();
            alertActionsManagerModel.set('id', 'alert_actions');
            this.deferredManagerAvailable = alertActionsManagerModel.binaryPromiseFetch({
                data: {
                    app: this.model.application.get("app"),
                    owner: this.model.application.get("owner")
                }
            });
            
            // TODO: this creation of collections is repeated in edit actions
            this.collection = this.collection || {};

            this.collection.alertActionUIs = new ModAlertsUICollection();
            // TODO: Add fetch data options - currently doing and unbouded fetch
            this.deferredAlertActionUIsCollection = this.collection.alertActionUIs.fetch({
                data: {
                    app: this.model.application.get("app"),
                    owner: this.model.application.get("owner")
                }
            });

            // TODO: Add fetch data options - currently doing and unbouded fetch
            this.collection.alertActions = new ModAlertActionsCollection();
            this.deferredAlertActionCollection = this.collection.alertActions.fetch({
                data: {
                    app: this.model.application.get("app"),
                    owner: this.model.application.get("owner"),
                    search: 'disabled!=1'
                },
                addListInTriggeredAlerts: true
            });
            
            this.children.flashMessages = new FlashMessagesView({
                model: {
                    alert: this.model.alert,
                    alertContent: this.model.alert.entry.content,
                    cron: this.model.alert.cron,
                    workingTimeRange: this.model.alert.workingTimeRange
                }
            });
            
            this.children.settings = new SettingsView({
                model: {
                    alert: this.model.alert,
                    user: this.model.user,
                    application: this.model.application,
                    serverInfo: this.model.serverInfo
                },
                showSearch: this.options.showSearch
            });
            
            this.children.triggerConditions = new TriggerConditionsView({
                model: {
                    alert: this.model.alert
                }
            });
            
            $.when(this.deferredPdfAvailable, this.deferredManagerAvailable).then(function(pdfAvailable, managerAvailable) {
                this.children.triggerActions = new TriggerActionsView({
                    pdfAvailable: _.isArray(pdfAvailable) ? pdfAvailable[0] : pdfAvailable,
                    canViewAlertActionsManager: managerAvailable,
                    model: {
                        alert: this.model.alert,
                        application: this.model.application
                    },
                    collection: {
                        alertActions: this.collection.alertActions,
                        alertActionUIs: this.collection.alertActionUIs
                    }
                });
            }.bind(this));

        },
        events: {
            'click .btn-primary': function(e) {
                e.preventDefault();
                if (this.model.alert.validateAssociated()) {
                    this.saveAlert();
                }
            }
        },
        saveAlert: function() {
            var permissions = this.model.alert.entry.content.get('ui.permissions'),
                data = {
                    app: this.model.application.get('app'),
                    owner: ((permissions === splunkd_utils.USER) ? this.model.application.get('owner') : splunkd_utils.NOBODY)
                };
            this.model.alert.save({},
                {
                    data: data,
                    validate: false,
                    success: function(model) {
                        if (model.entry.acl.get('sharing') !== permissions) {
                            this.model.aclReadOnly = new ACLReadOnlyModel($.extend(true, {}, model.entry.acl.toJSON()));
                            this.model.aclReadOnly.set('sharing', permissions);
                            var data = this.model.aclReadOnly.toDataPayload();
                            this.model.alert.acl.save({}, {
                                data: data,
                                success: function() {
                                    this.model.alert.trigger('saveSuccess');
                                }.bind(this)
                            });
                        } else {
                            this.model.alert.trigger('saveSuccess');
                        }
                    }.bind(this)
                }
            );
        },
        render: function() {
            $.when(this.deferredAlertActionCollection, this.deferredPdfAvailable, this.deferredAlertActionUIsCollection, this.deferredManagerAvailable).then(function() {
                this.$el.html(ModalView.TEMPLATE);
                this.$(ModalView.HEADER_TITLE_SELECTOR).html(_('Save As Alert').t());
                this.$(ModalView.BODY_SELECTOR).append(ModalView.FORM_HORIZONTAL_COMPLEX);
                this.$(ModalView.BODY_SELECTOR).addClass('modal-body-scrolling');
                this.children.flashMessages.render().appendTo(this.$(ModalView.BODY_FORM_SELECTOR));
                this.children.settings.render().appendTo(this.$(ModalView.BODY_FORM_SELECTOR));
                this.children.triggerConditions.render().appendTo(this.$(ModalView.BODY_FORM_SELECTOR));
                this.children.triggerActions.render().appendTo(this.$(ModalView.BODY_SELECTOR));
                this.$(ModalView.BODY_FORM_SELECTOR).show();
                this.$(ModalView.FOOTER_SELECTOR).append(ModalView.BUTTON_CANCEL);
                this.$(ModalView.FOOTER_SELECTOR).append(ModalView.BUTTON_SAVE);
            }.bind(this));
            return this;
        }
    });
});
