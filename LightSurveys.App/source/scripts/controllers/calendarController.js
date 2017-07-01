'use strict';
angular.module('lm.surveys').controller('calendarController', ['$scope', '$state', 'surveyService', 'alertService', 'gettext', 'userService',
    function ($scope, $state, surveyService, alertService, gettext, userService) {

        $scope.cal = {};
        $scope.cal.calendarView = 'month';
        $scope.cal.viewDate = new Date();
        $scope.cal.eventClicked = function (event) {
            $state.go('surveyView', { id: event.surveyId });
        };

        $scope.months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];



        $scope.cal.events = [];
        surveyService.getFormTemplates()
            .then(function (templates) {
                angular.forEach(templates, function (template) {

                    angular.forEach(template.metricGroups, function (group) {
                        if (!group.isRepeater) {
                            angular.forEach(group.metrics, function (metric) {

                                if (metric.type.toLowerCase().includes('time'))
                                    template.timeMetricId = metric.id;
                            });
                        }
                    });

                    surveyService.getSubmittedSurveys(template.id)
                        .then(function (surveys) {
                            angular.forEach(surveys, function (survey) {
                                var date = new Date(survey.surveyDate);

                                var dateFormValue = _.find(survey.formValues, { 'metricId': template.calendarDateMetricId });
                                if (dateFormValue)
                                    date = new Date(dateFormValue.dateValue);

                                var timeFormValue = _.find(survey.formValues, { 'metricId': template.timeMetricId });
                                if (timeFormValue !== undefined) {
                                    date.setHours(new Date(timeFormValue.timeValue).getHours(), new Date(timeFormValue.timeValue).getMinutes());
                                }

                                $scope.cal.events.push({
                                    title: template.title,
                                    startsAt: date,
                                    surveyId: survey.id,
                                    color: { primary: template.colour, secondary: $scope.shadeColor(template.colour, 0.6) }
                                });
                            });
                        });
                });
            });

        $scope.backToMonthView = function () {
            $scope.cal.calendarView = 'month';
        }

        $scope.shadeColor = function (color, percent) {
            if (!color)
                return null;

            var f = parseInt(color.slice(1), 16), t = percent < 0 ? 0 : 255, p = percent < 0 ? percent * -1 : percent, R = f >> 16, G = f >> 8 & 0x00FF, B = f & 0x0000FF;
            return "#" + (0x1000000 + (Math.round((t - R) * p) + R) * 0x10000 + (Math.round((t - G) * p) + G) * 0x100 + (Math.round((t - B) * p) + B)).toString(16).slice(1);
        }

    }]);