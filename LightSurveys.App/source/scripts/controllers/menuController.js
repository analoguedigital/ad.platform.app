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

        $scope.signOut = function () {
            surveyService.clearLocalData().then(function () {
                userService.logOut()
                    .then(function () {
                        $state.go('login');
                    });
            });
        }

        $scope.logOut = function () {
            userService.getExistingProfiles().then(function (profiles) {
                var profile = profiles[0];
                var confirmSignOut = profile.settings.confirmSignOut;

                if (confirmSignOut) {
                    var confirmTemplate = "<p>As a security feature, signing out clears the records and drafts from your device (but not from the server) and you will need to sign in again with your username and password. Then refresh the home screen by pulling it down to sync your records.</p><p>For quick login, go to <a ng-click='goToSettings()'>settings</a> and change your security preferences - create a PIN or enable fingerprint login. Then close the app by pressing the Home button. Signing out cancels the PIN or fingerprint setting.</p>";

                    $scope.signOutConfirmPopup = $ionicPopup.confirm({
                        title: 'Sign out',
                        subTitle: 'Are you sure you want to sign out?',
                        template: confirmTemplate,
                        scope: $scope,
                        buttons: [
                            {
                                text: 'Yes, sign out',
                                type: 'button-energized button-block',
                                onTap: function () {
                                    return true;
                                }
                            },
                            {
                                text: 'Cancel',
                                type: 'button-stable button-block'
                            }
                        ]
                    });

                    $scope.signOutConfirmPopup.then(function (res) {
                        if (res) {
                            $scope.signOut();
                        } else {
                            confirmPopup.close();
                        }
                    });
                } else {
                    $scope.signOut();
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