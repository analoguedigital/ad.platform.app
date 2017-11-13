﻿'use strict';
angular.module('lm.surveys').controller('homeController', ['$scope', '$rootScope', '$state', '$stateParams', '$ionicPlatform', '$ionicSideMenuDelegate', '$ionicPopup', 'surveyService', 'userService', 'alertService', 'ngProgress', '$ionicNavBarDelegate',
    function ($scope, $rootScope, $state, $stateParams, $ionicPlatform, $ionicSideMenuDelegate, $ionicPopup, surveyService, userService, alertService, ngProgress, $ionicNavBarDelegate) {

        //solution to Navbar disappearance issue suggested here https://github.com/ionic-team/ionic/issues/3483
        $scope.$on('$ionicView.enter', function (e) {
            $ionicNavBarDelegate.showBar(true);
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
                    $scope.formTemplates = _.filter(results, function (formTemplate) { return formTemplate.createdById === userService.current.userId; });

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
            //var recordingsTemplate = _.filter($scope.allFormTemplates, function (template) { return template.title.toLowerCase().includes('recording'); })[0];
            //var recordingTemplateId = '74eadb8f-7434-49c0-ad5a-854b0e77bcbd';
            var recordingTemplateId = '25f4439f-8d02-44a9-a9c7-029a2c41f185';
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
                    _loadList();
                    $scope.$broadcast('scroll.refreshComplete');
                    $scope.downloading = false;
                    ngProgress.complete();
                    surveyService.uploadAllSurveys();
                }, function (err) {
                    ngProgress.complete();
                    $scope.downloading = false;
                    alertService.show(err);
                });
        }


        if (userService.current.project !== undefined)
            _loadList();

    }]);

