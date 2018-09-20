/**
* Created by jshao on 7/27/16.
*/

define([
    'jquery',
    'underscore',
    'backbone',
    'moment',
    'splunkjs/mvc',
    'splunkjs/mvc/searchmanager',
    'splunkjs/mvc/textinputview',
    "splunkjs/mvc/dropdownview",
    'splunkjs/mvc/multidropdownview',
    'splunkjs/mvc/tableview',
    'app/config/BuildAnalysisCfg'

], function ($,
    _,
    Backbone,
    moment,
    mvc,
    SearchManager,
    TextInputView,
    DropdownView,
    MultiDropdownView,
    TableView,
    BuildAnalysisCfg
) {

    var defaultNamespace = mvc.Components.getInstance("default");

    return {

        addTitleAndTooltip: function(viewElem, label){
            var start = '<span class = "view-title">';
            var title = label;
            var tooltip = '<sup><a class="filter-tooltip" data-original-title="" title="" style="visibility:hidden">' +
                '<i class="fa fa-question-circle-o" aria-hidden="true"></i>' +
                '</a></sup>';
            var end = '</span>'
            viewElem.$el.prepend(start + title + tooltip + end);
        },

        getElementId: function (label, prefix) {
            prefix = (prefix == undefined ? "" : prefix);
            return prefix + '_' + label.toLowerCase().replace(' ', '');
        },

        getSearchManagerId: function (label, prefix) {
            prefix = (prefix == undefined ? "" : prefix);
            return prefix + '_' + label.toLowerCase().replace(' ', '') + "_managerid";
        },

        getToken: function (name, prefix) {
            prefix = (prefix == undefined ? "" : prefix);
            return "$token_" + prefix + "_" + name.toLowerCase().replace(/\s+/g, '') + "$";
        },

        createDropdownView: function (filter, prefix, css_locate, className) {
            //label and managerid have the same value will cause error

            var token = this.getToken(filter["field"], prefix);

            var viewElem;

            if(filter["addDefaultChoice"]){
                 viewElem = new DropdownView({
                    id: this.getElementId(filter["label"], prefix),
                    managerid: this.getSearchManagerId(filter["label"], prefix),
                    valueField: filter["field"],
                    selectFirstChoice: true,
                    showClearButton: false,
                    choices: [{label: "*", value: "*"}],
                    default: ['*'],
                    width: 220
                });

                //set initial value
                if(viewElem.val() != undefined) {
                    var searchString = filter["field"] + "=\"" + viewElem.val() + "\" ";
                    defaultNamespace.set(token.replace(/\$/g, ''), searchString);
                }

            }else{
                viewElem = new DropdownView({
                    id: this.getElementId(filter["label"], prefix),
                    managerid: this.getSearchManagerId(filter["label"], prefix),
                    valueField: filter["field"],
                    selectFirstChoice: true,
                    showClearButton: false,
                    width: 220
                });

            }

            viewElem.$el.addClass(className);
            $(css_locate).append(viewElem.render().el);

            this.addTitleAndTooltip(viewElem, filter["label"]);
            var searchStr=filter["search"].replace(/%prefix%/g,prefix);
            var earliestStr=filter["earliest_time"]||'$earliest_time$';
            var latestStr=filter["latest_time"]||'$latest_time$';
            var searchManager = new SearchManager({
                id: this.getSearchManagerId(filter["label"], prefix),
                search: searchStr,
                latest_time: latestStr,
                earliest_time: earliestStr,
                status_buckets: 0
            }, {tokens: true});

            viewElem.on("change", function () {
                //make wildmask search when change
                var searchString = filter["field"] + "=\"" + viewElem.val() + "\" ";
                defaultNamespace.set(token.replace(/\$/g, ''), searchString);
            });

            return [viewElem, token];
        },

        createMultiDropdownView: function (filter, prefix, css_locate, className) {
            var token = this.getToken(filter["field"], prefix);
            var viewElem = new MultiDropdownView({
                id: this.getElementId(filter["label"], prefix),
                managerid: this.getSearchManagerId(filter["label"], prefix),
                valueField: filter["field"],
                width: 690
            });

            viewElem.$el.addClass(className);
            $(css_locate).append(viewElem.render().el);

            this.addTitleAndTooltip(viewElem, filter["label"]);
            var searchStr=filter["search"].replace(/%prefix%/g,prefix);
            var earliestStr=filter["earliest_time"]||'$earliest_time$';
            var latestStr=filter["latest_time"]||'$latest_time$';
            var searchManager = new SearchManager({
                id: this.getSearchManagerId(filter["label"], prefix),
                search: searchStr,
                latest_time: latestStr,
                earliest_time: earliestStr,
                status_buckets: 0
            }, {tokens: true});

            viewElem.on("change", function () {
                //make wildmask search when change
                var searchString = "";
                var elemValues = viewElem.val();
                if(elemValues && elemValues.length != 0){
                    for (var i = 0, l = elemValues.length; i < l; i++) {
                        if (filter["field"] == "job_result") {
                            if (elemValues[i] == "INPROGRESS") {
                                searchString += "type=\"started\""  + " OR "
                            }
                            else {
                                searchString += filter["field"] + "=\"" + elemValues[i] + "\"" + " OR "
                            }
                        } else {
                            searchString += filter["field"] + "=\"" + elemValues[i] + "\"" + " OR "
                        }
                    }
                    searchString = "(" + searchString.substring(0, searchString.length - 3) + ") ";
                    defaultNamespace.set(token.replace(/\$/g, ''), searchString);
                }else{
                    defaultNamespace.set(token.replace(/\$/g, ''), '');
                }
            });

            defaultNamespace.set(token.replace(/\$/g, ''), '');

            return [viewElem, token];
        },

        createTextInputView: function (filter, prefix, css_locate, className) {
            var token
            if(filter.hasOwnProperty("field")){
                token = this.getToken(filter["field"], prefix);
            }else{
                token = this.getToken(filter["label"], prefix);
            }

            var viewElem = new TextInputView({
                id: this.getElementId(filter["label"], prefix) ,
                // value: mvc.tokenSafe(token),
                initialValue: ""
            });

            viewElem.$el.addClass(className);
            $(css_locate).append(viewElem.render().el);

            this.addTitleAndTooltip(viewElem, filter["label"]);

            viewElem.on("change", function () {
                //make wildmask search when change
                var searchString = "";
                if(filter["field"] == undefined){
                     searchString = viewElem.val().trim();
                }else {
                    searchString = filter["field"] + "=\"*" + viewElem.val().trim() + "*\" ";
                }
                defaultNamespace.set(token.replace(/\$/g, ''), searchString);

            });

            //set initial value
            defaultNamespace.set(token.replace(/\$/g, ''), "");

            return [viewElem, token];

        },

        getBuildResult: function(type, job_result) {
            var result_class = '';
            if (type == 'completed') {
                //for completed job
                if (job_result == 'SUCCESS') {
                    result_class = 'Successful';
                } else if (job_result == 'FAILURE') {
                    result_class = 'Failed'
                } else if (job_result == 'ABORTED') {
                    result_class = 'Aborted';
                } else if (job_result == 'UNSTABLE') {
                    result_class = 'Unstable';
                }
            } else if (type == 'started') {
                //for running job
                result_class = 'Running';
            }
            return result_class;
        },

        relativeTimeToString: function (earliest_time) {
            switch (earliest_time) {
                case "-30d@d":
                    earliestTime = "in last 30 days";
                    break;
                case "-15d@d":
                    earliestTime = "in last 15 days";
                    break;
                case "-1d@d":
                    earliestTime = "Yesterday";
                    break;
                case "-24h@h":
                    earliestTime = "in last 24 Hours";
                    break;
                default:
                    earliestTime = "";
            }
            return earliestTime;

        },

        durationToString: function(duration) {
            var duration = moment.duration(parseInt(duration), 'seconds');
            var duration_str = '';
            if (duration.days() > 0) {
                duration_str += duration.days() + ' days ';
            }
            if (duration.hours() > 0) {
                duration_str += duration.hours() + ' hours ';
            }
            if (duration.minutes() > 0) {
                duration_str += duration.minutes() + ' minutes ';
            }
            if (duration.seconds() > 0) {
                duration_str += duration.seconds() + ' seconds';
            }
            if (duration_str == '') {
                duration_str = '0 second';
            }
            return duration_str;
        },

        numberToString: function(number, singular, plural) {
            if (!plural) {
                plural = singular + 's';
            }
            return number + ' ' + (number <= 1 ? singular : plural);
        },

        addFilter: function(filters, css_locate, prefix) {
            var totalFilterString = "";
            var jobResultFilterString = "";
            var that = this;

            _.each(filters, function (filter) {
                var data = [];

                if (prefix == "build_analysis") {
                    if (filter["field"] == "host"
                        || filter["field"] == "node"
                    ) {
                        css_locate = "#filterset #jenkins-master-slave"
                    } else {
                        css_locate = "#filterset #job-detail"
                    }
                }

                if (filter["type"] === "TextInputView") {
                    data = that.createTextInputView(filter, prefix, css_locate, "filterset-input");
                } else if (filter["type"] === "DropdownView") {
                    data = that.createDropdownView(filter, prefix, css_locate, "filterset-input");
                } else if (filter["type"] === "MultiDropdownView") {
                    data = that.createMultiDropdownView(filter, prefix, css_locate, "filterset-input")
                }

                var token = data[1];

                if (filter["field"] != "job_result") {
                    totalFilterString += token;
                }else {
                    jobResultFilterString = token;
                }
            });
            return [totalFilterString, jobResultFilterString];
        },

        addColumnRender: function (tableView, column) {
            var ICONS = {
                FAILURE: 'fa fa-times fa-1',
                UNSTABLE: 'fa fa-exclamation-circle fa-1',
                SUCCESS: 'fa fa-check-circle fa-1',
                ABORTED: 'fa fa-minus-circle fa-1',
                INPROGRESS: 'fa fa-refresh fa-spin fa-fw'
            };

            var RANGES = {
                FAILURE: 'text-error',
                UNSTABLE: 'text-warning',
                SUCCESS: 'text-success',
                ABORTED: 'text-muted',
                INPROGRESS: 'text-success'
            };

            var CustomIconCellRenderer = TableView.BaseCellRenderer.extend({
                canRender: function (cell) {
                    return cell.field === column;
                },

                render: function ($td, cell) {
                    var icon = 'fa fa-question-circle fa-1';
                    if (ICONS.hasOwnProperty(cell.value)) {
                        icon = ICONS[cell.value];
                    }

                    var range = 'text-warning';
                    if (RANGES.hasOwnProperty(cell.value)) {
                        range = RANGES[cell.value];
                    }

                    $td.addClass('icon').html(_.template('<i class="<%-icon%> <%- range %>" title="<%- result %>"></i>', {
                        icon: icon,
                        range: range,
                        result: cell.value
                    }));
                }
            });
            tableView.table.addCellRenderer(new CustomIconCellRenderer());
        },

        addJenkinsSlaveCustomIconRenderer: function(tableView) {
            var slave_styles = {
                "Online": ["fa fa-check-circle-o fa-lg", "fa fa-times-circle-o fa-lg"],
                "Busy": ["fa fa-cog fa-spin fa-lg", "fa fa-minus fa-lg"]
            };
            var color_style = {
                "Online-true": "text-success", "Online-false": "text-error",
                "Busy-true": "text-error", "Busy-false": "text-success"
            };

            var CustomIconCellRenderer = TableView.BaseCellRenderer.extend({
                canRender: function (cell) {
                    return cell.field === 'Online' || cell.field == "Slave URL" || cell.field == "Busy";
                },
                render: function ($td, cell) {
                    if (cell.field === 'Online' || cell.field === "Busy") {
                        var idx = cell.value == "true" ? 0 : 1;
                        var iconClass = slave_styles[cell.field][idx];
                        var colorClass = color_style[cell.field + "-" + cell.value];
                        colorClass = colorClass ? colorClass : "string";
                        // Create the icon element and add it to the table cell
                        $td.html(_.template('<i class="<%-icon%> <%-addClass%>" ></i>', {
                            icon: iconClass,
                            addClass: colorClass
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
            tableView.table.addCellRenderer(new CustomIconCellRenderer());
        },

        wordWrap: function(str, maxWidth) {
            function testWhite(x) {
                var white = new RegExp(/^\s$/);
                return white.test(x.charAt(0));
            };
            var newLineStr = "\n"; done = false; res = '';
            do {
                if (str.length < maxWidth) {
                    res += [str, newLineStr].join('');
                    done = true;
                    return res;
                }
                found = false;
                // Inserts new line at first whitespace of the line
                for (i = maxWidth - 1; i >= 0; i--) {
                    if (testWhite(str.charAt(i))) {
                        res = res + [str.slice(0, i), newLineStr].join('');
                        str = str.slice(i + 1);
                        found = true;
                        break;
                    }
                }
                // Inserts new line at maxWidth position, the word is too long to wrap
                if (!found) {
                    res += [str.slice(0, maxWidth), newLineStr].join('');
                    str = str.slice(maxWidth);
                }

            } while (!done);

            return res;
        },

        getComponentInstanceByFieldName: function(field){
            var filters = BuildAnalysisCfg.entity;
            _.each(filters, function(filter){
                if (field == filter["field"]){
                    var label = filter["label"].toLowerCase().replace(' ', '');
                    return mvc.Components.get(label);
                }
            });
        },

        escapeSplunkSearch: function(str) {
            return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\|/g, '\\|');
        },

        getAbsoluteUrl: function(url) {
            var a = document.createElement('a');
            a.href = url;
            return a.href;
        },

        unselectText: function() {
            if (window.getSelection) {
                if (window.getSelection().empty) {  // Chrome
                    window.getSelection().empty();
                } else if (window.getSelection().removeAllRanges) {  // Firefox
                    window.getSelection().removeAllRanges();
                }
            } else if (document.selection) {  // IE?
                document.selection.empty();
            }
        },
        wordUpperCase: function(str){
            return str.toLowerCase().replace(/\b([\w|']+)\b/g, function(word) {
                return word.replace(word.charAt(0), word.charAt(0).toUpperCase());
            });
        },
        useLocalCache: function (elem, keyName) {
            if(window.location.href.indexOf("?")!=-1){
                // skip cache for custom url parameters
                return;
            }
            if (typeof localStorage === "undefined" || typeof elem === "undefined") {
                return;
            }
            var inputModel;
            if(typeof elem === "string"){
                inputModel = mvc.Components.get(elem);
            }else{
                inputModel=elem;
            }
            if (typeof inputModel === "undefined") {
                return;
            }
            var localName = "app_jenkins_"+(keyName|| inputModel.id);

            var valStr = localStorage.getItem(localName),cachedValue;
            if (valStr && _.isString(valStr)) {
                try {
                    cachedValue = JSON.parse(valStr);
                    inputModel.val(cachedValue);
                    //turn off selectFirstChoice
                    if(inputModel.vizSettings && inputModel.vizSettings.get("selectFirstChoice")){
                        inputModel.vizSettings.set("selectFirstChoice",false);
                    }
                    //if it is a preset time
                    if (inputModel.settings && inputModel.settings.get("preset")) {
                        //debugger;
                        inputModel.settings.set("preset", null);
                    }
                } catch (e) {
                    console.warn("failed to parse cached value:"+e)
                    localStorage.removeItem(localName)
                }
            }
            inputModel.on("change", function (value) {
                if (typeof value === "undefined" || value === undefined || value === "") {
                    localStorage.removeItem(localName)
                } else {

                    localStorage.setItem(localName, JSON.stringify(value));
                }
            });
            return cachedValue;
        }
    };
});
