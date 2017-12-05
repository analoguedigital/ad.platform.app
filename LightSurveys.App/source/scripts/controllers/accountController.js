'use strict';
angular.module('lm.surveys').controller('accountController', ['$scope', 'userService', 'moment', 'httpService', 'toastr', 'ngProgress',
    function ($scope, userService, moment, httpService, toastr, ngProgress) {
        $scope.profile = {};
        $scope.model = {
            firstName: '',
            surname: '',
            gender: '',
            birthdate: '',
            address: ''
        };

        $scope.activate = function () {
            userService.getExistingProfiles().then(function (profiles) {
                if (profiles.length) {
                    $scope.profile = profiles[0];

                    var info = $scope.profile.userInfo.profile;
                    $scope.model.firstName = info.firstName;
                    $scope.model.surname = info.surname;
                    $scope.model.gender = info.gender;
                    $scope.model.birthdate = moment(info.birthdate).toDate();
                    $scope.model.address = info.address;
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
            httpService.updateProfile($scope.model)
                .then(function (result) {
                    $scope.profile.userInfo.profile = $scope.model;
                    userService.saveProfile($scope.profile).then(function () { });

                    console.log('profile', $scope.profile);
                }, function (err) {
                    console.error(err);
                })
                .finally(function () {
                    ngProgress.complete();
                });
        }

        $scope.doRefresh = function () {
            httpService.getUserInfo()
                .then(function (data) {
                    $scope.profile.userInfo = data;
                    userService.saveProfile($scope.profile);
                }, function (err) {
                    console.error(err);
                })
                .finally(function () {
                    $scope.$broadcast('scroll.refreshComplete');
                });
        }

        $scope.activate();
    }]);

