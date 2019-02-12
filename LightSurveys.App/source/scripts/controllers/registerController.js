(function () {
    'use strict';
    angular.module('lm.surveys').controller('registerController', ['$scope', '$state', '$ionicModal', 'userService', 'toastr',
        function ($scope, $state, $ionicModal, userService, toastr) {
            $scope.isWorking = false;
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
                    toastr.error('Please enter your first name');
                    return false;
                }

                if (!$scope.registerData.surname) {
                    toastr.error('Please enter your surname');
                    return false;
                }

                if (!$scope.registerData.email) {
                    toastr.error('Please enter your email address');
                    return false;
                }

                if (!$scope.registerData.confirmEmail) {
                    toastr.error('Please retype your email address');
                    return false;
                }

                if ($scope.registerData.email !== $scope.registerData.confirmEmail) {
                    toastr.error('Email addresses do not match');
                    return false;
                }

                if (!$scope.registerData.password) {
                    toastr.error('Please enter your password');
                    return false;
                }

                if ($scope.model.termsAgreed === false) {
                    toastr.error('Please agree to conditions of use');
                    return false;
                }

                $scope.isWorking = true;
                userService.register($scope.registerData)
                    .then(function () {
                        $state.go('registerComplete');

                        // if account confirmation is turned off, 
                        // we can use the code below to automatically sign in.

                        // var params = {
                        //     email: $scope.registerData.email,
                        //     password: $scope.registerData.password
                        // };

                        // userService.login(params)
                        //     .then(function () {
                        //             _.forEach(localStorageService.keys(), function (key) {
                        //                 if (_.includes(key, 'user')) {
                        //                     localStorageService.remove(key);
                        //                 }
                        //             });

                        //             surveyService.clearLocalData().then(function () {
                        //                 surveyService.refreshData()
                        //                     .then(function () {
                        //                             $ionicHistory.clearHistory();

                        //                             var firstLogin = localStorageService.get('FIRST_TIME_LOGIN');
                        //                             if (firstLogin === null || firstLogin === undefined)
                        //                                 localStorageService.set('FIRST_TIME_LOGIN', true);

                        //                             $state.go('projects');
                        //                         },
                        //                         function (err) {
                        //                              console.error(err);
                        //                         });
                        //             });
                        //         },
                        //         function (err) {
                        //             $scope.loginWorking = false;
                        //         });
                    }, function (err) {
                        var errorMessage = $scope.getValidationErrors(err);
                        toastr.error(errorMessage);
                    }).finally(function () {
                        $scope.isWorking = false;
                    })
            };

            $scope.getValidationErrors = function (error) {
                var validationErrors = [];
                if (error.modelState && angular.isObject(error.modelState)) {
                    for (var key in error.modelState) {
                        validationErrors.push(error.modelState[key][0]);
                    }
                } else {
                    validationErrors.push('Could not register.');
                }

                return validationErrors.join("<br/>");
            };

            $scope.openTermsModal = function () {
                $scope.termsModal.show();
            };

            $scope.closeTermsModal = function () {
                $scope.termsModal.hide();
            };

            $scope.activate = function () {
                $ionicModal.fromTemplateUrl('partials/terms.html', {
                    scope: $scope,
                    animation: 'slide-in-up'
                }).then(function (modal) {
                    $scope.termsModal = modal;
                });
            };

            $scope.activate();
        }
    ]);
}());