(function () {
    'use strict';
    angular.module('lm.surveys').directive('coverImage', [function () {
        return function (scope, elem, attrs) {
            attrs.$observe('coverImage', function (value) {
                elem.css({
                    'background-image': 'url(' + value + ')',
                    'background-size': 'cover',
                    'background-repeat': 'no-repeat',
                    'background-position': 'center',
                    'background-attachment': 'scroll',
                    'width': '100%'
                });
            });
        };
    }]);
}());