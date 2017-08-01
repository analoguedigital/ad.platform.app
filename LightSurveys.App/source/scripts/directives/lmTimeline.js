angular.module('lm.surveys').directive('lmTimeline', ['$rootScope', function ($rootScope) {
    return {
        restrict: "E",
        replace: true,
        template: '<canvas id="timeline"></canvas>',
        scope: {
            formTemplates: '=',
            surveys: '='
        },
        link: function (scope, element, attrs) {
            scope.currentDate = new Date();

            function generateXAxesTicks() {
                var xAxesTicks = [];

                var daysInMonth = moment(scope.currentDate).daysInMonth();
                var currentDay = moment(scope.currentDate).date();
                var firstDayOfMonth = moment(scope.currentDate).add(-(currentDay - 1), 'day').toDate();
                var lastDayOfMonth = moment(scope.currentDate).add((daysInMonth - currentDay), 'day').toDate();

                var currentMonthSurveys = _.filter(scope.surveys, (survey) => {
                    var currentMonth = moment(scope.currentDate).format('MM-YYYY');
                    var surveyMonth = moment(survey.surveyDate).format('MM-YYYY');

                    if (surveyMonth === currentMonth) { return survey; }
                });

                var groupedSurveys = _.groupBy(currentMonthSurveys, function (survey) {
                    return moment(survey.surveyDate).startOf('day').format();
                });

                var occurences = _.map(groupedSurveys, function (group, day) {
                    return {
                        day: moment(day).toDate(),
                        surveys: group
                    }
                });
                occurences = _.sortBy(occurences, 'day');

                if (currentMonthSurveys.length < 1 || occurences.length > 10) {
                    // display ticks from 1st to last day of month
                    xAxesTicks.push(firstDayOfMonth);
                    for (var i = 2; i < daysInMonth; i++) {
                        var daysToAdd = -(currentDay - i);
                        var tick = moment(scope.currentDate).add(daysToAdd, 'day').toDate();
                        xAxesTicks.push(tick);
                    }
                    xAxesTicks.push(lastDayOfMonth);
                }
                else {
                    // display 10 ticks only
                    var hasFirstDayOfMonth = _.filter(occurences, (oc) => {
                        return moment(oc.day).format('MM-DD-YYYY') === moment(firstDayOfMonth).format('MM-DD-YYYY');
                    }).length > 0;

                    var hasLastDayOfMonth = _.filter(occurences, (oc) => {
                        return moment(oc.day).format('MM-DD-YYYY') === moment(lastDayOfMonth).format('MM-DD-YYYY');
                    }).length > 0;

                    // add first day of month and
                    // compute the number of days we can fill in
                    xAxesTicks.push(firstDayOfMonth);
                    var missingDays = 10 - occurences.length;

                    // if first/last day of month are not present
                    // in our datasets, subtract from missing days
                    if (!hasFirstDayOfMonth)
                        missingDays -= 1;
                    if (!hasLastDayOfMonth)
                        missingDays -= 1;

                    // build ticks from 2nd day to last day
                    for (var i = 2; i <= daysInMonth; i++) {
                        var hasData = _.filter(occurences, (oc) => {
                            return moment(oc.day).date() == i;
                        });

                        if (hasData.length) {
                            var occurence = hasData[0];
                            xAxesTicks.push(occurence.day);
                        } else {
                            if (missingDays > 0) {
                                var daysToAdd = -(currentDay - i);
                                var tick = moment(scope.currentDate).add(daysToAdd, 'day').toDate();
                                xAxesTicks.push(tick);
                                missingDays -= 1;
                            }
                        }
                    }

                    if (!hasLastDayOfMonth)
                        xAxesTicks.push(lastDayOfMonth);
                }

                return xAxesTicks;
            }

            function generateDatasets(xAxesTicks) {
                var datasets = [];

                _.forEach(scope.formTemplates, (template) => {
                    var data = [];
                    var records = _.filter(scope.surveys, (survey) => { return survey.formTemplateId == template.id });

                    _.forEach(xAxesTicks, function (tick) {
                        var foundSurveys = _.filter(records, (record) => {
                            if (moment(tick).format('MM-DD-YYYY') === moment(record.surveyDate).format('MM-DD-YYYY')) {
                                return record;
                            }
                        });

                        if (foundSurveys.length) {
                            let impactSum = 0;
                            _.forEach(foundSurveys, (survey) => {
                                var timelineBarFormValue = _.filter(survey.formValues, { 'metricId': template.timelineBarMetricId })[0];
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
                        formTemplateId: template.id,
                        backgroundColor: template.colour,
                        borderColor: template.colour,
                        borderWidth: 2,
                        data: data,
                        stack: 1
                    };

                    datasets.push(ds);
                });

                return datasets;
            }

            function generateTimelineData() {
                var ticks = generateXAxesTicks();

                scope.chartLabels = ticks;
                scope.chartDatasets = generateDatasets(ticks);
            }

            function onChartAnimationComplete() {
                var chartSelf = this;
                var chartInstance = this.chart;
                var ctx = chartInstance.ctx;

                ctx.font = Chart.helpers.fontString(Chart.defaults.global.defaultFontSize, Chart.defaults.global.defaultFontStyle, Chart.defaults.global.defaultFontFamily);
                ctx.textAlign = 'center';
                ctx.textBaseline = 'bottom';

                this.data.datasets.forEach(function (dataset, i) {
                    var meta = chartInstance.controller.getDatasetMeta(i);

                    if (meta.hidden === null || meta.hidden === false) {
                        var barSize = meta.controller._ruler.barSize;
                        var minBarSize = 15;

                        var currentDay = moment(scope.currentDate).date();
                        var firstDayOfMonth = moment(scope.currentDate).add(-(currentDay - 1), 'day').toDate();

                        if (barSize >= minBarSize) {
                            meta.data.forEach(function (bar, index) {
                                var data = dataset.data[index];
                                var impact = parseInt(data);

                                if (impact > 0) {
                                    var foundTemplate = _.filter(scope.formTemplates, (template) => { return template.id === dataset.formTemplateId; });
                                    if (foundTemplate.length) {
                                        var template = foundTemplate[0];
                                        var records = _.filter(scope.surveys, (survey) => { return survey.formTemplateId == template.id });

                                        var x_axis = chartSelf.scales['x-axis-0'];
                                        var tickLabel = x_axis.ticks[index];

                                        var dayString = tickLabel.substr(3, tickLabel.length - 2);
                                        var dayNumber = parseInt(dayString);

                                        var daysToAdd = -(currentDay - dayNumber);
                                        var foundDate = moment(scope.currentDate).add(daysToAdd, 'day').toDate();

                                        var foundSurveys = _.filter(records, (record) => {
                                            if (moment(foundDate).format('MM-DD-YYYY') === moment(record.surveyDate).format('MM-DD-YYYY')) {
                                                return record;
                                            }
                                        });

                                        if (foundSurveys.length) {
                                            var centerX = bar._model.x;
                                            var centerY = bar._model.y;
                                            var radius = barSize / 2;

                                            ctx.beginPath();
                                            ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
                                            ctx.fillStyle = 'white';
                                            ctx.fill();
                                            ctx.lineWidth = 1;
                                            ctx.strokeStyle = 'white';
                                            ctx.stroke();

                                            ctx.fillStyle = '#1D2331';
                                            ctx.fillText(foundSurveys.length, bar._model.x, bar._model.y + 7);
                                        }
                                    }
                                }
                            });
                        }
                    }
                });
            }

            function onTooltipsTitleCallback(items, data) {
                var xLabel = items[0].xLabel;
                var yValue = 0;
                _.forEach(items, (item) => {
                    yValue += parseInt(item.yLabel);
                });

                var result = [];
                result.push(xLabel);
                result.push(`Impact: ${yValue}`);

                return result;
            }

            function onTooltipsLabelCallback (item, data) {
                var label = data.datasets[item.datasetIndex].label;
                return `${label}: ${item.yLabel}`;
            }

            function renderTimelineChart() {
                var canvas = element[0];
                var parent = element.closest('.content');
                var ctx = canvas.getContext('2d');
                ctx.canvas.height = parent.height();

                // compute yAxes max value.
                var dataPoints = [];
                _.forEach(scope.chartDatasets, (ds) => {
                    dataPoints.push.apply(dataPoints, ds.data);
                });
                var maxImpact = _.max(dataPoints) + 10;

                var chartOptions = {
                    responsive: true,
                    maintainAspectRatio: false,
                    tooltips: {
                        mode: 'index',
                        position: 'nearest',
                        callbacks: {
                            title: onTooltipsTitleCallback,
                            label: onTooltipsLabelCallback
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
                                max: maxImpact
                            }
                        }]
                    },
                    hover: {
                        animationDuration: 0
                    },
                    animation: {
                        duration: 1,
                        onComplete: onChartAnimationComplete
                    }
                };

                var config = {
                    type: 'groupableBar',
                    data: {
                        labels: scope.chartLabels,
                        datasets: scope.chartDatasets
                    },
                    options: chartOptions
                };

                if (scope.timelineChart)
                    scope.timelineChart.destroy();

                scope.timelineChart = new Chart(ctx, config);
            }

            scope.timelineNextMonth = function () {
                scope.currentDate = moment(scope.currentDate).add(1, 'months').toDate();
            }

            scope.timelinePreviousMonth = function () {
                scope.currentDate = moment(scope.currentDate).subtract(1, 'months').toDate();
            }

            scope.$watchGroup(['formTemplates', 'surveys'], () => {
                generateTimelineData();
                renderTimelineChart();
            });

            scope.$watch('currentDate', (newValue, oldValue) => {
                if (newValue !== oldValue) {
                    generateTimelineData();
                    renderTimelineChart();
                }
            });

            $rootScope.$on('timeline-next-month', () => {
                scope.timelineNextMonth();
            });
            $rootScope.$on('timeline-previous-month', () => {
                scope.timelinePreviousMonth();
            });
        }
    }
}]);
