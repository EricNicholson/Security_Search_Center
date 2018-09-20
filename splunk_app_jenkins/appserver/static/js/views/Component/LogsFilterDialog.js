define([
    'jquery',
    'underscore',
    'backbone',
    'contrib/text!app/templates/LogsSettingDialogTemplate.html',
    'splunkjs/mvc/dropdownview'
], function (
    $,
    _,
    Backbone,
    LogsSettingDialogTemplate,
    DropdownView
) {
    return Backbone.View.extend({

        dropdown: null,
        prevVal: null,

        initialize: function(options) {
            this.options = options;
        },

        render: function() {
            this.$el.html(_.template(LogsSettingDialogTemplate));
            this.dropdown = new DropdownView({
                managerid: this.options.managerid,
                allowCustomValues: true,
                labelField: 'source',
                valueField: 'source',
                choices: [{label: "Console Output", value: "Console Output"}],
                default: ['Console Output'],
                el: this.$el.find('.modal-body'),
                width: 500
            }).render();


            var that = this;
            this.$("input[type=submit]").on("click", function() {
                that.options.updateLogs(that.dropdown.val());
                that.$("[role=dialog]").modal('hide');
            });
            this.$('button.cancel-btn').on("click", function() {
                that.dropdown.val(that.prevVal);
                that.$("[role=dialog]").modal('hide');
            });

            return this;
        },

        modal: function() {
            this.prevVal = this.dropdown.val();
            this.$("[role=dialog]").modal({backdrop: 'static', keyboard: false});
            this.$("[role=dialog]").modal().css("width","auto");
        }

    });
});