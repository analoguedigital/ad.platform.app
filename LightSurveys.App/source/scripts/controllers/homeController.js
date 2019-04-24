(function () {
    'use strict';
    angular.module('lm.surveys').controller('homeController', ['$scope', '$rootScope', '$q', '$state', '$ionicPopup', 'surveyService',
        'userService', 'localStorageService', 'toastr', '$timeout',
        'feedbackService', '$ionicLoading', '$ionicScrollDelegate',
        function ($scope, $rootScope, $q, $state, $ionicPopup, surveyService, userService, localStorageService, toastr, $timeout, feedbackService, $ionicLoading, $ionicScrollDelegate) {

            var FIRST_TIME_LOGIN_KEY = 'FIRST_TIME_LOGIN';

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
                }, 250);
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
                        var key = 'scrollPosition/' + formTemplate.id;
                        localStorageService.remove(key);

                        $state.go("survey", {
                            id: survey.id
                        });
                    }, function (err) { });
            };

            $scope.createFirstRecord = function () {
                var thread = $scope.formTemplates[0];

                var key = 'scrollPosition/' + thread.id;
                localStorageService.remove(key);

                surveyService.startSurvey(thread)
                    .then(function (survey) {
                        $state.go("survey", {
                            id: survey.id
                        });
                    }, function (err) {
                        console.error(err);
                        toastr.error('Could not start survey, sorry');
                    });
            };

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
                var confirmPopup = $ionicPopup.confirm({
                    title: 'Archive thread',
                    template: "Are you sure you want to archive this thread? Your data will still be available on our platform but archived threads won't be listed in the app anymore.",
                    buttons: [{
                        text: 'Yes, archive',
                        type: 'button-balanced',
                        onTap: function (e) {
                            return true;
                        }
                    },
                    {
                        text: 'Cancel',
                        type: 'button-stable'
                    }]
                });

                confirmPopup.then(function (res) {
                    if (res) {
                        surveyService.deleteFormTemplate(formTemplate)
                            .then(function () {
                                _.remove($scope.formTemplates, function (template) {
                                    return template.id === formTemplate.id;
                                });

                                $scope.clearScrollPosition();
                            }, function (err) {
                                console.error(err);
                                toastr.error($scope.getValidationErrors(err));
                            });
                    }
                });
            };

            $scope.editTemplate = function (formTemplate) {
                $state.go("editTemplate", {
                    id: formTemplate.id
                });
            };

            $scope.reload = function () {
                $ionicLoading.show({
                    template: '<i class="fa fa-circle-o-notch fa-spin fa-fw"></i> Uploading records...'
                });

                surveyService.uploadAllSurveys().then(function () {
                    $ionicLoading.hide();
                    $scope.loadList();
                }, function (err) {
                    $ionicLoading.hide();
                    console.error('uploadAllSurveys ERROR', err);
                });
            };

            $scope.doRefresh = function () {
                $ionicLoading.show({
                    template: '<i class="fa fa-circle-o-notch fa-spin fa-fw"></i> Refreshing data...'
                });

                surveyService.refreshData()
                    .then(function () {
                        $ionicLoading.hide();
                        $scope.$broadcast('scroll.refreshComplete');
                        $scope.reload();
                    }, function (err) {
                        $ionicLoading.hide();
                        console.error('refreshData ERROR', err);
                    });
            };

            $scope.listTemplates = function () {
                var q = $q.defer();

                surveyService.getFormTemplates()
                    .then(function (templates) {
                        var promises = [];

                        angular.forEach(templates, function (formTemplate) {
                            var qp = $q.defer();
                            promises.push(qp);

                            surveyService.getDraftsNumber(formTemplate.id)
                                .then(function (count) {
                                    formTemplate.draftsNumber = count;
                                    qp.resolve();
                                });
                        });

                        $q.all(promises).then(function () {
                            var sortedTemplates = _.sortBy(templates, function (t) { return t.title; });
                            q.resolve(sortedTemplates);
                        }, function (err) {
                            q.reject(err);
                        });
                    }, function (err) {
                        q.reject(err);
                    });

                return q.promise;
            };

            $scope.loadList = function () {
                $scope.listTemplates().then(function (templates) {
                    $scope.allFormTemplates = [].concat(templates);
                    $scope.formTemplates = [].concat(templates);

                    if (!$scope.formTemplates.length) {
                        if (userService.current.project.createdBy.id === userService.current.userId) {
                            $scope.noThreadsFound = true;
                        }
                    }

                    $scope.syncUserRecords();
                }, function (err) {
                    $ionicLoading.hide();
                    toastr.error(err);
                });
            };

            $scope.sortRecords = function (records) {
                var deferred = $q.defer();
                var promises = [];

                _.forEach(records, function (survey) {
                    var surveyPromise = $q.defer();
                    promises.push(surveyPromise);

                    _.forEach(survey.formValues, function (fv) {
                        _.forEach(fv.attachments, function (attachment) {
                            attachment.fileUri = undefined;
                            attachment.mediaType = _.toLower(attachment.typeString);
                            delete attachment.typeString;
                        });
                    });

                    var recordKey = 'survey/' + survey.id;
                    var _stored = localStorageService.set(recordKey, survey);
                    if (_stored) {
                        surveyPromise.resolve();
                    } else {
                        surveyPromise.reject();
                    }
                });

                $q.all(promises).then(function () {
                    deferred.resolve();
                }, function (err) {
                    console.error('sorting records failed');
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
                                        $ionicLoading.hide();

                                        surveyService.deleteSubmittedSurveys().then(function () {
                                            $ionicLoading.show({
                                                template: '<i class="fa fa-circle-o-notch fa-spin fa-fw"></i> Sorting records...'
                                            });

                                            $scope.sortRecords(records).then(function () {
                                                $scope.listTemplates().then(function (templates) {
                                                    $scope.allFormTemplates = [].concat(templates);
                                                    $scope.formTemplates = [].concat(templates);

                                                    if (templates.length === 1) {
                                                        if (!records.length) {
                                                            $scope.noRecordsFound = true;
                                                        } else if (records.length === 1) {
                                                            $scope.noRecordsFound = false;
                                                            $scope.wellDone = true;
                                                        }
                                                    }

                                                    $scope.clearScrollPosition();
                                                    $ionicLoading.hide();
                                                }, function (err) {
                                                    $ionicLoading.hide();
                                                });
                                            }, function (err) {
                                                console.error('could not sort records');
                                                $ionicLoading.hide();
                                            });
                                        }, function (err) {
                                            $ionicLoading.hide();
                                        });
                                    }, function (err) {
                                        console.error('getUserSurveys ERROR', err);
                                        $ionicLoading.hide();

                                        if (err && err.length && err.substr(0, 3) === '401')
                                            toastr.error("Access Denied. You don't have permission to sync records.");
                                    }).finally(function () {
                                        $scope.$broadcast('scroll.refreshComplete');
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

            $scope.createFirstThread = function () {
                $scope.cloneTemplate();
            };

            $scope.goToTimeline = function () {
                $state.go('timeline');
            };

            $scope.goToCalendar = function () {
                $state.go('calendar');
            };

            $scope.openFeedbackPopup = function () {
                var template = "<p>We’ll help you set up your threads and start making records. We're happy to help and we'll get back to you as soon as possible.</p>" +
                    "<textarea name='feedbackText' rows='3' class='feedback-popup-input' ng-model='feedbackModel.text' placeholder='Be specific with details, help us help you' required></textarea>";

                $scope.feedbackPopup = $ionicPopup.show({
                    template: template,
                    title: 'Get in touch',
                    subTitle: 'Summarise your situation',
                    scope: $scope,
                    buttons: [{
                        text: 'Send',
                        type: 'button-royal',
                        onTap: function () {
                            if ($scope.feedbackModel.text.length)
                                return true;
                            else
                                toastr.error('Please enter your message first');
                        }
                    },
                    {
                        text: 'Cancel',
                        type: 'button-stable',
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
            };

            $scope.sendFeedback = function () {
                var feedback = {
                    addedById: userService.currentProfile.userInfo.userId,
                    organisationId: userService.currentProfile.userInfo.organisationId,
                    comment: $scope.feedbackModel.text
                };

                $scope.feedbackWorking = true;
                feedbackService.sendFeedback(feedback)
                    .then(function (result) {
                        toastr.success('Message sent. Thank you!');

                        $scope.feedbackModel.text = '';
                        $scope.feedbackPopup.close();
                    }, function (error) {
                        console.error(error);
                    }).finally(function () {
                        $scope.feedbackWorking = false;
                    });
            };

            $scope.restoreScrollPosition = function () {
                var key = 'scrollPosition/home';
                var scrollPosition = localStorageService.get(key);
                if (scrollPosition !== null) {
                    $ionicScrollDelegate.scrollTo(scrollPosition.left, scrollPosition.top);
                }
            };

            $scope.saveScrollPosition = function () {
                var position = $ionicScrollDelegate.$getByHandle('home-handle').getScrollPosition();
                var key = 'scrollPosition/home';
                localStorageService.set(key, position);
            };

            $scope.clearScrollPosition = function () {
                var key = 'scrollPosition/home';
                localStorageService.remove(key);
            };

            $scope.$on('$ionicView.beforeLeave', function () {
                $scope.saveScrollPosition();
            });

            $scope.activate = function () {
                // update side-menu's profile widget
                userService.getExistingProfiles().then(function (profiles) {
                    if (profiles && profiles.length) {
                        $scope.profile = profiles[0];
                        $scope.userInfo = $scope.profile.userInfo;

                        $rootScope.$broadcast('update-menu-profile', {
                            profile: $scope.userInfo.profile,
                            notifications: $scope.userInfo.notifications
                        });
                    }
                });

                if (userService.current.project === undefined) {
                    $state.go('projects');
                } else {
                    var firstLogin = localStorageService.get(FIRST_TIME_LOGIN_KEY);
                    if (firstLogin && firstLogin === true)
                        localStorageService.set(FIRST_TIME_LOGIN_KEY, false);

                    var bootstrapped = localStorageService.get('APP_BOOTSTRAPPED');
                    if (bootstrapped === null || bootstrapped === undefined) {
                        localStorageService.set('APP_BOOTSTRAPPED', true);
                        $scope.loadList();
                    } else {
                        $ionicLoading.show({
                            template: '<i class="fa fa-circle-o-notch fa-spin fa-fw"></i> Loading...'
                        });

                        $scope.listTemplates().then(function (templates) {
                            $scope.allFormTemplates = [].concat(templates);
                            $scope.formTemplates = [].concat(templates);

                            if (!$scope.formTemplates.length) {
                                if (userService.current.project.createdBy.id === userService.current.userId) {
                                    $scope.noThreadsFound = true;
                                }
                            }

                            $scope.restoreScrollPosition();
                        }, function (err) {
                            toastr.error(err);
                        }).finally(function () {
                            $ionicLoading.hide();
                        });
                    }
                }
            };

            $scope.activate();
        }
    ]);
}());