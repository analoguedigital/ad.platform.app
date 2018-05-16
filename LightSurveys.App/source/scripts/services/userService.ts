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
        phoneNumber: string;
        organisationName: string;
    }

    interface IUserInfo {
        userId: string;
        email: string;
        calendar: string;
        language: string;
        profile: IProfileInfo;
    }

    interface IProfile {
        userInfo: IUserInfo;
        currentProject: Models.Project;
        authenticationData: AuthData;
        lastRefreshTemplate: Date;
        settings: ISettings;
    }

    interface IProfileInfo {
        firstName: string;
        surname: string;
        gender?: number;
        birthdate?: Date;
        address: string;
        email: string;
        phoneNumber: string;
        isSubscribed: boolean;
        expiryDate?: Date;
        lastSubscription?: any;
        monthlyQuota: IMonthlyQuota;
    }

    interface IMonthlyQuota {
        quota?: number;
        used: number;
    }

    interface ISettings {
        passcodeEnabled: boolean;
        fingerprintEnabled: boolean;
        passcodeText: string;
        noStoreEnabled: boolean;
    }

    class AppContext {
        userId: string;
        userEmail: string;
        calendar: string;
        language: string;
        project: Models.Project;
        profile: IProfileInfo;
    }


    export interface IUserService {
        current: AppContext;
        currentProfile: IProfile;
        login: (ILoginData: ILoginData) => ng.IPromise<void>;
        logOut: () => ng.IPromise<void>;
        activateProfile: (profile: IProfile) => void;
        getExistingProfiles: () => ng.IPromise<IProfile[]>;
        setCurrentProject: (project: Models.Project) => void;
        register(registerData: IRegisterData): angular.IPromise<void>;
        clearCurrent: () => void;
        changePassword(model: Models.IChangePasswordModel): ng.IPromise<void>;
    }

    class UserService implements IUserService {
        static $inject: string[] = ['$q', 'storageService', 'localStorageService', 'authService', 'httpService', 'gettextCatalog'];

        private USER_OBJECT_TYPE: string = 'user';
        current: AppContext;
        currentProfile: IProfile;

        constructor(
            private $q: angular.IQService,
            private storageService: IStorageService,
            private localStorageService: ng.local.storage.ILocalStorageService,
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
            this.current.profile = profile.userInfo.profile;
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
                        .then((profile) => {
                            this.activateProfile(profile);
                            this.saveProfile(profile).then((p) => {
                                // created profile saved
                            });

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
                    deferred.resolve(response);
                }, (err) => {
                    this.authService.logOutUser();
                    deferred.reject(err);
                });

            return deferred.promise;
        }

        createProfile(authenticationData: AuthData): angular.IPromise<IProfile> {
            var deferred = this.$q.defer<IProfile>();

            this.httpService.getUserInfo()
                .then((userinfo) => {
                    var profile: any = {
                        email: authenticationData.email,
                        authenticationData: authenticationData,
                        userInfo: userinfo,
                        settings: <ISettings>{
                            passcodeEnabled: false,
                            fingerprintEnabled: false,
                            passcodeText: '',
                            noStoreEnabled: false
                        }
                    };

                    deferred.resolve(profile);

                }, (err) => {
                    deferred.reject(err);
                });

            return deferred.promise;

        }

        saveProfile(profile: IProfile): ng.IPromise<IProfile> {
            // instead of storing the user object using storageService, which
            // uses cordovaFileService on device, use localStorageService.
            //return this.storageService.deleteByCat(null, this.USER_OBJECT_TYPE, this.current.userId)
            //    .then(() => {
            //        return this.storageService.save(null, this.USER_OBJECT_TYPE, profile.userInfo.userId, profile);
            //    });

            var q = this.$q.defer<IProfile>();

            var entryKey = 'user/' + profile.userInfo.userId;
            this.localStorageService.set(entryKey, profile);

            q.resolve(profile);

            return q.promise;
        }

        setCurrentProject(project: Models.Project): ng.IPromise<void> {
            var q = this.$q.defer<void>();

            this.currentProfile.currentProject = project;
            this.current.project = project;

            this.saveProfile(this.currentProfile).then(() => { });

            q.resolve();

            return q.promise;
        }

        logOut(): ng.IPromise<void> {
            var userService = this;
            var q = this.$q.defer<void>();

            // not necessary anymore, since the user object is being stored using localStorageService.
            //this.storageService.deleteByCat(null, this.USER_OBJECT_TYPE, this.current.userId);

            userService.clearCurrent();
            userService.authService.logOutUser();

            _.forEach(this.localStorageService.keys(), (key) => {
                if (_.includes(key, 'user'))
                    this.localStorageService.remove(key);
            });

            q.resolve();

            return q.promise;
        }

        activateProfile(profile: IProfile) {
            this.setCurrent(profile);

            var language = profile.userInfo.language;
            if (language && language.length)
                this.gettextCatalog.setCurrentLanguage(profile.userInfo.language.replace('-', '_'));
            else
                this.gettextCatalog.setCurrentLanguage('en-GB');
        }

        getExistingProfiles(): ng.IPromise<IProfile[]> {
            //return this.storageService.getAll(null, this.USER_OBJECT_TYPE);

            var q = this.$q.defer<any>();

            var keys = _.filter(this.localStorageService.keys(), key => _.startsWith(key, 'user/'));
            var storage = this.localStorageService;

            q.resolve(_.map(keys, key => storage.get(key)));

            return q.promise;
        }

        changePassword(model: Models.IChangePasswordModel): ng.IPromise<void> {
            var deferred = this.$q.defer<void>();

            this.httpService.changePassword(model)
                .then((res: any) => { deferred.resolve(res); },
                    (err) => { deferred.reject(err); });

            return deferred.promise;
        }
    }

    angular.module('lm.surveys').service('userService', UserService);

}