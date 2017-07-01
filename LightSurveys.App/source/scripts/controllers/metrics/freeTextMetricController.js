'use strict';
angular.module('lm.surveys').controller('freeTextMetricController', ['$scope', '$controller', function ($scope, $controller) {

    $controller('metricController', { $scope: $scope });

    if (_.isEmpty($scope.formValues)) {
        $scope.formValue = $scope.addFormValue($scope.metric, $scope.dataListItem, $scope.rowNumber);
    }
    else {
        $scope.formValue = $scope.formValues[0];
    }

}]);
