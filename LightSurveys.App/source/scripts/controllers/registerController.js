'use strict';
angular.module('lm.surveys').controller('registerController', ['$scope', '$state', '$ionicHistory', '$ionicModal', 'userService', 'alertService', 'ngProgress', 'surveyService', 'localStorageService', 
    function ($scope, $state, $ionicHistory, $ionicModal, userService, alertService, ngProgress, surveyService, localStorageService) {
        $scope.termsModal = undefined;
        $scope.model = {
            termsAgreed: false
        };

        $scope.registerData = {
            firstName: "",
            surname: "",
            email: "",
            password: "",
            birthdate: null,
            gender: "",
            address: "",
            phone: "",
            organisationName: "OnRecord"
        };

        $scope.register = function () {
            $scope.registerData.confirmPassword = $scope.registerData.password;

            if (!$scope.registerData.email) {
                alertService.show("Please enter your email");
            }
            else if (!$scope.registerData.password) {
                alertService.show("Please enter your password");
            }
            else if (!$scope.registerData.firstName) {
                alertService.show("Please enter your name");
            } else if (!$scope.registerData.surname) {
                alertService.show("Please enter your surname");
            }
            else if ($scope.model.termsAgreed == false) {
                alertService.show("Please agree to usage terms");
            }
            else {
                ngProgress.start();

                userService.register($scope.registerData)
                    .then(function () {
                        surveyService.refreshData()
                            .then(function () {
                                ngProgress.complete();
                                $ionicHistory.clearHistory();

                                var FIRST_TIME_LOGIN_KEY = 'FIRST_TIME_LOGIN';
                                localStorageService.set(FIRST_TIME_LOGIN_KEY, true);
                                $state.go('makingRecords');
                            },
                            function (err) {
                                ngProgress.complete();
                                alertService.show(err);
                            });
                    },
                    function (err) {
                        ngProgress.complete();
                        alertService.show($scope.getValidationErrors(err));
                    });
            }
        };

        $scope.getValidationErrors = function (error) {
            var validationErrors = [];
            if (error.modelState && angular.isObject(error.modelState)) {
                for (var key in error.modelState) {
                    validationErrors.push(error.modelState[key][0]);
                }
            } else {
                validationErrors.push('Could not register.');
            };

            return validationErrors.join("<br/>");
        }

        $ionicModal.fromTemplateUrl('partials/terms.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function (modal) {
            $scope.termsModal = modal;
        });

        $scope.openTermsModal = function () {
            $scope.termsModal.show();
        }

        $scope.closeTermsModal = function () {
            $scope.termsModal.hide();
        }
    }]);