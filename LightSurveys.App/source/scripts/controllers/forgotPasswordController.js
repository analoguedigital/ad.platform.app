'use strict';
angular.module('lm.surveys').controller('forgotPasswordController', ['$scope', '$state', 'ngProgress', 'toastr', 'httpService',
    function ($scope, $state, ngProgress, toastr, httpService) {
        $scope.model = {
            email: ''
        };

        $scope.resetPassword = function () {
            if (!$scope.model.email || $scope.model.email.length == 0) {
                toastr.info('Please enter your email address first');
                return;
            }

            ngProgress.start();
            httpService.forgotPassword($scope.model)
                .then(function (result) {
                    console.log(result);
                    toastr.info('Password reset token has been sent', 'Check your inbox!');
                    $state.go('resetPassword');
                }, function (error) {
                    console.error(error);
                    toastr.error('Please verify your username', 'Bad request');
                })
                .finally(function () {
                    ngProgress.complete();
                });
        };

    }]);