(function () {
    'use strict';
    angular.module('lm.surveys').controller('dateMetricController', ['$scope', '$controller', 'userService', function ($scope, $controller, userService) {

        $controller('metricController', {
            $scope: $scope
        });

        if (_.isEmpty($scope.formValues)) {
            $scope.formValue = $scope.addFormValue($scope.metric, $scope.dataListItem, $scope.rowNumber);
            $scope.formValue.dateValue = new Date();
        } else {
            $scope.formValue = $scope.formValues[0];
        }

        if ($scope.formValue)
            $scope.formValue.dateValue = new Date($scope.formValue.dateValue);

        $scope.isPersian = userService.current.calendar == "Persian";
    }]);
}());