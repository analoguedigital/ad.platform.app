'use strict';
angular.module('lm.surveys').controller('indexController', ["$scope", "$rootScope", "$state", '$location', 'authService', 'userService',
    function ($scope, $rootScope, $state, $location, authService, userService) {

        $scope.authentication = authService.authentication;
        $scope.getDirection = function () {
            return userService.current.language === 'fa-IR' ? 'rtl' : 'ltr';
        }

        $scope.getLeft = function () {
            return $scope.getDirection() === 'rtl' ? 'right' : 'left';
        }

        $scope.getRight = function () {
            return $scope.getDirection() === 'rtl' ? 'left' : 'right';
        }

        $scope.getBack = function () {
            return $scope.getDirection() === 'rtl' ? 'forward' : 'back';
        }

        $scope.getForward = function () {
            return $scope.getDirection() === 'rtl' ? 'back' : 'forward';
        }

        if (!$scope.authentication.isAuth) {
            $location.path('/login');
        }
        else
            $location.path('/home');

    }]);