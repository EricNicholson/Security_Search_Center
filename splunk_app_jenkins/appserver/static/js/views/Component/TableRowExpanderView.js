/**
 * Created by jshao on 7/29/16.
 */
/*global define*/
define([
    'jquery',
    'underscore',
    'backbone',
    'splunkjs/mvc',
    'splunkjs/mvc/searchmanager',
    'splunkjs/mvc/tableview',
], function ($,
             _,
             Backbone,
             mvc,
             SearchManager,
             TableView
) {

    return TableView.BaseRowExpansionRenderer.extend({
        options: {
			latest_time: "$latest_time$",
			earliest_time: "$earliest_time$",
			manager_id_prefix: "expand_",
			expandInfo: {},
			queryBuilder: null,
            template: '\
              <dl class="list-dotted">\
                  <% stat = obj[0];%>\
                      <% _.each(expandInfo.entity, function(entity) {\
                      if(stat[entity["field"]]){%> \
                      <dt><%= entity["label"] %></dt><dd><%= stat[entity["field"]] %></dd> \
                      <% }}); %>\
              </dl>'
        },
        initialize: function (args) {
            this.options = _.defaults(args || {}, this.options);
            var that = this;

            // Because only one row can be expanded at a time we can
            // reuse SearchManager and deferred object for all rows.
            that._deferred = null;

            that._searchManager = new SearchManager({
                id: that.options.manager_id_prefix + '-search-manager',
                preview: false,
                autostart: false,
                status_buckets: 0,
                latest_time: mvc.tokenSafe("$latest_time$"),
                earliest_time:mvc.tokenSafe("$earliest_time$")
            });
            that._searchManager.data('results', {count: 0, output_mode: 'json'})
                .on('data', function (results) {
                    if (that._deferred) {
                        var results = results.hasData() ? results.data().results : null;
                        that._deferred.resolve(results);
                    }
                    //no need to keep the search job alive, we don't pulling data, similar to oneshot search
                    that._searchManager.cancel();
                });
        },

        queryBuilder : function(rowData){
            if(!options.queryBuilder()){
                throw new Error('queryBuilder should be set.');
            }
            return options.queryBuilder(rowData);
        },

        canRender: function (rowData) {
            return true;
        },

        getRenderData: function(result){
            return result;
        },

        render: function ($container, rowData) {
            var that = this;

            $container.append('<div class="fa fa-refresh fa-spin fa-fw text-success"></div>');

            that._deferred = new $.Deferred();

            that._deferred.done(function (result) {
                var data = that.getRenderData(result);
				if (!data.hasOwnProperty("expandInfo")) {
					data["expandInfo"] = that.options.expandInfo;
				}
                $container.html(_.template(that.options.template,data));
                that._deferred = null;
            });

            that._deferred.fail(function (error) {
                // If deferred object is null - this means that job was canceled.
                if (that._deferred) {
                    $container.text(JSON.stringify(error));
                    that._deferred = null;
                }
            });

            that._searchManager.set({search: that.queryBuilder(rowData)});
            that._searchManager.startSearch();


        },

        teardown: function ($container, rowData) {
            var deferred = this._deferred;
            if (deferred) {
                // Let's set deferred to null - this flag means that job canceled.
                this._deferred = null;
                // If deferred object is not done yet - let's reject it.
                if (deferred.state() === 'pending') {
                    deferred.reject();
                    this._searchManager.cancel();
                }
            }
        }
    });
});
