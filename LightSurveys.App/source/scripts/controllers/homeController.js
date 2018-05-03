'use strict';
angular.module('lm.surveys').controller('homeController', ['$scope', '$rootScope', '$state', '$stateParams', '$ionicPlatform', '$ionicSideMenuDelegate', '$ionicPopup', 'surveyService', 'userService', 'alertService', 'ngProgress', '$ionicNavBarDelegate', '$ionicHistory', 'storageService', 'httpService', 'localStorageService',
    function ($scope, $rootScope, $state, $stateParams, $ionicPlatform, $ionicSideMenuDelegate, $ionicPopup, surveyService, userService, alertService, ngProgress, $ionicNavBarDelegate, $ionicHistory, storageService, httpService, localStorageService) {
        var FIRST_TIME_LOGIN_KEY = 'FIRST_TIME_LOGIN';

        //solution to Navbar disappearance issue suggested here https://github.com/ionic-team/ionic/issues/3483
        $scope.$on('$ionicView.enter', function (e) {
            $ionicNavBarDelegate.showBar(true);
            $ionicHistory.clearCache();
            $ionicHistory.clearHistory();
        });

        $scope.currentContext = userService.current;
        $scope.allFormTemplates = [];
        $scope.formTemplates = [];

        var _loadList = function () {
            surveyService.getFormTemplates()
                .then(function (results) {
                    angular.forEach(results, function (formTemplate) {
                        surveyService.getDraftsNumber(formTemplate.id)
                            .then(function (count) {
                                formTemplate.draftsNumber = count;
                            });
                    });

                    $scope.allFormTemplates = results;
                    $scope.formTemplates = results;

                    // filter results to threads created by current user.
                    //$scope.formTemplates = _.filter(results, function (formTemplate) { return formTemplate.createdById === userService.current.userId; });
                }, function (err) {
                    alertService.show(err);
                });
        };

        $scope.startSurvey = function (formTemplate) {
            surveyService.startSurvey(formTemplate)
                .then(function (survey) {
                    $state.go("survey", { id: survey.id });
                }, function (err) {
                });
        };

        $scope.goDrafts = function (formTemplate) {
            $state.go("drafts", { id: formTemplate.id });
        };

        $scope.cloneTemplate = function () {
            // SHARED FORM TEMPLATE (Your Recordings) as seeded in our DB.
            var recordingTemplateId = '74EADB8F-7434-49C0-AD5A-854B0E77BCBD';

            // Ideally, we would get the shared thread from our platform.
            // var recordingsTemplate = _.filter($scope.allFormTemplates, function (template) { return template.title.toLowerCase().includes('recording'); })[0];

            $state.go("cloneTemplate", { id: recordingTemplateId });
        };

        $scope.deleteTemplate = function (formTemplate) {
            ngProgress.start();

            surveyService.deleteFormTemplate(formTemplate)
                .then(function () {
                    _.remove($scope.formTemplates, function (template) { return template.id === formTemplate.id });
                    ngProgress.complete();
                },
                function (err) {
                    ngProgress.complete();
                    alertService.show($scope.getValidationErrors(err));
                });
        }

        $scope.editTemplate = function (formTemplate) {
            $state.go("editTemplate", { id: formTemplate.id });
        };

        $scope.doRefresh = function () {
            ngProgress.start();
            $scope.downloading = true;

            surveyService.refreshData()
                .then(function () {
                    $scope.$broadcast('scroll.refreshComplete');
                    $scope.downloading = false;
                    ngProgress.complete();

                    $rootScope.$broadcast('refresh-sidemenu-subscription');

                    surveyService.uploadAllSurveys();
                    $scope.syncUserRecords();
                }, function (err) {
                    ngProgress.complete();
                    $scope.downloading = false;
                    alertService.show(err);
                });
        }

        $scope.syncUserRecords = function () {
            userService.getExistingProfiles().then(function (profiles) {
                if (profiles.length) {
                    var profile = profiles[0];
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
                                                //attachment.fileUri = baseUrl + attachment.url;
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

                                _loadList();
                            }, function (err) {
                                console.error(err);
                            });
                    }
                }
            });
        }

        $scope.activate = function () {
            if (userService.current.project === undefined) {
                $state.go('projects');
            } else {
                var firstLogin = localStorageService.get(FIRST_TIME_LOGIN_KEY);
                if (firstLogin && firstLogin === true) {
                    localStorageService.set(FIRST_TIME_LOGIN_KEY, false);
                    $scope.syncUserRecords();
                } else {
                    _loadList();
                }
            }
        }

        $scope.activate();

    }]);

