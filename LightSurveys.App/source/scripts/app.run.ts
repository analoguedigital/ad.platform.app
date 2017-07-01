/// <reference path="../../scripts/typings/ionic/ionic.d.ts" />
/// <reference path="../../scripts/typings/angularjs/angular-route.d.ts" />
interface Navigator {
    app: any;
};

((): void => {
    "use strict";

    angular.module("lm.surveys")
        .run(RunIonic);

    RunIonic.$inject = ["$ionicPlatform", "$route", "$ionicSideMenuDelegate", "$ionicPopup", "gettext"];
    function RunIonic($ionicPlatform: ionic.platform.IonicPlatformService,
        $route: ng.route.IRouteService,
        $ionicSideMenuDelegate: ionic.sideMenu.IonicSideMenuDelegate,
        $ionicPopup: ionic.popup.IonicPopupService,
        gettext: any) {

        $ionicPlatform.ready(function () {
            if (window.StatusBar) {
                // org.apache.cordova.statusbar required
                window.StatusBar.styleDefault();
            }
        });

        $ionicPlatform.registerBackButtonAction(function () {

            var currentTemplate = $route.current.templateUrl;

            if (currentTemplate == "partials/home.html") {
                if ($ionicSideMenuDelegate.isOpen()) {
                    $ionicSideMenuDelegate.toggleLeft(false);
                    $ionicSideMenuDelegate.toggleRight(false);
                } else {
                    var popup = $ionicPopup.confirm({
                        title: gettext('Exit'),
                        template: gettext('Are you sure you want to close the application?')
                    });

                    popup.then(function (res) {
                        if (res) {
                            navigator.app.exitApp();
                        }
                    });
                }
            } 
        }, 100);
    }
})();