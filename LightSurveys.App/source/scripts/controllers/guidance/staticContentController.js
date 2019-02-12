(function () {
    'use strict';
    angular.module('lm.surveys').controller('staticContentController',
        ['$scope', '$timeout', 'localStorageService', function ($scope, $timeout, localStorageService) {
            $scope.firstLogin = false;

            var FIRST_TIME_LOGIN_KEY = 'FIRST_TIME_LOGIN';
            var firstLogin = localStorageService.get(FIRST_TIME_LOGIN_KEY);
            if (firstLogin && firstLogin === true) {
                $scope.firstLogin = true;
            }

            $scope.options = {
                loop: false,
                effect: 'slide',
                speed: 500
            };

            $scope.$on("$ionicSlides.sliderInitialized", function (event, data) {
                // data.slider is the instance of Swiper
                $scope.slider = data.slider;

                $timeout(function () {
                    var el = document.getElementsByClassName('swiper-pagination')[0];
                    el.classList.remove('ng-hide');
                }, 500);
            });

            $scope.$on("$ionicSlides.slideChangeStart", function (event, data) {
                console.log('Slide change is beginning');
            });

            $scope.$on("$ionicSlides.slideChangeEnd", function (event, data) {
                // note: the indexes are 0-based
                $scope.activeIndex = data.slider.activeIndex;
                $scope.previousIndex = data.slider.previousIndex;
            });
        }]);
}());