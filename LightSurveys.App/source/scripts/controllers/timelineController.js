'use strict';
angular.module('lm.surveys').controller('timelineController', ['$scope', 'surveyService', 'alertService', 'gettext', 'userService',
    function ($scope, surveyService, alertService, gettext, userService) {
        $scope.templates = [];
        $scope.surveys = [];

        $scope.currentDate = new Date();
        $scope.months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        $scope.chartLabels = [];
        $scope.chartDatasets = [];

        $scope.generateChartData = function () {
            var daysInMonth = moment($scope.currentDate).daysInMonth();
            var currentDay = moment($scope.currentDate).date();
            var firstDayOfMonth = moment($scope.currentDate).add(-(currentDay - 1), 'day').toDate();
            var lastDayOfMonth = moment($scope.currentDate).add((daysInMonth - currentDay), 'day').toDate();

            var days = [];
            days.push(firstDayOfMonth);
            for (var i = 2; i <= daysInMonth; i++) {
                var daysToAdd = -(currentDay - i);
                var tick = moment($scope.currentDate).add(daysToAdd, 'day').toDate();
                days.push(tick);
            }

            $scope.chartLabels = days;

            var datasets = [];
            _.forEach($scope.templates, (template) => {
                var data = [];
                var records = _.filter($scope.surveys, (survey) => { return survey.formTemplateId == template.id });

                console.log('records', records);

                _.forEach(days, (day) => {
                    var foundSurveys = _.filter(records, (record) => {
                        if (moment(day).format('MM-DD-YYYY') === moment(record.surveyDate).format('MM-DD-YYYY')) {
                            return record;
                        }
                    });

                    if (foundSurveys.length) {
                        console.log('found on ' + moment(day).format('MM-DD'), foundSurveys.length);

                        let impactSum = 0;
                        _.forEach(foundSurveys, (survey) => {
                            var timelineBarFormValue = _.filter(survey.formValues, { 'metricId': survey.formTemplate.timelineBarMetricId })[0];
                            if (timelineBarFormValue) {
                                impactSum += parseInt(timelineBarFormValue.numericValue);
                            }
                        });

                        data.push(impactSum);
                    } else {
                        data.push(0);
                    }
                });

                var ds = {
                    label: template.title,
                    backgroundColor: template.colour,
                    borderColor: template.colour,
                    borderWidth: 2,
                    data: data,
                    stack: 1
                };

                datasets.push(ds);
            });

            $scope.chartDatasets = datasets;
        }

        $scope.generateChart = function () {
            $scope.generateChartData();

            var ctx = document.getElementById("timeline").getContext("2d");
            var chartOptions = {
                tooltips: {
                    mode: 'index',
                    callbacks: {
                        title: function (items, data) {
                            var xLabel = items[0].xLabel;
                            var yValue = 0;
                            _.forEach(items, (item) => {
                                yValue += parseInt(item.yLabel);
                            });

                            var result = [];
                            result.push(xLabel);
                            result.push(`Impact: ${yValue}`);

                            return result;
                        },
                        label: function (item, data) {
                            var label = data.datasets[item.datasetIndex].label;
                            return `${label}: ${item.yLabel}`;
                        }
                    }
                },
                scales: {
                    xAxes: [{
                        display: true,
                        time: {
                            unit: 'day',
                            displayFormats: {
                                day: 'lll'
                            }
                        },
                        ticks: {
                            autoSkip: true,
                            callback: function (value) {
                                return moment(value).format('MMM D');
                            },
                        }
                    }],
                    yAxes: [{
                        ticks: {
                            beginAtZero: true,
                            max: 30
                        }
                    }]
                }
            };

            var config = {
                type: 'groupableBar',
                data: {
                    labels: $scope.chartLabels,
                    datasets: $scope.chartDatasets
                },
                options: chartOptions
            };

            if ($scope.timelineChart)
                $scope.timelineChart.destroy();

            $scope.timelineChart = new Chart(ctx, config);
        };

        $scope.nextMonth = function () {
            $scope.currentDate = moment($scope.currentDate).add(1, 'months').toDate();
        }

        $scope.previousMonth = function () {
            $scope.currentDate = moment($scope.currentDate).subtract(1, 'months').toDate();
        }

        $scope.readSurveys = function () {
            surveyService.getAllSubmittedSurveys()
                .then(function (surveys) {
                    // get unique form templates
                    var templates = _.uniqBy(surveys, 'formTemplate').map((survey) => { return survey.formTemplate; });

                    $scope.templates = templates;
                    $scope.surveys = surveys;
                });
        }

        $scope.activate = function () {
            $scope.readSurveys();
            $scope.$watch('currentDate', $scope.generateChart);
        }

        $scope.activate();

    }]);