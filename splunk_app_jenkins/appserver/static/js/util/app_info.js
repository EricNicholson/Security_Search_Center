define([
      'jquery',
      'underscore',
      'backbone',
      'splunkjs/mvc/utils'
    ],
    function(
        $,
        _,
        Backbone,
        SplunkJsUtils
    ) {
      return {
        get_locale: function() {
          return SplunkJsUtils.getPageInfo().locale;
        },

        get_url_prefix: function() {
          var pageinfo = SplunkJsUtils.getPageInfo();
          var url_prefix = "/" + pageinfo.locale;
          if (pageinfo.root !== undefined) {
            url_prefix = "/" + pageinfo.root + url_prefix;
          }
          return url_prefix;
        },
        get_app_url_prefix: function() {
          var pageinfo = SplunkJsUtils.getPageInfo();
          var url_prefix = "/" + pageinfo.locale;
          if (pageinfo.root !== undefined) {
            url_prefix = "/" + pageinfo.root + url_prefix;
          }
          return url_prefix + "/app/" + pageinfo.app;
        },

        get_current_app: function() {
          var pageinfo = SplunkJsUtils.getPageInfo();
          return pageinfo.app;
        },

        get_custom_url_prefix: function() {
          var pageinfo = SplunkJsUtils.getPageInfo();
          var url_prefix = "/" + pageinfo.locale;
          if (pageinfo.root !== undefined) {
            url_prefix = "/" + pageinfo.root + url_prefix;
          }
          return url_prefix + "/custom/" + pageinfo.app;
        },

        get_build_analysis_url: function() {
          return this.get_app_url_prefix() + '/build_analysis';
        }
      };
    }
);
