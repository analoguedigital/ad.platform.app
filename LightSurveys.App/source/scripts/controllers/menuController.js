'use strict';
angular.module('lm.surveys').controller('menuController', ['$scope', '$rootScope', '$ionicPopup', '$state',
    '$timeout', 'surveyService', 'userService', 'alertService', 'ngProgress', 'storageService',
    function ($scope, $rootScope, $ionicPopup, $state, $timeout, surveyService, userService, alertService, ngProgress, storageService) {
        $scope.currentContext = userService.current;
        $scope.downloading = false;
        $scope.uploading = false;
        $scope.numberOfAvailableProjects = 0;
        $scope.profile = {};

        $rootScope.$on("update-menu-profile", function (event, args) {
            $scope.profile = args.profile;
        });

        var init = function () {
            $scope.profile = $scope.currentContext.profile;

            surveyService.getProjects().then(function (projects) {
                $scope.numberOfAvailableProjects = projects.length;
            });
        }

        $scope.refresh = function () {

            ngProgress.start();
            $scope.downloading = true;

            surveyService.refreshData()
                .then(function () {
                    _loadList();
                    $scope.downloading = false;
                    ngProgress.complete();
                }, function (err) {
                    ngProgress.complete();
                    $scope.downloading = false;
                    alertService.show(err);
                });
        };


        $scope.uploadAll = function () {

            if ($scope.uploading) return;
            $scope.uploading = true;

            ngProgress.start();

            $scope.progressText = '';
            $scope.numberOfSuccessfuls = 0;
            $scope.numberOfErrors = 0;

            var progressPopup = $ionicPopup.show({
                template: "<div dir='ltr'>{{progressText}} <br /> <small> Successful uploads: {{numberOfSuccessfuls}}</small> <br /><small>Number of errors: {{numberOfErrors}}</small></div>",
                title: 'Upload progress',
                scope: $scope
            });

            $timeout(function () {
                surveyService.uploadAllSurveys()
                    .then(function () {
                            ngProgress.complete();
                            $scope.uploading = false;
                            $timeout(function () {
                                progressPopup.close();
                            }, 5000);
                            _loadList();
                        },
                        function (err) {
                            console.log(err);
                            alertService.show("Error in uploading surveys!");
                        },
                        function (state) {
                            $scope.progressText = state.totalProcessed + ' of ' + state.totalNumber;
                            $scope.numberOfSuccessfuls = state.totalSuccessful;
                            $scope.numberOfErrors = state.totalErrors;
                            console.log(state);
                        });
            }, 500);

        };


        $scope.goToProjects = function () {
            $state.go("projects");
        };

        $scope.goToCalendar = function () {
            $state.go('calendar');
        };

        $scope.goToTimeline = function () {
            $state.go('timeline');
        };

        $scope.switchUser = function () {
            $state.go('login');
        };

        $scope.goToSettings = function() {
            $scope.signOutConfirmPopup.close();
            $state.go('settings');
        }

        $scope.logOut = function () {
            var confirmTemplate = "<p>Signing out will clear local data from your device. And you will need to sign in again with your username and password.</p>" + 
                "<p>You could go to <a ng-click='goToSettings()'>Settings</a> and change your security preferences.</p>" + 
                "<p>You can enable fingerprint login if your device supports Touch ID. Alternatively, you can create a local PIN code and use that instead.</p>";

            $scope.signOutConfirmPopup = $ionicPopup.confirm({
                title: 'Sign out',
                subTitle: 'Are you sure you want to sign out?',
                template: confirmTemplate,
                scope: $scope,
                buttons: [{
                        text: 'Cancel',
                        type: 'button-stable'
                    },
                    {
                        text: 'Sign out',
                        type: 'button-energized',
                        onTap: function() {
                            return true;
                        }
                    }
                ]
            });

            $scope.signOutConfirmPopup.then(function (res) {
                if (res) {
                    surveyService.clearLocalData().then(function () {
                        userService.logOut()
                            .then(function () {
                                $state.go('login');
                            });
                    });
                } else {
                    confirmPopup.close();
                }
            });
        };

        if (userService.currentProfile !== null && userService.currentProfile.lastRefreshTemplate === undefined) {

            $scope.downloading = true;
            ngProgress.start();
            surveyService.refreshData()
                .then(function () {
                        $scope.downloading = false;
                        ngProgress.complete();
                        userService.currentProfile.lastRefreshTemplate = new Date();
                        init();
                    },
                    function (err) {
                        $scope.downloading = false;
                        ngProgress.complete();
                        alertService.show(err);
                    });
        } else {
            init();
        }

    }
]);