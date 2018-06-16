'use strict';
angular.module('lm.surveys').controller('indexController', ["$scope", "$rootScope", "$state", '$location', 'authService', 'userService',
    function ($scope, $rootScope, $state, $location, authService, userService) {

        $scope.authentication = authService.authentication;
        $scope.expiryDate = undefined;

        $scope.getDirection = function () {
            return 'ltr';
        }

        $scope.getLeft = function () {
            return 'left';
        }

        $scope.getRight = function () {
            return 'right';
        }

        $scope.getBack = function () {
            return 'back';
        }

        $scope.getForward = function () {
            return 'forward';
        }

        $scope.activate = function () {
            if (!$scope.authentication.isAuth)
                $location.path('/login');
            else
                $location.path('/home');            
        }

        $scope.activate();

    }]);