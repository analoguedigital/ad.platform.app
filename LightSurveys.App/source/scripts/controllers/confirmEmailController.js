'use strict';
angular.module('lm.surveys').controller('confirmEmailController', ['$scope', '$rootScope', '$ionicHistory', '$ionicPlatform', '$state', '$stateParams', '$timeout', '$ionicModal',
    'userService', 'alertService', 'ngProgress', 'surveyService', 'fingerprintService', 'passcodeModalService', 'md5', 'toastr', 'localStorageService', 'storageService', 'httpService', 
    function ($scope, $rootScope, $ionicHistory, $ionicPlatform, $state, $stateParams, $timeout, $ionicModal, userService,
        alertService, ngProgress, surveyService, fingerprintService, passcodeModalService, md5, toastr, localStorageService, storageService, httpService) {

        $scope.isWorking = false;
        $scope.emailSent = false;

        $scope.model = {
            email: ''
        };

        $scope.sendConfirmation = function () {
            if (!$scope.model.email || !$scope.model.email.length) {
                toastr.warning('Please enter your email address first');
                return false;
            }

            $scope.isWorking = true;
            ngProgress.start();

            httpService.sendConfirmationEmail($scope.model)
                .then(function (res) {
                    $scope.emailSent = true;
                    console.info(res);
                }, function (err) {
                    console.error(err);

                    if (err && err.length) {
                        var statusCode = err.substr(0, 3);
                        if (statusCode && statusCode.length && statusCode === '404')
                            toastr.error('Invalid email address');
                        else
                            toastr.error(err);
                    }
                })
                .finally(function () {
                    $scope.isWorking = false;
                    ngProgress.complete();
                });
        };

        $scope.activate = function () {

        };

        $scope.activate();
    }
]);