(function () {
    'use strict';
    angular.module('lm.surveys').controller('landingController', ["$scope", '$ionicPlatform', function ($scope, $ionicPlatform) {
        $scope.activate = function () {
            $ionicPlatform.ready(function () {
                $scope.platformIsIOS = ionic.Platform.isIOS();
            });
        };

        $scope.activate();
    }]);
}());