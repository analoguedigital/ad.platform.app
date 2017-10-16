/// <reference path="../../../scripts/typings/angularjs/angular.d.ts" />
/// <reference path="userservice.ts" />

declare var ionic: any;
declare var AppIconChanger: any;

module App.Services {
    "use strict";

    export interface IAlternateIconService {
        isSupported: () => ng.IPromise<boolean>;
        changeIcon: (iconName: string, suppressUserNotification: boolean) => ng.IPromise<void>;
    }

    class AlternateIconService implements IAlternateIconService {
        static $inject: string[] = ['$q', '$ionicModal', '$ionicPlatform', 'storageService', 'authService', 'httpService', 'alertService'];
        constructor(
            private $q: angular.IQService,
            private $ionicModal: ionic.modal.IonicModalService,
            private $ionicPlatform: ionic.platform.IonicPlatformService,
            private storageService: IStorageService,
            private authService: IAuthService,
            private httpService: IHttpService,
            private alertService: App.Services.IAlertService) { }

        isSupported(): ng.IPromise<boolean> {
            let d = this.$q.defer();

            this.$ionicPlatform.ready(() => {
                if (ionic.Platform.isIOS()) {
                    AppIconChanger.isSupported((supported) => {
                        d.resolve(supported);
                    }, (error) => {
                        d.resolve(false);
                    });
                }

                if (ionic.Platform.isAndroid()) {
                    d.resolve(false);
                }
            });

            return d.promise;
        }

        changeIcon(iconName: string, suppressUserNotification: boolean): ng.IPromise<void> {
            let d = this.$q.defer<void>();

            AppIconChanger.changeIcon(
                {
                    iconName: iconName,
                    suppressUserNotification: suppressUserNotification
                },
                () => {
                    d.resolve();
                },
                (err) => {
                    d.reject(err);
                }
            );

            return d.promise;
        }
    }

    angular.module('lm.surveys').service('alternateIconService', AlternateIconService);

}