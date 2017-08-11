/// <reference path="../../scripts/typings/ionic/ionic.d.ts" />
/// <reference path="../../scripts/typings/angularjs/angular-route.d.ts" />
interface Navigator {
    app: any;
};

((): void => {
    "use strict";

    angular.module("lm.surveys")
        .run(RunIonic);

    RunIonic.$inject = ["$rootScope", "$state", "$ionicPlatform", "$ionicHistory", "$route",
        "$ionicSideMenuDelegate", "$ionicPopup", "gettext", "userService"];
    function RunIonic(
        $rootScope: ng.IRootScopeService,
        $state: ng.ui.IStateService,
        $ionicPlatform: ionic.platform.IonicPlatformService,
        $ionicHistory: ionic.navigation.IonicHistoryService,
        $route: ng.route.IRouteService,
        $ionicSideMenuDelegate: ionic.sideMenu.IonicSideMenuDelegate,
        $ionicPopup: ionic.popup.IonicPopupService,
        gettext: any,
        userService: App.Services.IUserService) {

        $ionicPlatform.ready(function () {
            if (window.StatusBar) {
                // org.apache.cordova.statusbar required
                window.StatusBar.styleDefault();
            }

            document.addEventListener('deviceready', onDeviceReady, false);
        });

        $ionicPlatform.registerBackButtonAction(function (event) {
            if ($state.current.name === 'home') {
                if ($ionicSideMenuDelegate.isOpen()) {
                    $ionicSideMenuDelegate.toggleLeft(false);
                    $ionicSideMenuDelegate.toggleRight(false);
                } else {
                    var popup = $ionicPopup.confirm({
                        title: 'Exit Docit',
                        template: 'Are you sure you want to close the application?'
                    });

                    popup.then(function (res) {
                        if (res) {
                            navigator.app.exitApp();
                        }
                    });
                }
            }
        }, 101);

        function onDeviceReady() {
            document.addEventListener('pause', function (event) {
                $ionicHistory.clearHistory();
                $ionicHistory.clearCache();
                userService.clearCurrent();
            });

            document.addEventListener('resume', function (event) {
                $state.go('login');
            });
        }
    }
})();