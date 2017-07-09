/// <reference path="../../scripts/typings/ionic/ionic.d.ts" />
/// <reference path="../../scripts/typings/angularjs/angular-route.d.ts" />
interface Navigator {
    app: any;
};

((): void => {
    "use strict";

    angular.module("lm.surveys")
        .run(RunIonic);

    RunIonic.$inject = ["$rootScope", "$ionicPlatform", "$route", "$ionicSideMenuDelegate", "$ionicPopup", "gettext"];
    function RunIonic(
        $rootScope: ng.IRootScopeService,
        $ionicPlatform: ionic.platform.IonicPlatformService,
        $route: ng.route.IRouteService,
        $ionicSideMenuDelegate: ionic.sideMenu.IonicSideMenuDelegate,
        $ionicPopup: ionic.popup.IonicPopupService,
        gettext: any) {

        $ionicPlatform.ready(function () {
            if (window.StatusBar) {
                // org.apache.cordova.statusbar required
                window.StatusBar.styleDefault();
            }

            document.addEventListener('deviceready', onDeviceReady, false);
        });

        function onDeviceReady() {
            document.addEventListener('pause', function (event) {
                $rootScope.$broadcast('cordovaPauseEvent');
            });

            document.addEventListener('resume', function (event) {
                $rootScope.$broadcast('cordovaResumeEvent');
            });
        }
    }
})();