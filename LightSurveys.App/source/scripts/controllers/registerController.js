(function () {
    'use strict';
    angular.module('lm.surveys').controller('registerController', ['$scope', '$state', '$ionicModal', 'userService', 'alertService', 'ngProgress', 'toastr', '$ionicLoading',
        function ($scope, $state, $ionicModal, userService, alertService, ngProgress, toastr, $ionicLoading) {
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
                    // alertService.show("Please enter your name");
                    toastr.error('Please enter your first name');
                    return false;
                }

                if (!$scope.registerData.surname) {
                    // alertService.show("Please enter your surname");
                    toastr.error('Please enter your surname');
                    return false;
                }

                if (!$scope.registerData.email) {
                    // alertService.show("Please enter your email");
                    toastr.error('Please enter your email address');
                    return false;
                }

                if (!$scope.registerData.confirmEmail) {
                    // alertService.show("Please confirm your email");
                    toastr.error('Please retype your email address');
                    return false;
                }

                if ($scope.registerData.email !== $scope.registerData.confirmEmail) {
                    // alertService.show("Emails do not match! Try again.");
                    toastr.error('Email addresses do not match');
                    return false;
                }

                if (!$scope.registerData.password) {
                    // alertService.show("Please enter your password");
                    toastr.error('Please enter your password');
                    return false;
                }

                if ($scope.model.termsAgreed === false) {
                    // alertService.show("Please agree to usage terms");
                    toastr.error('Please agree to usage terms and conditions');
                    return false;
                }

                ngProgress.start();
                $ionicLoading.show({
                    template: '<i class="fa fa-circle-o-notch fa-spin fa-fw"></i> Creating account...'
                });

                userService.register($scope.registerData)
                    .then(function () {
                        $state.go('registerComplete');

                        // if account confirmation is turned off, 
                        // we can use the code below to automatically sign in.
                        
                        // var params = {
                        //     email: $scope.registerData.email,
                        //     password: $scope.registerData.password
                        // };
                        // ngProgress.start();

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
                        //                             ngProgress.complete();
                        //                             $ionicHistory.clearHistory();

                        //                             var firstLogin = localStorageService.get('FIRST_TIME_LOGIN');
                        //                             if (firstLogin === null || firstLogin === undefined)
                        //                                 localStorageService.set('FIRST_TIME_LOGIN', true);

                        //                             $state.go('projects');
                        //                         },
                        //                         function (err) {
                        //                             ngProgress.complete();
                        //                             alertService.show(err);
                        //                         });
                        //             });
                        //         },
                        //         function (err) {
                        //             ngProgress.complete();
                        //             $scope.loginWorking = false;
                        //             alertService.show(err);
                        //         });
                    }, function (err) {
                        // alertService.show($scope.getValidationErrors(err));
                        var errorMessage = $scope.getValidationErrors(err);
                        toastr.error(errorMessage);
                    }).finally(function () {
                        ngProgress.complete();
                        $ionicLoading.hide();
                    });
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