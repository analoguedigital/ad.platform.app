(function () {
    'use strict';
    angular.module('lm.surveys').controller('organizationsController', ['$scope', '$rootScope', 'httpService', 'toastr', '$ionicModal',
        '$ionicLoading', 'localStorageService', 'userService', '$ionicPopup',
        function ($scope, $rootScope, httpService, toastr, $ionicModal, $ionicLoading, localStorageService, userService, $ionicPopup) {
            $scope.userProfile = undefined;

            $scope.organizationsDialog = {};
            $scope.orgRequestModal = {};

            $scope.organizations = [];
            $scope.selectedOrganization = {};
            $scope.requestSent = false;
            $scope.feedbackSent = false;
            $scope.requestWorking = false;
            $scope.orgRequestWorking = false;

            $scope.belongsToOnRecord = false;
            $scope.hasUnlinked = false;

            $scope.model = {
                orgName: '',
                searchTerm: '',
                termsAgreed: false
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
                if (organization.linkedinUrl !== null && organization.linkedinUrl.length)
                    organization.linkedinUrl = _.replace(organization.linkedinUrl, 'https://www.linkedin.com', '');

                if (organization.youTubeUrl !== null && organization.youTubeUrl.length)
                    organization.youTubeUrl = _.replace(organization.youTubeUrl, 'https://www.youtube.com', '');

                $scope.selectedOrganization = organization;
                $scope.openOrganizationsDialog();
            };

            $scope.requestToJoin = function () {
                if ($scope.selectedOrganization.requiresAgreement && !$scope.model.termsAgreed) {
                    toastr.error('Please confirm organization terms first');
                    return false;
                }

                $ionicLoading.show({
                    template: '<i class="fa fa-circle-o-notch fa-spin fa-fw"></i> Sending request...'
                });

                var orgId = $scope.selectedOrganization.id;
                httpService.requestOrgConnection(orgId)
                    .then(function (res) {
                        $scope.requestSent = true;
                        toastr.success('Connection request sent successfully');
                        $scope.closeOrganizationsDialog();
                    }, function (err) {
                        console.error(err);
                        if (err.message)
                            toastr.error(err.message);
                    }).finally(function () {
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
                $ionicLoading.show({
                    template: '<i class="fa fa-circle-o-notch fa-spin fa-fw"></i> Refreshing data...'
                });

                httpService.getOrganizations().then(function (data) {
                    $scope.organizations = data;

                    _.forEach(data, function (item) {
                        localStorageService.set('organization/' + item.id, item);
                    });
                }).finally(function () {
                    $ionicLoading.hide();
                    $scope.$broadcast('scroll.refreshComplete');
                });
            };

            $scope.fetchOrganizations = function () {
                $ionicLoading.show({
                    template: '<i class="fa fa-circle-o-notch fa-spin fa-fw"></i> Loading organizations...'
                });

                httpService.getOrganizations().then(function (data) {
                    $scope.organizations = data;

                    _.forEach(data, function (item) {
                        localStorageService.set('organization/' + item.id, item);
                    });
                }).finally(function () {
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
                } else {
                    $scope.fetchOrganizations();
                }
            }

            $scope.refreshUserProfile = function () {
                httpService.getUserInfo()
                    .then(function (data) {
                        $scope.userProfile.userInfo = data;

                        $rootScope.$broadcast('update-menu-profile', {
                            profile: data.profile,
                            notifications: data.notifications
                        });

                        userService.saveProfile($scope.userProfile).then(function (res) {
                            // profile data updated
                        });
                    }, function (err) {
                        console.error(err);
                    })
                    .finally(function () {
                        $scope.$broadcast('scroll.refreshComplete');
                        $ionicLoading.hide();
                    });
            }

            $scope.unlinkFromOrganization = function () {
                var confirmPopup = $ionicPopup.confirm({
                    title: 'Unlink from organization',
                    template: 'Are you sure you want to unlink from this organization?',
                    buttons: [{
                        text: 'Proceed',
                        type: 'button-assertive',
                        onTap: function (e) {
                            return true;
                        }
                    },
                    {
                        text: 'Cancel',
                        type: 'button-stable'
                    }
                    ]
                });

                confirmPopup.then(function (res) {
                    if (res) {
                        var userId = userService.current.userId;
                        var orgId = userService.current.project.organisation.id;

                        $ionicLoading.show({
                            template: '<i class="fa fa-circle-o-notch fa-spin fa-fw"></i> Processing...'
                        });

                        httpService.unlinkFromOrganization(orgId, userId).then(function (data) {
                            $scope.hasUnlinked = true;
                            $scope.refreshUserProfile();
                        }).catch(function (err) {
                            if (err.message && err.message.length)
                                toastr.error(err.message);
                        }).finally(function () {
                            $ionicLoading.hide();
                        });
                    }
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

                userService.getExistingProfiles().then(function (profiles) {
                    var userProfile = profiles[0];
                    var activeSubscription = userProfile.userInfo.profile.lastSubscription;

                    $scope.userProfile = userProfile;
                    $scope.activeSubscription = activeSubscription;

                    if (activeSubscription.organisation && activeSubscription.organisation.name === 'OnRecord')
                        $scope.belongsToOnRecord = true;
                });

                $scope.loadOrganizations();
            };

            $scope.activate();
        }
    ]);
}());