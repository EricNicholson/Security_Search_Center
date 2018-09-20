define([
    'jquery',
    'underscore',
    'backbone',
    'd3/d3',
    'splunkjs/mvc',
    'splunkjs/mvc/simplesplunkview',
    'splunkjs/mvc/resultslinkview'
], function (
    $,
    _,
    Backbone,
    d3,
    mvc,
    SimpleSplunkView,
    ResultsLinkView
) {
    return SimpleSplunkView.extend({
        className: 'jenkins-donut-view',
        output_mode: 'json',

        createView: function() {
            var margin = {top: 0, right: 0, bottom: 0, left: 0};

            var width = parseInt(this.settings.get("width") || this.$el.width());
            var height = parseInt(this.settings.get("height") || this.$el.height());

            var availableWidth = width - margin.left - margin.right;
            var availableHeight = height - margin.top - margin.bottom;

            this.$el.html("");

            var svg = d3.select(this.el)
                .append("svg")
                .attr("width", availableWidth)
                .attr("height", availableHeight)
                .append("g")
                .attr("transform", "translate(" + availableWidth / 2 + "," + availableHeight / 2 + ")");

            return { svg: svg, margin: margin};
        },

        formatData: function(data) {
            var sum = 0;
            for (var i = 0; i < data.length; ++i) {
                sum += parseInt(data[i]["count"]);
            }
            for (var i = 0; i < data.length; ++i) {
                data[i]["ratio"] = (parseInt(data[i]["count"]) * 100 /sum).toFixed(2)  + "%";
            }
            return data;
        },

        color : function (job_result){
            if(job_result=="SUCCESS")return "#a2cc3e";
            else if(job_result=="UNSTABLE")return "#d99f0d";
            else if(job_result=="FAILURE")return "#d6563c";
            else if(job_result=="INPROGRESS")return "#f2b827";
            else if(job_result=="ABORTED")return "#1e93c6";
            else return "#ad6704";
        },

        updateView: function(viz, data) {

            var that = this;
            var height = this.$el.height();
            var width = this.$el.width();
            var margin = {top: 0, right: 0, bottom: 0, left: 0};
            var availableWidth = width - margin.left - margin.right;
            var availableHeight = height - margin.top - margin.bottom;
            var radius = Math.min(availableWidth, availableHeight) / 2;
            // Clear svg
            var svg = $(viz.svg[0]);
            // Only clear svg element is insufficient
            // The updateView function may be invoke multiple times thus cause multiple ResultsLinkView in UI
            // TODO: Should also remove donut-toolTip and spunk ResultsLinkView content
            svg.empty();
            svg.height(availableWidth);
            svg.width(availableHeight);

            svg = viz.svg;

            svg.append("g")
                .attr("class", "slices");
            svg.append("g")
                .attr("class", "labelName");
            svg.append("g")
                .attr("class", "labelValue");
            svg.append("g")
                .attr("class", "lines");

            var pie = d3.layout.pie()           //this will create arc data for us given a list of values
                .sort(null)
                .value(function(d) {
                    return d["count"];
                });

            var arc = d3.svg.arc()
                .outerRadius(radius * 0.8)
                .innerRadius(radius * 0.4);

            var outerArc = d3.svg.arc()
                .innerRadius(radius * 0.9)
                .outerRadius(radius * 0.9);

            var div =  d3.select(this.el).append("div").attr("class", "donut-toolTip");

            var slice = svg.select(".slices").selectAll("path.slice")
                .data(pie(data), function(d){ return d.data["count"] });

            slice.enter()
                .insert("path")
                .attr("stroke","#fff")
                .style("fill", function(d) { return that.color(d.data["job_result"]) })
                .attr("class", "slice");

            slice
                .transition().duration(1000)
                .attrTween("d", function(d) {
                    this._current = this._current || d;
                    var interpolate = d3.interpolate(this._current, d);
                    this._current = interpolate(0);
                    return function(t) {
                        return arc(interpolate(t));
                    };
                });

            slice
                .on("mousemove", function(d){
                    div.style("left", d3.event.pageX-250+"px");
                    div.style("top", d3.event.pageY-250+"px");
                    div.style("display", "inline-block");
                    div.html((d.data["job_result"])+": Count "+(d.data["count"]));
                });
            slice
                .on("mouseout", function(d){
                    div.style("display", "none");
                });

            slice.exit()
                .remove();

            /* ------- TEXT LABELS -------*/

            var text = svg.select(".labelName").selectAll("text")
                .data(pie(data), function(d){ return d.data["job_result"] });

            text.enter()
                .append("text")
                .attr("dy", ".35em")
                .text(function(d) {
                    return (d.data["job_result"]+": "+d.data["ratio"]);
                });

            function midAngle(d){
                return d.startAngle + (d.endAngle - d.startAngle)/2;
            }

            text
                .transition().duration(1000)
                .attrTween("transform", function(d) {
                    this._current = this._current || d;
                    var interpolate = d3.interpolate(this._current, d);
                    this._current = interpolate(0);
                    return function(t) {
                        var d2 = interpolate(t);
                        var pos = outerArc.centroid(d2);
                        pos[0] = radius * (midAngle(d2) < Math.PI ? 1 : -1);
                        return "translate("+ pos +")";
                    };
                })
                .styleTween("text-anchor", function(d){
                    this._current = this._current || d;
                    var interpolate = d3.interpolate(this._current, d);
                    this._current = interpolate(0);
                    return function(t) {
                        var d2 = interpolate(t);
                        return midAngle(d2) < Math.PI ? "start":"end";
                    };
                })
                .text(function(d) {
                    return (d.data["job_result"]+": "+d.data["ratio"]);
                });


            text.exit()
                .remove();

            /* ------- SLICE TO TEXT POLYLINES -------*/

            var polyline = svg.select(".lines").selectAll("polyline")
                .data(pie(data), function(d){ return d.data["job_result"] });

            polyline.enter()
                .append("polyline");

            polyline.transition().duration(1000)
                .attrTween("points", function(d){
                    this._current = this._current || d;
                    var interpolate = d3.interpolate(this._current, d);
                    this._current = interpolate(0);
                    return function(t) {
                        var d2 = interpolate(t);
                        var pos = outerArc.centroid(d2);
                        pos[0] = radius * 0.95 * (midAngle(d2) < Math.PI ? 1 : -1);
                        return [arc.centroid(d2), outerArc.centroid(d2), pos];
                    };
                });

            polyline.exit()
                .remove();


            var sum = 0;
            for (var i = 0; i < data.length; ++i) {
                sum += parseInt(data[i]["count"]);
            }

            svg.append("text")
                    .attr("dx", "-3em")
                    .attr("dy", "-1.5em")
                    .attr("class", "data")
                    .text(function(d) { return "Total"; });

            svg.append("text")
                .attr("dy", ".35em")
                .style("text-anchor", "middle")
                .attr("class", "inside")
                .text(function(d) { return sum; });

            svg.append("text")
                .attr("dy", "2em")
                .attr("dx", "0.5em")
                .attr("class", "data")
                .text(function(d) { return "Builds"; });

            // Instantiate the results link view
            new ResultsLinkView({
                managerid: that.options.tabId + '-history-result-overview-search'
            }).render().$el.appendTo($('#' + that.options.tabId + '-history-result-overview .panel-body'));

        },

    });
});
