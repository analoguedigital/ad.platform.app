'use strict';
angular.module('lm.surveys').controller('loginController', ['$scope', '$rootScope', '$ionicHistory', '$ionicPlatform', '$state', '$stateParams', '$timeout', '$ionicModal',
    'userService', 'alertService', 'ngProgress', 'surveyService', 'fingerprintService',
    function ($scope, $rootScope, $ionicHistory, $ionicPlatform, $state, $stateParams, $timeout, $ionicModal, userService, alertService, ngProgress, surveyService, fingerprintService) {
        $scope.passcodeModal = undefined;
        $scope.passcodeLoginMode = true;
        $scope.loginValidated = false;

        $scope.existingProfiles = [];
        $scope.profile = undefined;

        var rejected = $stateParams.rejected === 'true';

        if (rejected) {
            userService.logOut();
            alertService.show("login timeout expired! Please login again.")
        }

        $scope.loginData = {
            //email: "manager@test.t",
            //password: "Test1234"
            email: "",
            password: ""
        };

        $scope.isQuickLoginActive = false;
        $scope.isQuickLoginAvailable = false;

        $scope.login = function () {
            if (!$scope.loginData.email) {
                alertService.show("Please enter your email");
            }
            else if (!$scope.loginData.password) {
                alertService.show("Please enter your password");
            }
            else {
                ngProgress.start();

                userService.login($scope.loginData)
                    .then(function () {
                        $scope.loginValidated = true;

                        if ($scope.profile)
                            userService.activateProfile($scope.profile);

                        surveyService.refreshData()
                            .then(function () {
                                ngProgress.complete();
                                $ionicHistory.clearHistory();
                                $state.go('projects');
                            },
                            function (err) {
                                ngProgress.complete();
                                alertService.show(err);
                            });

                    },
                    function (err) {
                        ngProgress.complete();
                        alertService.show(err);
                    });
            }
        };

        $scope.activateProfile = function (profile) {
            ngProgress.start();

            userService.activateProfile(profile);
            $ionicHistory.clearHistory();
            $scope.loginValidated = true;
            $state.go('home');
            ngProgress.complete();
        };


        $scope.goRegister = function () {
            ngProgress.start();
            $state.go('register');
            ngProgress.complete();
        }

        $scope.loginWithDifferentAccount = function () {
            $scope.isQuickLoginActive = false;
        }

        $scope.loginWithExistingAccounts = function () {
            $scope.isQuickLoginActive = true;
        }

        $scope.$on('passcode-entered', function (ev, args) {
            var passcode = args;
            if (passcode && passcode.length == 4) {
                if (passcode === $scope.profile.settings.passcodeText) {
                    $timeout(function () {
                        $scope.loginValidated = true;
                        $scope.passcodeModal.hide();
                        $scope.activateProfile($scope.profile);
                    }, 500);
                } else {
                    alertService.show('Invalid code!');
                    $scope.$broadcast('passcode-clear');
                }
            }
        });

        $scope.$on('passcode-forgot-pin', function (ev, args) {
            userService.logOut();
            $scope.isQuickLoginActive = false;
            $scope.isQuickLoginAvailable = false;
            $scope.passcodeModal.hide();
        });

        $scope.showPasscodeDialog = function () {
            if ($scope.passcodeModal)
                $scope.passcodeModal.show();
            else {
                $ionicModal.fromTemplateUrl('partials/passcode-modal.html', {
                    scope: $scope,
                    animation: 'slide-in-up',
                    backdropClickToClose: false,
                    hardwareBackButtonClose: false
                }).then(function (modal) {
                    $scope.passcodeModal = modal;
                    $scope.passcodeModal.show();
                });
            }
        }

        $scope.activate = function () {
            userService.getExistingProfiles()
                .then(function (profiles) {
                    $scope.existingProfiles = profiles;
                    if (profiles.length > 0) {
                        $scope.profile = profiles[0];

                        var settings = profiles[0].settings;
                        if (settings.fingerprintEnabled || settings.passcodeEnabled) {
                            if (settings.fingerprintEnabled == true) {
                                fingerprintService.isAvailable().then((isAvailable) => {
                                    if (isAvailable) {
                                        // verify fingerprint
                                        fingerprintService.verify().then(function (result) {
                                            if (result.success === true) {
                                                $scope.loginValidated = true;
                                                $scope.activateProfile($scope.profile);
                                            } else {
                                                if (settings.passcodeEnabled == true) {
                                                    $scope.showPasscodeDialog();
                                                } else {
                                                    userService.clearCurrent();
                                                }
                                            }
                                        }, function (error) {
                                            if (settings.passcodeEnabled == true) {
                                                $scope.showPasscodeDialog();
                                            } else {
                                                userService.clearCurrent();
                                            }
                                        });
                                    } else {
                                        // fingerprint not available
                                        if (settings.passcodeEnabled == true)
                                            $scope.showPasscodeDialog();
                                        else
                                            userService.clearCurrent();
                                    }
                                });
                            } else if (settings.passcodeEnabled == true) {
                                $scope.showPasscodeDialog();
                            }
                        } else {
                            $scope.isQuickLoginActive = true;
                            $scope.isQuickLoginAvailable = true;
                        }
                    }
                });
        }
        $scope.activate();

        $rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams) {
            if (toState.name == 'login' && userService.currentProfile !== null) {
                event.preventDefault();
            }

            if (fromState.name == 'login' && !$scope.loginValidated) {
                event.preventDefault();
            }
        });

        $rootScope.$on('cordovaResumeEvent', function () {
            $state.go('login');
        });

        $rootScope.$on('cordovaPauseEvent', function () {
            $ionicHistory.clearHistory();
            $ionicHistory.clearCache();
            userService.clearCurrent();
        });

        $scope.$on('$destroy', function () {
            if ($scope.passcodeModal)
                $scope.passcodeModal.remove();
        });

    }]);