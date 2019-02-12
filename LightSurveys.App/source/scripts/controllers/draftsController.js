(function () {
    'use strict';
    angular.module('lm.surveys').controller('draftsController', ['$scope', '$state', '$stateParams', '$ionicPopup',
        'surveyService', 'gettext', 'userService', 'toastr', '$ionicLoading', 'localStorageService', '$ionicScrollDelegate',
        function ($scope, $state, $stateParams, $ionicPopup, surveyService, gettext, userService, toastr, $ionicLoading, localStorageService, $ionicScrollDelegate) {
            $scope.currentUserId = '';
            $scope.formTemplateId = $stateParams.id;
            $scope.formTemplate = {};
            $scope.drafts = [];

            $scope.reload = function () {
                $scope.currentUserId = userService.current.userId;

                surveyService.getAllSavedSurveys($scope.formTemplateId)
                    .then(function (drafts) {
                        $scope.drafts = [];
                        angular.forEach(drafts, function (draft) {
                            var attachmentGroups = _.groupBy(_.flatMap(draft.formValues, function (formValue) {
                                return formValue.attachments === undefined ? [] : formValue.attachments;
                            }), function (attachment) {
                                return attachment.mediaType;
                            });

                            draft.attachments = '';
                            angular.forEach(Object.keys(attachmentGroups), function (key) {
                                draft.attachments += (draft.attachments !== '' ? ', ' : '') + attachmentGroups[key].length + " " + key + (attachmentGroups[key].length > 1 ? 's' : '');
                            });

                            var attachments = [];
                            _.forEach(draft.formValues, function (fv) {
                                attachments = attachments.concat(fv.attachments);
                            });

                            if (attachments.length) {
                                var images = _.filter(attachments, function (a) {
                                    if (a) return a.mediaType === 'image';
                                });
                                var videos = _.filter(attachments, function (a) {
                                    if (a) return a.mediaType === 'video';
                                });
                                var audios = _.filter(attachments, function (a) {
                                    if (a) return a.mediaType === 'audio';
                                });
                                var documents = _.filter(attachments, function (a) {
                                    if (a) return a.mediaType === 'document';
                                });
                                var files = _.filter(attachments, function (a) {
                                    if (a && a.mediaType !== 'image' && a.mediaType !== 'video' && a.mediaType !== 'audio' && a.mediaType !== 'document') {
                                        return a;
                                    }
                                });

                                var meta = {
                                    images: images,
                                    videos: videos,
                                    audios: audios,
                                    documents: documents,
                                    files: files
                                };

                                draft.metadata = meta;
                            }

                            $scope.drafts.push(draft);
                        });

                        $ionicLoading.hide();

                        // get last scroll position for this thread, and apply.
                        var key = 'scrollPosition/' + $scope.formTemplateId;
                        var scrollPosition = localStorageService.get(key);
                        if (scrollPosition !== null) {
                            $ionicScrollDelegate.scrollTo(scrollPosition.left, scrollPosition.top);
                        }
                    }, function (err) {
                        // alertService.show(gettext('error in loading saved surveys: ') + err);
                        console.error('could not get saved surveys', err);
                        $ionicLoading.hide();
                        toastr.error(err);
                    });
            };

            $scope.continue = function (draft) {
                $state.go('survey', {
                    id: draft.id
                });
            };

            $scope.viewSurvey = function (survey, index) {
                $state.go('surveyView', {
                    id: survey.id,
                    index: index + 1,
                    total: $scope.drafts.length
                });
            };

            $scope.delete = function (draft) {
                var title = draft.isSubmitted ? "Delete record" : "Delete draft";
                var confirmPopup = $ionicPopup.confirm({
                    title: title,
                    buttons: [
                        {
                            text: 'Delete',
                            type: 'button-assertive',
                            onTap: function (e) {
                                return true;
                            }
                        },
                        {
                            text: 'Cancel',
                            type: 'button-stable'
                        },
                    ],
                    template: 'Are you sure you want to delete this record from your device?'
                });

                confirmPopup.then(function (res) {
                    if (res) {
                        $ionicLoading.show({
                            template: '<i class="fa fa-circle-o-notch fa-spin fa-fw"></i> Deleting record...'
                        });

                        surveyService.delete(draft.id)
                            .then(function () {
                                $scope.reload();
                            }, function (err) {
                                console.error('could not delete survey', err);

                                // alertService.show(gettext('error in deleting survey: ') + err);
                                var errorMessage = gettext('error in deleting survey: ') + err;
                                toastr.error(errorMessage);
                            }).finally(function () {
                                $ionicLoading.hide();
                            });
                    }
                });
            };

            $scope.dateToString = function (isoString) {
                var utcDate = moment.utc(isoString);
                var localDate = utcDate.local();

                if (userService.current.calendar === "Gregorian") {
                    return localDate.format('L LT');
                } else {
                    var dateVal = persianDate(localDate.toDate());
                    return dateVal.format("LLLL");
                }
            };

            $scope.saveScrollPosition = function () {
                var position = $ionicScrollDelegate.$getByHandle('drafts-handle').getScrollPosition();
                var key = 'scrollPosition/' + $scope.formTemplateId;
                localStorageService.set(key, position);
            };

            $scope.clearScrollPosition = function () {
                var key = 'scrollPosition/' + $scope.formTemplateId;
                localStorageService.remove(key);
            }

            $scope.$on('$ionicView.beforeLeave', function () {
                $scope.saveScrollPosition();
            });

            $scope.activate = function () {
                $ionicLoading.show({
                    template: '<i class="fa fa-circle-o-notch fa-spin fa-fw"></i> Loading records...'
                });

                surveyService.getFormTemplate($scope.formTemplateId)
                    .then(function (formTemplate) {
                        $scope.formTemplate = formTemplate;
                        $scope.reload();
                    }, function (err) {
                        console.error('could not get form template', err);

                        $ionicLoading.hide();

                        // alertService.show(gettext('error in loading the form template: ') + err);
                        var errorMessage = gettext('error in loading the form template: ') + err;
                        toastr.error(errorMessage);
                    });
            };

            $scope.activate();
        }
    ]);
}());