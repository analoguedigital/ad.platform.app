﻿'use strict';
angular.module('lm.surveys').controller('settingsController', ['$scope', '$rootScope', '$state', '$timeout', '$ionicModal', '$ionicPopup', 'alertService', 'userService',
    function ($scope, $rootScope, $state, $timeout, $ionicModal, $ionicPopup, alertService, userService) {
        $scope.passcodeModal = undefined;
        $scope.profile = undefined;
        $scope.passcodeSaved = false;

        $scope.model = {
            passcodeEnabled: false,
            fingerprintEnabled: false
        };

        $scope.$watch('model.passcodeEnabled', function (newValue, oldValue) {
            if (oldValue === false && newValue === true) {
                if (!$scope.passcodeSaved && !$scope.profile.settings.passcodeEnabled) {
                    $rootScope.$broadcast('passcode-clear');
                    $scope.passcodeModal.show();
                }
            }
            else if (oldValue === true && newValue === false) {
                if ($scope.passcodeSaved && $scope.profile.settings.passcodeEnabled) {
                    var confirmPopup = $ionicPopup.confirm({
                        title: 'Disable Local Passcode',
                        template: 'Are you sure you want to disable your local PIN login?'
                    });

                    confirmPopup.then(function (res) {
                        if (res) {
                            $scope.profile.settings.passcodeEnabled = false;
                            $scope.profile.settings.passcodeText = '';
                            $scope.passcodeSaved = false;

                            userService.saveProfile($scope.profile).then(function () { });
                        } else {
                            $scope.model.passcodeEnabled = true;
                        }
                    });
                }
            }
        });

        $scope.$watch('model.fingerprintEnabled', function (newValue, oldValue) {
            if (oldValue === false && newValue === true)
                $scope.profile.settings.fingerprintEnabled = true;
            else if (oldValue === true && newValue === false)
                $scope.profile.settings.fingerprintEnabled = false;

            if ($scope.profile) {
                userService.saveProfile($scope.profile).then(function () { });
            }
        });

        $scope.$on('passcode-save-button-clicked', function (ev, args) {
            $scope.profile.settings.passcodeEnabled = true;
            $scope.profile.settings.passcodeText = args;

            userService.saveProfile($scope.profile).then(function () {
                alertService.show('Passcode set!');
                $scope.passcodeSaved = true;
                $scope.passcodeModal.hide();
            });
        });

        $scope.$on('passcode-modal-closed', function (ev, args) {
            if ($scope.passcodeSaved == false)
                $scope.model.passcodeEnabled = false;
            $scope.passcodeModal.hide();
        });

        $scope.$on('$destroy', function () {
            $scope.passcodeModal.remove();
        });

        $scope.activate = function () {
            $ionicModal.fromTemplateUrl('partials/passcode-modal.html', {
                scope: $scope,
                animation: 'slide-in-up'
            }).then(function (modal) {
                $scope.passcodeModal = modal;

                userService.getExistingProfiles().then(function (profiles) {
                    if (profiles.length) {
                        var profile = profiles[0];
                        $scope.profile = profile;

                        $scope.model.passcodeEnabled = profile.settings.passcodeEnabled;
                        $scope.model.fingerprintEnabled = profile.settings.fingerprintEnabled;
                        $scope.passcodeSaved = profile.settings.passcodeEnabled;
                    }
                });
            });
        }
        $scope.activate();

    }]);