(function () {
    'use strict';
    angular.module('lm.surveys').controller('loginController', ['$scope', '$state', '$stateParams', 'userService', 'httpService', 
        'surveyService', 'fingerprintService', 'passcodeModalService', 'md5', 'toastr', 'localStorageService', '$ionicLoading', '$ionicPlatform',
        function ($scope, $state, $stateParams, userService, httpService, surveyService,
            fingerprintService, passcodeModalService, md5, toastr, localStorageService, $ionicLoading, $ionicPlatform) {

            $scope.existingProfiles = [];
            $scope.profile = undefined;
            $scope.loginValidated = false;
            $scope.loginWorking = false;

            var rejected = $stateParams.rejected === 'true';
            var FIRST_TIME_LOGIN_KEY = 'FIRST_TIME_LOGIN';

            if (rejected) {
                userService.logOut();
                toastr.error('Login token expired. Please log in again');
            }

            $scope.loginData = {
                email: "",
                password: ""
            };

            $scope.login = function () {
                if (!$scope.loginData.email) {
                    toastr.error("Please enter your email address");
                } else if (!$scope.loginData.password) {
                    toastr.error("Please enter your password");
                } else {
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
                                                $scope.loginWorking = false;

                                                var firstLogin = localStorageService.get(FIRST_TIME_LOGIN_KEY);
                                                if (firstLogin === null || firstLogin === undefined)
                                                    localStorageService.set(FIRST_TIME_LOGIN_KEY, true);

                                                $ionicLoading.hide();
                                                $state.go('projects');
                                            },
                                            function (err) {
                                                $ionicLoading.hide();
                                                toastr.error(err);
                                            });
                                });
                            },
                            function (err) {
                                $scope.loginWorking = false;
                                $ionicLoading.hide();
                                if (err && err.length)
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

                        $ionicLoading.show({
                            template: '<i class="fa fa-circle-o-notch fa-spin fa-fw"></i> Getting things ready...'
                        });

                        userService.activateProfile($scope.profile);
                        localStorageService.remove('APP_BOOTSTRAPPED');

                        httpService.getUserInfo().then(function (freshUserInfo) {
                            $scope.profile.userInfo = freshUserInfo;

                            userService.saveProfile($scope.profile).then(function () {
                                // profile saved to local storage.
                                // update the app badge.
                                var adviceCount = freshUserInfo.notifications.adviceRecords;
                                if (adviceCount !== null) {
                                    $ionicPlatform.ready(function () {
                                        cordova.plugins.notification.badge.set(adviceCount);
                                    });
                                }

                                surveyService.refreshData()
                                    .then(function () {
                                        $state.go('projects');
                                    }, function (err) {
                                        console.error('could not refresh data', err);
                                        toastr.error(err);
                                    }).finally(function () {
                                        $ionicLoading.hide();
                                    });
                            });
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

                                                            // update user info
                                                            httpService.getUserInfo().then(function(freshUserInfo) {
                                                                $scope.profile.userInfo = freshUserInfo;

                                                                userService.saveProfile($scope.profile).then(function () {
                                                                    // profile saved to local storage.
                                                                    // update the app badge.
                                                                    var adviceCount = freshUserInfo.notifications.adviceRecords;
                                                                    if (adviceCount !== null) {
                                                                        $ionicPlatform.ready(function () {
                                                                            cordova.plugins.notification.badge.set(adviceCount);
                                                                        });
                                                                    }

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
                                                                });
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