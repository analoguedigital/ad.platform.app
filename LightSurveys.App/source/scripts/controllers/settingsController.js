'use strict';
angular.module('lm.surveys').controller('settingsController', ['$scope', '$state', '$timeout', '$ionicModal', 'alertService', 'userService',
    function ($scope, $state, $timeout, $ionicModal, alertService, userService) {
        $scope.modal = undefined;
        $scope.passcode = undefined;
        $scope.passcodeSaved = false;

        $scope.model = {
            passCodeEnabled: false,
            fingerPrintEnabled: false
        };

        $scope.$watch('model.passCodeEnabled', function (newValue, oldValue) {
            if (oldValue === false && newValue === true)
                $scope.openModal();
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

            alertService.show('Passcode set!');
            // TODO: store passcode

            $scope.passcodeSaved = true;
            $scope.closeModal();
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
    }]);