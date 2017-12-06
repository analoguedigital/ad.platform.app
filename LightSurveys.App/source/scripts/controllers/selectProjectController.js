'use strict';
angular.module('lm.surveys').controller('selectProjectController', ['$scope', '$ionicHistory', '$state', 'userService', 'surveyService', 'alertService', 'gettext',
function ($scope, $ionicHistory, $state, userService, surveyService, alertService, gettext) {
    $scope.projects = [];
    $scope.isBackAvailable = (userService.current.project != null)

    var _loadList = function () {
        surveyService.getProjects().then(
            function (projects) {
                if (projects.length === 0) {
                    $ionicHistory.clearHistory();
                    $state.go('login');
                }
                else if (projects.length === 1) {
                    $scope.selectProject(projects[0]);
                } else {
                    $scope.projects = projects;
                }
            },
            function (err) { alertService.show(gettext("Error in loading projects: "), err); });
    };

    $scope.selectProject = function (project) {
        userService.setCurrentProject(project).then(
            function () {
                $ionicHistory.clearHistory();
                $ionicHistory.nextViewOptions({
                    historyRoot: true,
                    disableBack: true
                });

                $state.go('home');
            },
            function (err) { alertService.show(gettext("Error in setting active projects: "), err); });
    };

    $scope.back = function () {
        $ionicHistory.nextViewOptions({
            historyRoot: true,
            disableBack: true
        });
        $state.go('home');
    };

    _loadList();
}]);