(function () {
    'use strict';
    angular.module('lm.surveys').controller('menuController', ['$scope', '$rootScope', '$ionicPopup', '$state',
        '$timeout', 'surveyService', 'userService', 'alertService', 'ngProgress', '$ionicLoading', 'toastr',
        function ($scope, $rootScope, $ionicPopup, $state, $timeout, surveyService, userService, alertService, ngProgress, $ionicLoading, toastr) {
            $scope.currentContext = userService.current;
            $scope.downloading = false;
            $scope.uploading = false;
            $scope.numberOfAvailableProjects = 0;
            $scope.profile = {};

            $rootScope.$on("update-menu-profile", function (event, args) {
                $scope.profile = args.profile;
            });

            $scope.initialize = function () {
                $scope.profile = $scope.currentContext.profile;

                $ionicLoading.show({
                    template: '<i class="fa fa-circle-o-notch fa-spin fa-fw"></i> Loading projects...'
                });

                surveyService.getProjects().then(function (projects) {
                    $scope.numberOfAvailableProjects = projects.length;
                }, function (err) {
                    console.error('could not get projects', err);
                }).finally(function () {
                    $ionicLoading.hide();
                });
            };

            $scope.refresh = function () {
                ngProgress.start();
                $scope.downloading = true;

                $ionicLoading.show({
                    template: '<i class="fa fa-circle-o-notch fa-spin fa-fw"></i> Refreshing data..'
                });

                surveyService.refreshData()
                    .then(function () {
                        _loadList();
                    }, function (err) {
                        // alertService.show(err);
                        console.error('could not refresh data', err);
                        toastr.error(err);
                    }).finally(function () {
                        ngProgress.complete();
                        $scope.downloading = false;
                        $ionicLoading.hide();
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

            $scope.goToSettings = function () {
                $scope.signOutConfirmPopup.close();
                $state.go('settings');
            };

            $scope.signOut = function () {
                surveyService.clearLocalData().then(function () {
                    userService.logOut().then(function () {
                        $state.go('login');
                    });
                });
            };

            $scope.logOut = function () {
                userService.getExistingProfiles().then(function (profiles) {
                    var profile = profiles[0];
                    var confirmSignOut = profile.settings.confirmSignOut;

                    if (confirmSignOut) {
                        var confirmTemplate = "<p>For security, signing out here clears all records and drafts from your device and cancels PIN and Fingerprint login. All uploaded records (but NOT drafts) are saved on our server. You will need to sign in again with username and password, then reload your records by pulling down the home screen.</p><p>For quick login, go to <a ng-click='goToSettings()'>settings</a> and change your security preferences - create a PIN or enable fingerprint login. Then close the app by pressing the Home button.</p>";

                        $scope.signOutConfirmPopup = $ionicPopup.confirm({
                            title: 'Sign out',
                            subTitle: 'Are you sure you want to sign out?',
                            template: confirmTemplate,
                            scope: $scope,
                            buttons: [{
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

            $scope.activate = function () {
                if (userService.currentProfile !== null && userService.currentProfile.lastRefreshTemplate === undefined) {
                    $scope.downloading = true;
                    ngProgress.start();

                    $ionicLoading.show({
                        template: '<i class="fa fa-circle-o-notch fa-spin fa-fw"></i> Refreshing data...'
                    });

                    surveyService.refreshData()
                        .then(function () {
                            userService.currentProfile.lastRefreshTemplate = new Date();
                            $scope.initialize();
                        }, function (err) {
                            // alertService.show(err);
                            console.error('could not refresh data', err);
                            toastr.error(err);
                        }).finally(function () {
                            $scope.downloading = false;
                            ngProgress.complete();
                            $ionicLoading.hide();
                        });
                } else {
                    $scope.initialize();
                }
            };

            $scope.activate();
        }
    ]);
}());