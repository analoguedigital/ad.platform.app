'use strict';
angular.module('lm.surveys').controller('multipleChoiceMetricController', ['$scope', '$controller', function ($scope, $controller) {

    $controller('metricController', { $scope: $scope });

    $scope.metric.isMultipleAnswer = $scope.metric.viewType === "CheckBoxList";

    if (_.isEmpty($scope.formValues)) {
        if ($scope.metric.isMultipleAnswer) {
            $scope.formValues = [];
            angular.forEach($scope.metric.dataList.items, function (item) {
                var newValue = $scope.addFormValue($scope.metric, $scope.dataListItem, $scope.rowNumber);
                newValue.guidValue = item.id;
                $scope.formValues.push(newValue);
            });
        }
        else {
            $scope.formValue = $scope.addFormValue($scope.metric, $scope.dataListItem, $scope.rowNumber);
        }
    }
    else {
        if ($scope.metric.isMultipleAnswer) {
            // nothing to do
        } else {
            $scope.formValue = $scope.formValues[0];
        }

    }

    $scope.getText = function (dataListItemId) {
        return _.find($scope.metric.dataList.items, { 'id': dataListItemId }).text;
    };
}]);