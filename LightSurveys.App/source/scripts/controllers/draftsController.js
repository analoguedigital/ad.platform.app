'use strict';
angular.module('lm.surveys').controller('draftsController', ['$scope', '$state', '$stateParams', '$location', '$ionicPopup', 'surveyService', 'alertService', 'gettext', 'userService',
    function ($scope, $state, $stateParams, $location, $ionicPopup, surveyService, alertService, gettext, userService) {

        $scope.formTemplateId = $stateParams.id;
        $scope.formTemplate = {};
        $scope.drafts = [];

        var reload = function () {
            surveyService.getAllSavedSurveys($scope.formTemplateId).then(
                function (drafts) {
                    $scope.drafts = [];
                    angular.forEach(drafts, function (draft) {
                        var attachmentGroups = _.groupBy(_.flatMap(draft.formValues, function (formValue) { return formValue.attachments === undefined ? [] : formValue.attachments; }), function (attachment) { return attachment.mediaType; });
                        draft.attachments = '';
                        angular.forEach(Object.keys(attachmentGroups), function (key) {
                            draft.attachments += (draft.attachments !== '' ? ', ' : '') + attachmentGroups[key].length + " " + key + (attachmentGroups[key].length > 1 ? 's' : '');
                        });

                        var attachments = [];
                        _.forEach(draft.formValues, function (fv) {
                            attachments = attachments.concat(fv.attachments);
                        });

                        if (attachments.length) {
                            var images = _.filter(attachments, function (a) { if (a) return a.mediaType === 'image'; });
                            var videos = _.filter(attachments, function (a) { if (a) return a.mediaType === 'video'; });
                            var audios = _.filter(attachments, function (a) { if (a) return a.mediaType === 'audio' });
                            var documents = _.filter(attachments, function (a) { if (a) return a.mediaType === 'document' });
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

                            if (images.length > 0) {
                                draft.coverImage = images[0].fileUri;
                            }
                        }

                        $scope.drafts.push(draft);
                    });
                },
                function (err) { alertService.show(gettext('error in loading saved surveys: ') + err); });
        };

        $scope.continue = function (draft) {
            $state.go('survey', { id: draft.id });
        };

        $scope.viewSurvey = function (survey) {
            $state.go('surveyView', { id: survey.id });
        };

        $scope.delete = function (draft) {
            var title = draft.isSubmitted ? "Delete record" : "Delete draft";
            var confirmPopup = $ionicPopup.confirm({
                title: title,
                buttons: [
                    { text: 'Cancel' },
                    {
                        text: 'Delete',
                        type: 'button-assertive',
                        onTap: function (e) {
                            return true;
                        }
                    }
                ],
                template: 'Are you sure you want to delete this record from your device?'
            });

            confirmPopup.then(function (res) {
                if (res) {
                    surveyService.delete(draft.id).then(
                        reload,
                        function (err) { alertService.show(gettext('error in deleting survey: ') + err); });
                }
            });
        };

        $scope.dateToString = function (isoString) {
            var utcDate = moment.utc(isoString);
            var localDate = utcDate.local();

            if (userService.current.calendar === "Gregorian") {
                return localDate.format('L LT');
            }
            else {
                var dateVal = persianDate(localDate.toDate());
                return dateVal.format("LLLL");
            }
        };

        surveyService.getFormTemplate($scope.formTemplateId).then(
            function (formTemplate) {
                $scope.formTemplate = formTemplate;
            },
            function (err) { alertService.show(gettext('error in loading the form template: ') + err); });

        reload();

    }]);