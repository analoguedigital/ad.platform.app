(function () {
    'use strict';
    angular.module('lm.surveys').controller('sharedThreadsController', ['$scope', '$state', 'surveyService', 'userService', 'ngProgress',
        'storageService', 'httpService', 'toastr', '$ionicLoading', '$q',
        function ($scope, $state, surveyService, userService, ngProgress, storageService, httpService, toastr, $ionicLoading, $q) {
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

                $ionicLoading.show({
                    template: '<i class="fa fa-circle-o-notch fa-spin fa-fw"></i> Uploading records...'
                });

                surveyService.uploadAllSurveys()
                    .then(function () {
                        if ($scope.model.selectedProject) {
                            var pid = $scope.model.selectedProject.id;
                            $scope.reload(pid);
                        } else {
                            $scope.loadData();
                        }
                    }, function (err) {
                        console.error('could not upload all surveys', err);
                    }).finally(function () {
                        $scope.$broadcast('scroll.refreshComplete');
                        $scope.downloading = false;
                        ngProgress.complete();
                        $ionicLoading.hide();
                    });
            };

            $scope.reload = function (projectId) {
                $ionicLoading.show({
                    template: '<i class="fa fa-circle-o-notch fa-spin fa-fw"></i> Loading...'
                });

                httpService.getSurveys(0, projectId)
                    .then(function (surveys) {
                        var promises = [];

                        // fix attachments, and store surveys locally
                        _.forEach(surveys, function (survey, index) {
                            var surveyPromise = $q.defer();
                            promises.push(surveyPromise);

                            survey.isSubmitted = true;
                            _.forEach(survey.formValues, function (fv) {
                                _.forEach(fv.attachments, function (attachment) {
                                    attachment.fileUri = undefined;
                                    attachment.mediaType = _.toLower(attachment.typeString);
                                    delete attachment.typeString;
                                });
                            });

                            storageService.save('survey', survey.formTemplateId, survey.id, survey)
                                .then(function () {
                                    surveyPromise.resolve();
                                }, function (err) {
                                    surveyPromise.reject(err);
                                });
                        });

                        $q.all(promises).then(function () {
                            $scope.surveys = surveys;

                            httpService.getSharedThreads(projectId)
                                .then(function (threads) {
                                    var threadPromises = [];

                                    angular.forEach(threads, function (formTemplate) {
                                        var threadPromise = $q.defer();
                                        threadPromises.push(threadPromise);

                                        storageService.save('formTemplate', null, formTemplate.id, formTemplate)
                                            .then(function () {
                                                var res = _.filter($scope.surveys, function (survey) {
                                                    return survey.formTemplateId === formTemplate.id;
                                                });

                                                formTemplate.draftsNumber = res.length;

                                                threadPromise.resolve();
                                            }, function (err) {
                                                console.error('could not save formTemplate', err);
                                                threadPromise.reject(err);
                                            });
                                    });

                                    $q.all(threadPromises).then(function () {
                                        $scope.allSharedThreads = threads;
                                        $scope.sharedThreads = threads;
                                        $ionicLoading.hide();
                                    }, function (err) {
                                        console.error('thread promises did not resolve', err);
                                        $ionicLoading.hide();
                                    });
                                }, function (err) {
                                    console.error('could not load shared threads', err);
                                    $ionicLoading.hide();
                                });
                        }, function (err) {
                            console.error('survey promises did not resolve', err);
                            $ionicLoading.hide();
                        });
                    }, function (err) {
                        console.error('could not load surveys', err);
                        $ionicLoading.hide();
                    });
            };

            $scope.loadData = function () {
                $ionicLoading.show({
                    template: '<i class="fa fa-circle-o-notch fa-spin fa-fw"></i> Loading...'
                });

                httpService.getSharedProjects()
                    .then(function (data) {
                        $scope.sharedProjects = data;

                        if (data.length === 1) {
                            var id = data[0].id;
                            $scope.reload(id);
                        }
                    }, function (err) {
                        console.error(err);
                    }).finally(function () {
                        $ionicLoading.hide();
                    });
            };

            $scope.selectedProjectChanged = function () {
                var pid = $scope.model.selectedProject.id;
                $scope.reload(pid);
            };

            $scope.loadData();
        }
    ]);
}());