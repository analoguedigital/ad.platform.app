(function () {
    'use strict';
    angular.module('lm.surveys').directive('persiandatepicker', ['$parse', function ($parse) {
        return {
            restrict: "A",
            link: function (scope, element, attrs) {
                var parsed = $parse(attrs.persiandatepicker);
                $(element).pDatepicker({
                    persianDigit: true,
                    format: 'YYYY-MM-DD',
                    autoClose: true,
                    onSelect: function (unixDate) {
                        scope.$apply(function () {
                            parsed.assign(scope, new Date(unixDate));
                        });
                    }
                });
            }
        };
    }]);
}());