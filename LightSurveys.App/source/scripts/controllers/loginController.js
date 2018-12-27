(function () {
    'use strict';
    angular.module('lm.surveys').controller('loginController', ['$scope', '$state', '$stateParams', 'userService',
        'alertService', 'ngProgress', 'surveyService', 'fingerprintService', 'passcodeModalService', 'md5', 'toastr', 'localStorageService', '$ionicLoading',
        function ($scope, $state, $stateParams, userService, alertService, ngProgress, surveyService, fingerprintService, passcodeModalService, md5, toastr, localStorageService, $ionicLoading) {
            $scope.existingProfiles = [];
            $scope.profile = undefined;
            $scope.loginValidated = false;
            $scope.loginWorking = false;

            var rejected = $stateParams.rejected === 'true';
            var FIRST_TIME_LOGIN_KEY = 'FIRST_TIME_LOGIN';

            if (rejected) {
                userService.logOut();
                // alertService.show("login timeout expired! Please login again.");
                toastr.error('Login token expired. Please log in again');
            }

            $scope.loginData = {
                email: "",
                password: ""
            };

            $scope.login = function () {
                if (!$scope.loginData.email) {
                    toastr.warning("Please enter your email");
                } else if (!$scope.loginData.password) {
                    toastr.warning("Please enter your password");
                } else {
                    ngProgress.start();
                    $scope.loginWorking = true;

                    userService.login($scope.loginData)
                        .then(function () {
                                $scope.loginValidated = true;

                                $ionicLoading.show({
                                    template: '<i class="fa fa-circle-o-notch fa-spin fa-fw"></i> Getting things ready...'
                                });

                                var lsKeys = localStorageService.keys();
                                var userKeys = _.filter(lsKeys, function(key) { return _.includes(key, 'user'); });
                                _.forEach(userKeys, function(uk) {
                                    localStorageService.remove(uk);
                                });

                                surveyService.clearLocalData().then(function () {
                                    surveyService.refreshData()
                                        .then(function () {
                                                ngProgress.complete();
                                                $scope.loginWorking = false;

                                                var firstLogin = localStorageService.get(FIRST_TIME_LOGIN_KEY);
                                                if (firstLogin === null || firstLogin === undefined)
                                                    localStorageService.set(FIRST_TIME_LOGIN_KEY, true);

                                                $ionicLoading.hide();
                                                $state.go('projects');
                                            },
                                            function (err) {
                                                $ionicLoading.hide();
                                                ngProgress.complete();
                                                // alertService.show(err);
                                                toastr.error(err);
                                            });
                                });
                            },
                            function (err) {
                                ngProgress.complete();
                                $scope.loginWorking = false;
                                $ionicLoading.hide();
                                toastr.error(err);
                            });
                }
            };

            $scope.activateProfile = function (profile) {
                userService.activateProfile(profile);
                $scope.loginValidated = true;
                $state.go('home');
            };

            $scope.$on('passcode-modal-pin-entered', function (ev, args) {
                var passcode = args;
                if (passcode && passcode.length === 4) {
                    var hashed = md5.createHash(passcode || '');
                    if (hashed === $scope.profile.settings.passcodeText) {
                        toastr.clear();
                        $scope.loginValidated = true;

                        passcodeModalService.hideDialog();
                        userService.activateProfile($scope.profile);
                        localStorageService.remove('APP_BOOTSTRAPPED');

                        $ionicLoading.show({
                            template: '<i class="fa fa-circle-o-notch fa-spin fa-fw"></i> Getting things ready...'
                        });

                        surveyService.refreshData()
                            .then(function () {
                                $state.go('projects');
                            }, function (err) {
                                console.error('could not refresh data', err);
                                toastr.error(err);
                            }).finally(function () {
                                $ionicLoading.hide();
                            });
                    } else {
                        toastr.error('Invalid PING code. Please try again.');
                        passcodeModalService.reset();
                    }
                }
            });

            $scope.$on('passcode-modal-forgot-pin', function (ev, args) {
                userService.clearCurrent();
                passcodeModalService.hideDialog();
            });

            $scope.fallbackToPasscode = function () {
                userService.clearCurrent();
                if ($scope.profile.settings.passcodeEnabled === true)
                    passcodeModalService.showDialog('login');
            };

            $scope.activate = function () {
                userService.getExistingProfiles()
                    .then(function (profiles) {
                        if (profiles.length) {
                            $scope.existingProfiles = profiles;
                            $scope.profile = profiles[0];

                            var settings = $scope.profile.settings;
                            if (settings === undefined) {
                                userService.logOut().then(function () {
                                    // force re-log. not necessary though.
                                });
                            } else {
                                if (settings.fingerprintEnabled || settings.passcodeEnabled) {
                                    if (settings.fingerprintEnabled === true) {
                                        fingerprintService.isAvailable().then(function (isAvailable) {
                                            if (isAvailable) {
                                                fingerprintService.verify()
                                                    .then(function (result) {
                                                        if (result.success === true) {
                                                            $ionicLoading.show({
                                                                template: '<i class="fa fa-circle-o-notch fa-spin fa-fw"></i> Getting things ready...'
                                                            });

                                                            $scope.loginValidated = true;
                                                            userService.activateProfile($scope.profile);
                                                            localStorageService.remove('APP_BOOTSTRAPPED');

                                                            surveyService.refreshData()
                                                                .then(function () {
                                                                    $state.go('projects');
                                                                }, function (err) {
                                                                    console.error('could not refresh data', err);
                                                                    toastr.error(err);
                                                                }).finally(function () {
                                                                    $ionicLoading.hide();
                                                                });
                                                        } else {
                                                            userService.logOut();
                                                            $scope.fallbackToPasscode();
                                                        }
                                                    }, function (error) {
                                                        userService.logOut();
                                                        $scope.fallbackToPasscode();
                                                    });
                                            } else {
                                                $scope.fallbackToPasscode(); // fingerprint not available
                                            }
                                        });
                                    } else {
                                        $scope.fallbackToPasscode();
                                    }
                                }
                            }
                        }
                    });
            };

            $scope.activate();
        }
    ]);
}());