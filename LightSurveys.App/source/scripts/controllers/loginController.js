'use strict';
angular.module('lm.surveys').controller('loginController', ['$scope', '$ionicHistory', '$state', '$stateParams', '$timeout', '$ionicModal', 'userService', 'alertService', 'ngProgress', 'surveyService',
    function ($scope, $ionicHistory, $state, $stateParams, $timeout, $ionicModal, userService, alertService, ngProgress, surveyService) {
        $scope.passcodeModal = undefined;
        $scope.passcode = '';
        $scope.passcodeLoginMode = true;
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

        $scope.closeModal = function () {
            $scope.passcodeModal.hide();
        }

        $scope.$on('$destroy', function () {
            $scope.passcodeModal.remove();
        });

        $scope.addDigit = function (value) {
            if ($scope.passcode.length < 4) {
                $scope.passcode = $scope.passcode + value;
                if ($scope.passcode.length == 4) {
                    $scope.validatePasscode();
                }
            }
        }

        $scope.removeDigit = function () {
            if ($scope.passcode.length > 0) {
                $scope.passcode = $scope.passcode.substring(0, $scope.passcode.length - 1);
            }
        }

        $scope.validatePasscode = function () {
            var passcode = $scope.passcode;
            if (passcode.length == 4) {
                if (passcode === $scope.profile.settings.passcodeText) {
                    $timeout(function () {
                        $scope.closeModal();
                        $scope.activateProfile($scope.profile);
                    }, 500);
                } else {
                    alertService.show('Invalid code!');
                }
            }
        }

        $scope.activate = function () {
            $ionicModal.fromTemplateUrl('partials/passcode-modal.html', {
                scope: $scope,
                animation: 'slide-in-up'
            }).then(function (modal) {
                $scope.passcodeModal = modal;

                userService.getExistingProfiles()
                    .then(function (profiles) {
                        $scope.existingProfiles = profiles;
                        if (profiles.length > 0) {
                            $scope.profile = profiles[0];

                            $scope.isQuickLoginActive = true;
                            $scope.isQuickLoginAvailable = true;

                            var settings = profiles[0].settings;
                            if (settings.passcodeEnabled === true)
                                $scope.passcodeModal.show();
                        }
                    });
            });
        }
        $scope.activate();

    }]);