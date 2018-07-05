'use strict';
angular.module('lm.surveys').controller('adviceThreadsController', ['$scope', '$rootScope', '$state', '$stateParams',
    '$ionicPlatform', '$ionicSideMenuDelegate', '$ionicPopup', 'surveyService', 'userService', 'alertService', 'ngProgress',
    '$ionicNavBarDelegate', '$ionicHistory', 'storageService', 'httpService', 'localStorageService', 'toastr',
    function ($scope, $rootScope, $state, $stateParams, $ionicPlatform, $ionicSideMenuDelegate, $ionicPopup, surveyService, userService,
        alertService, ngProgress, $ionicNavBarDelegate, $ionicHistory, storageService, httpService, localStorageService, toastr) {

        $scope.currentContext = userService.current;
        $scope.allAdviceThreads = [];
        $scope.adviceThreads = [];

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

            surveyService.refreshData()
                .then(function () {
                    $scope.$broadcast('scroll.refreshComplete');
                    $scope.downloading = false;
                    ngProgress.complete();

                    surveyService.uploadAllSurveys();
                    $scope.syncUserRecords();
                }, function (err) {
                    ngProgress.complete();
                    $scope.downloading = false;
                    alertService.show(err);
                });
        }

        $scope.loadList = function () {
            surveyService.getAdviceThreads()
                .then(function (results) {
                    angular.forEach(results, function (formTemplate) {
                        surveyService.getDraftsNumber(formTemplate.id)
                            .then(function (count) {
                                formTemplate.draftsNumber = count;
                            });
                    });

                    $scope.allAdviceThreads = results;
                    $scope.adviceThreads = results;
                }, function (err) {
                    alertService.show(err);
                });
        };

        $scope.syncUserRecords = function () {
            userService.getExistingProfiles().then(function (profiles) {
                if (profiles.length) {
                    var profile = profiles[0];
                    if (profile.settings !== undefined) {
                        if (!profile.settings.noStoreEnabled) {
                            var projectId = userService.current.project.id;
                            var baseUrl = httpService.getServiceBase();

                            surveyService.getUserSurveys(projectId)
                                .then(function (data) {
                                    try {
                                        // fix attachments, and store surveys locally
                                        _.forEach(data, function (survey, index) {
                                            _.forEach(survey.formValues, function (fv) {
                                                _.forEach(fv.attachments, function (attachment) {
                                                    attachment.fileUri = undefined;
                                                    attachment.mediaType = _.toLower(attachment.typeString);
                                                    delete attachment.typeString;
                                                });
                                            });

                                            storageService.save('survey', survey.formTemplateId, survey.id, survey);
                                        });
                                    } catch (err) {
                                        console.warn(err);
                                    }

                                    $scope.loadList();
                                }, function (err) {
                                    console.error(err);
                                });
                        }
                    }
                }
            });
        }

        $scope.activate = function () {
            $scope.loadList();
        }

        $scope.activate();

    }
]);