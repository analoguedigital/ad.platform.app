'use strict';
angular.module('lm.surveys').controller('draftsController', ['$scope', '$state', '$stateParams', '$location', 'surveyService', 'alertService', 'gettext', 'userService',
    function ($scope, $state, $stateParams, $location, surveyService, alertService, gettext, userService) {

        $scope.formTemplateId = $stateParams.id;
        $scope.formTemplate = {};
        $scope.drafts = [];
        $scope.descriptionMetrics = [];

        function getDescriptionMetrics(formTemplate) {
            var descFormat = formTemplate.descriptionFormat;
            if (descFormat && descFormat.length) {
                var rxp = /{{([^}]+)}}/g;
                var titles = [];
                var currentMatch = undefined;
                while (currentMatch = rxp.exec(descFormat)) {
                    titles.push(currentMatch[1]);
                }

                var foundMetrics = [];
                _.forEach(formTemplate.metricGroups, function (metricGroup) {
                    _.forEach(metricGroup.metrics, function (metric) {
                        var shortTitle = _.toLower(metric.shortTitle);
                        if (_.includes(titles, shortTitle)) {
                            foundMetrics.push(metric);
                        }
                    });
                });

                return foundMetrics;
            }

            return [];
        }

        function getValueText(formValue) {
            if (formValue.hasOwnProperty('textValue'))
                return formValue.textValue;

            if (formValue.hasOwnProperty('dateValue'))
            {
                var date = new Date(formValue.dateValue);
                return $scope.dateToString(date);
            }

            if (formValue.hasOwnProperty('numericValue'))
                return formValue.numericValue;
        }

        function getDescription(survey) {
            var values = [];
            _.forEach($scope.descriptionMetrics, function (metric) {
                var formValue = _.find(survey.formValues, function (fv) { return fv.metricId == metric.id; });
                values.push(getValueText(formValue));
            });

            return values.join(' - ');
        }

        var reload = function () {
            surveyService.getAllSavedSurveys($scope.formTemplateId).then(
                function (drafts) {
                    $scope.drafts = [];
                    angular.forEach(drafts, function (draft) {
                        draft.description = getDescription(draft);

                        var attachmentGroups = _.groupBy(_.flatMap(draft.formValues, function (formValue) { return formValue.attachments === undefined ? [] : formValue.attachments; }), function (attachment) { return attachment.mediaType; });
                        draft.attachments = '';
                        angular.forEach(Object.keys(attachmentGroups), function (key) {
                            draft.attachments += (draft.attachments !== '' ? ', ' : '') + attachmentGroups[key].length + " " + key + (attachmentGroups[key].length > 1 ? 's' : '');
                        });

                        $scope.drafts.push(draft);
                    });
                },
                function (err) { alertService.show(gettext('error in loading saved surveys: ') + err); });
        };

        $scope.continue = function (draft) {
            $state.go('survey', { id: draft.id });
        };

        $scope.viewSurvey = function (survey) {
            $state.go('surveyView', { id: survey.id });
        };

        $scope.delete = function (draft) {
            surveyService.delete(draft.id).then(
                reload,
                function (err) { alertService.show(gettext('error in deleting survey: ') + err); });
        };

        $scope.dateToString = function (milliseconds) {
            if (userService.current.calendar === "Gregorian") {
                var dateValue = new Date(milliseconds);
                return dateValue.toLocaleString('en-GB');
            }
            else {
                var dateVal = persianDate(milliseconds);
                return dateVal.format("LLLL");
            }
        };

        surveyService.getFormTemplate($scope.formTemplateId).then(
            function (formTemplate) {
                $scope.formTemplate = formTemplate;
                $scope.descriptionMetrics = getDescriptionMetrics(formTemplate);
            },
            function (err) { alertService.show(gettext('error in loading the form template: ') + err); });

        reload();

    }]);