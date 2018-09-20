/*global require*/
require([
    'jquery',
    'underscore',
    'backbone',
    'splunkjs/mvc/headerview',
    'app/views/Pages/OverviewPage'
], function (
    $,
    _,
    Backbone,
    HeaderView,
    OverviewPageView
) {
    new HeaderView({
        id: 'header',
        section: 'dashboards',
        el: $('.preload'),
        acceleratedAppNav: true
    }).render();

    //Set the title
    document.title = 'Overview';
    new OverviewPageView({
        el: $('.addonContainer')
    }).render();
});
