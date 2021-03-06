﻿(function () {
    'use strict';
    angular.module('lm.surveys').controller('settingsController', ['$scope', '$state', '$ionicModal', 'toastr',
        '$ionicPopup', 'userService', 'surveyService', 'passcodeModalService', 'md5', 'fingerprintService',
        'alternateIconService', 'httpService', 'localStorageService', '$ionicLoading',
        function ($scope, $state, $ionicModal, toastr, $ionicPopup, userService, surveyService, passcodeModalService, md5,
            fingerprintService, alternateIconService, httpService, localStorageService, $ionicLoading) {

            $scope.profile = undefined;
            $scope.userInfo = undefined;

            $scope.passcodeSaved = false;
            $scope.fingerprintHardwareDetected = false;
            $scope.canChangeAppIcon = false;
            $scope.selectedAppIcon = undefined;

            $scope.modal = {};
            $scope.addPhoneNumberModal = {};
            $scope.changePhoneNumberModal = {};

            $scope.phoneNumberAdded = false;

            $scope.addPhoneNumberModel = {
                phoneNumber: '',
                securityCode: ''
            };

            $scope.changePhoneNumberModel = {
                phoneNumberAdded: false,
                phoneNumber: '',
                securityCode: ''
            };

            $scope.model = {
                passcodeEnabled: false,
                fingerprintEnabled: false,
                autoLockoutDisabled: false,
                noStoreEnabled: false,
                confirmSignOut: false,
                password: '',
                newPassword: '',
                confirmPassword: ''
            };

            $scope.changePwdWorking = false;
            $scope.addPhoneNumberWorking = false;
            $scope.verifyPhoneNumberWorking = false;
            $scope.changePhoneNumberWorking = false;
            $scope.verifyChangePhoneWorking = false;

            $scope.$watch('model.passcodeEnabled', function (newValue, oldValue) {
                if (oldValue === false && newValue === true) {
                    if (!$scope.passcodeSaved && !$scope.profile.settings.passcodeEnabled) {
                        passcodeModalService.showDialog('setpasscode', 'Enable login by passcode');
                    }
                } else if (oldValue === true && newValue === false) {
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
                    userService.saveProfile($scope.profile).then(function () {});
                }
            });

            $scope.$watch('model.autoLockoutDisabled', function (newValue, oldValue) {
                if (oldValue === false && newValue === true)
                    $scope.profile.settings.autoLockoutDisabled = true;
                else if (oldValue === true && newValue === false)
                    $scope.profile.settings.autoLockoutDisabled = false;

                if ($scope.profile) {
                    userService.saveProfile($scope.profile).then(function () { });
                }
            });

            $scope.$watch('model.noStoreEnabled', function (newValue, oldValue) {
                if ($scope.profile) {
                    $scope.profile.settings.noStoreEnabled = newValue;
                    userService.saveProfile($scope.profile).then(function () {});
                }
            });

            $scope.$watch('model.confirmSignOut', function (newValue, oldValue) {
                if ($scope.profile) {
                    $scope.profile.settings.confirmSignOut = newValue;
                    userService.saveProfile($scope.profile).then(function () {});
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
                        toastr.success('Passcode disabled successfully');
                    });
                } else {
                    passcodeModalService.hideDialog();
                    $scope.model.passcodeEnabled = true;
                    toastr.error('Invalid passcode. Try again.');
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
                    toastr.success('Passcode enabled successfully');
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
                $scope.selectedAppIcon = iconName;

                try {
                    alternateIconService.isSupported()
                        .then(function (supported) {
                            if (supported) {
                                alternateIconService.changeIcon(iconName, true)
                                    .then(function () {
                                        $scope.selectedAppIcon = iconName;
                                    }, function (err) {
                                        console.error('could not change app icon', err);
                                        toastr.error('Could not change app icon');
                                    });
                            } else {
                                toastr.error('App Icon Changer is not available');
                            }
                        });
                } catch (e) {
                    console.error('could not change app icon', e);
                }
            };

            $scope.deleteAllData = function () {
                var confirmPopup = $ionicPopup.confirm({
                    title: 'Delete all records',
                    template: 'Are you sure you want to delete all records on this device? Don\'t worry you won\'t lose your data. This is client-side only and your records will be safe on our servers.',
                    buttons: [{
                            text: 'Yes, delete',
                            type: 'button-assertive',
                            onTap: function (e) {
                                return true;
                            }
                        },
                        {
                            text: 'Cancel',
                            type: 'button-stable'
                        }
                    ]
                });

                confirmPopup.then(function (res) {
                    if (res) {
                        $ionicLoading.show({
                            template: '<i class="fa fa-circle-o-notch fa-spin fa-fw"></i> Deleting data...'
                        });

                        surveyService.deleteAllData()
                            .then(function () {
                                toastr.success('Local data deleted successfully');
                            }, function (err) {
                                console.error('could not delete all data', err);
                                toastr.error('Could not delete all data');
                            }).finally(function () {
                                $ionicLoading.hide();
                            });
                    }
                });
            };

            $scope.openModal = function () {
                $scope.model.password = '';
                $scope.model.newPassword = '';
                $scope.model.confirmPassword = '';

                $scope.modal.show();
            };

            $scope.closeModal = function () {
                $scope.modal.hide();
            };

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
                    toastr.error('Please retype your new password');
                    return false;
                }

                if ($scope.model.newPassword !== $scope.model.confirmPassword) {
                    toastr.error('New passwords do not match');
                    return false;
                }

                $scope.errors = [];

                var payload = {
                    userId: userService.current.userId,
                    oldPassword: $scope.model.password,
                    newPassword: $scope.model.newPassword,
                    confirmPassword: $scope.model.confirmPassword
                };

                $scope.changePwdWorking = true;

                $ionicLoading.show({
                    template: '<i class="fa fa-circle-o-notch fa-spin fa-fw"></i> Changing password...'
                });

                userService.changePassword(payload)
                    .then(function (result) {
                        $scope.closeModal();
                        toastr.success('Password changed successfully');
                    }, function (err) {
                        console.error('could not change password', err);

                        if (err.message)
                            toastr.error(err.message);

                        var errors = [];
                        for (var key in err.modelState) {
                            if (err.modelState.hasOwnProperty(key)) {
                                errors.push(err.modelState[key][0]);
                            }
                        }

                        $scope.errors = errors;
                    }).finally(function () {
                        $scope.changePwdWorking = false;
                        $ionicLoading.hide();
                    });
            };

            $scope.addPhoneNumber = function () {
                var phoneNumber = $scope.addPhoneNumberModel.phoneNumber;
                if (!phoneNumber.length) {
                    toastr.error('Please enter a valid phone number');
                    return false;
                }

                $scope.addPhoneNumberWorking = true;

                httpService.addPhoneNumber(phoneNumber)
                    .then(function (res) {
                        $scope.phoneNumberAdded = true;
                        localStorageService.set('capture-in-progress', true);
                        toastr.info('We have sent you a security code');
                    }, function (err) {
                        console.error('could not add phone number', err);
                        if (err.exceptionMessage)
                            toastr.error(err.exceptionMessage);

                        if (err.message)
                            toastr.error(err.message);
                    }).finally(function () {
                        $scope.addPhoneNumberWorking = false;
                    });
            };

            $scope.verifyPhoneNumber = function () {
                var phoneNumber = $scope.addPhoneNumberModel.phoneNumber;
                var code = $scope.addPhoneNumberModel.securityCode;

                if (code.length == 0) {
                    toastr.error('Please enter your security code');
                    return false;
                }

                $scope.verifyPhoneNumberWorking = true;

                $ionicLoading.show({
                    template: '<i class="fa fa-circle-o-notch fa-spin fa-fw"></i> Verifying phone number...'
                });

                httpService.verifyPhoneNumber(phoneNumber, code)
                    .then(function (res) {
                        localStorageService.set('capture-in-progress', false);
                        $scope.closeAddPhoneNumberModal();
                        toastr.success('Phone number confirmed successfully');

                        $scope.refreshUserInfo();
                    }, function (err) {
                        console.error('could not verify phone number', err);

                        if (err.exceptionMessage)
                            toastr.error(err.exceptionMessage);

                        if (err.message)
                            toastr.error(err.message);
                    }).finally(function () {
                        $scope.verifyPhoneNumberWorking = false;
                        $ionicLoading.hide();
                    });
            };

            $scope.confirmPhoneNumber = function () {
                $scope.addPhoneNumberModel.phoneNumber = $scope.profile.userInfo.phoneNumber;
                $scope.addPhoneNumberModel.confirmMode = true;

                $scope.openAddPhoneNumberModal();
            };

            $scope.removePhoneNumber = function () {
                var confirmPopup = $ionicPopup.confirm({
                    title: 'Remove phone number',
                    buttons: [{
                            text: 'Cancel'
                        },
                        {
                            text: 'Remove',
                            type: 'button-assertive',
                            onTap: function (e) {
                                return true;
                            }
                        }
                    ],
                    template: 'Are you sure you want to remove your phone number?'
                });

                confirmPopup.then(function (res) {
                    if (res) {
                        $ionicLoading.show({
                            template: '<i class="fa fa-circle-o-notch fa-spin fa-fw"></i> Removing phone number...'
                        });

                        httpService.removePhoneNumber()
                            .then(function (res) {
                                toastr.success("Phone number removed successfully");
                                $scope.refreshUserInfo();
                            }, function (err) {
                                console.error('could not remove phone number', err);
                                toastr.error("Could not remove phone number, sorry");
                            }).finally(function () {
                                $ionicLoading.hide();
                            });
                    }
                });
            };

            $scope.changePhoneNumber = function () {
                var phoneNumber = $scope.changePhoneNumberModel.phoneNumber;
                if (!phoneNumber.length) {
                    toastr.error('Please enter a valid phone number');
                    return false;
                }

                var oldPhoneNumber = $scope.profile.userInfo.phoneNumber;
                if (phoneNumber === oldPhoneNumber) {
                    toastr.error('This number is already in use. Enter a different number to change.');
                    return false;
                }

                $scope.changePhoneNumberWorking = true;

                httpService.changePhoneNumber(phoneNumber)
                    .then(function (res) {
                        $scope.changePhoneNumberModel.phoneNumberAdded = true;
                        localStorageService.set('capture-in-progress', true);
                        toastr.success('We have sent you a security code');
                    }, function (err) {
                        console.error('could not change phone number', err);

                        if (err.exceptionMessage)
                            toastr.error(err.exceptionMessage);
                    }).finally(function () {
                        $scope.changePhoneNumberWorking = false;
                    });
            };

            $scope.verifyChangedNumber = function () {
                var phoneNumber = $scope.changePhoneNumberModel.phoneNumber;
                var code = $scope.changePhoneNumberModel.securityCode;

                if (code.length == 0) {
                    toastr.error('Please enter your security code');
                    return false;
                }

                $scope.verifyChangePhoneWorking = true;

                httpService.verifyChangedPhoneNumber(phoneNumber, code)
                    .then(function (res) {
                        toastr.success('New phone number confirmed successfully');
                        $scope.closeChangePhoneNumberModal();

                        localStorageService.set('capture-in-progress', false);
                        $scope.refreshUserInfo();
                    }, function (err) {
                        console.error('could not verify changed phone number', err);

                        if (err.exceptionMessage)
                            toastr.error(err.exceptionMessage);

                        if (err.message)
                            toastr.error(err.message);
                    }).finally(function () {
                        $scope.verifyChangePhoneWorking = false;
                    });
            };

            $scope.openAddPhoneNumberModal = function () {
                $scope.addPhoneNumberModal.show();
            };

            $scope.closeAddPhoneNumberModal = function () {
                localStorageService.set('capture-in-progress', false);
                $scope.addPhoneNumberModal.hide();
            };

            $scope.openChangePhoneNumberModal = function () {
                $scope.changePhoneNumberModel.phoneNumber = $scope.profile.userInfo.phoneNumber;
                $scope.changePhoneNumberModal.show();
            };

            $scope.closeChangePhoneNumberModal = function () {
                localStorageService.set('capture-in-progress', false);
                $scope.changePhoneNumberModal.hide();
            };

            $scope.refreshUserInfo = function () {
                $ionicLoading.show({
                    template: '<i class="fa fa-circle-o-notch fa-spin fa-fw"></i> Refreshing...'
                });

                httpService.getUserInfo()
                    .then(function (data) {
                        $scope.userInfo = data;
                        $scope.profile.userInfo = data;

                        userService.saveProfile($scope.profile).then(function () {
                            // local profile data updated.
                        });
                    }, function (err) {
                        console.error('could not refresh user info', err);
                        toastr.error('Could not refresh user info');
                    }).finally(function () {
                        $scope.$broadcast('scroll.refreshComplete');
                        $ionicLoading.hide();
                    });
            };

            $scope.activate = function () {
                $scope.isIOS = ionic.Platform.isIOS();

                try {
                    fingerprintService.isHardwareDetected().then(function (result) {
                        $scope.fingerprintHardwareDetected = result;
                    });
                } catch (error) {
                    console.error('failed to detect fingerprint hardware', error);
                }

                if (ionic.Platform.isIOS()) {
                    try {
                        alternateIconService.isSupported().then(function (supported) {
                            $scope.canChangeAppIcon = supported;
                        });
                    } catch (error) {
                        console.error('failed to detect app-icon-changer', error);
                    }
                }

                $ionicModal.fromTemplateUrl('partials/change-password.html', {
                    scope: $scope,
                    animation: 'slide-in-up'
                }).then(function (modal) {
                    $scope.modal = modal;
                });

                $ionicModal.fromTemplateUrl('partials/add-phonenumber.html', {
                    scope: $scope,
                    animation: 'slide-in-up'
                }).then(function (modal) {
                    $scope.addPhoneNumberModal = modal;
                });

                $ionicModal.fromTemplateUrl('partials/change-phonenumber.html', {
                    scope: $scope,
                    animation: 'slide-in-up'
                }).then(function (modal) {
                    $scope.changePhoneNumberModal = modal;
                });

                userService.getExistingProfiles().then(function (profiles) {
                    $scope.profile = profiles[0];
                    $scope.userInfo = $scope.profile.userInfo;

                    $scope.model.passcodeEnabled = $scope.profile.settings.passcodeEnabled;
                    $scope.model.fingerprintEnabled = $scope.profile.settings.fingerprintEnabled;
                    $scope.model.autoLockoutDisabled = $scope.profile.settings.autoLockoutDisabled;
                    $scope.model.noStoreEnabled = $scope.profile.settings.noStoreEnabled;
                    $scope.model.confirmSignOut = $scope.profile.settings.confirmSignOut;
                    $scope.passcodeSaved = $scope.profile.settings.passcodeEnabled;
                });
            };

            $scope.activate();

        }
    ]);
}());