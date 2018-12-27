(function () {
    'use strict';
    angular.module('lm.surveys').controller('confirmEmailController', ['$scope', 'ngProgress', 'toastr', 'httpService', '$ionicLoading',
        function ($scope, ngProgress, toastr, httpService, $ionicLoading) {
            $scope.isWorking = false;
            $scope.emailSent = false;

            $scope.model = {
                email: ''
            };

            $scope.sendConfirmation = function () {
                if (!$scope.model.email || !$scope.model.email.length) {
                    toastr.error('Please enter your email address');
                    return false;
                }

                $scope.isWorking = true;
                ngProgress.start();

                $ionicLoading.show({
                    template: '<i class="fa fa-circle-o-notch fa-spin fa-fw"></i> Sending e-mail...'
                });

                httpService.sendConfirmationEmail($scope.model)
                    .then(function (res) {
                        $scope.emailSent = true;
                    }, function (err) {
                        console.error('could not send confirmation email', err);

                        if (err && err.length) {
                            var statusCode = err.substr(0, 3);
                            if (statusCode && statusCode.length && statusCode === '404')
                                toastr.error('Invalid email address');
                            else
                                toastr.error(err);
                        }
                    }).finally(function () {
                        $scope.isWorking = false;
                        ngProgress.complete();
                        $ionicLoading.hide();
                    });
            };
        }
    ]);
}());