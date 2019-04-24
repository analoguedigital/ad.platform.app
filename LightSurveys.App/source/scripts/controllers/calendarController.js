(function () {
    'use strict';
    angular.module('lm.surveys').controller('calendarController', ['$scope', '$state', 'surveyService',
        '$q', '$timeout', '$ionicNavBarDelegate', '$ionicLoading', 'localStorageService', '$ionicModal', 
        function ($scope, $state, surveyService, $q, $timeout, $ionicNavBarDelegate, $ionicLoading, localStorageService, $ionicModal) {
            $scope.formTemplates = [];
            $scope.surveys = [];

            $scope.cal = {};
            $scope.cal.calendarView = 'month';

            $scope.months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

            $scope.monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            $scope.years = [];
            $scope.dateModel = {
                month: undefined,
                year: undefined
            };

            $scope.cal.events = [];
            $scope.orientation = '';
            $scope.CalendarHeaderBarStyle = {};
            $scope.CalendarContentStyle = {};

            $scope.cal.eventClicked = function (event) {
                $state.go('surveyView', {
                    id: event.surveyId
                });
            };

            $scope.backToMonthView = function () {
                $scope.cal.calendarView = 'month';
            };

            $scope.shadeColor = function (color, percent) {
                if (!color)
                    return null;

                var f = parseInt(color.slice(1), 16),
                    t = percent < 0 ? 0 : 255,
                    p = percent < 0 ? percent * -1 : percent,
                    R = f >> 16,
                    G = f >> 8 & 0x00FF,
                    B = f & 0x0000FF;
                return "#" + (0x1000000 + (Math.round((t - R) * p) + R) * 0x10000 + (Math.round((t - G) * p) + G) * 0x100 + (Math.round((t - B) * p) + B)).toString(16).slice(1);
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
                    $scope.CalendarHeaderBarStyle = {
                        'top': headerBarTop
                    };
                    $scope.CalendarContentStyle = {
                        'top': contentTop
                    };
                } else if (orientation === 'portrait') {
                    $ionicNavBarDelegate.showBar(true);
                    $scope.CalendarHeaderBarStyle = {};
                    $scope.CalendarContentStyle = {};
                }
            };

            $scope.$on('$ionicView.loaded', function () {
                window.onresize = function () {
                    $timeout(function () {
                        $scope.orientation = $scope.getScreenOrientation();
                        $scope.orientationChanged($scope.orientation);
                    }, 100);
                };
            });

            $scope.$on('$destroy', function () {
                window.onresize = null;
            });

            $scope.loadData = function () {
                $ionicLoading.show({
                    template: '<i class="fa fa-circle-o-notch fa-spin fa-fw"></i> Loading...'
                });

                $scope.formTemplates = [];
                $scope.surveys = [];

                surveyService.getFormTemplates()
                    .then(function (templates) {
                        $scope.formTemplates = templates;

                        var promises = [];

                        angular.forEach(templates, function (template) {
                            var surveysPromise = $q.defer();
                            promises.push(surveysPromise.promise);

                            surveyService.getSubmittedSurveys(template.id)
                                .then(function (surveys) {
                                    _.forEach(surveys, function(s) {
                                        s.formTemplateTitle = template.title;
                                        s.formTemplateColor = template.colour;
                                    });

                                    $scope.surveys = $scope.surveys.concat(surveys);
                                    surveysPromise.resolve();
                                });
                        });

                        $q.all(promises).then(function () {
                            angular.forEach($scope.surveys, function (survey) {
                                var utcDate = moment.utc(survey.surveyDate);
                                var localDate = utcDate.local().toDate();

                                $scope.cal.events.push({
                                    title: survey.formTemplateTitle,
                                    startsAt: localDate,
                                    surveyId: survey.id,
                                    color: {
                                        primary: survey.formTemplateColor,
                                        secondary: $scope.shadeColor(survey.formTemplateColor, 0.6)
                                    }
                                });
                            });

                            $ionicLoading.hide();
                        });
                    });
            };

            $scope.$watch('cal.viewDate', function (newVal, oldVal) {
                var newDate = moment(newVal).toDate();

                $scope.dateModel = {
                    month: $scope.monthNames[newDate.getMonth()],
                    year: newDate.getFullYear()
                };

                localStorageService.set('calendar_current_date', newDate);
            });

            $scope.openChangeDateDialog = function () {
                $scope.changeDateModal.show();
            }

            $scope.closeChangeDateDialog = function () {
                $scope.changeDateModal.hide();
            }

            $scope.changeCalendarDate = function () {
                var monthIndex = $scope.monthNames.indexOf($scope.dateModel.month);
                var year = $scope.dateModel.year;

                $scope.cal.viewDate = moment(new Date(year, monthIndex, 1)).toDate();

                localStorageService.set('calendar_current_date', $scope.cal.viewDate);
                $scope.closeChangeDateDialog();
            }

            $scope.resetCalendarDate = function () {
                var today = new Date();
                $scope.cal.viewDate = today;

                $scope.dateModel = {
                    month: $scope.monthNames[today.getMonth()],
                    year: today.getFullYear()
                };

                localStorageService.set('calendar_current_date', $scope.cal.viewDate);
                $scope.closeChangeDateDialog();
            }

            $scope.activate = function () {
                $ionicModal.fromTemplateUrl('partials/calendar-date-modal.html', {
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
                var currentDate = localStorageService.get('calendar_current_date');
                if (currentDate !== null)
                    $scope.cal.viewDate = moment(currentDate).toDate();
                else
                    $scope.cal.viewDate = new Date();

                $scope.dateModel = {
                    month: $scope.monthNames[$scope.cal.viewDate.getMonth()],
                    year: $scope.cal.viewDate.getFullYear()
                };

                localStorageService.set('calendar_current_date', $scope.cal.viewDate);

                $scope.loadData();

                $timeout(function () {
                    $scope.orientation = $scope.getScreenOrientation();
                    $scope.orientationChanged($scope.orientation);
                }, 100);
            };

            $scope.activate();
        }
    ]);
}());