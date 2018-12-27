(function () {
    'use strict';
    angular.module('lm.surveys').controller('staticContentController', ['$scope', 'localStorageService', function ($scope, localStorageService) {
        $scope.firstLogin = false;

        var FIRST_TIME_LOGIN_KEY = 'FIRST_TIME_LOGIN';
        var firstLogin = localStorageService.get(FIRST_TIME_LOGIN_KEY);
        if (firstLogin && firstLogin === true) {
            $scope.firstLogin = true;
        }
    }]);
}());