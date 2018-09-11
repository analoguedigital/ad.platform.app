'use strict';
angular.module('lm.surveys').controller('cloneTemplateController', ['$scope', '$state', '$stateParams', '$ionicHistory', 'userService', 'alertService', 'ngProgress', 'surveyService', 'httpService', 'toastr', 
function ($scope, $state, $stateParams, $ionicHistory, userService, alertService, ngProgress, surveyService, httpService, toastr) {

    $scope.templateId = $stateParams.id;
    $scope.formTemplate = null;
    $scope.vm = {
        title: "",
        colour: "",
    };

    $scope.submit = function () {
        if (!$scope.vm.title) {
            toastr.warning('Please enter title');
        }
        else {
            ngProgress.start();

            httpService.cloneFormTemplate($scope.templateId, $scope.vm.title, $scope.vm.colour, userService.current.project.id)
                .then(function () {
                    surveyService.refreshTemplates().then(function () {
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
            validationErrors.push('Could not create the new thread.');
        };

        return validationErrors.join("<br/>");
    }


    surveyService.getFormTemplate($scope.templateId).then(function (template) {
        $scope.formTemplate = template;
    });

}]);