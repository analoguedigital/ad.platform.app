'use strict';
angular.module('lm.surveys').controller('homeController', ['$scope', '$state', 'surveyService', 'userService', 'alertService', 'ngProgress',
    function ($scope, $state, surveyService, userService, alertService, ngProgress) {

        $scope.currentContext = userService.current;
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

                    var partitions = _.partition(results, function (template) { return !template.title.match(/feedback/i); });
                    $scope.formTemplates = _.concat(partitions[0], partitions[1]);

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
            var recordingsTemplate = _.filter($scope.formTemplates, function (template) { return template.title.toLowerCase().includes('recording'); })[0];
            $state.go("cloneTemplate", { id: recordingsTemplate.id });
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
                    _loadList();
                    $scope.$broadcast('scroll.refreshComplete');
                    $scope.downloading = false;
                    ngProgress.complete();
                }, function (err) {
                    ngProgress.complete();
                    $scope.downloading = false;
                    alertService.show(err);
                });
        }


        if (userService.current.project !== undefined)
            _loadList();

    }]);

