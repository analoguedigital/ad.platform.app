// For an introduction to the Blank template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkID=397704
// To debug code on page load in cordova-simulate or on Android devices/emulators: launch your app, set breakpoints, 
// and then run "window.location.reload()" in the JavaScript Console.
(function () {
    "use strict";
    if (window.cordova !== undefined) {
        document.addEventListener('deviceready', onDeviceReady.bind(this), false);
    } else {
        bootstrapAngularApp();
    }

    function onDeviceReady() {

        // Handle the Cordova pause and resume events
        document.addEventListener('pause', onPause.bind(this), false);
        document.addEventListener('resume', onResume.bind(this), false);
        document.addEventListener("backbutton", onBackKeyDown, true);

        bootstrapAngularApp();
    }

    function onPause() {
        // TODO: This application has been suspended. Save application state here.
    }

    function onResume() {
        // TODO: This application has been reactivated. Restore application state here.
    }

    function bootstrapAngularApp() {
        angular.bootstrap(window.document, ['lm.surveys'], false);
    }

    function onBackKeyDown(e) {
        e.preventDefault();
        navigator.app.backHistory();
        return false;
    }
})();