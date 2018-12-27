(function () {
    'use strict';
    angular.module('lm.surveys').controller('forgotPasswordController', ['$scope', '$state', 'ngProgress', 'toastr', 'httpService', '$ionicLoading',
        function ($scope, $state, ngProgress, toastr, httpService, $ionicLoading) {
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
                ngProgress.start();

                $ionicLoading.show({
                    template: '<i class="fa fa-circle-o-notch fa-spin fa-fw"></i> Requesting password reset...'
                });

                httpService.forgotPassword($scope.model)
                    .then(function (result) {
                        $scope.isWorking = false;
                        $scope.emailSent = true;
                    }, function (error) {
                        console.error('could not send forgot-password', error);
                        toastr.error('Invalid username/email. Please try again');
                    }).finally(function () {
                        ngProgress.complete();
                        $ionicLoading.hide();
                    });
            };
        }
    ]);
}());