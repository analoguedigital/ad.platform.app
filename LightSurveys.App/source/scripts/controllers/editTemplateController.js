(function () {
    'use strict';
    angular.module('lm.surveys').controller('editTemplateController', ['$scope', '$stateParams', '$ionicHistory',
        'surveyService', 'httpService', 'toastr', '$ionicLoading',
        function ($scope, $stateParams, $ionicHistory, surveyService, httpService, toastr, $ionicLoading) {
            $scope.templateId = $stateParams.id;
            $scope.formTemplate = null;
            $scope.vm = {
                title: "",
                colour: "",
            };

            $scope.submit = function () {
                if (!$scope.vm.title) {
                    toastr.error('Please enter thread title');
                    return false;
                }

                $scope.formTemplate.colour = $scope.vm.colour;
                $scope.formTemplate.title = $scope.vm.title;

                $ionicLoading.show({
                    template: '<i class="fa fa-circle-o-notch fa-spin fa-fw"></i> Updating thread...'
                });

                httpService.editFormTemplate($scope.formTemplate)
                    .then(function () {
                        surveyService.saveTemplate($scope.formTemplate)
                            .then(function () {
                                $ionicHistory.goBack();
                            }, function (err) {
                                console.error('could not save template', err);
                            });
                    }, function (err) {
                        console.error('could not update template', err);

                        var errorMessage = $scope.getValidationErrors(err);
                        toastr.error(errorMessage);
                    }).finally(function () {
                        $ionicLoading.hide();
                    });
            };

            $scope.back = function () {
                $ionicHistory.goBack();
            };

            $scope.getValidationErrors = function (error) {
                var validationErrors = [];
                if (error.modelState && angular.isObject(error.modelState)) {
                    for (var key in error.modelState) {
                        validationErrors.push(error.modelState[key][0]);
                    }
                } else {
                    validationErrors.push('Could not update the thread.');
                }

                return validationErrors.join("<br/>");
            };

            $scope.activate = function () {
                surveyService.getFormTemplate($scope.templateId)
                    .then(function (template) {
                        $scope.formTemplate = template;
                        $scope.vm.title = template.title;
                        $scope.vm.colour = template.colour;
                    });
            };

            $scope.activate();
        }
    ]);
}());