angular.module('lm.surveys').directive('lmDateTime', [function () {
    return {
        restrict: "E",
        replace: true,
        template: '<span>{{resultString}}</span>',
        scope: {
            value: '='
        },
        link: function (scope, element, attrs) {
            var dateValue = new Date(scope.value);
            var hours = dateValue.getHours();
            var minutes = dateValue.getMinutes();
            var formatString = (hours > 0 || minutes > 0) ? 'L LT' : 'L';

            scope.resultString = moment(scope.value).format(formatString);
        }
    }
}]);
