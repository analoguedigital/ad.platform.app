(function () {
    'use strict';
    angular.module('lm.surveys').controller('organizationsController', ['$scope', 'httpService', 'toastr', 'ngProgress', '$ionicModal', '$ionicLoading', 'localStorageService',
        function ($scope, httpService, toastr, ngProgress, $ionicModal, $ionicLoading, localStorageService) {
            $scope.organizationsDialog = {};
            $scope.orgRequestModal = {};

            $scope.organizations = [];
            $scope.selectedOrganization = {};
            $scope.requestSent = false;
            $scope.feedbackSent = false;
            $scope.requestWorking = false;
            $scope.orgRequestWorking = false;

            $scope.model = {
                orgName: '',
                searchTerm: ''
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
            };

            $scope.closeOrganizationsDialog = function () {
                $scope.organizationsDialog.hide();
            };

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
            };

            $scope.closeOrgRequestDialog = function () {
                $scope.orgRequestModal.hide();
            };

            $scope.selectOrganization = function (organization) {
                $scope.selectedOrganization = organization;
                $scope.openOrganizationsDialog();
            };

            $scope.requestToJoin = function () {
                var orgId = $scope.selectedOrganization.id;

                ngProgress.start();
                $ionicLoading.show({
                    template: '<i class="fa fa-circle-o-notch fa-spin fa-fw"></i> Sending request...'
                });

                httpService.requestOrgConnection(orgId)
                    .then(function (res) {
                        $scope.requestSent = true;
                        toastr.success('Connection request sent successfully');
                        $scope.closeOrganizationsDialog();
                    }, function (err) {
                        console.error('could not send organization connection', err);

                        if (err.message)
                            toastr.error(err.message);
                    }).finally(function () {
                        ngProgress.complete();
                        $ionicLoading.hide();
                    });
            };

            $scope.sendOrgRequest = function () {
                if ($scope.orgRequestModel.name.length < 1) {
                    toastr.warning('Organization name is required');
                    return false;
                }

                if ($scope.orgRequestModel.address.length < 1) {
                    toastr.warning('Address is required');
                    return false;
                }

                if ($scope.orgRequestModel.contactName.length < 1) {
                    toastr.warning('Contact name is required');
                    return false;
                }

                if ($scope.orgRequestModel.email.length < 1) {
                    toastr.warning('Email address is required');
                    return false;
                }

                $ionicLoading.show({
                    template: '<i class="fa fa-circle-o-notch fa-spin fa-fw"></i> Sending request...'
                });

                httpService.requestOrganization($scope.orgRequestModel)
                    .then(function (res) {
                        $scope.feedbackSent = true;
                        $scope.closeOrgRequestDialog();
                        toastr.success('Organization request sent. Thanks!');
                    }, function (err) {
                        console.error('could not send organization request',
                         err);
                        if (err.message)
                            toastr.error(err.message);
                    }).finally(function () {
                        $ionicLoading.hide();
                    });
            };

            $scope.doRefresh = function () {
                ngProgress.start();
                $ionicLoading.show({
                    template: '<i class="fa fa-circle-o-notch fa-spin fa-fw"></i> Refreshing data...'
                });

                httpService.getOrganizations().then(function (data) {
                    $scope.organizations = data;

                    _.forEach(data, function (item) {
                        localStorageService.set('organization/' + item.id, item);
                    });
                }).finally(function () {
                    ngProgress.complete();
                    $ionicLoading.hide();
                    $scope.$broadcast('scroll.refreshComplete');
                });
            };

            $scope.fetchOrganizations = function () {
                ngProgress.start();
                $ionicLoading.show({
                    template: '<i class="fa fa-circle-o-notch fa-spin fa-fw"></i> Loading organizations...'
                });

                httpService.getOrganizations().then(function (data) {
                    $scope.organizations = data;

                    _.forEach(data, function (item) {
                        localStorageService.set('organization/' + item.id, item);
                    });

                    console.log('data fetched from server');
                }).finally(function () {
                    ngProgress.complete();
                    $ionicLoading.hide();
                });
            }

            $scope.loadOrganizations = function () {
                var lsKeys = localStorageService.keys();
                var organizationKeys = _.filter(lsKeys, function (key) {
                    return _.startsWith(key, 'organization/');
                });

                var _organizations = [];
                _.forEach(organizationKeys, function (orgKey) {
                    var org = localStorageService.get(orgKey);
                    _organizations.push(org);
                });

                if (_organizations.length) {
                    $scope.organizations = _organizations;
                    console.log('data loaded from localStorage');
                } else {
                    $scope.fetchOrganizations();
                }
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

                $scope.loadOrganizations();
            };

            $scope.activate();
        }
    ]);
}());