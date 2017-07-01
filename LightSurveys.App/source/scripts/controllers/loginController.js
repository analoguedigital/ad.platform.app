'use strict';
angular.module('lm.surveys').controller('loginController', ['$scope', '$ionicHistory', '$state', '$stateParams', 'userService', 'alertService', 'ngProgress', 'surveyService',
    function ($scope, $ionicHistory, $state, $stateParams, userService, alertService, ngProgress, surveyService) {

        var rejected = $stateParams.rejected === 'true';

        if (rejected) {
            userService.logOut();
            alertService.show("login timeout expired! Please login again.")
        }

        $scope.loginData = {
            //email: "manager@test.t",
            //password: "Test1234"
            email: "",
            password: ""
        };

        $scope.isQuickLoginActive = false;
        $scope.isQuickLoginAvailable = false;


        userService.getExistingProfiles()
            .then(function (profiles) {
                $scope.existingProfiles = profiles;
                if (profiles.length > 0) {
                    $scope.isQuickLoginActive = true;
                    $scope.isQuickLoginAvailable = true;
                }
            });


        $scope.login = function () {
            if (!$scope.loginData.email) {
                alertService.show("Please enter your email");
            }
            else if (!$scope.loginData.password) {
                alertService.show("Please enter your password");
            }
            else {
                ngProgress.start();

                userService.login($scope.loginData)
                    .then(function () {
                        surveyService.refreshData()
                            .then(function () {
                                ngProgress.complete();
                                $ionicHistory.clearHistory();
                                $state.go('projects');
                            },
                            function (err) {
                                ngProgress.complete();
                                alertService.show(err);
                            });

                    },
                    function (err) {
                        ngProgress.complete();
                        alertService.show(err);
                    });
            }
        };

        $scope.activateProfile = function (profile) {
            ngProgress.start();

            userService.activateProfile(profile);
            $ionicHistory.clearHistory();
            $state.go('home');
            ngProgress.complete();
        };


        $scope.goRegister = function () {
            ngProgress.start();
            $state.go('register');
            ngProgress.complete();
        }

        $scope.loginWithDifferentAccount = function () {
            $scope.isQuickLoginActive = false;
        }

        $scope.loginWithExistingAccounts = function () {
            $scope.isQuickLoginActive = true;
        }

    }]);