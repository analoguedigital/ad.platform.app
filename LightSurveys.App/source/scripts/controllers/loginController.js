'use strict';
angular.module('lm.surveys').controller('loginController', ['$scope', '$rootScope', '$ionicHistory', '$ionicPlatform', '$state', '$stateParams', '$timeout', '$ionicModal',
    'userService', 'alertService', 'ngProgress', 'surveyService', 'fingerprintService', 'passcodeModalService', 'md5', 'toastr', 'localStorageService', 
    function ($scope, $rootScope, $ionicHistory, $ionicPlatform, $state, $stateParams, $timeout, $ionicModal, userService,
        alertService, ngProgress, surveyService, fingerprintService, passcodeModalService, md5, toastr, localStorageService) {
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
            //email: "manager@test.t",
            //password: "Test1234"
            email: "",
            password: ""
        };

        $scope.login = function () {
            if (!$scope.loginData.email) {
                alertService.show("Please enter your email");
            }
            else if (!$scope.loginData.password) {
                alertService.show("Please enter your password");
            }
            else {
                ngProgress.start();
                $scope.loginWorking = true;

                userService.login($scope.loginData)
                    .then(function () {
                        $scope.loginValidated = true;

                        if ($scope.profile)
                            userService.activateProfile($scope.profile);

                        surveyService.clearLocalData()
                            .then(function() {
                                console.warn('local data cleared out');
                            }, function(err) {
                                console.error(err);
                            });

                        surveyService.refreshData()
                            .then(function () {
                                ngProgress.complete();
                                $scope.loginWorking = false;
                                $ionicHistory.clearHistory();

                                var firstLogin = localStorageService.get(FIRST_TIME_LOGIN_KEY);
                                if (firstLogin === null || firstLogin === undefined) {
                                    localStorageService.set(FIRST_TIME_LOGIN_KEY, true);
                                    $state.go('makingRecords');
                                } else {
                                    $state.go('projects');
                                }
                            },
                            function (err) {
                                ngProgress.complete();
                                alertService.show(err);
                            });

                    },
                    function (err) {
                        ngProgress.complete();
                        $scope.loginWorking = false;
                        alertService.show(err);
                    });
            }
        };

        $scope.activateProfile = function (profile) {
            ngProgress.start();
            userService.activateProfile(profile);

            $ionicHistory.clearCache();
            $ionicHistory.clearHistory();

            $scope.loginValidated = true;
            ngProgress.complete();

            $ionicHistory.nextViewOptions({
                historyRoot: true,
                disableBack: true
            });

            $state.go('home');
        };

        $scope.$on('passcode-modal-pin-entered', function (ev, args) {
            var passcode = args;
            if (passcode && passcode.length === 4) {
                var hashed = md5.createHash(passcode || '');
                if (hashed === $scope.profile.settings.passcodeText) {
                    toastr.clear();
                    $timeout(function () {
                        $scope.loginValidated = true;
                        passcodeModalService.hideDialog();
                        $scope.activateProfile($scope.profile);
                    }, 250);
                } else {
                    alertService.show('Invalid code!');
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
                    $scope.existingProfiles = profiles;
                    if (profiles.length > 0) {
                        $scope.profile = profiles[0];

                        var settings = profiles[0].settings;
                        if (settings.fingerprintEnabled || settings.passcodeEnabled) {
                            if (settings.fingerprintEnabled === true) {
                                fingerprintService.isAvailable().then(function (isAvailable) {
                                    if (isAvailable) {
                                        // verify fingerprint
                                        fingerprintService.verify().then(function (result) {
                                            if (result.success === true) {
                                                $scope.loginValidated = true;
                                                $scope.activateProfile($scope.profile);
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
                });
        };
        $scope.activate();

    }]);