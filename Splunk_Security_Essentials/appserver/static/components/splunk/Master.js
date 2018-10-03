define(
    [
        'underscore',
        'backbone',
        'module',
        'models/search/Alert',
        'views/shared/Modal',
        'views/shared/MultiStepModal',
        'components/splunk/Save',
        'views/shared/alertcontrols/dialogs/shared/SuccessWithAdditionalSettings',
        'views/shared/alertcontrols/dialogs/shared/CanNotEdit',
        'util/splunkd_utils'
    ],
    function(
        _,
        Backbone,
        module,
        AlertModel,
        ModalView,
        MultiStepModal,
        SaveView,
        SuccessView,
        CanNotEditView,
        splunkd_utils
    ){
    return MultiStepModal.extend({
        /**
         * @param {Object} options {
         *     model: {
         *         report: <models.search.Report>,
         *         reportPristine: <models.search.Report>,
         *         user: <models.services.admin.User>,
         *         application: <models.Application>,
         *         serverInfo: <models.services.server.ServerInfo>
         *     }
         * }
         */
        moduleId: module.id,
        className: ModalView.CLASS_NAME + ' ' + ModalView.CLASS_MODAL_WIDE + ' alert-save-as',
        initialize: function() {
            MultiStepModal.prototype.initialize.apply(this, arguments);

            //model
            this.model.inmem = this.model.report.clone();
            // console.log("Master.js: Step one", this, arguments)
            if (!this.model.inmem.isNew() && this.model.inmem.isAlert()) {
                //SPL-68947 reset earliest time latest time incase timerange picker was change
                // console.log("Master.js: Step two", this)
                if (this.model.reportPristine && !this.model.reportPristine.isNew()) {
                    // console.log("Master.js: Step three", this, this.model.reportPristine.entry.content.get('dispatch.earliest_time'))
                    this.model.inmem.entry.content.set({
                        'dispatch.earliest_time': this.model.reportPristine.entry.content.get('dispatch.earliest_time'),
                        'dispatch.latest_time': this.model.reportPristine.entry.content.get('dispatch.latest_time')
                    });
                }
            }
            this.model.alert = new AlertModel({}, {splunkDPayload: this.model.inmem.toSplunkD({withoutId: true})});
            
            /*
            this.model.alert.cron.set({
                    "cronType": "custom",
                    "cron_schedule": "37 1 * * *",
                    "dayOfWeek": "*",
                    "hour": "1",
                    "minute": "37"
                });
            
            this.model.alert.workingTimeRange.set("earliest", "-1d@d")
            this.model.alert.workingTimeRange.set("latest", "@d")
            this.model.alert.entry.content.set("name", "This is a test");
            */

            if (this.model.alert.canNotEditInUI()) {
                
                this.children.canNotEdit = new CanNotEditView({
                    model: {
                        alert: this.model.inmem,
                        application: this.model.application
                    }
                });
            } else {
                
                this.model.alert.entry.content.set({
                    'request.ui_dispatch_app': this.model.application.get('app'),
                    'request.ui_dispatch_view': this.model.application.get('page')
                });

                this.children.save = new SaveView({
                    model:  {
                        alert: this.model.alert,
                        application: this.model.application,
                        user: this.model.user,
                        serverInfo: this.model.serverInfo
                    },
                    showSearch: this.options.showSearch,
                    title: this.options.title
                });

                this.children.success = new SuccessView({
                    model: {
                        alert: this.model.alert,
                        application: this.model.application,
                        user: this.model.user
                    }
                });



                this.listenTo(this.model.alert, 'saveSuccess', function() {
                    
                    if(this.model.alert.entry.content.get("continueindialog") && this.model.alert.entry.content.get("continueindialog") == "false"){
                    
                        this.hide()
                        if(typeof this.model.alert.onComplete=="function"){
                            this.model.alert.onComplete();
                        }

                    }else{
                        // console.log("Master.js: continuing...")
                        this.stepViewStack.setSelectedView(this.children.success);
                        this.children.success.focus();
                    }
                });

                this.on("hidden", function() {
                    if (!this.model.alert.isNew()) {
                        this.model.report.fetch({url: splunkd_utils.fullpath(this.model.alert.id)});
                    }
                }, this);
            }
        },
        getStepViews: function() {
            if (this.model.alert.canNotEditInUI()) {
                return([this.children.canNotEdit]);
            } 
            return ([
                this.children.save,
                this.children.success
            ]);
        }
    });
});
