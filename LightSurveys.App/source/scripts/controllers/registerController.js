'use strict';
angular.module('lm.surveys').controller('registerController', ['$scope', '$state', '$ionicHistory', 'userService', 'alertService', 'ngProgress', 'surveyService',
function ($scope, $state, $ionicHistory, userService, alertService, ngProgress, surveyService) {


    $scope.registerData = {
        firstName: "",
        surname: "",
        email: "",
        password: "",
        birthdate: null,
        gender: "",
        address: "",
        organisationName: "Docit"
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
        }
        else if (!$scope.registerData.birthdate) {
            alertService.show("Please enter your birthdate");
        }
        else if (!$scope.registerData.address) {
            alertService.show("Please enter your address");
        }
        else {
            ngProgress.start();

            userService.register($scope.registerData)
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
            validationErrors.push('Could not register.');
        };

        return validationErrors.join("<br/>");
    }

}]);