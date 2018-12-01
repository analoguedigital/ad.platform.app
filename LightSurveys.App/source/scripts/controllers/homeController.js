'use strict';
angular.module('lm.surveys').controller('homeController', ['$scope', '$rootScope', '$q', '$state', '$stateParams', '$ionicPlatform',
    '$ionicSideMenuDelegate', '$ionicPopup', 'surveyService', 'userService', 'alertService', 'ngProgress', '$ionicNavBarDelegate',
    '$ionicHistory', 'storageService', 'httpService', 'localStorageService', '$ionicModal', 'toastr', '$ionicPopover', '$timeout', 'feedbackService', '$ionicLoading',
    function ($scope, $rootScope, $q, $state, $stateParams, $ionicPlatform, $ionicSideMenuDelegate, $ionicPopup, surveyService,
        userService, alertService, ngProgress, $ionicNavBarDelegate, $ionicHistory, storageService, httpService, localStorageService,
        $ionicModal, toastr, $ionicPopover, $timeout, feedbackService, $ionicLoading) {

        var FIRST_TIME_LOGIN_KEY = 'FIRST_TIME_LOGIN';

        var appNavbar = document.getElementById("app-nav-bar");
        if (appNavbar.classList) {
            if (appNavbar.classList.contains('hide')) {
                appNavbar.classList.remove('hide');
            }
        }

        // solution to the ion-nav-bar disappearance. as suggested here: 
        // https://stackoverflow.com/questions/39052392/ionic-header-bar-disappears-after-reloading-the-state-in-angularjs/42703366
        $scope.$on('$ionicView.loaded', function () {
            $timeout(function () {
                var header = document.getElementById('app-nav-bar');
                if (header.classList) {
                    if (header.classList.contains('hide')) {
                        header.classList.remove('hide');
                    }
                }
            }, 500);
        });

        $scope.feedbackWorking = false;
        $scope.feedbackModel = {
            text: ''
        };

        $scope.currentContext = userService.current;
        $scope.allFormTemplates = [];
        $scope.formTemplates = [];

        $scope.profile = {};
        $scope.userInfo = {};

        $scope.noThreadsFound = false;
        $scope.noRecordsFound = false;
        $scope.wellDone = false;

        $scope.startSurvey = function (formTemplate) {
            surveyService.startSurvey(formTemplate)
                .then(function (survey) {
                    $state.go("survey", {
                        id: survey.id
                    });
                }, function (err) {});
        };

        $scope.createFirstRecord = function () {
            var thread = $scope.formTemplates[0];
            surveyService.startSurvey(thread)
                .then(function (survey) {
                    $state.go("survey", {
                        id: survey.id
                    });
                }, function (err) {});
        }

        $scope.goDrafts = function (formTemplate) {
            $state.go("drafts", {
                id: formTemplate.id
            });
        };

        $scope.cloneTemplate = function () {
            // SHARED FORM TEMPLATE (Your Recordings) as seeded in our DB.
            var recordingTemplateId = '74EADB8F-7434-49C0-AD5A-854B0E77BCBD';

            // Ideally, we would get the shared thread from our platform.
            // var recordingsTemplate = _.filter($scope.allFormTemplates, function (template) { return template.title.toLowerCase().includes('recording'); })[0];

            $state.go("cloneTemplate", {
                id: recordingTemplateId
            });
        };

        $scope.deleteTemplate = function (formTemplate) {
            ngProgress.start();

            surveyService.deleteFormTemplate(formTemplate)
                .then(function () {
                        _.remove($scope.formTemplates, function (template) {
                            return template.id === formTemplate.id
                        });
                        ngProgress.complete();
                    },
                    function (err) {
                        ngProgress.complete();
                        alertService.show($scope.getValidationErrors(err));
                    });
        }

        $scope.editTemplate = function (formTemplate) {
            $state.go("editTemplate", {
                id: formTemplate.id
            });
        };

        $scope.reload = function () {
            $ionicLoading.show({
                template: 'Uploading records...'
            });

            surveyService.uploadAllSurveys().then(function () {
                $ionicLoading.hide();
                $scope.loadList();
            });
        }

        $scope.doRefresh = function () {
            ngProgress.start();
            $scope.downloading = true;

            surveyService.refreshData()
                .then(function () {
                    $scope.$broadcast('scroll.refreshComplete');
                    $scope.downloading = false;
                    ngProgress.complete();

                    $scope.reload();
                }, function (err) {
                    ngProgress.complete();
                    $scope.downloading = false;
                    alertService.show(err);
                });
        }

        $scope.listTemplates = function () {
            var q = $q.defer();

            surveyService.getFormTemplates()
                .then(function (data) {
                    angular.forEach(data, function (formTemplate) {
                        surveyService.getDraftsNumber(formTemplate.id)
                            .then(function (count) {
                                formTemplate.draftsNumber = count;
                            });
                    });

                    q.resolve(data);
                }, function (err) {
                    q.reject(err);
                });

            return q.promise;
        }

        $scope.loadList = function () {
            $scope.listTemplates().then(function (results) {
                $scope.allFormTemplates = [].concat(results);
                $scope.formTemplates = [].concat(results);

                if (!$scope.formTemplates.length) {
                    if (userService.current.project.createdBy.id === userService.current.userId) {
                        $scope.noThreadsFound = true;
                    }
                }

                $scope.syncUserRecords();
            }, function (err) {
                toastr.error(err);
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
                                        surveyService.deleteSubmittedSurveys().then(function () {
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

                                            $scope.listTemplates().then(function (results) {
                                                $scope.allFormTemplates = [].concat(results);
                                                $scope.formTemplates = [].concat(results);
                                            });
                                        });
                                    } catch (err) {
                                        console.warn(err);
                                    }

                                    if ($scope.formTemplates.length === 1) {
                                        if (!data.length) {
                                            $scope.noRecordsFound = true;
                                        } else if (data.length === 1) {
                                            $scope.noRecordsFound = false;
                                            $scope.wellDone = true;
                                        }
                                    }
                                }, function (err) {
                                    console.warn(err);

                                    if (err.substr(0, 3) === '401')
                                        toastr.error("Access Denied. You don't have permission to sync records.");
                                });
                        }
                    }
                }
            });
        }

        $scope.createFirstThread = function () {
            $scope.cloneTemplate();
        }

        $scope.goToTimeline = function () {
            $state.go('timeline');
        }

        $scope.goToCalendar = function () {
            $state.go('calendar');
        }

        $scope.openFeedbackPopup = function () {
            var template = "<p>We’ll help you set up your threads and start making records. We're happy to help and we'll get back to you as soon as possible.</p>" +
                "<textarea name='feedbackText' rows='3' ng-model='feedbackModel.text' placeholder='Be specific with details, help us help you' required></textarea>";

            $scope.feedbackPopup = $ionicPopup.show({
                template: template,
                title: 'Get in touch',
                subTitle: 'Summarise your situation',
                scope: $scope,
                buttons: [{
                        text: 'Send Message',
                        type: 'button-energized button-block',
                        onTap: function () {
                            if ($scope.feedbackModel.text.length)
                                return true;
                            else
                                toastr.warning('Enter your message first');
                        }
                    },
                    {
                        text: 'Cancel',
                        type: 'button-stable button-block',
                        onTap: function () {
                            return false;
                        }
                    }
                ]
            });

            $scope.feedbackPopup.then(function (res) {
                if (res) {
                    $scope.sendFeedback();
                }
            });
        }

        $scope.sendFeedback = function () {
            var feedback = {
                addedById: userService.currentProfile.userInfo.userId,
                organisationId: userService.currentProfile.userInfo.organisationId,
                comment: $scope.feedbackModel.text
            };

            ngProgress.start();
            $scope.feedbackWorking = true;
            feedbackService.sendFeedback(feedback)
                .then(function (result) {
                    toastr.success('Message sent. Thank you!');

                    $scope.feedbackModel.text = '';
                    $scope.feedbackPopup.close();
                }, function (error) {
                    console.error(error);
                }).finally(function () {
                    ngProgress.complete();
                    $scope.feedbackWorking = false;
                });
        }

        $scope.activate = function () {
            // update side-menu's profile widget
            userService.getExistingProfiles().then(function (profiles) {
                if (profiles.length) {
                    $scope.profile = profiles[0];
                    $scope.userInfo = $scope.profile.userInfo;

                    $rootScope.$broadcast('update-menu-profile', {
                        profile: $scope.userInfo.profile
                    });
                }
            });

            if (userService.current.project === undefined) {
                $state.go('projects');
            } else {
                var firstLogin = localStorageService.get(FIRST_TIME_LOGIN_KEY);
                if (firstLogin && firstLogin === true)
                    localStorageService.set(FIRST_TIME_LOGIN_KEY, false);

                $scope.loadList();
            }
        }

        $scope.activate();

    }
]);