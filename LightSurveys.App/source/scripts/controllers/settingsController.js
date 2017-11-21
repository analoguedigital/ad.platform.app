'use strict';
angular.module('lm.surveys').controller('settingsController', ['$scope', '$rootScope', '$state', '$timeout', '$ionicModal',
    '$ionicPopup', 'alertService', 'userService', 'surveyService', 'passcodeModalService', 'md5', 'fingerprintService', 'alternateIconService',
    function ($scope, $rootScope, $state, $timeout, $ionicModal,
        $ionicPopup, alertService, userService, surveyService, passcodeModalService, md5, fingerprintService, alternateIconService) {

        $scope.profile = undefined;
        $scope.passcodeSaved = false;
        $scope.fingerprintHardwareDetected = false;
        $scope.canChangeAppIcon = false;
        $scope.selectedAppIcon = undefined;

        $scope.model = {
            passcodeEnabled: false,
            fingerprintEnabled: false,
            noStoreEnabled: false
        };

        $scope.$watch('model.passcodeEnabled', function (newValue, oldValue) {
            if (oldValue === false && newValue === true) {
                if (!$scope.passcodeSaved && !$scope.profile.settings.passcodeEnabled) {
                    passcodeModalService.showDialog('setpasscode', 'Enable login by passcode');
                }
            }
            else if (oldValue === true && newValue === false) {
                if ($scope.passcodeSaved && $scope.profile.settings.passcodeEnabled) {
                    passcodeModalService.showDialog('disable', 'Disable login by passcode');
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

        $scope.$watch('model.noStoreEnabled', function (newValue, oldValue) {
            $scope.profile.settings.noStoreEnabled = newValue;
            userService.saveProfile($scope.profile).then(function () { });
        });

        $scope.$on('passcode-modal-pin-disabled', function (ev, args) {
            var hashed = md5.createHash(args || '');
            if (hashed === $scope.profile.settings.passcodeText) {
                // disable local passcode
                $scope.profile.settings.passcodeEnabled = false;
                $scope.profile.settings.passcodeText = '';
                $scope.passcodeSaved = false;

                userService.saveProfile($scope.profile).then(function () {
                    passcodeModalService.hideDialog();
                    alertService.show('Passcode disabled');
                });
            } else {
                passcodeModalService.hideDialog();
                $scope.model.passcodeEnabled = true;
                alertService.show('Invalid passcode!');
            }
        });

        $scope.$on('passcode-modal-forgot-pin', function (ev, args) {
            userService.clearCurrent();
            passcodeModalService.hideDialog();
            $state.go('login');
        });

        $scope.$on('passcode-modal-pin-confirmed', function (ev, args) {
            $scope.profile.settings.passcodeEnabled = true;
            $scope.profile.settings.passcodeText = md5.createHash(args || '');

            userService.saveProfile($scope.profile).then(function () {
                alertService.show('Passcode set!');
                $scope.passcodeSaved = true;
                passcodeModalService.hideDialog();
            });
        });

        $scope.$on('passcode-modal-closed', function (ev, args) {
            if ($scope.passcodeSaved === false)
                $scope.model.passcodeEnabled = false;
            else
                $scope.model.passcodeEnabled = true;

            passcodeModalService.hideDialog();
        });

        $scope.changeAppIcon = function (iconName) {
            try {
                alternateIconService.isSupported()
                    .then(function (supported) {
                        if (supported) {
                            alternateIconService.changeIcon(iconName, true)
                                .then(function () {
                                    alertService.show('app icon changed!');
                                    $scope.selectedAppIcon = iconName;
                                },
                                function (err) {
                                    alertService.show('app icon not changed. check your console!');
                                });
                        } else {
                            alertService.show('appiconchanger is not available');
                        }
                    });
            } catch (e) {
                console.error(e);
            }
        };

        $scope.deleteAllData = function () {
            var confirmPopup = $ionicPopup.confirm({
                title: 'Delete all data',
                template: 'Are you sure you want to delete all data stored on the device?'
            });

            confirmPopup.then(function (res) {
                if (res) {
                    surveyService.deleteAllData().then(
                        function () { alertService.show('All local data deleted successfully!'); },
                        function (err) { alertService.show('Failed: ' + err); });
                }
            });
        }

        $scope.activate = function () {

            $scope.isIOS = ionic.Platform.isIOS();
            fingerprintService.isHardwareDetected()
                .then(function (result) {
                    $scope.fingerprintHardwareDetected = result;
                });

            if (ionic.Platform.isIOS())
                alternateIconService.isSupported().then(function (supported) {
                    $scope.canChangeAppIcon = supported;
                });

            userService.getExistingProfiles().then(function (profiles) {
                if (profiles.length) {
                    var profile = profiles[0];
                    $scope.profile = profile;

                    $scope.model.passcodeEnabled = profile.settings.passcodeEnabled;
                    $scope.model.fingerprintEnabled = profile.settings.fingerprintEnabled;
                    $scope.passcodeSaved = profile.settings.passcodeEnabled;
                    $scope.model.noStoreEnabled = profile.settings.noStoreEnabled;
                }
            });
        };

        $scope.activate();

    }]);