/// <reference path="../../../scripts/typings/angularjs/angular.d.ts" />
/// <reference path="authservice.ts" />

module App.Services {
    "use strict";

    export interface IAuthInterceptorService {
        request: (config: ng.IRequestConfig) => ng.IRequestConfig;
        responseError: (rejection: ng.IHttpPromiseCallbackArg<any>) => ng.IPromise<ng.IHttpPromiseCallbackArg<any>>;
    }

    class AuthInterceptorService implements IAuthInterceptorService {
        static $inject: string[] = ['$q', '$location', 'authService'];

        constructor(
            private $q: ng.IQService,
            private $location: ng.ILocationService,
            private authService: IAuthService) { }

        request: (config: ng.IRequestConfig) => ng.IRequestConfig = (config) => {
            var q = this.$q.defer();

            config.headers = config.headers || {};
            config.headers.timezoneOffset = new Date().getTimezoneOffset();

            var authData = this.authService.getExistingAuthData();
            if (authData && !_.endsWith(config.url, 'token')) {
                config.headers.Authorization = 'Bearer ' + authData.token;
            }

            return config;
        }

        responseError: (rejection: ng.IHttpPromiseCallbackArg<any>) => ng.IPromise<ng.IHttpPromiseCallbackArg<any>> = (rejection) => {
            if (rejection.status === 401) {
                this.$location.path('/login').search('rejected', 'true');
            }
            return this.$q.reject(rejection);
        }
    }

    angular.module('lm.surveys').service('authInterceptorService', AuthInterceptorService);
}