(function () {
    'use strict';
    angular.module('lm.surveys').controller('cloneTemplateController', ['$scope', '$stateParams', '$ionicHistory',
        'userService', 'surveyService', 'httpService', 'toastr', '$ionicLoading',
        function ($scope, $stateParams, $ionicHistory, userService, surveyService, httpService, toastr, $ionicLoading) {
            $scope.templateId = $stateParams.id;
            $scope.formTemplate = null;
            $scope.vm = {
                title: "",
                colour: "",
            };

            $scope.submit = function () {
                if (!$scope.vm.title) {
                    toastr.error('Please enter thread title');
                } else {
                    $ionicLoading.show({
                        template: '<i class="fa fa-circle-o-notch fa-spin fa-fw"></i> Creating thread...'
                    });

                    httpService.cloneFormTemplate($scope.templateId, $scope.vm.title, $scope.vm.colour, userService.current.project.id)
                        .then(function () {
                            $ionicLoading.show({
                                template: '<i class="fa fa-circle-o-notch fa-spin fa-fw"></i> Refreshing threads...'
                            });

                            surveyService.refreshTemplates()
                                .then(function () {
                                    $ionicHistory.goBack();
                                }, function (err) {
                                    console.error('could not refresh templates', err);
                                }).finally(function () {
                                    $ionicLoading.hide();
                                });
                        }, function (err) {
                            console.error('could not clone template', err);

                            // alertService.show($scope.getValidationErrors(err));
                            var errorMessage = $scope.getValidationErrors(err);
                            toastr.error(errorMessage);
                        }).finally(function () {
                            $ionicLoading.hide();
                        });
                }
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
                    validationErrors.push('Could not create the new thread.');
                }

                return validationErrors.join("<br/>");
            };

            $scope.activate = function () {
                surveyService.getFormTemplate($scope.templateId)
                    .then(function (template) {
                        $scope.formTemplate = template;
                    }, function (err) {
                        console.error('could not get template', err);
                    });
            };

            $scope.activate();
        }
    ]);
}());