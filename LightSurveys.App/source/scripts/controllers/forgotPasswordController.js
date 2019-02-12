(function () {
    'use strict';
    angular.module('lm.surveys').controller('forgotPasswordController', ['$scope', '$state', 'toastr', 'httpService',
        function ($scope, $state, toastr, httpService) {
            $scope.model = {
                email: ''
            };

            $scope.emailSent = false;
            $scope.isWorking = false;

            $scope.resetPassword = function () {
                if (!$scope.model.email || !$scope.model.email.length) {
                    toastr.error('Please enter your email address');
                    return;
                }

                $scope.isWorking = true;

                httpService.forgotPassword($scope.model)
                    .then(function (result) {
                        $scope.isWorking = false;
                        $scope.emailSent = true;
                    }, function (error) {
                        toastr.error('Invalid username/email. Please try again');
                    });
            };
        }
    ]);
}());