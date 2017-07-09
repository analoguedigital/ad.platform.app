'use strict';
angular.module('lm.surveys').controller('loginController', ['$scope', '$ionicHistory', '$state', '$stateParams', '$timeout', '$ionicModal',
    'userService', 'alertService', 'ngProgress', 'surveyService', 'fingerprintService',
    function ($scope, $ionicHistory, $state, $stateParams, $timeout, $ionicModal, userService, alertService, ngProgress, surveyService, fingerprintService) {
        $scope.passcodeModal = undefined;
        $scope.passcodeLoginMode = true;

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

        $scope.$on('$destroy', function () {
            if ($scope.passcodeModal)
                $scope.passcodeModal.remove();
        });

        $scope.$on('passcode-entered', function (ev, args) {
            var passcode = args;
            if (passcode && passcode.length == 4) {
                if (passcode === $scope.profile.settings.passcodeText) {
                    $timeout(function () {
                        $scope.passcodeModal.hide();
                        $scope.activateProfile($scope.profile);
                    }, 500);
                } else {
                    alertService.show('Invalid code!');
                }
            }
        });

        $scope.$on('passcode-forgot-pin', function (ev, args) {
            userService.logOut();
            $scope.isQuickLoginActive = false;
            $scope.isQuickLoginAvailable = false;
            $scope.passcodeModal.hide();
        });

        $scope.activate = function () {
            userService.getExistingProfiles()
                .then(function (profiles) {
                    $scope.existingProfiles = profiles;
                    if (profiles.length > 0) {
                        $scope.profile = profiles[0];

                        $scope.isQuickLoginActive = true;
                        $scope.isQuickLoginAvailable = true;

                        var settings = profiles[0].settings;
                        fingerprintService.isAvailable().then((isAvailable) => {
                            if (isAvailable && settings.fingerprintEnabled === true) {
                                fingerprintService.verify().then(function (result) {
                                    if (result.success === true) {
                                        $scope.activateProfile($scope.profile);
                                    } else {
                                        userService.logOut();
                                        $scope.isQuickLoginActive = false;
                                        $scope.isQuickLoginAvailable = false;
                                    }
                                });
                            } else {
                                if (settings.passcodeEnabled === true) {
                                    $ionicModal.fromTemplateUrl('partials/passcode-modal.html', {
                                        scope: $scope,
                                        animation: 'slide-in-up'
                                    }).then(function (modal) {
                                        $scope.passcodeModal = modal;
                                        $scope.passcodeModal.show();
                                    });
                                }
                            }
                        });
                    }
                });
        }
        $scope.activate();
    }]);