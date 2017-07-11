/// <reference path="../app.models.ts" />
/// <reference path="../../../scripts/typings/angularjs/angular.d.ts" />
/// <reference path="authservice.ts" />
/// <reference path="storageservice.ts" />

module App.Services {
    "use strict";

    export interface ILoginData {
        email: string;
        password: string;
    }

    export interface IRegisterData {
        firstName: string;
        surname: string;
        email: string;
        password: string;
        confirmPassword: string;
        birthdate: Date;
        gender: string;
        address: string;
        organisationName: string;
    }

    interface IUserInfo {
        userId: string;
        email: string;
        calendar: string;
        language: string;
    }

    interface IProfile {
        userInfo: IUserInfo;
        currentProject: Models.Project;
        authenticationData: AuthData;
        lastRefreshTemplate: Date;
        settings: ISettings;
    }

    interface ISettings {
        passcodeEnabled: boolean;
        fingerprintEnabled: boolean;
        passcodeText: string;
    }

    class AppContext {
        userId: string;
        userEmail: string;
        calendar: string;
        language: string;
        project: Models.Project;
    }


    export interface IUserService {
        current: AppContext;
        login: (ILoginData: ILoginData) => ng.IPromise<void>;
        logOut: () => void;
        activateProfile: (profile: IProfile) => void;
        getExistingProfiles: () => ng.IPromise<IProfile[]>;
        setCurrentProject: (project: Models.Project) => void;
        register(registerData: IRegisterData): angular.IPromise<void>;
        clearCurrent: () => void;
    }

    class UserService implements IUserService {
        static $inject: string[] = ['$q', 'storageService', 'authService', 'httpService', 'gettextCatalog'];

        private USER_OBJECT_TYPE: string = 'user';
        current: AppContext;
        currentProfile: IProfile;

        constructor(
            private $q: angular.IQService,
            private storageService: IStorageService,
            private authService: IAuthService,
            private httpService: IHttpService,
            private gettextCatalog: any) {

            this.current = new AppContext();
            this.clearCurrent();
        }


        setCurrent(profile: IProfile) {
            this.currentProfile = profile;
            this.current.calendar = profile.userInfo.calendar;
            this.current.language = profile.userInfo.language;
            this.current.userId = profile.userInfo.userId;
            this.current.userEmail = profile.userInfo.email;
            this.current.project = profile.currentProject;
        }

        clearCurrent() {
            this.currentProfile = null;
            this.current.calendar = 'Gregorian';
            this.current.language = 'en-GB';
            this.current.userId = '';
            this.current.userEmail = '';
            this.current.project = null;
        }


        login(loginData: ILoginData): angular.IPromise<void> {

            var deferred = this.$q.defer<void>();

            this.httpService.getAuthenticationToken(loginData)
                .then((response) => {
                    // user is authenicated 
                    var authenticationData = new AuthData(response.access_token, loginData.email);
                    this.authService.loginUser(authenticationData);
                    this.createProfile(authenticationData)
                        .then((profile) => { return this.saveProfile(profile); })
                        .then((profile) => {
                            this.activateProfile(profile);
                            deferred.resolve();
                        }, (err) => {
                            this.authService.logOutUser();
                            deferred.reject(err);
                        });

                }, (err) => {
                    // user is not authenicated 
                    this.authService.logOutUser();
                    deferred.reject(err);
                });

            return deferred.promise;
        }

        register(registerData: IRegisterData): angular.IPromise<void> {

            var deferred = this.$q.defer<void>();

            this.httpService.register(registerData)
                .then((response) => {
                    // user is registered
                    var loginData = <ILoginData>{ email: registerData.email, password: registerData.password };
                    this.login(loginData).then(
                        (response) => { deferred.resolve(response); },
                        (err) => { deferred.reject(err); });

                }, (err) => {
                    // user is not authenicated 
                    this.authService.logOutUser();
                    deferred.reject(err);
                });

            return deferred.promise;
        }

        createProfile(authenticationData: AuthData): angular.IPromise<IProfile> {
            var deferred = this.$q.defer();

            this.httpService.getUserInfo()
                .then((userinfo) => {
                    var profile = {
                        email: authenticationData.email,
                        authenticationData: authenticationData,
                        userInfo: userinfo,
                        settings: <ISettings>{
                            passcodeEnabled: false,
                            fingerprintEnabled: false,
                            passcodeText: ''
                        }
                    };

                    deferred.resolve(profile);

                }, (err) => {
                    deferred.reject(err);
                });

            return deferred.promise;

        }


        saveProfile(profile: IProfile): ng.IPromise<IProfile> {
            return this.storageService.save(null, this.USER_OBJECT_TYPE, profile.userInfo.userId, profile);
        }


        setCurrentProject(project: Models.Project) {
            this.currentProfile.currentProject = project;
            this.current.project = project;
            return this.saveProfile(this.currentProfile);
        }


        logOut() {
            var userService = this;
            return this.storageService.deleteByCat(null, this.USER_OBJECT_TYPE, this.current.userId)
                .then(() => {
                    userService.clearCurrent();
                    userService.authService.logOutUser();
                }, function () {
                    userService.clearCurrent();
                    userService.authService.logOutUser();
                });
        }


        activateProfile(profile: IProfile) {
            this.setCurrent(profile);
            this.authService.loginUser(profile.authenticationData);
            this.gettextCatalog.setCurrentLanguage(profile.userInfo.language.replace('-', '_'));
        }


        getExistingProfiles() {
            return this.storageService.getAll(null, this.USER_OBJECT_TYPE);
        }
    }

    angular.module('lm.surveys').service('userService', UserService);

}