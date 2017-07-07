'use strict';
angular.module('lm.surveys').controller('passcodeModalController', ['$scope', '$rootScope', '$timeout', '$ionicModal', 'alertService', 'userService',
    function ($scope, $rootScope, $timeout, $ionicModal, alertService, userService) {
        $scope.passcode = '';

        $scope.addDigit = function (value) {
            if ($scope.passcode.length < 4) {
                $scope.passcode = $scope.passcode + value;
                if ($scope.passcode.length == 4) {
                    $rootScope.$broadcast('passcode-entered', $scope.passcode);
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

            $rootScope.$broadcast('passcode-save-button-clicked', $scope.passcode);
        }

        $scope.closeModal = function () {
            $rootScope.$broadcast('passcode-modal-closed', $scope.passcode);
        }
    }]);