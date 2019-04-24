(function () {
    'use strict';
    angular.module('lm.surveys').controller('timelineController', ['$scope', '$rootScope', '$timeout',
        'surveyService', '$ionicNavBarDelegate', '$ionicLoading', '$ionicModal', 'localStorageService',
        function ($scope, $rootScope, $timeout, surveyService, $ionicNavBarDelegate, $ionicLoading, $ionicModal, localStorageService) {
            $scope.templates = [];
            $scope.surveys = [];

            $scope.months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

            $scope.monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            $scope.years = [];
            $scope.dateModel = {
                month: undefined,
                year: undefined
            };

            $scope.orientation = '';
            $scope.TimelineHeaderBarStyle = {};
            $scope.TimelineContentStyle = {};

            $scope.nextMonth = function () {
                $scope.today = moment($scope.today).add(1, 'months').toDate();

                $scope.dateModel = {
                    month: $scope.monthNames[$scope.today.getMonth()],
                    year: $scope.today.getFullYear()
                };

                $rootScope.$broadcast('timeline-next-month');
                localStorageService.set('timeline_current_date', $scope.today);
            };

            $scope.previousMonth = function () {
                $scope.today = moment($scope.today).subtract(1, 'months').toDate();

                $scope.dateModel = {
                    month: $scope.monthNames[$scope.today.getMonth()],
                    year: $scope.today.getFullYear()
                };

                $rootScope.$broadcast('timeline-previous-month');
                localStorageService.set('timeline_current_date', $scope.today);
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

            $scope.openChangeDateDialog = function () {
                $scope.changeDateModal.show();
            }

            $scope.closeChangeDateDialog = function () {
                $scope.changeDateModal.hide();
            }

            $scope.changeTimelineDate = function () {
                var monthIndex = $scope.monthNames.indexOf($scope.dateModel.month);
                var year = $scope.dateModel.year;

                $scope.today = moment(new Date(year, monthIndex, 1)).toDate();
                $rootScope.$broadcast('timeline-change-date', $scope.today);
                localStorageService.set('timeline_current_date', $scope.today);

                $scope.closeChangeDateDialog();
            }

            $scope.resetTimelineDate = function () {
                $scope.today = moment(new Date()).toDate();
                $rootScope.$broadcast('timeline-change-date', $scope.today);

                $scope.dateModel = {
                    month: $scope.monthNames[$scope.today.getMonth()],
                    year: $scope.today.getFullYear()
                };

                localStorageService.set('timeline_current_date', $scope.today);

                $scope.closeChangeDateDialog();
            }

            $scope.activate = function () {
                $ionicModal.fromTemplateUrl('partials/timeline-date-modal.html', {
                    scope: $scope,
                    animation: 'slide-in-up'
                }).then(function (modal) {
                    $scope.changeDateModal = modal;
                });

                // populate the years select
                var currentYear = new Date().getFullYear();
                for (var i = currentYear - 10; i < currentYear; i++) {
                    $scope.years.push(i);
                }

                $scope.years.push(currentYear);

                for (var i = currentYear + 1; i < currentYear + 11; i++) {
                    $scope.years.push(i);
                }

                // get current date from local storage
                var currentDate = localStorageService.get('timeline_current_date');
                if (currentDate !== null)
                    $scope.today = moment(currentDate).toDate();
                else
                    $scope.today = new Date();

                $scope.dateModel = {
                    month: $scope.monthNames[$scope.today.getMonth()],
                    year: $scope.today.getFullYear()
                };

                localStorageService.set('timeline_current_date', $scope.today);

                if (currentDate !== null) {
                    $timeout(function () {
                        console.log('CHANGE DATE', $scope.today);
                        $rootScope.$broadcast('timeline-change-date', $scope.today);
                    }, 100);
                }

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