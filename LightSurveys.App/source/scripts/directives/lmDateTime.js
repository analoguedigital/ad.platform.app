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
            var result = '';

            if (hours > 0 || minutes > 0)
                result = moment(scope.value).format('DD/MM/YYYY hh:mm A');
            else
                result = moment(scope.value).format('DD/MM/YYYY');

            scope.resultString = result;
        }
    }
}]);
