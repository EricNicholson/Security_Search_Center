/*global require*/
require([
    'jquery',
    'underscore',
    'backbone',
    'splunkjs/mvc/headerview',
    'app/views/Pages/TestAnalysisPage'
], function (
    $,
    _,
    Backbone,
    HeaderView,
    TestAnalysisPageView
) {
    new HeaderView({
        id: 'header',
        section: 'dashboards',
        el: $('.preload'),
        acceleratedAppNav: true
    }).render();

    //Set the title
    document.title = 'Test Results';

    new TestAnalysisPageView({
        el: $('.addonContainer')
    }).render();

});
