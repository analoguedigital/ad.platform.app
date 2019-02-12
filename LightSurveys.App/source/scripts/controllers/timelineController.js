(function () {
    'use strict';
    angular.module('lm.surveys').controller('timelineController', ['$scope', '$rootScope', '$timeout', 'surveyService', '$ionicNavBarDelegate', '$ionicLoading',
        function ($scope, $rootScope, $timeout, surveyService, $ionicNavBarDelegate, $ionicLoading) {
            $scope.templates = [];
            $scope.surveys = [];

            $scope.today = new Date();
            $scope.months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

            $scope.orientation = '';
            $scope.TimelineHeaderBarStyle = {};
            $scope.TimelineContentStyle = {};

            $scope.nextMonth = function () {
                $scope.today = moment($scope.today).add(1, 'months').toDate();
                $rootScope.$broadcast('timeline-next-month');
            };

            $scope.previousMonth = function () {
                $scope.today = moment($scope.today).subtract(1, 'months').toDate();
                $rootScope.$broadcast('timeline-previous-month');
            };

            $scope.getScreenOrientation = function () {
                if (window.innerHeight > window.innerWidth) {
                    return 'portrait';
                }

                return 'landscape';
            };

            $scope.orientationChanged = function (orientation) {
                if (orientation === 'landscape') {
                    var headerBarTop, contentTop;
                    if (ionic.Platform.isAndroid()) {
                        headerBarTop = '0';
                        contentTop = '60px';
                    }

                    if (ionic.Platform.isIOS()) {
                        headerBarTop = '20px';
                        contentTop = '80px';
                    }

                    $ionicNavBarDelegate.showBar(false);
                    $scope.TimelineHeaderBarStyle = {
                        'top': headerBarTop
                    };
                    $scope.TimelineContentStyle = {
                        'top': contentTop
                    };
                } else {
                    $ionicNavBarDelegate.showBar(true);
                    $scope.TimelineHeaderBarStyle = {};
                    $scope.TimelineContentStyle = {};
                }
            };

            $scope.getScreenOrientation = function () {
                if (window.innerHeight > window.innerWidth) {
                    return 'portrait';
                }
                return 'landscape';
            };

            $scope.$on('$ionicView.loaded', function () {
                window.onresize = function () {
                    $timeout(function () {
                        $scope.orientation = $scope.getScreenOrientation();
                        $scope.orientationChanged($scope.orientation);
                        $rootScope.$broadcast('timeline-rebuild', $scope.orientation);
                    }, 100);
                };
            });

            $scope.$on('$destroy', function () {
                window.onresize = null;
            });

            $scope.activate = function () {
                 $ionicLoading.show({
                     template: '<i class="fa fa-circle-o-notch fa-spin fa-fw"></i> Loading...'
                 });

                $timeout(function () {
                    $scope.orientation = $scope.getScreenOrientation();
                    $scope.orientationChanged($scope.orientation);
                }, 100);

                surveyService.getAllSubmittedSurveys()
                    .then(function (surveys) {
                        // get unique form templates
                        var templates = _.uniqBy(surveys, 'formTemplate').map(function (survey) {
                            return survey.formTemplate;
                        });

                        $scope.templates = templates;
                        $scope.surveys = surveys;
                    }).finally(function () {
                         $ionicLoading.hide();
                    });
            };

            $scope.activate();
        }
    ]);
}());