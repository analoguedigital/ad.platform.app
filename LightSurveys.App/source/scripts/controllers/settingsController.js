'use strict';
angular.module('lm.surveys').controller('settingsController', ['$scope', '$rootScope', '$state', '$timeout', '$ionicModal', 'toastr',
    '$ionicPopup', 'alertService', 'userService', 'surveyService', 'passcodeModalService', 'md5', 'fingerprintService', 'alternateIconService', 'ngProgress', 
    function ($scope, $rootScope, $state, $timeout, $ionicModal, toastr,
        $ionicPopup, alertService, userService, surveyService, passcodeModalService, md5, fingerprintService, alternateIconService, ngProgress) {

        $scope.profile = undefined;
        $scope.passcodeSaved = false;
        $scope.fingerprintHardwareDetected = false;
        $scope.canChangeAppIcon = false;
        $scope.selectedAppIcon = undefined;
        $scope.modal = {};

        $scope.model = {
            passcodeEnabled: false,
            fingerprintEnabled: false,
            noStoreEnabled: false,
            password: '',
            newPassword: '',
            confirmPassword: ''
        };

        $scope.changePwdWorking = false;

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
            if ($scope.profile) {
                $scope.profile.settings.noStoreEnabled = newValue;
                userService.saveProfile($scope.profile).then(function () { });
            }
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
                buttons: [
                    { text: 'Cancel' },
                    {
                        text: 'Delete',
                        type: 'button-assertive',
                        onTap: function (e) {
                            return true;
                        }
                    }
                ],
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

            $ionicModal.fromTemplateUrl('partials/change-password.html', {
                scope: $scope,
                animation: 'slide-in-up'
            }).then(function (modal) {
                $scope.modal = modal;
            });
        };

        $scope.openModal = function () {
            $scope.model.password = '';
            $scope.model.newPassword = '';
            $scope.model.confirmPassword = '';

            $scope.modal.show();
        }

        $scope.closeModal = function () {
            $scope.modal.hide();
        }

        $scope.changePassword = function () {
            if ($scope.model.password.length < 1) {
                toastr.error('Please enter your current password');
                return false;
            }

            if ($scope.model.newPassword.length < 1) {
                toastr.error('Please enter your new password');
                return false;
            }

            if ($scope.model.confirmPassword.length < 1) {
                toastr.error('Please confirm your new password');
                return false;
            }

            if ($scope.model.newPassword !== $scope.model.confirmPassword) {
                toastr.error('New password and confirm password do not match');
                return false;
            }

            $scope.errors = [];

            var payload = {
                userId: userService.current.userId,
                oldPassword: $scope.model.password,
                newPassword: $scope.model.newPassword,
                confirmPassword: $scope.model.confirmPassword
            };

            ngProgress.start();
            $scope.changePwdWorking = true;
            userService.changePassword(payload)
                .then(function (result) {
                    toastr.info('You have changed your password', 'Password changed');
                    $scope.closeModal();
                }, function (err) {
                    toastr.error(err.message);

                    var errors = [];
                    for (var key in err.modelState) {
                        if (err.modelState.hasOwnProperty(key)) {
                            errors.push(err.modelState[key][0]);
                        }
                    }

                    $scope.errors = errors;
                }).finally(function () {
                    ngProgress.complete();
                    $scope.changePwdWorking = false;
                });
        }

        $scope.activate();

    }]);