'use strict';
angular.module('lm.surveys').controller('editTemplateController', ['$scope', '$state', '$stateParams', '$ionicHistory', 'userService', 'alertService', 'ngProgress', 'surveyService', 'httpService',
    function ($scope, $state, $stateParams, $ionicHistory, userService, alertService, ngProgress, surveyService, httpService) {

        $scope.templateId = $stateParams.id;
        $scope.formTemplate = null;
        $scope.vm = {
            title: "",
            colour: "",
        };

        $scope.submit = function () {

            if (!$scope.vm.title) {
                alertService.show("Please enter title");
            }
            else {
                ngProgress.start();

                $scope.formTemplate.colour = $scope.vm.colour;
                $scope.formTemplate.title = $scope.vm.title;

                httpService.editFormTemplate($scope.formTemplate)
                    .then(function () {
                        surveyService.saveTemplate($scope.formTemplate).then(function () {
                            ngProgress.complete();
                            $ionicHistory.goBack();
                        });
                    },
                    function (err) {
                        ngProgress.complete();
                        alertService.show($scope.getValidationErrors(err));
                    });
            }
        };

        $scope.back = function () {
            $ionicHistory.goBack();
        }

        $scope.getValidationErrors = function (error) {
            var validationErrors = [];
            if (error.modelState && angular.isObject(error.modelState)) {
                for (var key in error.modelState) {
                    validationErrors.push(error.modelState[key][0]);
                }
            } else {
                validationErrors.push('Could not update the thread.');
            };

            return validationErrors.join("<br/>");
        }


        surveyService.getFormTemplate($scope.templateId).then(function (template) {
            $scope.formTemplate = template;
            $scope.vm.title = template.title;
            $scope.vm.colour = template.colour;
        });

    }]);