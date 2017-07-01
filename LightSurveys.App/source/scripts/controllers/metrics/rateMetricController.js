'use strict';
angular.module('lm.surveys').controller('rateMetricController', ['$scope', '$controller', function ($scope, $controller) {

    $controller('metricController', { $scope: $scope });

    if (_.isEmpty($scope.formValues)) {
        $scope.formValue = $scope.addFormValue($scope.metric, $scope.dataListItem, $scope.rowNumber);
        $scope.formValue.numericValue =  $scope.metric.minValue;
    }
    else {
        $scope.formValue = $scope.formValues[0];
    }

}]);

angular.module('lm.surveys').directive('ngMin', function () {
  return {
    restrict : 'A',
    require : ['ngModel'],
    compile: function($element, $attr) {
      return function linkDateTimeSelect(scope, element, attrs, controllers) {
        var ngModelController = controllers[0];
        scope.$watch($attr.ngMin, function watchNgMin(value) {
          element.attr('min', value);
          ngModelController.$render();
        })
      }
    }
  }
})
angular.module('lm.surveys').directive('ngMax', function () {
  return {
    restrict : 'A',
    require : ['ngModel'],
    compile: function($element, $attr) {
      return function linkDateTimeSelect(scope, element, attrs, controllers) {
        var ngModelController = controllers[0];
        scope.$watch($attr.ngMax, function watchNgMax(value) {
          element.attr('max', value);
          ngModelController.$render();
        })
      }
    }
  }
})