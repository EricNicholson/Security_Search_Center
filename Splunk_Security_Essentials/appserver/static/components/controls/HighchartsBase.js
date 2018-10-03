'use strict';

// A utility class that sets global options that should be used by all Highcharts instances
define(['highcharts-amd', 'no-data-to-display', 'components/data/parameters/ColorPalette'], function (Highcharts, NoData, ColorPalette) {
    Highcharts.setOptions({
        global: {
            useUTC: false
        },
        colors: ColorPalette.getColors()
    });

    return Highcharts;
});
