'use strict';
angular.module('lm.surveys').controller('loginController', ['$scope', '$rootScope', '$ionicHistory', '$ionicPlatform', '$state', '$stateParams', '$timeout', '$ionicModal',
    'userService', 'alertService', 'ngProgress', 'surveyService', 'fingerprintService', 'passcodeModalService', 'md5', 'toastr', 'localStorageService', 'storageService',
    function ($scope, $rootScope, $ionicHistory, $ionicPlatform, $state, $stateParams, $timeout, $ionicModal, userService,
        alertService, ngProgress, surveyService, fingerprintService, passcodeModalService, md5, toastr, localStorageService, storageService) {
        $scope.existingProfiles = [];
        $scope.profile = undefined;
        $scope.loginValidated = false;

        $scope.loginWorking = false;

        var rejected = $stateParams.rejected === 'true';
        var FIRST_TIME_LOGIN_KEY = 'FIRST_TIME_LOGIN';

        if (rejected) {
            userService.logOut();
            alertService.show("login timeout expired! Please login again.");
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

                            _.forEach(localStorageService.keys(), function (key) {
                                if (_.includes(key, 'user')) {
                                    localStorageService.remove(key);
                                }
                            });

                            surveyService.clearLocalData().then(function () {
                                surveyService.refreshData()
                                    .then(function () {
                                            ngProgress.complete();
                                            $scope.loginWorking = false;

                                            var firstLogin = localStorageService.get(FIRST_TIME_LOGIN_KEY);
                                            if (firstLogin === null || firstLogin === undefined)
                                                localStorageService.set(FIRST_TIME_LOGIN_KEY, true);

                                            $state.go('projects');
                                        },
                                        function (err) {
                                            ngProgress.complete();
                                            alertService.show(err);
                                        });
                            });
                        },
                        function (err) {
                            ngProgress.complete();
                            $scope.loginWorking = false;
                            toastr.error(err);
                        });
            }
        };

        $scope.activateProfile = function (profile) {
            ngProgress.start();
            userService.activateProfile(profile);

            $scope.loginValidated = true;
            ngProgress.complete();

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

                    surveyService.refreshData()
                        .then(function () {
                                $state.go('projects');
                            },
                            function (err) {
                                toastr.error(err);
                            });
                } else {
                    toastr.error('Invalid code. Try again.');
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
                                            fingerprintService.verify().then(function (result) {
                                                if (result.success === true) {
                                                    $scope.loginValidated = true;
                                                    userService.activateProfile($scope.profile);

                                                    surveyService.refreshData()
                                                        .then(function () {
                                                                $state.go('projects');
                                                            },
                                                            function (err) {
                                                                toastr.error(err);
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
                                            // fingerprint not available
                                            $scope.fallbackToPasscode();
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