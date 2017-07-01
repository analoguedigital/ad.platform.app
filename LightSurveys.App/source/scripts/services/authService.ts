/// <reference path="../../../scripts/typings/angularjs/angular.d.ts" />
/// <reference path="../../../scripts/typings/angular-local-storage/angular-local-storage.d.ts" />

module App.Services {
    "use strict";

    class AuthContext {
        public isAuth: boolean;
        public email: string;
    }

    export class AuthData {
        constructor(
            public token: string,
            public email: string) { }
    }

    export interface IAuthService {
        authentication: AuthContext;

        loginUser(authenticationData: AuthData): void;
        logOutUser(): void;
        getExistingAuthData(): AuthData;
    }

    class AuthService implements IAuthService {

        static $inject: string[] = ['localStorageService']
        LOCAL_STORAGE_KEY: string = 'authenticationData';
        authentication: AuthContext;

        constructor(
            private localStorageService: angular.local.storage.ILocalStorageService) {

            this.authentication = new AuthContext();
        }


        loginUser(authenticationData: AuthData): void {
            this.localStorageService.set(this.LOCAL_STORAGE_KEY, authenticationData);
            this.authentication.isAuth = true;
            this.authentication.email = authenticationData.email;
        }


        //used in app.js
        getExistingAuthData(): AuthData {
            return this.localStorageService.get<AuthData>(this.LOCAL_STORAGE_KEY);
        }


        logOutUser(): void {
            this.localStorageService.remove(this.LOCAL_STORAGE_KEY);
            this.authentication.isAuth = false;
            this.authentication.email = "";
        }
    }

    angular.module('lm.surveys').service("authService", AuthService);
}
