/// <reference path="../../scripts/typings/ionic/ionic.d.ts" />
/// <reference path="../../scripts/typings/angularjs/angular-route.d.ts" />
interface Navigator {
    app: any;
};

((): void => {
    "use strict";

    angular.module("lm.surveys")
        .run(RunIonic)
        .run(configAngularMoment)
        .run(SetupLoginTransitionControls);

    RunIonic.$inject = ["$rootScope", "$state", "$ionicPlatform", "$ionicHistory", "$route",
        "$ionicSideMenuDelegate", "$ionicPopup", "gettext", "userService", "mediaService"];
    function RunIonic(
        $rootScope: ng.IRootScopeService,
        $state: ng.ui.IStateService,
        $ionicPlatform: ionic.platform.IonicPlatformService,
        $ionicHistory: ionic.navigation.IonicHistoryService,
        $route: ng.route.IRouteService,
        $ionicSideMenuDelegate: ionic.sideMenu.IonicSideMenuDelegate,
        $ionicPopup: ionic.popup.IonicPopupService,
        gettext: any,
        userService: App.Services.IUserService,
        mediaService: App.Services.IMediaService) {

        $ionicPlatform.ready(function () {
            if (window.StatusBar) {
                // org.apache.cordova.statusbar required
                window.StatusBar.styleDefault();
            }

            document.addEventListener('pause', function (event) {
                if ($rootScope.currentMedia) {
                    $rootScope.currentMedia.stop();
                    $rootScope.currentMedia.release();

                    if ($rootScope.mediaModal) {
                        $rootScope.mediaModal.hide();
                        $rootScope.mediaModal.remove();
                    }
                }

                if (mediaService.isCaptureInProgress()) {
                    // media capture in progress
                } else {
                    $ionicHistory.clearHistory();
                    $ionicHistory.clearCache();
                    userService.clearCurrent();
                }

            });

            document.addEventListener('resume', function (event) {
                if (!mediaService.isCaptureInProgress()) {
                    $state.go('login');
                }
            });
        });

        $ionicPlatform.registerBackButtonAction(function (event) {
            if ($state.current.name === 'home') {
                if ($ionicSideMenuDelegate.isOpen()) {
                    $ionicSideMenuDelegate.toggleLeft(false);
                    $ionicSideMenuDelegate.toggleRight(false);
                } else {
                    var popup = $ionicPopup.confirm({
                        title: 'Exit',
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
    }

    SetupLoginTransitionControls.$inject = ["$rootScope", "userService"];
    function SetupLoginTransitionControls(
        $rootScope: ng.IRootScopeService,
        userService: App.Services.IUserService) {

        $rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams) {
            var publicStates = ['login', 'register'];

            if (publicStates.indexOf(toState.name) !== -1 && publicStates.indexOf(fromState.name) !== -1)
                return;

            if (publicStates.indexOf(toState.name) !== -1 && userService.currentProfile !== null) {
                event.preventDefault();
            }

            if (publicStates.indexOf(fromState.name) !== -1 && userService.currentProfile === null) {
                event.preventDefault();
            }
        });
    }

    configAngularMoment.$inject = ["amMoment", "$locale"];
    function configAngularMoment(amMoment, $locale) {
        amMoment.changeLocale("en-GB");
    }
})();