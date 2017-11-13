'use strict';
angular.module('lm.surveys').controller('multipleChoiceMetricController', ['$scope', '$controller', 'httpService', function ($scope, $controller, httpService) {

    $controller('metricController', { $scope: $scope });

    $scope.metric.isMultipleAnswer = $scope.metric.viewType === "CheckBoxList";

    if (!$scope.metric.isAdHoc) {
        httpService.getDataList($scope.metric.dataListId)
            .then((data) => {
                $scope.metric.dataList = data;
            }, (err) => {
                console.error(err);
            });
    } else {
        $scope.metric.dataList = { id: $scope.metric.dataListId, name: 'AdHoc DataList' };
        $scope.metric.dataList.items = $scope.metric.adHocItems;
    }

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
        if ($scope.metric.dataList && $scope.metric.dataList.items)
            return _.find($scope.metric.dataList.items, { 'id': dataListItemId }).text;

        return '';
    };
}]);