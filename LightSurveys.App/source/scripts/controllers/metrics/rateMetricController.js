'use strict';
angular.module('lm.surveys').controller('rateMetricController', ['$scope', '$controller', function ($scope, $controller) {

    $controller('metricController', { $scope: $scope });

    if (_.isEmpty($scope.formValues)) {
        $scope.formValue = $scope.addFormValue($scope.metric, $scope.dataListItem, $scope.rowNumber);
        // set default value
        $scope.formValue.numericValue = $scope.metric.minValue;
        if ($scope.metric.defaultValue)
            $scope.formValue.numericValue = $scope.metric.defaultValue;
    }
    else {
        $scope.formValue = $scope.formValues[0];
    }

    $scope.getStepLabel = function() {
        var value = $scope.formValue.numericValue;
        if ($scope.metric.isAdHoc) {
            var item = _.find($scope.metric.adHocItems, function (item) { return item.value == value });
            return item.text;
        }

        return value;
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