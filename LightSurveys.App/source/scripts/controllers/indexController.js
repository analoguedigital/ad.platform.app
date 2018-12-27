(function () {
    'use strict';
    angular.module('lm.surveys').controller('indexController', ["$scope", '$location', 'authService',
        function ($scope, $location, authService) {
            $scope.authentication = authService.authentication;
            $scope.expiryDate = undefined;

            $scope.getDirection = function () {
                return 'ltr';
            };

            $scope.getLeft = function () {
                return 'left';
            };

            $scope.getRight = function () {
                return 'right';
            };

            $scope.getBack = function () {
                return 'back';
            };

            $scope.getForward = function () {
                return 'forward';
            };

            $scope.activate = function () {
                $location.path('/landing');

                //var firstLogin = localStorageService.get('FIRST_TIME_LOGIN');
                //if (firstLogin === null || firstLogin === undefined) {
                //    $location.path('/landing');
                //} else {
                //    if (!$scope.authentication.isAuth)
                //        $location.path('/login');
                //    else
                //        $location.path('/home');
                //}
            };

            $scope.activate();
        }
    ]);
}());