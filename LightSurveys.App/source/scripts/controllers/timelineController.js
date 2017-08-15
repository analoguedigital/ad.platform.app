'use strict';
angular.module('lm.surveys').controller('timelineController', ['$scope', '$rootScope', 'surveyService', 'alertService', 'gettext', 'userService',
    function ($scope, $rootScope, surveyService, alertService, gettext, userService) {
        $scope.templates = [];
        $scope.surveys = [];

        $scope.today = new Date();
        $scope.months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        $scope.nextMonth = function () {
            $scope.today = moment($scope.today).add(1, 'months').toDate();
            $rootScope.$broadcast('timeline-next-month');
        }

        $scope.previousMonth = function () {
            $scope.today = moment($scope.today).subtract(1, 'months').toDate();
            $rootScope.$broadcast('timeline-previous-month');
        }

        $scope.activate = function () {
            surveyService.getAllSubmittedSurveys()
                .then(function (surveys) {
                    // get unique form templates
                    var templates = _.uniqBy(surveys, 'formTemplate').map(function (survey) { return survey.formTemplate; });

                    $scope.templates = templates;
                    $scope.surveys = surveys;
                });
        }

        $scope.activate();

    }]);