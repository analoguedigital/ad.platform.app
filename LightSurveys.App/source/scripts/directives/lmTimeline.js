﻿angular.module('lm.surveys').directive('lmTimeline', ['$rootScope', '$timeout', function ($rootScope, $timeout) {
    return {
        restrict: "E",
        replace: true,
        template: "<canvas id='timeline-chart'></canvas>",
        transclude: false,
        link: link,
        scope: {
            formTemplates: '=',
            surveys: '=',
            height: '@',
            renderMode: '@'
        }
    };

    function link(scope, element, attrs) {
        if (scope.renderMode === undefined || scope.renderMode.length < 1)
            scope.renderMode = 'mobile';

        scope.currentDate = new Date();
        scope.orientation = getScreenOrientation();

        function getScreenOrientation() {
            if (window.innerHeight > window.innerWidth) {
                return 'portrait';
            }

            return 'landscape';
        }

        function generateWebXAxis() {
            var xAxesTicks = [];

            var groupedSurveys = _.groupBy(scope.surveys, function (survey) {
                return moment(survey.surveyDate).startOf('day').format();
            });

            var occurences = _.map(groupedSurveys, function (group, day) {
                return {
                    day: moment(day).toDate(),
                    surveys: group
                };
            });
            occurences = _.sortBy(occurences, 'day');

            if (occurences.length >= 28) {
                // broadcast that we have a month view
                $rootScope.$broadcast('timeline-in-month-view');

                // first day of month to last
                var daysInMonth = moment(scope.currentDate).daysInMonth();
                var currentDay = moment(scope.currentDate).date();
                var firstDayOfMonth = moment(scope.currentDate).add(-(currentDay - 1), 'day').toDate();
                var lastDayOfMonth = moment(scope.currentDate).add((daysInMonth - currentDay), 'day').toDate();

                xAxesTicks.push(firstDayOfMonth);
                for (var i = 2; i < daysInMonth; i++) {
                    var daysToAdd = -(currentDay - i);
                    var tick = moment(scope.currentDate).add(daysToAdd, 'day').toDate();
                    xAxesTicks.push(tick);
                }
                xAxesTicks.push(lastDayOfMonth);
            } else {
                // broadcast that we have a snapshot view
                $rootScope.$broadcast('timeline-in-snapshot-view');

                // date range with padding
                _.forEach(occurences, function (oc) {
                    xAxesTicks.push(oc.day);
                });

                var minDate = _.minBy(occurences, 'day').day;
                var maxDate = _.maxBy(occurences, 'day').day;

                var maxTicks = 28;
                var missingTicks = Math.floor((maxTicks - occurences.length) / 2);

                // padding to start
                for (var k = 1; k <= missingTicks; k++) {
                    var date = moment(minDate).add(-k, 'days').toDate();
                    xAxesTicks.unshift(date);
                }

                // padding to end
                for (var j = 1; j <= missingTicks; j++) {
                    var endDate = moment(maxendDate).add(j, 'days').toDate();
                    xAxesTicks.push(endDate);
                }

                if (xAxesTicks.length < maxTicks) {
                    var firstTick = xAxesTicks[0];
                    var _date = new moment(firstTick).add(-1, 'days').toDate();
                    xAxesTicks.unshift(_date);
                }
            }

            return xAxesTicks;
        }

        function generateMobileXAxis() {
            var xAxesTicks = [];

            var daysInMonth = moment(scope.currentDate).daysInMonth();
            var currentDay = moment(scope.currentDate).date();
            var firstDayOfMonth = moment(scope.currentDate).add(-(currentDay - 1), 'day').toDate();
            var lastDayOfMonth = moment(scope.currentDate).add((daysInMonth - currentDay), 'day').toDate();

            var currentMonthSurveys = _.filter(scope.surveys, function (survey) {
                var currentMonth = moment(scope.currentDate).format('MM-YYYY');
                var surveyMonth = moment(survey.surveyDate).format('MM-YYYY');

                if (surveyMonth === currentMonth) {
                    return survey;
                }
            });

            var groupedSurveys = _.groupBy(currentMonthSurveys, function (survey) {
                return moment(survey.surveyDate).startOf('day').format();
            });

            var occurences = _.map(groupedSurveys, function (group, day) {
                return {
                    day: moment(day).toDate(),
                    surveys: group
                };
            });
            occurences = _.sortBy(occurences, 'day');

            if (currentMonthSurveys.length < 1 || occurences.length > 10 || scope.orientation !== 'portrait') {
                // display ticks from 1st to last day of month
                xAxesTicks.push(firstDayOfMonth);
                for (var i = 2; i < daysInMonth; i++) {
                    var daysToAdd = -(currentDay - i);
                    var tick = moment(scope.currentDate).add(daysToAdd, 'day').toDate();
                    xAxesTicks.push(tick);
                }
                xAxesTicks.push(lastDayOfMonth);
            } else {
                // display 10 ticks only
                var hasFirstDayOfMonth = _.filter(occurences, function (oc) {
                    return moment(oc.day).format('MM-DD-YYYY') === moment(firstDayOfMonth).format('MM-DD-YYYY');
                }).length > 0;

                var hasLastDayOfMonth = _.filter(occurences, function (oc) {
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
                for (var _index = 2; _index <= daysInMonth; _index++) {
                    var hasData = _.filter(occurences, function (oc) {
                        return moment(oc.day).date() == _index;
                    });

                    if (hasData.length) {
                        var occurence = hasData[0];
                        xAxesTicks.push(occurence.day);
                    } else {
                        if (missingDays > 0) {
                            var _daysToAdd = -(currentDay - _index);
                            var missingTick = moment(scope.currentDate).add(_daysToAdd, 'day').toDate();
                            xAxesTicks.push(missingTick);
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

            _.forEach(scope.formTemplates, function (template) {
                var data = [];
                var records = _.filter(scope.surveys, function (survey) {
                    return survey.formTemplateId == template.id;
                });

                _.forEach(xAxesTicks, function (tick) {
                    var foundSurveys = _.filter(records, function (record) {
                        if (moment(tick).format('MM-DD-YYYY') === moment(record.surveyDate).format('MM-DD-YYYY')) {
                            return record;
                        }
                    });

                    if (foundSurveys.length) {
                        var impactSum = 0;
                        _.forEach(foundSurveys, function (survey) {
                            var timelineBarFormValue = _.filter(survey.formValues, {
                                'metricId': template.timelineBarMetricId
                            })[0];
                            if (timelineBarFormValue) {
                                var value = timelineBarFormValue.numericValue;

                                if (typeof value === 'string' || value instanceof String) {
                                    impactSum += parseInt(value);
                                } else {
                                    impactSum += value;
                                }
                            }
                        });

                        if (impactSum === 0) impactSum = 0.1;

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

            return datasets.reverse();
        }

        function generateTimelineData() {
            var ticks = [];
            scope.tickData = [];

            if (scope.renderMode === 'web')
                ticks = generateWebXAxis();
            else if (scope.renderMode === 'mobile')
                ticks = generateMobileXAxis();

            // generate ticks data
            _.forEach(ticks, function (tick) {
                var surveys = _.filter(scope.surveys, function (survey) {
                    if (moment(survey.surveyDate).format('MM-DD-YYYY') === moment(tick).format('MM-DD-YYYY')) {
                        return survey;
                    }
                });

                scope.tickData.push({
                    date: tick,
                    data: surveys
                });
            });

            scope.chartLabels = ticks;
            scope.chartDatasets = generateDatasets(ticks);
        }

        function customTooltips(tooltip) {
            // Tooltip Element
            var tooltipEl = document.getElementById('chartjs-tooltip');

            if (!tooltipEl) {
                tooltipEl = document.createElement('div');
                tooltipEl.id = 'chartjs-tooltip';
                tooltipEl.innerHTML = "<table></table>";
                this._chart.canvas.parentNode.appendChild(tooltipEl);
            }

            // Hide if no tooltip
            if (tooltip.opacity === 0) {
                tooltipEl.style.opacity = 0;
                return;
            }

            // Set caret Position
            tooltipEl.classList.remove('above', 'below', 'no-transform');
            if (tooltip.yAlign) {
                tooltipEl.classList.add(tooltip.yAlign);
            } else {
                tooltipEl.classList.add('no-transform');
            }

            function getBody(bodyItem) {
                return bodyItem.lines;
            }

            // Set Text
            if (tooltip.body) {
                var titleLines = tooltip.title || [];
                var bodyLines = tooltip.body.map(getBody);

                var innerHtml = '<thead>';

                titleLines.forEach(function (title) {
                    innerHtml += '<tr><th>' + title + '</th></tr>';
                });
                innerHtml += '</thead><tbody>';

                bodyLines.forEach(function (body, i) {
                    if (body.length > 0) {
                        var colors = tooltip.labelColors[i];
                        var style = 'background:' + colors.backgroundColor;
                        style += '; border-color:' + colors.borderColor;
                        style += '; border-width: 2px';
                        var span = '<span class="chartjs-tooltip-key" style="' + style + '"></span>';
                        innerHtml += '<tr><td>' + span + body + '</td></tr>';
                    }
                });
                innerHtml += '</tbody>';

                var tableRoot = tooltipEl.querySelector('table');
                tableRoot.innerHTML = innerHtml;
            }

            var positionY = this._chart.canvas.offsetTop;
            var positionX = this._chart.canvas.offsetLeft;

            var canvasWidth = element[0].style.width;
            canvasWidth = canvasWidth.substr(0, canvasWidth.length - 2);

            var ctxWidth = parseInt(canvasWidth);
            var caretX = parseInt(tooltip.caretX);
            var isNearEdge = (ctxWidth - caretX) < 40;

            // default value for tooltip left
            var tooltipLeft = positionX + tooltip.caretX + 10 + 'px';

            // if near edge, reduce X padding
            if (isNearEdge) {
                tooltipLeft = positionX + tooltip.caretX - 30 + 'px';
            }

            // Display, position, and set styles for font
            tooltipEl.style.opacity = 1;
            tooltipEl.style.left = tooltipLeft;
            tooltipEl.style.top = positionY + tooltip.caretY + 'px';
            tooltipEl.style.fontFamily = tooltip._bodyFontFamily;
            tooltipEl.style.fontSize = tooltip.bodyFontSize;
            tooltipEl.style.fontStyle = tooltip._fontStyle;
            tooltipEl.style.padding = tooltip.yPadding + 'px ' + tooltip.xPadding + 'px';
        }

        function renderTimelineChart() {
            var canvas = element[0];

            var parent;
            if (scope.renderMode === 'web')
                parent = element.closest('.box-content');
            else if (scope.renderMode === 'mobile')
                parent = element.closest('.timeline-content');

            var ctx = canvas.getContext('2d');

            // set timeline height
            if (scope.height && scope.height > 0)
                ctx.canvas.height = scope.height;
            else
                ctx.canvas.height = parent.height();

            // compute yAxis max, and add a little padding
            var dailyImpact = [];
            _.forEach(scope.chartLabels, function (tick, index) {
                var impact = 0;
                for (var i = 0; i < scope.chartDatasets.length; i++) {
                    impact += scope.chartDatasets[i].data[index];
                }
                dailyImpact.push(impact);
            });

            var maxImpact = _.max(dailyImpact) + 1;
            var minImpact = _.min(dailyImpact);

            if (minImpact < 0) minImpact += -1;

            var chartOptions = {
                responsive: true,
                maintainAspectRatio: false,
                tooltips: {
                    enabled: false,
                    mode: 'index',
                    position: 'nearest',
                    bodyFontFamily: "'Calibri', 'Arial', sans-serif",
                    custom: customTooltips,
                    callbacks: {
                        title: onTooltipsTitleCallback,
                        label: onTooltipsLabelCallback
                    }
                },
                scales: {
                    xAxes: [{
                        display: true,
                        stacked: true,
                        gridLines: {
                            display: false
                        },
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
                            fontColor: '#444'
                        }
                    }],
                    yAxes: [{
                        stacked: true,
                        gridLines: {
                            display: true,
                            drawBorder: false
                        },
                        ticks: {
                            beginAtZero: true,
                            stepSize: 1,
                            max: maxImpact,
                            min: minImpact,
                            fontColor: '#444'
                        },
                        scaleLabel: {
                            display: true,
                            labelString: 'Impact',
                            fontColor: '#444'
                        }
                    }]
                },
                hover: {
                    animationDuration: 0
                },
                animation: {
                    duration: 1,
                    onComplete: onChartAnimationComplete
                },
                legend: {
                    labels: {
                        fontColor: '#444'
                    }
                }
            };

            var config = {
                type: 'bar',
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

        function buildTimeline() {
            generateTimelineData();

            $timeout(function () {
                renderTimelineChart();
            }, 100);
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

                    if (barSize >= minBarSize) {
                        meta.data.forEach(function (bar, index) {
                            var data = dataset.data[index];
                            var impact = parseInt(data);

                            var foundTemplate = _.filter(scope.formTemplates, function (template) {
                                return template.id === dataset.formTemplateId;
                            });
                            if (foundTemplate.length) {
                                var template = foundTemplate[0];
                                var tickData = scope.tickData[index];

                                var records = _.filter(tickData.data, function (record) {
                                    return record.formTemplateId == template.id;
                                });

                                if (records.length) {
                                    var centerX = bar._model.x;
                                    var centerY = bar._model.y;
                                    var radius = barSize / 2;
                                    var fillColour = impact === 0 ? 'orange' : 'white';
                                    var strokeColor = impact === 0 ? 'darkorange' : 'gray';

                                    ctx.beginPath();
                                    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
                                    ctx.fillStyle = fillColour;
                                    ctx.fill();
                                    ctx.lineWidth = 1;
                                    ctx.strokeStyle = strokeColor;
                                    ctx.stroke();

                                    ctx.fillStyle = '#1D2331';
                                    ctx.fillText(records.length, bar._model.x, bar._model.y + 7);
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
            _.forEach(items, function (item) {
                yValue += parseInt(item.yLabel);
            });

            var result = [];
            result.push(xLabel);
            result.push('Impact: ' + yValue);

            return result;
        }

        function onTooltipsLabelCallback(item, data) {
            var label = data.datasets[item.datasetIndex].label;
            var dataset = data.datasets[item.datasetIndex];
            var dataPoint = dataset.data[item.index];

            if (item.yLabel === 0.1)
                item.yLabel = 0;

            return label + ': ' + item.yLabel;
        }

        scope.timelineNextMonth = function () {
            scope.currentDate = moment(scope.currentDate).add(1, 'months').toDate();
        };

        scope.timelinePreviousMonth = function () {
            scope.currentDate = moment(scope.currentDate).subtract(1, 'months').toDate();
        };

        scope.$watchGroup(['formTemplates', 'surveys'], function (data) {
            buildTimeline();
        });

        scope.$watch('currentDate', function (newValue, oldValue) {
            if (newValue !== oldValue) {
                buildTimeline();
            }
        });

        $rootScope.$on('timeline-next-month', function () {
            scope.timelineNextMonth();
        });

        $rootScope.$on('timeline-previous-month', function () {
            scope.timelinePreviousMonth();
        });

        $rootScope.$on('timeline-rebuild', function (evt, arg) {
            $timeout(function () {
                scope.orientation = arg;
                if (scope.timelineChart) scope.timelineChart.destroy();
                buildTimeline();
            }, 100);
        });

        $rootScope.$on('timeline-change-date', function (evt, args) {
            scope.currentDate = args;
        });
    }
}]);