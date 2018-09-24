'use strict';
angular.module('lm.surveys').controller('homeController', ['$scope', '$rootScope', '$q', '$state', '$stateParams', '$ionicPlatform',
    '$ionicSideMenuDelegate', '$ionicPopup', 'surveyService', 'userService', 'alertService', 'ngProgress', '$ionicNavBarDelegate',
    '$ionicHistory', 'storageService', 'httpService', 'localStorageService', '$ionicModal', 'toastr', '$ionicPopover', '$timeout', 'feedbackService',
    function ($scope, $rootScope, $q, $state, $stateParams, $ionicPlatform, $ionicSideMenuDelegate, $ionicPopup, surveyService,
        userService, alertService, ngProgress, $ionicNavBarDelegate, $ionicHistory, storageService, httpService, localStorageService,
        $ionicModal, toastr, $ionicPopover, $timeout, feedbackService) {

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

        $scope.threadsGuidePopup = undefined;
        $scope.recordsGuidePopup = undefined;
        $scope.wellDonePopup = undefined;

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
                    $scope.recordsGuidePopup.close();

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
            surveyService.uploadAllSurveys().then(function () {
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
                        var threadsPopupTemplate = "<p>Your records can be grouped in threads.</p>" +
                            "<p>Threads help you sort and share your information. You can create as many threads as you like and choose who to share them with.</p>" +
                            "<p>Go ahead and create your first thread now.</p>";

                        $scope.threadsGuidePopup = $ionicPopup.show({
                            template: threadsPopupTemplate,
                            title: 'Create Threads',
                            scope: $scope,
                            buttons: [{
                                text: 'Create my first thread',
                                type: 'button-energized button-block',
                                onTap: function () {
                                    return true;
                                }
                            }, {
                                text: 'Skip',
                                type: 'button-stable button-block',
                                onTap: function () {
                                    return false;
                                }
                            }]
                        });

                        $scope.threadsGuidePopup.then(function (res) {
                            if (res) {
                                $scope.createFirstThread();
                            } else {
                                $scope.threadsGuidePopup = undefined;
                            }
                        });
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
                                            var recordsPopupTemplate = "<p>Records store your information.</p>" +
                                                "<p>Records allow you to collect the detailed information about a specific day, time or incident. You can upload text, voice and photos. Your records are completely confidential.</p>" +
                                                "<p>Create your first record now.</p>";

                                            $scope.recordsGuidePopup = $ionicPopup.show({
                                                template: recordsPopupTemplate,
                                                title: 'Create Records',
                                                scope: $scope,
                                                buttons: [{
                                                        text: 'Create my first record',
                                                        type: 'button-energized button-block',
                                                        onTap: function () {
                                                            return true;
                                                        }
                                                    },
                                                    {
                                                        text: 'Skip',
                                                        type: 'button-stable button-block',
                                                        onTap: function () {
                                                            return false;
                                                        }
                                                    }
                                                ]
                                            });

                                            $scope.recordsGuidePopup.then(function (res) {
                                                if (res) {
                                                    $scope.createFirstRecord();
                                                } else {
                                                    $scope.recordsGuidePopup.close();
                                                }
                                            });
                                        } else if (data.length === 1) {
                                            var wellDonePopupShown = localStorageService.get('WELL_DONE_POPUP_SHOWN');
                                            if (wellDonePopupShown === null || wellDonePopupShown === undefined) {
                                                // show only once.
                                                // $scope.wellDonePopup.then(function () {
                                                //     localStorageService.set('WELL_DONE_POPUP_SHOWN', true);
                                                // });
                                            }

                                            // or show until a 2nd record is created.
                                            var wellDoneTemplate = "<p>You have created your first thread and record. Continue to make records and you can:</p>" +
                                                "<p><a ng-click='goToTimeline()'><i class='icon ion-ios-film-outline'></i> View them on the Timeline</a><br>" +
                                                "<a ng-click='goToCalendar()'><i class='icon ion-ios-calendar-outline'></i> View them on the Calendar</a><br>" +
                                                "<a ui-sref='organizations'><i class='icon ion-help-buoy'></i> Get help and advice</a><br>" +
                                                "<a href='#' onclick='window.open(&apos;http://feeds.soundcloud.com/users/soundcloud:users:483303747/sounds.rss&apos;, &apos;_system&apos;, &apos;location=yes&apos;); return false;'><i class='icon ion-social-rss'></i> Subscribe to our podcast</a></p>";

                                            $scope.wellDonePopup = $ionicPopup.show({
                                                template: wellDoneTemplate,
                                                title: 'Well Done',
                                                subTitle: 'Keep going!',
                                                scope: $scope,
                                                buttons: [{
                                                    text: 'OK',
                                                    type: 'button-energized'
                                                }]
                                            });

                                            $scope.wellDonePopup.then(function () {
                                                $scope.wellDonePopup.close();
                                            });
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
            $scope.threadsGuidePopup.close();
            $scope.cloneTemplate();
        }

        $scope.goToTimeline = function () {
            $scope.wellDonePopup.close();
            $state.go('timeline');
        }

        $scope.goToCalendar = function () {
            $scope.wellDonePopup.close();
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