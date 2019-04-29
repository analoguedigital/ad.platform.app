(function () {
    'use strict';
    angular.module('lm.surveys').controller('accountController', ['$scope', '$rootScope', 'userService', 'moment', 'httpService', 'toastr', '$ionicLoading',
        function ($scope, $rootScope, userService, moment, httpService, toastr, $ionicLoading) {
            $scope.profile = {};
            $scope.userInfo = {};

            $scope.activeSubscription = undefined;
            $scope.monthlyQuota = undefined;

            $scope.model = {
                firstName: '',
                surname: '',
                gender: '',
                birthdate: '',
                address: '',
                email: '',
                phoneNumber: '',
                phoneNumberConfirmed: false,
                isSubscribed: false,
                expiryDate: null
            };

            $scope.genders = [{
                    text: 'Male',
                    value: 0
                },
                {
                    text: 'Female',
                    value: 1
                },
                {
                    text: 'Other',
                    value: 2
                }
            ];

            $scope.requestWorking = false;

            $scope.saveChanges = function () {
                if (!$scope.model.firstName || $scope.model.firstName.length < 1) {
                    toastr.error('First name is required', 'Validation failed');
                    return false;
                }

                if (!$scope.model.surname || $scope.model.surname.length < 1) {
                    toastr.error('Surname is required', 'Validation failed');
                    return false;
                }

                $scope.requestWorking = true;
                $ionicLoading.show({
                    template: '<i class="fa fa-circle-o-notch fa-spin fa-fw"></i> Saving profile...'
                });

                httpService.updateProfile($scope.model)
                    .then(function (result) {
                        $scope.profile.userInfo.profile = $scope.model;
                        userService.saveProfile($scope.profile).then(function () {
                            toastr.success('Profile information updated');
                            
                            $rootScope.$broadcast("update-menu-profile", {
                                profile: $scope.model
                            });

                            $scope.doRefresh();
                        });
                    }, function (err) {
                        console.error(err);
                        toastr.error(err);
                    })
                    .finally(function () {
                        $scope.requestWorking = false;
                        $ionicLoading.hide();
                    });
            };

            $scope.doRefresh = function () {
                $ionicLoading.show({
                    template: '<i class="fa fa-circle-o-notch fa-spin fa-fw"></i> Loading...'
                });

                httpService.getUserInfo()
                    .then(function (data) {
                        $scope.userInfo = data;
                        $scope.profile.userInfo = data;

                        $scope.activeSubscription = data.profile.lastSubscription;
                        $scope.monthlyQuota = data.profile.monthlyQuota;

                        var info = data.profile;
                        $scope.model.firstName = info.firstName;
                        $scope.model.surname = info.surname;
                        $scope.model.gender = info.gender;
                        $scope.model.birthdate = moment(info.birthdate).toDate();
                        $scope.model.address = info.address;
                        $scope.model.email = info.email;
                        $scope.model.phoneNumber = info.phoneNumber;
                        $scope.model.phoneNumberConfirmed = $scope.profile.userInfo.phoneNumberConfirmed;

                        $rootScope.$broadcast('update-menu-profile', {
                            profile: data.profile,
                            notifications: data.notifications
                        });

                        userService.saveProfile($scope.profile).then(function () {
                            // profile data updated
                        });
                    }, function (err) {
                        console.error(err);
                    })
                    .finally(function () {
                        $scope.$broadcast('scroll.refreshComplete');
                        $ionicLoading.hide();
                    });
            };

            $scope.activate = function () {
                userService.getExistingProfiles().then(function (profiles) {
                    $scope.profile = profiles[0];
                    $scope.userInfo = $scope.profile.userInfo;

                    $scope.activeSubscription = $scope.userInfo.profile.lastSubscription;
                    $scope.monthlyQuota = $scope.userInfo.profile.monthlyQuota;

                    var info = $scope.userInfo.profile;

                    try {
                        $scope.model.firstName = info.firstName;
                        $scope.model.surname = info.surname;
                        $scope.model.gender = info.gender;
                        $scope.model.birthdate = moment(info.birthdate).toDate();
                        $scope.model.address = info.address;
                        $scope.model.phoneNumber = info.phoneNumber;
                        $scope.model.phoneNumberConfirmed = $scope.userInfo.phoneNumberConfirmed;
                        $scope.model.isSubscribed = info.isSubscribed;
                        $scope.model.expiryDate = info.expiryDate;

                        $scope.doRefresh();
                    } catch (e) {
                        console.warn(e);
                    }
                });
            };

            $scope.activate();
        }
    ]);
}());