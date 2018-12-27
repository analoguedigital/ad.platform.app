(function () {
    'use strict';
    angular.module('lm.surveys').controller('metricController', ['$scope', function ($scope) {
        $scope.isCompact = $scope.metricGroup.isRepeater;

        var relatedFormValues = [];

        if ($scope.metricGroup.isRepeater) {
            if ($scope.metricGroup.type === "IterativeRepeater")
                relatedFormValues = _.filter($scope.allFormValues, {
                    'metricId': $scope.metric.id,
                    'rowNumber': $scope.rowNumber
                });
            else
                relatedFormValues = _.filter($scope.allFormValues, {
                    'metricId': $scope.metric.id,
                    'rowNumber': $scope.rowNumber,
                    'rowDataListItemId': $scope.dataListItem.id
                });

            $scope.metric.inputName = _.camelCase('m' + $scope.metric.id) + $scope.rowNumber;
        } else {
            relatedFormValues = _.filter($scope.allFormValues, {
                'metricId': $scope.metric.id
            });
            $scope.metric.inputName = _.camelCase('m' + $scope.metric.id);
        }

        $scope.inputError = "surveyForm." + $scope.metric.inputName + ".$error";
        $scope.formValues = relatedFormValues;

        //angular.forEach(_.where(formValues, { 'metricId': metric.id }), function (formValue) {
        //    metric.formValue[formValue.rowId] = formValue;
        //});
    }]);
}());