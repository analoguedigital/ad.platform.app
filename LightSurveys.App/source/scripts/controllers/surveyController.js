'use strict';
angular.module('lm.surveys').controller('surveyController', ['$scope', '$ionicHistory', '$stateParams', '$state', 'userService', 'surveyService', 'alertService', 'gettext',
function ($scope, $ionicHistory, $stateParams, $state, userService, surveyService, alertService, gettext) {

    $scope.surveyId = $stateParams.id;
    $scope.formTemplate = null;
    $scope.currentPageIndex = -1;
    $scope.numberOfPages = 0;
    $scope.activeGroups = [];
    $scope.allFormValues = [];

    var populateFormValues = function () {
        $scope.survey.formValues = [];
        for (var i = 0; i < $scope.formTemplate.metricGroups.length; i++) {
            for (var j = 0; j < $scope.formTemplate.metricGroups[i].metrics.length; j++) {
                var metric = $scope.formTemplate.metricGroups[i].metrics[j];

                if (!_.isUndefined(metric.formValue)) {
                    if (metric.isComplex) {
                        for (var key in metric.formValue) {
                            $scope.survey.formValues.push(metric.formValue[key]);
                        }
                    } else {
                        metric.formValue.metricId = metric.id;
                        $scope.survey.formValues.push(metric.formValue);
                    }
                }
            }
        }
    };

    $scope.isCurrentPage = function (metricGroup) {
        if ($scope.currentPageIndex == -1) return false;
        return metricGroup.page == $scope.currentPageIndex + 1;
    }

    $scope.isFirstPage = function () {
        if ($scope.currentPageIndex == -1) return false;
        return $scope.currentPageIndex == 0;
    };

    $scope.isLastPage = function () {
        if ($scope.currentPageIndex == -1) return false;
        return $scope.currentPageIndex + 1 == $scope.numberOfPages;
    };

    $scope.goToNextPage = function () {
        if (!$scope.isLastPage()) {
            goToPageIndex($scope.currentPageIndex + 1);
        }
    };

    $scope.goToPreviousPage = function () {
        if (!$scope.isFirstPage()) {
            _.remove($scope.activeGroups, function (group) { group.page === $scope.currentPageIndex + 1 });
            goToPageIndex($scope.currentPageIndex - 1);
        }
    };

    var goToPageIndex = function (index) {
        if (index >= 0 && index < $scope.numberOfPages) {
            if (index > $scope.currentPageIndex) {

                //$scope.activeGroups = []
                _.forEach(_.filter($scope.formTemplate.metricGroups, function (group) { return group.page <= index + 1; }), function (group) {
                    if (_.find($scope.activeGroups, { 'id': group.id }))
                        return;
                    $scope.activeGroups.push(group);
                });

            }
            $scope.currentPageIndex = index;
        }
    }

    $scope.saveDraft = function () {
        if ($scope.formTemplate == null)
            return;

        //populateFormValues();
        $scope.survey.formValues = $scope.allFormValues;

        surveyService.saveDraft($scope.survey).then(
            function () { alertService.show(gettext("Recording saved successfully!")); },
            function (err) { alertService.show(gettext("Error in saving the recording: ") + err); });
    };

    $scope.back = function () {
        $ionicHistory.goBack();
    };

    $scope.delete = function () {
        if (confirm(gettext("Are you sure you want to delete this recording?"))) {
            surveyService.delete($scope.surveyId).then(
                function () { $ionicHistory.goBack(); },
                function (err) { alertService.show(gettext("Error in deleting the recording: ") + err); });
        }
    };

    $scope.dateToString = function (isoString) {
        var utcDate = moment(isoString);
        var localDate = utcDate.local();

        if (userService.current.calendar === "Gregorian") {
            return localDate.format('L LT');
        }
        else {
            var dateValue = persianDate(localDate.toDate());
            return dateValue.format("dddd, DD MMMM YYYY");
        }
    };

    $scope.submitSurvey = function () {
        if ($scope.formTemplate == null)
            return;

        //populateFormValues();
        $scope.survey.formValues = $scope.allFormValues;

        surveyService.submitSurvey($scope.survey).then(
            function () { alertService.show("Recording submitted successfully!"); $ionicHistory.goBack(); },
            function (err) { alertService.show(gettext("Error in submitting the recording: ") + err); });
    };

    $scope.getMetricShortTitle = function (inputName) {
        for (var i = 0; i < $scope.formTemplate.metricGroups.length; i++) {
            for (var j = 0; j < $scope.formTemplate.metricGroups[i].metrics.length; j++) {
                if ($scope.formTemplate.metricGroups[i].metrics[j].inputName === inputName)
                    return $scope.formTemplate.metricGroups[i].metrics[j].shortTitle;
            }
        }
    }

    $scope.addFormValue = function (metric, rowDataListItem, rowNumber) {
        var formValue = {};
        formValue.metricId = metric.id;
        formValue.rowNumber = rowNumber;
        if (rowDataListItem)
            formValue.rowDataListItemId = rowDataListItem.id;
        $scope.allFormValues.push(formValue);
        return formValue;
    };

    surveyService.getTemplateWithValues($scope.surveyId).then(
        function (template) {
            _.forEach(template.metricGroups, function (group) {
                _.forEach(group.metrics, function (metric) {
                    metric.type = _.camelCase(metric.type);
                });
            });
            $scope.formTemplate = template;
            $scope.survey = template.survey;
            $scope.allFormValues = template.survey.formValues;
            $scope.numberOfPages = _.max(template.metricGroups, 'page').page;
            goToPageIndex(0);
        },
        function (err) { alertService.show(gettext("Error in loading ... ") + err); });
}]);