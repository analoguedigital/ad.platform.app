'use strict';
angular.module('lm.surveys').controller('registerController', ['$scope', '$state', '$ionicHistory', '$ionicModal', 'userService', 'alertService', 'ngProgress', 'surveyService', 'localStorageService',
    function ($scope, $state, $ionicHistory, $ionicModal, userService, alertService, ngProgress, surveyService, localStorageService) {
        var FIRST_TIME_LOGIN_KEY = 'FIRST_TIME_LOGIN';

        $scope.termsModal = undefined;

        $scope.model = {
            termsAgreed: false
        };

        $scope.registerData = {
            firstName: "",
            surname: "",
            email: "",
            confirmEmail: "",
            password: "",
            birthdate: null,
            gender: "",
            address: "",
            phone: "",
            organisationName: "OnRecord"
        };

        $scope.register = function () {
            $scope.registerData.confirmPassword = $scope.registerData.password;

            if (!$scope.registerData.firstName) {
                alertService.show("Please enter your name");
            }
            else if (!$scope.registerData.surname) {
                alertService.show("Please enter your surname");
            }
            else if (!$scope.registerData.email) {
                alertService.show("Please enter your email");
            }
            else if (!$scope.registerData.confirmEmail) {
                alertService.show("Please confirm your email");
            }
            else if ($scope.registerData.email !== $scope.registerData.confirmEmail) {
                alertService.show("Emails do not match! Try again.")
            }
            else if (!$scope.registerData.password) {
                alertService.show("Please enter your password");
            }
            else if ($scope.model.termsAgreed === false) {
                alertService.show("Please agree to usage terms");
            }
            else {
                ngProgress.start();

                userService.register($scope.registerData)
                    .then(function () {
                        ngProgress.complete();

                        // disabled temporarily. but we need this in production.
                        //$state.go('registerComplete');

                        var params = { email: $scope.registerData.email, password: $scope.registerData.password };
                        ngProgress.start();

                        userService.login(params)
                            .then(function () {
                                if (navigator.vibrate)
                                    navigator.vibrate(1000);

                                _.forEach(localStorageService.keys(), function (key) {
                                    if (_.includes(key, 'user')) {
                                        localStorageService.remove(key);
                                    }
                                });

                                surveyService.clearLocalData().then(function () {
                                    //var firstLogin = localStorageService.get(FIRST_TIME_LOGIN_KEY);
                                    //if (firstLogin === null || firstLogin === undefined) {
                                    //    localStorageService.set(FIRST_TIME_LOGIN_KEY, true);
                                    //    $state.go('makingRecords');
                                    //} else {
                                    //    $state.go('projects');
                                    //}

                                    var firstLogin = localStorageService.get(FIRST_TIME_LOGIN_KEY);
                                    if (firstLogin === null || firstLogin === undefined) {
                                        localStorageService.set(FIRST_TIME_LOGIN_KEY, true);
                                    }

                                    $state.go('projects');
                                });
                            },
                                function (err) {
                                    ngProgress.complete();
                                    $scope.loginWorking = false;
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