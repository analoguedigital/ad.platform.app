'use strict';
angular.module('lm.surveys').controller('draftsController', ['$scope', '$state', '$stateParams', '$location', 'surveyService', 'alertService', 'gettext', 'userService',
    function ($scope, $state, $stateParams, $location, surveyService, alertService, gettext, userService) {

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
            surveyService.delete(draft.id).then(
                reload,
                function (err) { alertService.show(gettext('error in deleting survey: ') + err); });
        };

        $scope.dateToString = function (milliseconds) {
            if (userService.current.calendar === "Gregorian") {
                var dateValue = new Date(milliseconds);
                return dateValue.toLocaleString('en-GB');
            }
            else {
                var dateVal = persianDate(milliseconds);
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