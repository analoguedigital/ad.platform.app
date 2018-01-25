'use strict';
angular.module('lm.surveys').controller('calendarController', ['$scope', '$state', 'surveyService', 'alertService', 'gettext', 'userService', '$timeout', '$ionicNavBarDelegate',
    function ($scope, $state, surveyService, alertService, gettext, userService, $timeout, $ionicNavBarDelegate) {

        $scope.cal = {};
        $scope.cal.calendarView = 'month';
        $scope.cal.viewDate = new Date();

        $scope.months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        $scope.cal.events = [];
        $scope.orientation = '';
        $scope.CalendarHeaderBarStyle = {};
        $scope.CalendarContentStyle = {};

        $scope.cal.eventClicked = function (event) {
            $state.go('surveyView', { id: event.surveyId });
        };

        $scope.backToMonthView = function () {
            $scope.cal.calendarView = 'month';
        }

        $scope.shadeColor = function (color, percent) {
            if (!color)
                return null;

            var f = parseInt(color.slice(1), 16), t = percent < 0 ? 0 : 255, p = percent < 0 ? percent * -1 : percent, R = f >> 16, G = f >> 8 & 0x00FF, B = f & 0x0000FF;
            return "#" + (0x1000000 + (Math.round((t - R) * p) + R) * 0x10000 + (Math.round((t - G) * p) + G) * 0x100 + (Math.round((t - B) * p) + B)).toString(16).slice(1);
        }

        $scope.getScreenOrientation = function () {
            if (window.innerHeight > window.innerWidth) {
                return 'portrait';
            }

            return 'landscape';
        }

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
                $scope.CalendarHeaderBarStyle = { 'top': headerBarTop };
                $scope.CalendarContentStyle = { 'top': contentTop };
            } else if (orientation === 'portrait') {
                $ionicNavBarDelegate.showBar(true);
                $scope.CalendarHeaderBarStyle = {};
                $scope.CalendarContentStyle = {};
            }
        }

        $scope.activate = function () {
            $timeout(function () {
                $scope.orientation = $scope.getScreenOrientation();
                $scope.orientationChanged($scope.orientation);
            }, 100);

            surveyService.getFormTemplates()
                .then(function (templates) {
                    angular.forEach(templates, function (template) {
                        surveyService.getSubmittedSurveys(template.id)
                            .then(function (surveys) {
                                angular.forEach(surveys, function (survey) {
                                    var utcDate = moment.utc(survey.surveyDate);
                                    var localDate = utcDate.local().toDate();

                                    $scope.cal.events.push({
                                        title: template.title,
                                        startsAt: localDate,
                                        surveyId: survey.id,
                                        color: { primary: template.colour, secondary: $scope.shadeColor(template.colour, 0.6) }
                                    });
                                });
                            });
                    });
                });
        }

        $scope.activate();

        $scope.$on('$ionicView.enter', function () {
            window.onresize = function () {
                $timeout(function () {
                    $scope.orientation = $scope.getScreenOrientation();
                    $scope.orientationChanged($scope.orientation);
                }, 100);
            }
        });

        $scope.$on('$destroy', function() {
            window.onresize = null;
        })
    }]);