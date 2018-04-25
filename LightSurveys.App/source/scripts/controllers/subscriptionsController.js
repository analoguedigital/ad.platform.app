﻿'use strict';
angular.module('lm.surveys').controller('subscriptionsController', ['$scope', '$rootScope', '$state', '$timeout', '$ionicModal', 'toastr',
    '$ionicPopup', 'alertService', 'userService', 'surveyService', 'passcodeModalService', 'md5', 'fingerprintService',
    'alternateIconService', 'ngProgress', 'httpService',
    function ($scope, $rootScope, $state, $timeout, $ionicModal, toastr,
        $ionicPopup, alertService, userService, surveyService, passcodeModalService, md5,
        fingerprintService, alternateIconService, ngProgress, httpService) {

        $scope.profile = undefined;
        $scope.userInfo = undefined;
        $scope.activeSubscription = undefined;

        $scope.model = {
            voucherCode: ''
        };

        $scope.voucherModal = {};
        $scope.voucherWorking = false;

        $scope.activate = function () {
            userService.getExistingProfiles().then(function (profiles) {
                if (profiles.length) {
                    var profile = profiles[0];
                    $scope.profile = profile;
                    $scope.userInfo = profile.userInfo;
                    $scope.activeSubscription = profile.userInfo.profile.lastSubscription;
                }

                $scope.refreshUserInfo();
            });

            $ionicModal.fromTemplateUrl('partials/redeem-voucher.html', {
                scope: $scope,
                animation: 'slide-in-up'
            }).then(function (modal) {
                $scope.voucherModal = modal;
            });
        };

        $scope.openVoucherModal = function () {
            $scope.voucherModal.show();
        }

        $scope.closeVoucherModal = function () {
            $scope.voucherModal.hide();
        }

        $scope.redeemVoucher = function () {
            var code = $scope.model.voucherCode;
            if (code.length == 0) {
                toastr.warning('Please enter your voucher code');
                return false;
            }

            ngProgress.start();
            $scope.voucherWorking = true;
            httpService.redeemVoucher(code)
                .then(function (res) {
                    toastr.success('Voucher redeemed successfully');
                    $scope.closeVoucherModal();
                    $scope.refreshUserInfo();
                }, function (err) {
                    console.error(err);

                    var statusCode = err.substring(0, 3);
                    if (statusCode === '404')
                        toastr.error('Voucher code is not valid');

                    if (err.exceptionMessage)
                        toastr.error(err.exceptionMessage);

                    if (err.message)
                        toastr.error(err.message);
                })
                .finally(function () {
                    $scope.voucherWorking = false;
                    ngProgress.complete();
                });
        }

        $scope.refreshUserInfo = function () {
            httpService.getUserInfo()
                .then(function (data) {
                    $scope.userInfo = data;
                    $scope.profile.userInfo = data;
                    $scope.activeSubscription = data.profile.lastSubscription;

                    userService.saveProfile($scope.profile)
                        .then(function () {
                            // local profile data updated.
                        });
                }, function (err) {
                    console.error(err);
                })
                .finally(function () {
                    $scope.$broadcast('scroll.refreshComplete');
                });
        }

        $scope.activate();

    }]);