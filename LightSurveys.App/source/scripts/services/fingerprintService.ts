declare var FingerprintAuth: any;
declare var ionic: any;

module App.Services {
    "use strict";

    interface IEncryptConfig {
        clientId: string,
        username?: string,
        password?: string,
        token?: string,
        disableBackup?: boolean,
        maxAttempts?: number,
        locale?: string,
        userAuthRequired?: boolean,
        dialogTitle?: string,
        dialogMessage?: string,
        dialogHint?: string
    }

    interface IVerifyFingerprintResult {
        success: boolean;
        message: string;
        result: any;
    }

    export interface IFingerprintService {
        isAvailable: () => ng.IPromise<boolean>;
        verify: () => ng.IPromise<IVerifyFingerprintResult>;
    }

    class FingerprintService implements IFingerprintService {
        static $inject: string[] = ['$q', 'storageService', 'authService', 'httpService', '$cordovaTouchID'];

        constructor(
            private $q: angular.IQService,
            private storageService: IStorageService,
            private authService: IAuthService,
            private httpService: IHttpService,
            private $cordovaTouchID: any) { }

        isAvailable(): ng.IPromise<boolean> {
            let d = this.$q.defer();

            if (ionic.Platform.isIOS()) {
                this.$cordovaTouchID.checkSupport().then(function () {
                    console.log('apple touch-id is available');
                    d.resolve(true);
                }, function (error) {
                    console.warn('apple touch-id is not supported');
                    d.resolve(false);
                });
            }

            if (ionic.Platform.isAndroid()) {
                if (window.cordova && FingerprintAuth) {
                    FingerprintAuth.isAvailable((result) => {
                        console.log('FingerprintAuth available: ' + JSON.stringify(result));
                        d.resolve(result.isAvailable);
                    }, (error) => {
                        console.log('isAvailableError(): ' + error);
                        d.resolve(false);
                    });
                } else {
                    console.warn('fingerprint is not supported');
                    d.resolve(false);
                }
            }

            return d.promise;
        }

        verify(): ng.IPromise<IVerifyFingerprintResult> {
            let d = this.$q.defer();

            let response: IVerifyFingerprintResult = {
                success: false,
                message: '',
                result: {}
            };

            if (ionic.Platform.isIOS()) {
                this.$cordovaTouchID.authenticate("You must authenticate").then(function (result) {
                    response.success = true;
                    response.message = 'Touch ID authentication successful';
                    response.result = result;

                    d.resolve(response);
                }, function (error) {
                    response.message = JSON.stringify(error);
                    d.resolve(response);
                });
            }

            if (ionic.Platform.isAndroid()) {
                console.log('platform: android');
                let config: IEncryptConfig = {
                    clientId: 'LightSurveys.App',
                    disableBackup: true
                };

                FingerprintAuth.encrypt(config, (result) => {
                    response.success = true;
                    response.result = result;

                    if (result.withFingerprint)
                        response.message = 'Successfully encrypted credentials.';
                    else if (result.withBackup)
                        response.message = 'Authenticated with backup password.';

                    d.resolve(response);
                }, (error) => {
                    if (error === FingerprintAuth.ERRORS.FINGERPRINT_CANCELLED)
                        response.message = 'FingerprintAuth Dialog Cancelled!';
                    else
                        response.message = 'FingerprintAuth Error: ' + error;

                    d.resolve(response);
                });
            }

            return d.promise;
        }
    }

    angular.module('lm.surveys').service('fingerprintService', FingerprintService);

}