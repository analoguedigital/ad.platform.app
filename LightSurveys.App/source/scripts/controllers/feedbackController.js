'use strict';
angular.module('lm.surveys').controller('feedbackController', ['$scope', 'alertService', 'userService', 'ngProgress', 'feedbackService',
    function ($scope, alertService, userService, ngProgress, feedbackService) {
        $scope.feedbackSent = false;

        $scope.model = {
            comment: ''
        };

        $scope.sendFeedback = function () {
            var feedback = {
                addedById: userService.currentProfile.userInfo.userId,
                organisationId: userService.currentProfile.userInfo.organisationId,
                comment: $scope.model.comment
            };

            ngProgress.start();
            feedbackService.sendFeedback(feedback)
                .then(function (result) {
                    alertService.show('Feedback sent! Thank you.');
                    $scope.model.comment = '';
                    $scope.feedbackSent = true;
                }, function (error) {
                    console.error(error);
                }).finally(function () {
                    ngProgress.complete();
                });
        }
    }]);