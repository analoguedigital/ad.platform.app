declare var FingerprintAuth: any;

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
        static $inject: string[] = ['$q', 'storageService', 'authService', 'httpService'];

        constructor(
            private $q: angular.IQService,
            private storageService: IStorageService,
            private authService: IAuthService,
            private httpService: IHttpService) { }

        isAvailable(): ng.IPromise<boolean> {
            let d = this.$q.defer();

            if (window.cordova && FingerprintAuth) {
                FingerprintAuth.isAvailable((result) => {
                    console.log('FingerprintAuth available: ' + JSON.stringify(result));
                    d.resolve(true);
                }, (error) => {
                    console.log('isAvailableError(): ' + error);
                    d.resolve(false);
                });
            } else {
                console.warn('fingerprint is not supported');
                d.resolve(false);
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

            let config: IEncryptConfig = { clientId: 'LightSurveys.App', };
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

            return d.promise;
        }
    }

    angular.module('lm.surveys').service('fingerprintService', FingerprintService);

}