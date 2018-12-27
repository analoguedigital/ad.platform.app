(function () {
    'use strict';
    angular.module('lm.surveys').controller('addSubscriptionController', ['$scope', '$rootScope', '$state', '$timeout', '$ionicModal', 'toastr',
        '$ionicPopup', 'alertService', 'userService', 'ngProgress', 'httpService',
        function ($scope, $rootScope, $state, $timeout, $ionicModal, toastr,
            $ionicPopup, alertService, userService, ngProgress, httpService) {

            $scope.profile = {};
            $scope.userInfo = {};

            $scope.subscriptionPlans = [];
            $scope.selectedPackage = undefined;

            $scope.invitationModal = {};
            $scope.checkoutModal = {};

            $scope.joinOrgModel = {
                invitationToken: ''
            };

            $scope.joinOrgWorking = false;

            $scope.openInvitationModal = function () {
                $scope.invitationModal.show();
            };

            $scope.closeInvitationModal = function () {
                $scope.invitationModal.hide();
            };

            $scope.openCheckoutModal = function () {
                $scope.checkoutModal.show();
            };

            $scope.closeCheckoutModal = function () {
                $scope.checkoutModal.hide();
            };

            $scope.buy = function (subscriptionPlan) {
                $scope.selectedPackage = subscriptionPlan;
                $scope.openCheckoutModal();
            };

            $scope.checkoutSubscription = function (subscriptionPlan) {
                httpService.buySubscription(subscriptionPlan.id)
                    .then(function (res) {
                        toastr.success('Subscription purchased successfully');
                        $scope.closeCheckoutModal();
                        $scope.refreshUserInfo();
                    }, function (err) {
                        console.error(err);

                        if (err.exceptionMessage)
                            toastr.error(err.exceptionMessage);

                        if (err.message)
                            toastr.error(err.message);
                    })
                    .finally(function () {
                        ngProgress.complete();
                    });
            };

            $scope.refreshUserInfo = function () {
                ngProgress.start();
                httpService.getUserInfo()
                    .then(function (data) {
                        $scope.userInfo = data;
                        $scope.profile.userInfo = data;

                        userService.saveProfile($scope.profile)
                            .then(function () {
                                $state.go('subscriptions');
                            });
                    }, function (err) {
                        console.error(err);
                    })
                    .finally(function () {
                        ngProgress.complete();
                    });
            };

            $scope.joinOrganization = function () {
                var token = $scope.joinOrgModel.invitationToken;
                if (token.length == 0) {
                    toastr.warning('Enter your invitation token first');
                    return false;
                }

                ngProgress.start();
                $scope.joinOrgWorking = true;
                httpService.joinOrganization(token)
                    .then(function (res) {
                        toastr.success('You have joined the organization');
                        $scope.closeInvitationModal();
                        $scope.refreshUserInfo();
                    }, function (err) {
                        console.error(err);

                        if (err.message)
                            toastr.error(err.message);

                        if (err.exceptionMessage)
                            toastr.error(err.exceptionMessage);

                        var statusCode = err.substring(0, 3);
                        if (statusCode == '404')
                            toastr.error('Invalid token. Try again.');
                    })
                    .finally(function () {
                        ngProgress.complete();
                        $scope.joinOrgWorking = false;
                    });
            };

            $scope.activate = function () {
                $ionicModal.fromTemplateUrl('partials/join-organization.html', {
                    scope: $scope,
                    animation: 'slide-in-up'
                }).then(function (modal) {
                    $scope.invitationModal = modal;
                });

                $ionicModal.fromTemplateUrl('partials/checkout-subscription.html', {
                    scope: $scope,
                    animation: 'slide-in-up'
                }).then(function (modal) {
                    $scope.checkoutModal = modal;
                });

                userService.getExistingProfiles().then(function (profiles) {
                    if (profiles.length) {
                        var profile = profiles[0];
                        $scope.profile = profile;
                        $scope.userInfo = profile.userInfo;
                    }
                });

                httpService.getSubscriptionPlans().then(function (data) {
                    $scope.subscriptionPlans = data;
                }, function (err) {
                    console.error(err);
                });
            };

            $scope.activate();

        }
    ]);
}());