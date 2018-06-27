'use strict';
angular.module('lm.surveys').controller('organizationsController', ['$scope', '$rootScope', 'userService', 'moment', 'httpService', 'toastr', 'ngProgress', '$ionicModal', 'feedbackService',
    function ($scope, $rootScope, userService, moment, httpService, toastr, ngProgress, $ionicModal, feedbackService) {
        $scope.organizationsDialog = {};
        $scope.orgRequestModal = {};

        $scope.organizations = [];
        $scope.selectedOrganization = {};
        $scope.requestSent = false;
        $scope.feedbackSent = false;
        $scope.requestWorking = false;
        $scope.orgRequestWorking = false;

        $scope.model = {
            orgName: ''
        };

        $scope.orgRequestModel = {
            name: '',
            address: '',
            contactName: '',
            email: '',
            telNumber: '',
            postcode: ''
        };

        $scope.openOrganizationsDialog = function () {
            $scope.organizationsDialog.show();
        }

        $scope.closeOrganizationsDialog = function () {
            $scope.organizationsDialog.hide();
        }

        $scope.openOrgRequestDialog = function () {
            $scope.orgRequestModel = {
                name: '',
                address: '',
                contactName: '',
                email: '',
                telNumber: '',
                postcode: ''
            };

            $scope.orgRequestModal.show();
        }

        $scope.closeOrgRequestDialog = function () {
            $scope.orgRequestModal.hide();
        }

        $scope.selectOrganization = function (organization) {
            $scope.selectedOrganization = organization;
            $scope.openOrganizationsDialog();
        }

        $scope.requestToJoin = function () {
            var orgId = $scope.selectedOrganization.id;

            ngProgress.start();
            httpService.requestOrgConnection(orgId)
                .then(function (res) {
                    $scope.requestSent = true;
                    toastr.success('Connection request sent');
                    $scope.closeOrganizationsDialog();
                }, function (err) {
                    if (err.message)
                        toastr.error(err.message);
                })
                .finally(function () {
                    ngProgress.complete();
                });
        }

        $scope.sendOrgRequest = function () {
            if ($scope.orgRequestModel.name.length < 1) {
                toastr.warning('Organization name is required');
                return false;
            }

            httpService.requestOrganization($scope.orgRequestModel)
                .then(function (res) {
                    toastr.success('Organization request sent. Thanks!');

                    $scope.feedbackSent = true;
                    $scope.closeOrgRequestDialog();
                }, function (err) {
                    console.error(err);
                    if (err.message)
                        toastr.error(err.message);
                });
        }

        $scope.activate = function () {
            $ionicModal.fromTemplateUrl('partials/organizations-modal.html', {
                scope: $scope,
                animation: 'slide-in-up'
            }).then(function (modal) {
                $scope.organizationsDialog = modal;
            });

            $ionicModal.fromTemplateUrl('partials/organization-request.html', {
                scope: $scope,
                animation: 'slide-in-up'
            }).then(function (modal) {
                $scope.orgRequestModal = modal;
            });

            ngProgress.start();
            httpService.getOrganizations().then(function (data) {
                $scope.organizations = data;
            }).finally(function () {
                ngProgress.complete();
            });
        }

        $scope.activate();
    }
]);