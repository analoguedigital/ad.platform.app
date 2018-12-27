(function () {
    'use strict';
    angular.module('lm.surveys').controller('selectProjectController', ['$scope', '$rootScope', '$ionicHistory', '$state',
        'userService', 'surveyService', 'alertService', 'gettext', 'toastr', '$ionicLoading',
        function ($scope, $rootScope, $ionicHistory, $state, userService, surveyService, alertService, gettext, toastr, $ionicLoading) {
            $scope.projects = [];
            $scope.isBackAvailable = (userService.current.project != null);

            $scope.loadList = function () {
                $ionicLoading.show({
                    template: '<i class="fa fa-circle-o-notch fa-spin fa-fw"></i> Loading projects...'
                });

                surveyService.getProjects()
                    .then(function (projects) {
                        if (!projects.length) {
                            // $ionicHistory.clearHistory();
                            $state.go('login');
                        } else if (projects.length === 1) {
                            $scope.selectProject(projects[0]);
                        } else {
                            $scope.projects = projects;
                        }
                    }, function (err) {
                        // alertService.show(gettext("Error in loading projects: "), err);
                        var errorMessage = gettext('Error in loading projects: ') + err;
                        toastr.error(errorMessage);
                    }).finally(function () {
                        $ionicLoading.hide();
                    });
            };

            $scope.selectProject = function (project) {
                userService.setCurrentProject(project)
                    .then(function () {
                        // $ionicHistory.clearCache();
                        // $ionicHistory.clearHistory();

                        // $ionicHistory.nextViewOptions({
                        //     historyRoot: true,
                        //     disableBack: true
                        // });

                        userService.getExistingProfiles().then(function (profiles) {
                            if (profiles.length) {
                                $scope.profile = profiles[0];
                                $scope.userInfo = $scope.profile.userInfo;

                                $rootScope.$broadcast('update-menu-profile', {
                                    profile: $scope.userInfo.profile
                                });

                                $state.go('home');
                            }
                        });
                    }, function (err) {
                        // alertService.show(gettext("Error in setting active projects: "), err);
                        var errorMessage = gettext('Error in setting active projects: ') + err;
                        toastr.error(errorMessage);
                    });
            };

            $scope.back = function () {
                $ionicHistory.nextViewOptions({
                    historyRoot: true,
                    disableBack: true
                });

                $state.go('home');
            };

            $scope.loadList();
        }
    ]);
}());