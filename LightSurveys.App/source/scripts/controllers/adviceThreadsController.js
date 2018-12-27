(function () {
    'use strict';
    angular.module('lm.surveys').controller('adviceThreadsController', ['$scope', '$state', '$q', 'surveyService', 'userService',
        'alertService', 'ngProgress', 'storageService', 'httpService', 'toastr', '$ionicLoading',
        function ($scope, $state, $q, surveyService, userService,
            alertService, ngProgress, storageService, httpService, toastr, $ionicLoading) {

            $scope.currentContext = userService.current;
            $scope.allAdviceThreads = [];
            $scope.adviceThreads = [];

            $scope.startSurvey = function (formTemplate) {
                surveyService.startSurvey(formTemplate)
                    .then(function (survey) {
                        $state.go("survey", {
                            id: survey.id
                        });
                    }, function (err) {
                        console.error('could not start survey', err);
                    });
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
                    template: '<i class="fa fa-circle-o-notch fa-spin fa-fw"></i> Refreshing data...'
                });

                surveyService.refreshData()
                    .then(function () {
                        $ionicLoading.show({
                            template: '<i class="fa fa-circle-o-notch fa-spin fa-fw"></i> Uploading records...'
                        });

                        surveyService.uploadAllSurveys()
                            .then(function () {
                                $ionicLoading.hide();
                                $scope.syncUserRecords();
                            }, function (err) {
                                console.error('could not upload all surveys', err);
                            });

                    }, function (err) {
                        console.error('could not refresh data', err);
                        toastr.error(err);
                    }).finally(function () {
                        $ionicLoading.hide();
                        ngProgress.complete();
                        $scope.downloading = false;
                    });
            };

            $scope.loadList = function () {
                $ionicLoading.show({
                    template: '<i class="fa fa-circle-o-notch fa-spin fa-fw"></i> Loading...'
                });

                surveyService.getAdviceThreads()
                    .then(function (results) {
                        var promises = [];

                        angular.forEach(results, function (formTemplate) {
                            var deferred = $q.defer();
                            promises.push(deferred);

                            surveyService.getDraftsNumber(formTemplate.id)
                                .then(function (count) {
                                    formTemplate.draftsNumber = count;
                                    deferred.resolve();
                                }, function (err) {
                                    deferred.reject();
                                });
                        });

                        $q.all(promises).then(function () {
                            $scope.allAdviceThreads = results;
                            $scope.adviceThreads = results;
                        }, function (err) {
                            console.error('promises did not resolve', err);
                        });
                    }, function (err) {
                        console.error('could not load advice threads', err);
                        toastr.error(err);
                    }).finally(function () {
                        $ionicLoading.hide();
                    });
            };

            $scope.sortRecords = function (records) {
                var deferred = $q.defer();

                var promises = [];
                _.forEach(records, function (survey) {
                    _.forEach(survey.formValues, function (fv) {
                        _.forEach(fv.attachments, function (attachment) {
                            attachment.fileUri = undefined;
                            attachment.mediaType = _.toLower(attachment.typeString);
                            delete attachment.typeString;
                        });
                    });

                    var surveyPromise = $q.defer();
                    promises.push(surveyPromise.promise);

                    storageService.save('survey', survey.formTemplateId, survey.id, survey)
                        .then(function (data) {
                            surveyPromise.resolve(data);
                        }, function (err) {
                            surveyPromise.reject(err);
                        });
                });

                $q.all(promises).then(function () {
                    deferred.resolve();
                }, function (err) {
                    console.error('could not sort records', err);
                    deferred.reject(err);
                });

                return deferred.promise;
            };

            $scope.syncUserRecords = function () {
                userService.getExistingProfiles().then(function (profiles) {
                    if (profiles && profiles.length) {
                        var profile = profiles[0];
                        if (profile && profile.settings !== undefined) {
                            if (!profile.settings.noStoreEnabled) {
                                var projectId = userService.current.project.id;

                                $ionicLoading.show({
                                    template: '<i class="fa fa-circle-o-notch fa-spin fa-fw"></i> Syncing records...'
                                });

                                surveyService.getUserSurveys(projectId)
                                    .then(function (records) {
                                        surveyService.deleteSubmittedSurveys().then(function () {
                                            $scope.sortRecords(records).then(function () {
                                                $scope.loadList();
                                            }, function (err) {
                                                console.error('could not sort records');
                                            }).finally(function () {
                                                $ionicLoading.hide();
                                                $scope.$broadcast('scroll.refreshComplete');
                                            });
                                        });
                                    }, function (err) {
                                        console.error('getUserSurveys ERROR', err);

                                        if (err.substr(0, 3) === '401')
                                            toastr.error("Access Denied. You don't have permission to sync records.");
                                    });
                            } else {
                                console.warn('NO_STORE ENABLED. sync cancelled.');
                                $ionicLoading.hide();
                                $scope.$broadcast('scroll.refreshComplete');
                            }
                        }
                    }
                });
            };

            $scope.activate = function () {
                $scope.loadList();
            };

            $scope.activate();
        }
    ]);
}());