define([
    'backbone',
    'jquery',
    'underscore',
    'routers/Base'
], function(
    Backbone,
    $,
    _,
    BaseRouter
) {
    function parseQueryString(queryString) {
        // parse query string into a JSON object
        var params = {};
        if (!_.isString(queryString)) {
            return params;
        }
        queryString = queryString.substring(queryString.indexOf('?') + 1);
        var queryParts = decodeURI(queryString).split(/&/g);
        _.each(queryParts, function (value) {
            var parts = value.split('=');
            if (parts.length >= 1) {
                var val;
                if (parts.length === 2) {
                    val = parts[1];
                }
                params[parts[0]] = val;
            }
        });
        return params;
    }
    // const URL_PREFIX = AppInfo.get_app_url_prefix();
    return BaseRouter.extend({
        routes: {
            ':locale/app/:app/:page(/)': '_route',
            '*root/:locale/app/:app/:page(/)': '_routeRooted'
        },
        initialize: function(options) {
            BaseRouter.prototype.initialize.apply(this);
            this.changeUrl = options.changeUrl;
        },
        _route: function(locale, app, page, queryString) {
            BaseRouter.prototype.page.apply(this, arguments);
            that = this;
            this.deferreds.pageViewRendered.done(function() {
                var params = parseQueryString(queryString);
                that.changeUrl(params);
            });
        },
        _routeRooted: function(root, locale, app, page, queryString) {
            this.model.application.set({
                root: root
            }, {silent: true});
            this._route(locale, app, page, queryString);
        }
    });
});