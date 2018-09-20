define([
    'jquery',
    'underscore',
    'backbone',
    'd3/d3',
    'splunkjs/mvc',
    'splunkjs/mvc/simplesplunkview',
    'app/util/app_info',
    'app/util/util'
], function (
    $,
    _,
    Backbone,
    d3,
    mvc,
    SimpleSplunkView,
    AppInfo,
    Util
) {
    return SimpleSplunkView.extend({
        className: 'jenkins-circle-packing-view',
        output_mode: 'json',

        createView: function() {
            var margin = {top: 10, right: 10, bottom: 10, left: 10};
            var availableWidth = parseInt(this.settings.get("width") || this.$el.width());
            var availableHeight = parseInt(this.settings.get("height") || this.$el.height());

            this.$el.html("");

            var svg = d3.select(this.el)
                .append("svg")
                .attr("width", availableWidth)
                .attr("height", availableHeight)
                .attr("pointer-events", "all")

            return { svg: svg, margin: margin};
        },

        formatData: function(data) {
            var root = {'name': 'Jenkins', 'children': []};

            for (var i = 0; i < data.length; ++i) {
                var item = data[i];
                var slaveInfo = {'name': item['node_name'], 'size': item['num_executors'], 'online': item['is_online'] == "true", 'busy': item['is_idle'] == "false"};
                var j = 0;
                for (j = 0; j < root['children'].length; ++j) {
                    if (root['children'][j]['name'] == item['host']) {
                        root['children'][j]['children'].push(slaveInfo);
                        break;
                    }
                }
                if (j == root['children'].length) {
                    root['children'].push({
                        'name': item['host'],
                        'children': [slaveInfo]
                    });
                }
            }

            return root;
        },

        updateView: function(viz, data) {

            var that = this;
            var containerHeight = this.$el.height();
            var containerWidth = this.$el.width();

            var margin = 20, width = containerWidth, height = containerHeight, diameter = containerHeight;

            // Clear svg
            var svg = $(viz.svg[0]);
            svg.empty();
            svg.height(containerHeight);
            svg.width(containerWidth);

            svg = viz.svg.append("g").attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

            // var color = d3.scale.linear()
            // .domain([-1, 5])
            // .range(["hsl(152,80%,80%)", "hsl(228,30%,40%)"])
            // .interpolate(d3.interpolateHcl);

            var pack = d3.layout.pack()
                .padding(2)
                .size([width - margin, height - margin])
                .sort(function(a,b) { return b.size - a.size; })
                .value(function(d) { return d.size; })

            // var svg = d3.select(this.el).append("svg")
            // .attr("width", width)
            // .attr("height", height)
            // .append("g")
            // .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");
            //
            // var that = this;

            var a = function(root) {

                var focus = root,
                nodes = pack.nodes(root), view;
                nodes.shift();

                var circle = svg.selectAll("circle")
                    .data(nodes)
                    .enter().append("circle")
                    .attr("class", function(d) { return d.parent ? d.children ? "node" : "node node--leaf" : "node node--root"; })
                    .style("fill", function(d) {
                        return that.get_jenkins_node_color(d);
                    })
                    .style("pointer-events", function(d) {return d.children && d.parent ? "auto" : "none";})
                    .on("click", function(d) {
                        if (!d.children) {
                            var url = AppInfo.get_app_url_prefix() + '/jenkins_slave?&master=' + encodeURIComponent(d.parent.name) + '&slave=' + encodeURIComponent(d.name);
                            window.open(url, '_blank');
                        } else {
                            if (focus != d) {
                                zoom(d);
                            } else {
                                zoom(root);
                            }
                        }
                        d3.event.stopPropagation();
                    })
                    .on("mouseleave", function(d) {
                        if ($('#display-hover-name #slave-name').text() == d.name) {
                            $('#display-hover-name #slave-name').html('');
                            $('#display-hover-name').removeClass()
                        }
                    })
                    .on("mouseover", function(d) {
                        var color = that.get_jenkins_node_color(d);
                        $('#display-hover-name').css("color", color);
                        $('#display-hover-name').attr("class", "fa fa-circle fa-2x");
                        $('#display-hover-name #slave-name').html(d.name);
                    });

                var text = svg.selectAll("text")
                    .data(nodes)
                    .enter().append("text")
                    .attr("class", "label")
                    .style("fill-opacity", function(d) { return d.parent === root ? 1 : 0; })
                    .style("display", function(d) { return d.parent === root ? "inline" : "none"; })
                    .text(function(d) {
                        return d.name;
                        //console.log(d);
                        //return d.name.substring(0, d.r / 3);
                    });

                var node = svg.selectAll("circle,text");

                d3.select(that.el)
                  .on("click", function() { zoom(root); });

                zoomTo([root.x, root.y, root.r * 2 + margin]);

                function zoom(d) {
                    var focus0 = focus; focus = d;

                    var transition = d3.transition()
                        .duration(d3.event.altKey ? 7500 : 750)
                        .tween("zoom", function(d) {
                            var i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2 + margin]);
                            return function(t) { zoomTo(i(t)); };
                        });

                    transition.selectAll("text")
                        .filter(function(d) { return d && (d.parent === focus || this.style.display === "inline"); })
                        .style("fill-opacity", function(d) { return d.parent === focus ? 1 : 0; })
                        .each("start", function(d) { if (d.parent === focus) this.style.display = "inline"; })
                        .each("end", function(d) { if (d.parent !== focus) this.style.display = "none"; })
                        .text(function(d) {
                            return d.name.substring(0, d.r * 80 / focus.r);
                        });

                    transition.selectAll("circle.node--leaf").style("pointer-events", function(d) {
                        return d.parent === focus ? "auto" : "none";
                    });

                }

                function zoomTo(v) {
                    var k = diameter / v[2]; view = v;
                    node.attr("transform", function(d) { return "translate(" + (d.x - v[0]) * k + "," + (d.y - v[1]) * k + ")"; });
                    circle.attr("r", function(d) { return d.r * k; });
                }
            };
            a(data);

            d3.select(self.frameElement).style("height", height + "px");

        },
        get_jenkins_node_color: function(d) {
            if (d.name == "Jenkins") {
                return "rgb(255,255,255)";
            }
            // for master
            if (d.children) {
                //return "rgb(30,147,198)";
                return "rgb(16,119,173)";
            }
            // for offline slave
            if (!d['online']) {
                return "rgb(214,86,60)";
            }
            // for busy slave
            if (d['busy']) {
                return "rgb(162,204,62)";
            }
            return "rgb(128,128,128)";
    }
    });
});
