/*global require*/
require([
    'jquery',
    'underscore',
    'backbone',
    'splunkjs/mvc/headerview',
    'app/views/Pages/JenkinsSlavePage'
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
    document.title = 'Jenkins Slaves';

    new BuildAnalysisPageView({
        el: $('.addonContainer')
    }).render();
});
