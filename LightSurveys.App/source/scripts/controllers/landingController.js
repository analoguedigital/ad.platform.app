'use strict';
angular.module('lm.surveys').controller('landingController', ["$scope", "$rootScope", "$state", '$location', 'authService', 'userService', '$ionicPlatform', 
    function ($scope, $rootScope, $state, $location, authService, userService, $ionicPlatform) {
        $scope.activate = function () {
            $ionicPlatform.ready(function() {
                $scope.platformIsIOS = ionic.Platform.isIOS();
            });
        }

        $scope.activate();

    }]);