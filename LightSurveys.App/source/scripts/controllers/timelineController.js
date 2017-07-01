'use strict';
angular.module('lm.surveys').controller('timelineController', ['$scope', 'surveyService', 'alertService', 'gettext', 'userService',
function ($scope, surveyService, alertService, gettext, userService) {

    $scope.chartOptions = {
        legend: {
            display: false,
        },
        tooltips: {
            callbacks: {
                title: function (items, data) {
                    return "Records: " + data.datasets[0].meta[items[0].index].records;
                },
                label: function (item, data) {
                    return "Sum Impact: " + data.datasets[0].data[item.index];
                }
            }
        }
    };

    $scope.templates = [];
    $scope.values = [];
    $scope.months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
           "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    var readSurveys = function () {
        return surveyService.getAllSubmittedSurveys()
        .then(function (surveys) {
            angular.forEach(surveys, function (survey) {
                var date = new Date(survey.surveyDate);

                var dateFormValue = _.filter(survey.formValues, { 'metricId': survey.formTemplate.calendarDateMetricId })[0];
                if (dateFormValue) {
                    date = new Date(dateFormValue.dateValue);
                }
                date.setHours(0, 0, 0, 0);

                var value = _.filter(survey.formValues, { 'metricId': survey.formTemplate.timelineBarMetricId })[0];

                if (value) {
                    var existingValueForDateAndTemplate = _.find($scope.values, { 'templateId': survey.formTemplateId, 'date': date });

                    if (existingValueForDateAndTemplate !== undefined) {
                        existingValueForDateAndTemplate.value.numericValue = parseInt(existingValueForDateAndTemplate.value.numericValue) + parseInt(value.numericValue);
                        existingValueForDateAndTemplate.records++;
                    }
                    else {
                        $scope.values.push({
                            "templateId": survey.formTemplateId,
                            "date": date,
                            "value": value,
                            "colour": survey.formTemplate.colour,
                            "records": 1,
                        });
                    }
                }
            });
        })
    }

    readSurveys()
     .then(function () {
         $scope.currentDate = new Date(new Date().setDate(1));
         $scope.$watch('currentDate', $scope.generateChart);
     });

    $scope.generateChart = function () {

        var data = {};
        data.labels = [];

        var daysInMonth = new Date($scope.currentDate.getYear(), $scope.currentDate.getMonth() + 1, 0).getDate();

        var currentMonthValues = _.filter($scope.values, function (val) {
            return val.date.getYear() === $scope.currentDate.getYear() && val.date.getMonth() === $scope.currentDate.getMonth()
        });

        currentMonthValues = _.sortBy(currentMonthValues, function (val) { return val.date.toISOString(); });

        data.datasets = [{
            label: "Recordings",
            backgroundColor: [],
            borderColor: [],
            data: [],
            meta: [],
        }];

        angular.forEach(currentMonthValues, function (val) {
            data.labels.push(val.date.getDate());
            data.datasets[0].data.push(val.value.numericValue);
            data.datasets[0].meta.push({ records: val.records });
            data.datasets[0].backgroundColor.push(val.colour);
            data.datasets[0].borderColor.push(val.colour);
        });

        while (data.labels.length < 30) {
            data.labels.push("");
            data.datasets[0].data.push(0);
        }


        $scope.timelineData = data;
    };

    $scope.nextMonth = function () {
        $scope.currentDate = moment($scope.currentDate).add(1, 'months').toDate();
    }

    $scope.previousMonth = function () {
        $scope.currentDate = moment($scope.currentDate).subtract(1, 'months').toDate();
    }


}]);