'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

define([], function () {
    return (
        /**
         *
         * @param {element}         panel
         * @param {object|boolean} [footerButtons={}]                        If false, hide footer buttons; can also be an object to control individual buttons
         * @param {boolean}        [footerButtons.openInSearchButton=true]   If false, hide this button
         * @param {boolean}        [footerButtons.showSPLButton=true]        If false, hide this button
         * @param {boolean}        [footerButtons.scheduleAlertButton=false] If false, hide this button
         * @returns {{footer: (*|jQuery)}}
         */
        function AssistantPanelFooter(panel) {
            var footerButtons = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

            _classCallCheck(this, AssistantPanelFooter);

            var panelElements = {
                footer: $('<div>').addClass('mlts-panel-footer')
            };

            panel.find('.panel-body').append(panelElements.footer);
            
            if (footerButtons !== false) {
                if (footerButtons.openInSearchButton !== false) {
                    panelElements.openInSearchButton = $('<button>').addClass('btn btn-default mlts-open-in-search').text('Open in Search');
                }

                if (footerButtons.showSPLButton !== false) {
                    panelElements.showSPLButton = $('<button>').addClass('btn btn-default mlts-show-spl').text('Show SPL');
                }

                if (footerButtons.scheduleAlertButton === true) {
                    panelElements.scheduleAlertButton = $('<button>').addClass('btn btn-default mlts-schedule-alert').text('Schedule Alert');
                }

                if (footerButtons.scheduleHighCardinalityAlertButton === true) {
                    panelElements.scheduleHighCardinalityAlertButton = $('<button>').addClass('btn btn-default mlts-schedule-high-cardinality-alert').text('Schedule High Cardinality Alert');
                }

                panelElements.footer.append(panelElements.openInSearchButton, panelElements.showSPLButton, panelElements.scheduleAlertButton, panelElements.scheduleHighCardinalityAlertButton);
            }

            return panelElements;
        }
    );
});
