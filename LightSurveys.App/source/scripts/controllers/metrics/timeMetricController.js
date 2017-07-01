'use strict';
angular.module('lm.surveys').controller('timeMetricController', ['$scope', '$controller', 'userService', function ($scope, $controller, userService) {

    $controller('metricController', { $scope: $scope });

    if (_.isEmpty($scope.formValues)) {
        $scope.formValue = $scope.addFormValue($scope.metric, $scope.dataListItem, $scope.rowNumber);
        var defaultVal = new Date();
        defaultVal.setSeconds(0);
        defaultVal.setMilliseconds(0);
        $scope.formValue.timeValue = defaultVal;
    }
    else {
        $scope.formValue = $scope.formValues[0];
    }

    if ($scope.formValue)
        $scope.formValue.timeValue = new Date($scope.formValue.timeValue);

}]);

