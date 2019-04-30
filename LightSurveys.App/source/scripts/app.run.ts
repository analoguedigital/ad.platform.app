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

    RunIonic.$inject = ["$rootScope", "$state", "$ionicPlatform", "$ionicConfig", "$ionicHistory", "$route",
        "$ionicSideMenuDelegate", "$ionicPopup", "gettext", "userService", "mediaService", "$timeout", "$ionicScrollDelegate"];
    function RunIonic(
        $rootScope: ng.IRootScopeService,
        $state: ng.ui.IStateService,
        $ionicPlatform: ionic.platform.IonicPlatformService,
        $ionicConfig: ionic.utility.IonicConfigProvider,
        $ionicHistory: ionic.navigation.IonicHistoryService,
        $route: ng.route.IRouteService,
        $ionicSideMenuDelegate: ionic.sideMenu.IonicSideMenuDelegate,
        $ionicPopup: ionic.popup.IonicPopupService,
        gettext: any,
        userService: App.Services.IUserService,
        mediaService: App.Services.IMediaService,
        $timeout: ng.ITimeoutService,
        $ionicScrollDelegate: ionic.scroll.IonicScrollDelegate) {

        $ionicPlatform.ready(function () {
            if (window.StatusBar) {
                // org.apache.cordova.statusbar required
                window.StatusBar.styleDefault();

                if (ionic.Platform.isAndroid()) {
                    window.StatusBar.backgroundColorByHexString("#245278");
                } else if (ionic.Platform.isIOS()) {
                    window.StatusBar.overlaysWebView(true);
                }
            }

            if (ionic.Platform.grade.toLowerCase() != 'a') {
                $ionicConfig.views.transition('none');
                console.log('Ionic Platform Grade is not A, disabling views transitions');
            }

            // not necessary but it's a good practice. might help with view quirks and the nav-bar disappearance too.
            $ionicConfig.views.maxCache(0);            

            // enable JS scrolling
            $ionicConfig.scrolling.jsScrolling(true);

            document.addEventListener('pause', function (event) {
                console.warn('application paused', event);

                // release audio playback, if any.
                if ($rootScope.currentMedia) {
                    try {
                        $rootScope.currentMedia.stop();
                        $rootScope.currentMedia.release();

                        if ($rootScope.mediaModal) {
                            $rootScope.mediaModal.hide();
                            $rootScope.mediaModal.remove();
                        }
                    } catch (error) {
                        console.error('could not dispose media', error);
                    }
                }

                // if we're not coming back from media-capture, 
                // release active profile and enforce relog.
                if (!mediaService.isCaptureInProgress()) {
                    userService.getExistingProfiles().then((profiles) => {
                        var profile = profiles[0];
                        var autoLockoutDisabled = profile.settings.autoLockoutDisabled;
                        if (autoLockoutDisabled === false) {
                            $ionicHistory.clearHistory();
                            $ionicHistory.clearCache();
                            userService.clearCurrent();
                        }
                    });
                }
            });

            document.addEventListener('resume', function (event) {
                console.warn('application resumed', event);

                if (!mediaService.isCaptureInProgress()) {
                    userService.getExistingProfiles().then((profiles) => {
                        var profile = profiles[0];
                        var autoLockoutDisabled = profile.settings.autoLockoutDisabled;
                        if (autoLockoutDisabled === false) {
                            $state.go('login');
                        }
                    });
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
        }, 100);
    }

    configAngularMoment.$inject = ["amMoment", "$locale"];
    function configAngularMoment(amMoment, $locale) {
        amMoment.changeLocale("en-GB");
    }

    SetupLoginTransitionControls.$inject = ["$rootScope", "userService", "$ionicHistory"];
    function SetupLoginTransitionControls(
        $rootScope: ng.IRootScopeService,
        userService: App.Services.IUserService,
        $ionicHistory: ionic.navigation.IonicHistoryService) {

        $rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams) {
            var publicStates = ['landing', 'login', 'register', 'registerComplete', 'forgotPassword', 'resetPassword', 'confirmEmail'];

            if (publicStates.indexOf(toState.name) !== -1 && publicStates.indexOf(fromState.name) !== -1)
                return;

            if (publicStates.indexOf(toState.name) !== -1 && userService.currentProfile !== null) {
                event.preventDefault();
            }

            if (publicStates.indexOf(fromState.name) !== -1 && userService.currentProfile === null) {
                event.preventDefault();
            }

            if (toState.name === 'home') {
                $ionicHistory.clearCache();
                $ionicHistory.clearHistory();

                $ionicHistory.nextViewOptions({
                    historyRoot: true,
                    disableBack: true
                });
            }
        });
    }

    // refactor this filter to a separate file.
    angular.module("lm.surveys").filter('trusted', ['$sce', function ($sce: ng.ISCEService) {
        return $sce.trustAsResourceUrl;
    }]);
})();