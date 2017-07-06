'use strict';
angular.module('lm.surveys').controller('settingsController', ['$scope', '$state', '$timeout', '$ionicModal', 'alertService', 'userService',
    function ($scope, $state, $timeout, $ionicModal, alertService, userService) {
        $scope.modal = undefined;
        $scope.profile = undefined;

        $scope.passcode = undefined;
        $scope.passcodeSaved = false;

        $scope.model = {
            passCodeEnabled: false,
            fingerPrintEnabled: false
        };

        $scope.$watch('model.passCodeEnabled', function (newValue, oldValue) {
            if (oldValue === false && newValue === true)
                $scope.openModal();
            else if (oldValue === true && newValue === false) {
                $scope.profile.settings.passcodeEnabled = false;
                $scope.profile.settings.passcodeText = '';
                userService.saveProfile($scope.profile).then(function () { });
            }
        });

        $scope.$watch('model.fingerPrintEnabled', function (newValue, oldValue) {
            if (oldValue === false && newValue === true)
                $scope.profile.settings.fingerprintEnabled = true;
            else if (oldValue === true && newValue === false)
                $scope.profile.settings.fingerprintEnabled = false;

            userService.saveProfile($scope.profile).then(function () { });
        });

        $scope.addDigit = function (value) {
            if ($scope.passcode.length < 4) {
                $scope.passcode = $scope.passcode + value;
                if ($scope.passcode.length == 4) {
                    console.info('four digits entered', $scope.passcode);
                }
            }
        }

        $scope.removeDigit = function () {
            if ($scope.passcode.length > 0) {
                $scope.passcode = $scope.passcode.substring(0, $scope.passcode.length - 1);
            }
        }

        $scope.savePasscode = function () {
            if ($scope.passcode.length < 4) {
                alertService.show('Please enter a passcode first');
                return;
            }

            $scope.profile.settings.passcodeEnabled = true;
            $scope.profile.settings.passcodeText = $scope.passcode;

            userService.saveProfile($scope.profile).then(function () {
                alertService.show('Passcode set!');
                $scope.passcodeSaved = true;
                $scope.closeModal();
            });
        }

        $ionicModal.fromTemplateUrl('partials/passcode-modal.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function (modal) {
            $scope.modal = modal;
        });

        $scope.openModal = function () {
            $scope.passcode = '';
            $scope.passcodeSaved = false;
            $scope.modal.show();
        };

        $scope.closeModal = function () {
            $scope.model.passCodeEnabled = $scope.passcodeSaved;
            $scope.modal.hide();
        };

        $scope.$on('$destroy', function () {
            $scope.modal.remove();
        });

        $scope.activate = function () {
            userService.getExistingProfiles().then(function (profiles) {
                if (profiles.length) {
                    var profile = profiles[0];
                    $scope.profile = profile;
                    $scope.model.passCodeEnabled = profile.settings.passcodeEnabled;
                    $scope.model.fingerPrintEnabled = profile.settings.fingerprintEnabled;
                }
            });
        }
        $scope.activate();

    }]);