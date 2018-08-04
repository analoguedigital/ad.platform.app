'use strict';
angular.module('lm.surveys').controller('forgotPasswordController', ['$scope', '$state', 'ngProgress', 'toastr', 'httpService',
    function ($scope, $state, ngProgress, toastr, httpService) {
        $scope.model = {
            email: ''
        };

        $scope.emailSent = false;
        $scope.isWorking = false;

        $scope.resetPassword = function () {
            if (!$scope.model.email || $scope.model.email.length == 0) {
                toastr.warning('Please enter your email address first');
                return;
            }

            $scope.isWorking = true;
            ngProgress.start();
            httpService.forgotPassword($scope.model)
                .then(function (result) {
                    $scope.emailSent = true;
                }, function (error) {
                    console.error(error);
                    toastr.error('Please verify your username', 'Bad request');
                })
                .finally(function () {
                    ngProgress.complete();
                    $scope.isWorking = false;
                });
        };

    }]);