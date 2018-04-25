'use strict';
angular.module('lm.surveys').controller('accountController', ['$scope', '$rootScope', 'userService', 'moment', 'httpService', 'toastr', 'ngProgress', '$ionicModal', 
    function ($scope, $rootScope, userService, moment, httpService, toastr, ngProgress, $ionicModal) {
        $scope.profile = {};
        $scope.userInfo = {};

        $scope.model = {
            firstName: '',
            surname: '',
            gender: '',
            birthdate: '',
            address: '',
            phoneNumber: '',
            phoneNumberConfirmed: false,
            isSubscribed: false,
            expiryDate: null
        };

        $scope.genders = [
            { text: 'Male', value: 0 },
            { text: 'Female', value: 1 },
            { text: 'Other', value: 2 }
        ];

        $scope.requestWorking = false;
        $scope.voucherWorking = false;

        $scope.activate = function () {
            userService.getExistingProfiles().then(function (profiles) {
                if (profiles.length) {
                    $scope.profile = profiles[0];
                    $scope.userInfo = $scope.profile.userInfo.profile;

                    var info = $scope.userInfo;
                    try {
                        $scope.model.firstName = info.firstName;
                        $scope.model.surname = info.surname;
                        $scope.model.gender = info.gender;
                        $scope.model.birthdate = moment(info.birthdate).toDate();
                        $scope.model.address = info.address;
                        $scope.model.phoneNumber = info.phoneNumber;
                        $scope.model.phoneNumberConfirmed = $scope.profile.userInfo.phoneNumberConfirmed;
                        $scope.model.isSubscribed = info.isSubscribed;
                        $scope.model.expiryDate = info.expiryDate;
                    } catch (e) {
                        console.warn(e);
                    }
                }
            });
        }

        $scope.saveChanges = function () {
            if (!$scope.model.firstName || $scope.model.firstName.length < 1) {
                toastr.error('First name is required', 'Validation failed');
                return false;
            }

            if (!$scope.model.surname || $scope.model.surname.length < 1) {
                toastr.error('Surname is required', 'Validation failed');
                return false;
            }

            ngProgress.start();
            $scope.requestWorking = true;

            httpService.updateProfile($scope.model)
                .then(function (result) {
                    $scope.profile.userInfo.profile = $scope.model;
                    userService.saveProfile($scope.profile).then(function () {
                        toastr.info('Profile information saved');
                        $rootScope.$broadcast("update-menu-profile", { profile: $scope.model });
                        $scope.doRefresh();
                    });
                }, function (err) {
                    console.error(err);
                })
                .finally(function () {
                    ngProgress.complete();
                    $scope.requestWorking = false;
                });
        }

        $scope.doRefresh = function () {
            httpService.getUserInfo()
                .then(function (data) {
                    $scope.userInfo = data;
                    $scope.profile.userInfo = data;

                    userService.saveProfile($scope.profile)
                        .then(function () {
                            var info = data.profile;
                            $scope.model.firstName = info.firstName;
                            $scope.model.surname = info.surname;
                            $scope.model.gender = info.gender;
                            $scope.model.birthdate = moment(info.birthdate).toDate();
                            $scope.model.address = info.address;
                            $scope.model.phoneNumber = info.phoneNumber;
                            $scope.model.phoneNumberConfirmed = $scope.profile.userInfo.phoneNumberConfirmed;
                        });
                }, function (err) {
                    console.error(err);
                })
                .finally(function () {
                    $scope.$broadcast('scroll.refreshComplete');
                });
        }

        $scope.activate();
    }]);

