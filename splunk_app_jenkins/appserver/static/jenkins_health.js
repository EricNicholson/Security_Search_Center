require([
	'underscore',
	'jquery',
	'splunkjs/mvc',
	'splunkjs/mvc/tableview',
	'splunkjs/mvc/simplexml/ready!'
], function (_, $, mvc, TableView) {
	var slave_styles = {
		"Online": ["fa fa-check-circle-o fa-lg", "fa fa-times-circle-o fa-lg"],
		"Busy": ["fa fa-cog fa-spin fa-lg", "fa fa-minus fa-lg"]
	};
	var color_style = {"Online-true": "text-success", "Online-false": "text-error",
                       "Busy-true": "text-error", "Busy-false": "text-success"};
	var tooltip_labels = {
		"#log_text_input label": "Filter log messages, for example IOException, java.io.EOFException or Unexpected termination",
		"#slave_text_input label": "Filter by table header or text, for example Online=false or Linux",
		"#panel1 h3": "JVM heap size (MB) of the selected Jenkins Master",
		"#panel2 h3": "Thread count of the selected Jenkins Master",
		"#panel3 h3": "Number of builds waiting in queue for the selected Jenkins Master",
		"#panel4 h3": "Executor and computer number of the selected Jenkins Master"
	};
	var CustomIconRenderer = TableView.BaseCellRenderer.extend({
		canRender: function (cell) {
			return cell.field === 'Online' || cell.field == "Slave URL" || cell.field == "Busy";
		},
		render: function ($td, cell) {
			if (cell.field === 'Online' || cell.field === "Busy") {
				var idx = cell.value == "true" ? 0 : 1;
				var iconClass = slave_styles[cell.field][idx];
				var colorClass = color_style[cell.field + "-" + cell.value]
				colorClass = colorClass ? colorClass : "string";
				// Create the icon element and add it to the table cell
				$td.addClass(colorClass).html(_.template('<i class="<%-icon%>"></i>', {
					icon: iconClass
				}));
			} else if (cell.field == "Slave URL") {
				var link = cell.value;
				var a = $('<a>').attr("href", cell.value).text("Open");
				$td.addClass('table-link').empty().append(a);
				a.click(function (e) {
					e.stopPropagation();
					e.preventDefault();
					//window.location = $(e.currentTarget).attr('href');
					// or for popup:
					window.open($(e.currentTarget).attr('href'));
				});
			}
		}
	});

	//add tooltips
	var tooltipTemplate = _.template(' <a class="tooltip-link" rel="tooltip" data-title="<%= tooltip %>"><i class="fa fa-question-circle-o"></i></a>');
	for(var locator in tooltip_labels){
		$(locator).append(tooltipTemplate({
			tooltip: tooltip_labels[locator]
		}))
	}
	// $(".dashboard-panel label").find('.tooltip-link').tooltip({container: 'body', html: true, delay: {show: 0, hide: 0}});

	$('.tooltip-link').tooltip({container: 'body', html: true, delay: {show: 0, hide: 0}});
});
