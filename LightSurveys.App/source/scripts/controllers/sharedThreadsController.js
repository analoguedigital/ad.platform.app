'use strict';
angular.module('lm.surveys').controller('sharedThreadsController', ['$scope', '$rootScope', '$state', '$stateParams',
    '$ionicPlatform', '$ionicSideMenuDelegate', '$ionicPopup', 'surveyService', 'userService', 'alertService', 'ngProgress',
    '$ionicNavBarDelegate', '$ionicHistory', 'storageService', 'httpService', 'localStorageService', 'toastr',
    function ($scope, $rootScope, $state, $stateParams, $ionicPlatform, $ionicSideMenuDelegate, $ionicPopup, surveyService, userService,
        alertService, ngProgress, $ionicNavBarDelegate, $ionicHistory, storageService, httpService, localStorageService, toastr) {

        $scope.currentContext = userService.current;
        $scope.allSharedThreads = [];
        $scope.sharedThreads = [];
        $scope.sharedProjects = [];
        $scope.surveys = [];

        $scope.model = {
            selectedProject: undefined
        };

        $scope.startSurvey = function (formTemplate) {
            surveyService.startSurvey(formTemplate)
                .then(function (survey) {
                    $state.go("survey", {
                        id: survey.id
                    });
                }, function (err) {});
        };

        $scope.goDrafts = function (formTemplate) {
            $state.go("drafts", {
                id: formTemplate.id
            });
        };

        $scope.doRefresh = function () {
            ngProgress.start();
            $scope.downloading = true;

            surveyService.uploadAllSurveys();

            if ($scope.model.selectedProject) {
                var pid = $scope.model.selectedProject.id;
                $scope.reload(pid);
            }
            else {
                $scope.loadData();
            }

            $scope.$broadcast('scroll.refreshComplete');
            $scope.downloading = false;
            ngProgress.complete();
        }

        $scope.reload = function (projectId) {
            httpService.getSurveys(0, projectId).then(function (surveys) {
                try {
                    // fix attachments, and store surveys locally
                    _.forEach(surveys, function (survey, index) {
                        survey.isSubmitted = true;
                        _.forEach(survey.formValues, function (fv) {
                            _.forEach(fv.attachments, function (attachment) {
                                attachment.fileUri = undefined;
                                attachment.mediaType = _.toLower(attachment.typeString);
                                delete attachment.typeString;
                            });
                        });

                        storageService.save('survey', survey.formTemplateId, survey.id, survey);
                    });

                    $scope.surveys = surveys;
                    
                    httpService.getSharedThreads(projectId).then(function (threads) {
                        angular.forEach(threads, function (formTemplate) {
                            storageService.save('formTemplate', null, formTemplate.id, formTemplate)
                                .then(function () {
                                    var res = _.filter($scope.surveys, function (survey) {
                                        return survey.formTemplateId === formTemplate.id;
                                    });

                                    formTemplate.draftsNumber = res.length;
                                });
                        });

                        $scope.allSharedThreads = threads;
                        $scope.sharedThreads = threads;
                    });
                } catch (err) {
                    console.warn(err);
                }
            });
        }

        $scope.loadData = function() {
            httpService.getSharedProjects().then(function (data) {
                $scope.sharedProjects = data;

                if (data.length === 1) {
                    var id = data[0].id;
                    $scope.reload(id);
                }
            }, function (err) {
                console.error(err);
            });
        }

        $scope.selectedProjectChanged = function () {
            var pid = $scope.model.selectedProject.id;
            $scope.reload(pid);
        }

        $scope.activate = function () {
            $scope.loadData();
        }

        $scope.activate();

    }
]);