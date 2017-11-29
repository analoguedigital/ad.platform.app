'use strict';
angular.module('lm.surveys').controller('rateMetricController', ['$scope', '$state', '$controller', function ($scope, $state, $controller) {

    $controller('metricController', { $scope: $scope });

    const surveyViewRouteName = "surveyView";

    if (!$scope.metric.isAdHoc) {
        // basic slider (min/max bound)
        $scope.sliderOptions = {
            floor: $scope.metric.minValue,
            ceil: $scope.metric.maxValue,
            showTicks: true
        };
    } else {
        // ad-hoc data list. sort values first.
        var items = $scope.metric.adHocItems;
        items.sort((a, b) => a.value - b.value);

        let steps = $scope.metric.adHocItems.map((val) => {
            return {
                value: val.value,
                legend: val.text
            };
        });

        $scope.sliderOptions = {
            showTicks: true,
            showTicksValues: true,
            stepsArray: steps
        };
    }

    if ($state.current.name === surveyViewRouteName) {
        $scope.sliderOptions.readOnly = true;
    }

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