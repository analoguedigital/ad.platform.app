'use strict';
angular.module('lm.surveys').controller('resetPasswordController', ['$scope', '$state', 'ngProgress', 'toastr', 'httpService',
    function ($scope, $state, ngProgress, toastr, httpService) {
        $scope.model = {
            email: '',
            code: '',
            password: '',
            confirmPassword: ''
        };

        $scope.setPassword = function () {
            if (!$scope.model.email) {
                toastr.info('Please enter your email address');
            } else if (!$scope.model.code) {
                toastr.info('Please enter password reset token');
            } else if (!$scope.model.password) {
                toastr.info('Please enter password');
            }
            else if (!$scope.model.confirmPassword) {
                toastr.info('Please confirm password');
            } else if ($scope.model.password !== $scope.model.confirmPassword) {
                toastr.info('Passwords do not match!');
            } else {
                ngProgress.start();
                httpService.resetPassword($scope.model)
                    .then(function (result) {
                        console.log(result);
                        toastr.success('You can now sign in with your new password', 'Password set');
                        $state.go('login');
                    }).finally(function () {
                        ngProgress.complete();
                    });
            }
        };

    }]);