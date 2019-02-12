(function () {
    'use strict';
    angular.module('lm.surveys').controller('confirmEmailController', ['$scope', 'toastr', 'httpService',
        function ($scope, toastr, httpService) {
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

                httpService.sendConfirmationEmail($scope.model)
                    .then(function (res) {
                        $scope.emailSent = true;
                    }, function (err) {
                        if (err && err.length) {
                            var statusCode = err.substr(0, 3);
                            if (statusCode && statusCode.length && statusCode === '404')
                                toastr.error('Invalid email address');
                            else
                                toastr.error(err);
                        }
                    }).finally(function () {
                        $scope.isWorking = false;
                    });
            };
        }
    ]);
}());