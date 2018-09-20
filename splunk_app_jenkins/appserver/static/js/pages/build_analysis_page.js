/*global require*/
require([
    'jquery',
    'underscore',
    'backbone',
    'splunkjs/mvc/headerview',
    'app/views/Pages/BuildAnalysisPage'
], function (
    $,
    _,
    Backbone,
    HeaderView,
    BuildAnalysisPageView
) {
    new HeaderView({
        id: 'header',
        section: 'dashboards',
        el: $('.preload'),
        acceleratedAppNav: true
    }).render();

    //Set the title
    document.title = 'Build Analysis';

    new BuildAnalysisPageView({
        el: $('.addonContainer')
    }).render();
});
