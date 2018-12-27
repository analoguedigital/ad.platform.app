(function () {
    'use strict';
    angular.module('lm.surveys').controller('feedbackController', ['$scope', 'alertService', 'userService', 'ngProgress', 'feedbackService', '$ionicLoading', 'toastr', 
        function ($scope, alertService, userService, ngProgress, feedbackService, $ionicLoading, toastr) {
            $scope.feedbackSent = false;
            $scope.feedbackWorking = false;

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
                $scope.feedbackWorking = true;

                $ionicLoading.show({
                    template: '<i class="fa fa-circle-o-notch fa-spin fa-fw"></i> Sending feedback...'
                });

                feedbackService.sendFeedback(feedback)
                    .then(function (result) {
                        // alertService.show('Feedback sent. Thank you!');
                        toastr.success('Feedback sent. Thank you!');

                        $scope.model.comment = '';
                        $scope.feedbackSent = true;
                    }, function (error) {
                        console.error('could not send feedback', error);
                    }).finally(function () {
                        ngProgress.complete();
                        $scope.feedbackWorking = false;
                        $ionicLoading.hide();
                    });
            };
        }
    ]);
}());