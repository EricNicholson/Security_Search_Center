require.config({
    paths: {
        'app': '../app/splunk_app_jenkins/js'
    }
});

//data-token code was copied from splunk monitoring console
require(
	[
		'jquery',
		'underscore',
		'splunkjs/mvc',
		'uri/route',
		'splunkjs/mvc/sharedmodels',
		'util/console',
		'app/util/util',
		'splunkjs/mvc/simplexml/ready!'
	],
	function ($,
			  _,
			  mvc,
			  route,
			  sharedModels,
			  console,
			  Util) {
		function setToken(name, value) {
			var defaultTokenModel = mvc.Components.get('default');
			if (defaultTokenModel) {
				defaultTokenModel.set(name, value);
			}
			var submittedTokenModel = mvc.Components.get('submitted');
			if (submittedTokenModel) {
				submittedTokenModel.set(name, value);
			}
		}

		$('.dashboard-body').on('click', '[data-set-token],[data-unset-token],[data-token-json]', function (e) {
			e.preventDefault();
			var target = $(e.currentTarget);
			var setTokenName = target.data('set-token');
			if (setTokenName) {
				setToken(setTokenName, target.data('value'));
			}
			var unsetTokenName = target.data('unset-token');
			if (unsetTokenName) {
				setToken(unsetTokenName, undefined);
			}
			var tokenJson = target.data('token-json');
			if (tokenJson) {
				try {
					if (_.isObject(tokenJson)) {
						_(tokenJson).each(function (value, key) {
							if (value == null) {
								// Unset the token
								setToken(key, undefined);
							} else {
								setToken(key, value);
							}
						});
					}
				} catch (err) {
					console.warn('Cannot parse token JSON: ', err);
				}
			}
		});
		_(["time_input","host_input"]).each(function(id){
			Util.useLocalCache(id);
		})
	})