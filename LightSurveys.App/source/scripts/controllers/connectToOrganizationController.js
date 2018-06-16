'use strict';
angular.module('lm.surveys').controller('connectToOrganizationController', ['$scope', '$rootScope', '$state', '$timeout', '$ionicModal', 'toastr',
    '$ionicPopup', 'alertService', 'userService', 'surveyService', 'passcodeModalService', 'md5', 'fingerprintService',
    'alternateIconService', 'ngProgress', 'httpService',
    function ($scope, $rootScope, $state, $timeout, $ionicModal, toastr,
        $ionicPopup, alertService, userService, surveyService, passcodeModalService, md5,
        fingerprintService, alternateIconService, ngProgress, httpService) {

        $scope.profile = undefined;
        $scope.userInfo = undefined;
        $scope.activeSubscription = undefined;
        $scope.monthlyQuota = undefined;
        
        $scope.invitationModal = {};
        $scope.joinOrgWorking = false;

        $scope.joinOrgModel = {
            invitationToken: ''
        };

        $scope.activate = function () {
            $ionicModal.fromTemplateUrl('partials/join-organization.html', {
                scope: $scope,
                animation: 'slide-in-up'
            }).then(function (modal) {
                $scope.invitationModal = modal;
            });

            userService.getExistingProfiles().then(function (profiles) {
                $scope.profile = profiles[0];
                $scope.userInfo = $scope.profile.userInfo;

                $scope.activeSubscription = $scope.userInfo.profile.lastSubscription;
                $scope.monthlyQuota = $scope.userInfo.profile.monthlyQuota;

                $scope.refreshUserInfo();
            });
        };

        $scope.refreshUserInfo = function () {
            httpService.getUserInfo()
                .then(function (data) {
                    $scope.userInfo = data;
                    $scope.profile.userInfo = data;
                    $scope.activeSubscription = data.profile.lastSubscription;
                    $scope.monthlyQuota = data.profile.monthlyQuota;

                    userService.saveProfile($scope.profile)
                        .then(function () {
                            // local profile data updated.
                            // $rootScope.$broadcast('refresh-sidemenu-subscription');
                        });
                }, function (err) {
                    console.error(err);
                })
                .finally(function () {
                    $scope.$broadcast('scroll.refreshComplete');
                });
        }

        $scope.openInvitationModal = function () {
            $scope.invitationModal.show();
        }

        $scope.closeInvitationModal = function () {
            $scope.invitationModal.hide();
        }

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
        }

        $scope.activate();

    }]);