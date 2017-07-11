/// <reference path="../../../scripts/typings/angularjs/angular.d.ts" />
/// <reference path="userservice.ts" />

module App.Services {
    "use strict";

    export interface IPasscodeModalService {
        showDialog: (loginMode: boolean) => void;
        hideDialog: () => void;
        reset: () => void;
    }

    interface IPasscodeModalScope extends ng.IScope {
        passcode: string;
        firstPasscode: string;
        loginMode: boolean;

        addDigit: (value: number) => void;
        removeDigit: () => void;
    }

    class PasscodeModalService implements IPasscodeModalService {
        modalInstance: any = undefined;
        modalScope: IPasscodeModalScope;

        static $inject: string[] = ['$q', '$rootScope', '$ionicModal', 'storageService', 'authService', 'httpService', 'alertService'];
        constructor(
            private $q: angular.IQService,
            private $rootScope: ng.IRootScopeService,
            private $ionicModal: ionic.modal.IonicModalService,
            private storageService: IStorageService,
            private authService: IAuthService,
            private httpService: IHttpService,
            private alertService: App.Services.IAlertService) { }

        showDialog(loginMode: boolean = false) {
            let self = this;

            if (this.modalInstance) {
                this.modalScope.loginMode = loginMode;
                this.modalScope.passcode = '';
                this.modalScope.firstPasscode = '';
                this.modalInstance.show();
            }
            else {
                this.modalScope = <IPasscodeModalScope>this.$rootScope.$new(true);
                this.modalScope.passcode = '';
                this.modalScope.firstPasscode = '';
                this.modalScope.loginMode = loginMode;

                this.modalScope.addDigit = (value: number) => {
                    if (self.modalScope.passcode.length < 4) {
                        self.modalScope.passcode = self.modalScope.passcode + value;

                        if (self.modalScope.passcode.length == 4) {
                            if (self.modalScope.loginMode)
                                self.$rootScope.$broadcast('passcode-modal-pin-entered', self.modalScope.passcode);
                            else {
                                if (self.modalScope.firstPasscode.length == 0) {
                                    self.alertService.show('please confirm your passcode');
                                    self.modalScope.firstPasscode = self.modalScope.passcode;
                                    self.reset();
                                } else {
                                    if (self.modalScope.firstPasscode !== self.modalScope.passcode) {
                                        self.alertService.show('Passcodes did not match! try again');
                                        self.reset();
                                        self.modalScope.firstPasscode = '';
                                    } else {
                                        // passcode confirmed
                                        self.$rootScope.$broadcast('passcode-modal-pin-confirmed', self.modalScope.passcode);
                                    }
                                }
                            }
                        }
                    }
                }

                this.modalScope.removeDigit = () => {
                    if (self.modalScope.passcode.length > 0) {
                        self.modalScope.passcode = self.modalScope.passcode.substring(0, self.modalScope.passcode.length - 1);
                    }
                }

                this.modalScope.forgotPasscode = function () {
                    self.$rootScope.$broadcast('passcode-modal-forgot-pin');
                }

                this.modalScope.closeModal = function () {
                    self.$rootScope.$broadcast('passcode-modal-closed', self.modalScope.passcode);
                }

                this.modalScope.$on('$destroy', function () {
                    if (self.modalInstance)
                        self.modalInstance.remove();
                });

                this.$ionicModal.fromTemplateUrl('partials/passcode-modal.html', {
                    scope: this.modalScope,
                    animation: 'slide-in-up',
                    backdropClickToClose: false,
                    hardwareBackButtonClose: false
                }).then(function (modal) {
                    self.modalInstance = modal;
                    self.modalInstance.show();
                });
            }
        }

        hideDialog() {
            if (this.modalInstance)
                this.modalInstance.hide();
        }

        reset() {
            this.modalScope.passcode = '';
        }
    }

    angular.module('lm.surveys').service('passcodeModalService', PasscodeModalService);

}