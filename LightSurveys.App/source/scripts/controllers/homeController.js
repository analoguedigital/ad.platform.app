'use strict';
angular.module('lm.surveys').controller('homeController', ['$scope', '$rootScope', '$state', '$stateParams', '$ionicPlatform',
    '$ionicSideMenuDelegate', '$ionicPopup', 'surveyService', 'userService', 'alertService', 'ngProgress', '$ionicNavBarDelegate',
    '$ionicHistory', 'storageService', 'httpService', 'localStorageService', '$ionicModal', 'toastr', '$ionicPopover', 
    function ($scope, $rootScope, $state, $stateParams, $ionicPlatform, $ionicSideMenuDelegate, $ionicPopup, surveyService,
        userService, alertService, ngProgress, $ionicNavBarDelegate, $ionicHistory, storageService, httpService, localStorageService, $ionicModal, toastr, $ionicPopover) {
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

        $scope.profile = {};
        $scope.userInfo = {};

        $scope.threadsGuidePopup = undefined;
        $scope.recordsGuidePopup = undefined;
        $scope.wellDonePopup = undefined;

        $scope.loadList = function () {
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

                    if (!$scope.formTemplates.length) {
                        if (userService.current.project.createdBy.id === userService.current.userId) {
                            var threadsPopupTemplate = "<p>Your records can be grouped in threads.</p>" +
                                "<p>Threads help you sort and share your information. You can create as many threads as you like and choose who to share them with.</p>" +
                                "<p>Go ahead and create your first thread now.</p>";

                            if (!$scope.threadsGuidePopup) {
                                $scope.threadsGuidePopup = $ionicPopup.show({
                                    template: threadsPopupTemplate,
                                    title: 'Create Threads',
                                    scope: $scope,
                                    buttons: [
                                        {
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
                                        }
                                    ]
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
                    } else if ($scope.formTemplates.length === 1) {
                        var savedSurveys = surveyService.getAllSavedSurveys($scope.formTemplates[0].id)
                            .then(function (data) {
                                if (data.length === 1 && data[0].isSubmitted) {
                                    var wellDonePopupShown = localStorageService.get('WELL_DONE_POPUP_SHOWN');
                                    if (wellDonePopupShown === null || wellDonePopupShown === undefined) {
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
                                            buttons: [
                                                {
                                                    text: 'OK',
                                                    type: 'button-energized'
                                                }
                                            ]
                                        });

                                        localStorageService.set('WELL_DONE_POPUP_SHOWN', true);
                                    }
                                }
                            });
                    }

                    // filter results to threads created by current user.
                    // PS this isn't necessary because users can see threads 
                    // that they have access to. based on assignments and all.
                    //$scope.formTemplates = _.filter(results, function (formTemplate) {
                    //    return formTemplate.createdById === userService.current.userId;
                    //});
                }, function (err) {
                    alertService.show(err);
                });
        };

        $scope.startSurvey = function (formTemplate) {
            surveyService.startSurvey(formTemplate)
                .then(function (survey) {
                    $state.go("survey", {
                        id: survey.id
                    });
                }, function (err) { });
        };

        $scope.createFirstRecord = function () {
            var thread = $scope.formTemplates[0];
            surveyService.startSurvey(thread)
                .then(function (survey) {
                    $scope.recordsGuidePopup.close();
                    $state.go("survey", {
                        id: survey.id
                    });
                }, function (err) { });
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
                                    if ($scope.formTemplates.length === 1) {
                                        if (!data.length) {
                                            var recordsPopupTemplate = "<p>Records store your information.</p>" +
                                                "<p>Records allow you to collect the detailed information about a specific day, time or incident. You can upload text, voice and photos. Your records are completely confidential.</p>" +
                                                "<p>Create your first record now.</p>";

                                            if (!$scope.recordsGuidePopup) {
                                                $scope.recordsGuidePopup = $ionicPopup.show({
                                                    template: recordsPopupTemplate,
                                                    title: 'Create Records',
                                                    scope: $scope,
                                                    buttons: [
                                                        {
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
                                                        $scope.recordsGuidePopup = undefined;
                                                    }
                                                });
                                            }
                                        }
                                    }

                                    try {
                                        surveyService.deleteAllData().then(function () {
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
                                        });
                                    } catch (err) {
                                        console.warn(err);
                                    }

                                    $scope.loadList();
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

        $scope.activate = function () {
            $ionicPopover.fromTemplateUrl('partials/popover.html', {
                scope: $scope,
            }).then(function (popover) {
                $scope.popover = popover;
            });
            
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
                if (firstLogin && firstLogin === true) {
                    localStorageService.set(FIRST_TIME_LOGIN_KEY, false);
                }

                surveyService.uploadAllSurveys();
                $scope.loadList();
                $scope.syncUserRecords();
            }
        }

        $scope.activate();

    }
]);