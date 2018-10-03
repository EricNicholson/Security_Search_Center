'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// a shim that loads either an html5 <input type="range"> element or a jQuery UI Slider based on browser support
define([], function () {
    var Slider = function () {
        function Slider(container$El, minimumValue, maximumValue, initialValue, increment) {
            var _this = this,
                _arguments = arguments;

            var slideCallback = arguments.length <= 5 || arguments[5] === undefined ? function () {} : arguments[5];
            var changeCallback = arguments.length <= 6 || arguments[6] === undefined ? function () {} : arguments[6];

            _classCallCheck(this, Slider);

            this.container$El = container$El;
            this.slideCallback = slideCallback;
            this.changeCallback = changeCallback;

            if (testHtml5Slider()) {
                createInputRange$El.apply(this, arguments);
                this.changeCallback(initialValue);
            } else {
                require(['jquery-ui-slider'], function () {
                    createJQueryUISlider.apply(_this, _arguments);
                });
            }
        }

        _createClass(Slider, [{
            key: 'val',
            value: function val(value) {
                if (value != null) {
                    if (testHtml5Slider()) {
                        this.container$El.children('input[type="range"]').val(value);
                        this.changeCallback(value);
                    } else {
                        if (typeof this.container$El.slider === 'function') {
                            this.container$El.slider('value', value);
                        } else {
                            // if we're using the slider replacement and it hasn't loaded yet, save this value
                            this.deferredValue = value;
                        }
                    }
                }
            }
        }, {
            key: 'setDisabled',
            value: function setDisabled(disabled) {
                if (testHtml5Slider()) {
                    this.container$El.children('input[type="range"]').attr('disabled', disabled);
                } else {
                    if (typeof this.container$El.slider === 'function') {
                        this.container$El.slider('option', 'disabled', disabled);
                    }
                }
            }
        }, {
            key: 'enable',
            value: function enable() {
                this.setDisabled(false);
            }
        }, {
            key: 'disable',
            value: function disable() {
                this.setDisabled(true);
            }
        }]);

        return Slider;
    }();

    function createInputRange$El(container$El, minimumValue, maximumValue, initialValue, increment) {
        var slideCallback = arguments.length <= 5 || arguments[5] === undefined ? function () {} : arguments[5];
        var changeCallback = arguments.length <= 6 || arguments[6] === undefined ? function () {} : arguments[6];

        var slider$El = $('<input>').css('width', '100%');

        slider$El.attr({
            type: 'range',
            min: minimumValue,
            max: maximumValue,
            step: increment
        });

        // setting value in the .attr() call above causes issues in Firefox
        slider$El.val(initialValue);

        slider$El.on('input', function () {
            if (slideCallback != null) slideCallback(parseFloat(slider$El.val()));
        });

        slider$El.on('change', function () {
            if (changeCallback != null) changeCallback(parseFloat(slider$El.val()));
        });

        container$El.append(slider$El);
    }

    function createJQueryUISlider(container$El, minimumValue, maximumValue, initialValue, increment) {
        var slideCallback = arguments.length <= 5 || arguments[5] === undefined ? null : arguments[5];
        var changeCallback = arguments.length <= 6 || arguments[6] === undefined ? null : arguments[6];

        // if we tried to set a value before the slider was ready, apply that value now
        if (this.deferredValue != null) {
            initialValue = this.deferredValue;
            this.deferredValue = null;
        }

        container$El.slider({
            value: initialValue,
            min: minimumValue,
            max: maximumValue,
            step: increment,
            slide: function slide(event, ui) {
                if (slideCallback != null) slideCallback(ui.value);
            },
            change: function change(event, ui) {
                if (changeCallback != null) changeCallback(ui.value);
            }
        });

        if (changeCallback != null) changeCallback(initialValue);else if (slideCallback != null) slideCallback(initialValue);
    }

    var testHtml5Slider = function () {
        var html5slider = void 0;

        return function () {
            if (html5slider == null) {
                if (navigator.userAgent.indexOf('Trident') >= 0) {
                    // always fail on IE because while IE10/11 implement <input type="range"> they implement it incorrectly - they never fire the "input" event
                    html5slider = false;
                } else {
                    var test$El = document.createElement('input');
                    try {
                        test$El.type = 'range';
                        if (test$El.type == 'range') html5slider = true;
                    } catch (e) {
                        html5slider = false;
                    }
                }
            }

            return html5slider;
        };
    }();

    return Slider;
});
