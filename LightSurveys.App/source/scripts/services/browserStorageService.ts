/// <reference path="../../../scripts/typings/lodash/lodash.d.ts" />
/// <reference path="../../../scripts/typings/angularjs/angular.d.ts" />
/// <reference path="../../../scripts/typings/angular-local-storage/angular-local-storage.d.ts" />
/// <reference path="storageservice.ts" />
/// <reference path="authservice.ts" />

module App.Services {
    "use strict";

    class BrowserStorageService implements IStorageService {

        static $inject: string[] = ['localStorageService', '$q', 'authService'];

        constructor(
            private localStorageService: angular.local.storage.ILocalStorageService,
            private $q: ng.IQService,
            private authService: IAuthService) { }


        private getMergedKey(objectType: string, category: string, key: string): string {

            var folder = '';
            if (objectType)
                folder = this.authService.authentication.email + '/' + objectType + '/';

            if (category != null)
                folder += category + '/';

            if (key != null)
                folder += key;

            return folder;
        }


        save<T>(objectType: string, category: string, key: string, value: T): ng.IPromise<T> {
            var q = this.$q.defer();

            var entryKey = this.getMergedKey(objectType, category, key);
            this.localStorageService.set(entryKey, value);

            q.resolve(value);
            return q.promise;
        }


        getObj<T>(objectType: string, key: string): ng.IPromise<T> {
            var q = this.$q.defer();

            var entryKey = _.find(this.localStorageService.keys(), entry => _.endsWith(entry, key));
            var obj = this.localStorageService.get(entryKey);

            var survey = <Models.Survey>obj;
            if (survey) {
                _.forEach(survey.formValues, (fv) => {
                    if (fv.dateValue) {
                        var utcDate = moment.utc(fv.dateValue);
                        var hours = utcDate.hour();
                        var minutes = utcDate.minutes();

                        var localDate = utcDate.local().toDate();
                        if (hours === 0 && minutes === 0) {
                            localDate.setHours(0);
                            localDate.setMinutes(0);
                            localDate.setSeconds(0);
                            localDate.setMilliseconds(0);
                        }

                        fv.dateValue = localDate;
                    }
                });

                obj = survey;
            }

            q.resolve(obj);
            return q.promise;
        }


        getObjByCat<T>(objectType: string, category: string, key: string): ng.IPromise<T> {
            var q = this.$q.defer();

            var mergedNames = this.getMergedKey(objectType, category, key);
            q.resolve(this.localStorageService.get(mergedNames));

            return q.promise;
        }


        count(objectType: string, category: string): ng.IPromise<number> {
            var q = this.$q.defer();

            var mergedNames = this.getMergedKey(objectType, category, null);
            q.resolve(_.filter(this.localStorageService.keys(), key => _.startsWith(key, mergedNames)).length);

            return q.promise;
        }


        list<T>(objectType: string, category: string): ng.IPromise<Array<T>> {
            var q = this.$q.defer();

            var mergedNames = this.getMergedKey(objectType, category, null);
            var keys = _.filter(this.localStorageService.keys(), key => _.startsWith(key, mergedNames));
            q.resolve(_.map(keys, key => key.substring(key.lastIndexOf("/"))));

            return q.promise;

        }


        getAll<T>(objectType: string, category: string): ng.IPromise<Array<T>> {
            var q = this.$q.defer();

            var mergedNames = this.getMergedKey(objectType, category, null);
            var keys = _.filter(this.localStorageService.keys(), key => _.startsWith(key, mergedNames));
            var storage = this.localStorageService;
            q.resolve(_.map(keys, key => storage.get(key)));

            return q.promise;

        }


        delete(objectType: string, key: string): ng.IPromise<void> {
            var q = this.$q.defer<void>();

            var entryKey = _.find(this.localStorageService.keys(), entry => _.endsWith(entry, key));

            this.localStorageService.remove(entryKey);
            q.resolve();
            return q.promise;
        }

        softDelete(objectType: string, key: string): ng.IPromise<void> {
            return this.delete(objectType, key);
        }

        deleteByCat(objectType: string, category: string, key: string): ng.IPromise<void> {
            var q = this.$q.defer<void>();

            var mergedNames = this.getMergedKey(objectType, category, key);
            this.localStorageService.remove(mergedNames);
            q.resolve();

            return q.promise;
        }

        deleteAllObjectsOfType(objectType: string): ng.IPromise<void> {

            var q = this.$q.defer<void>();
            var keysPrefix = this.getMergedKey(objectType, null, null);

            angular.forEach(this.localStorageService.keys(), (key: string) => {
                if (_.startsWith(key, keysPrefix))
                    this.localStorageService.remove(key);
            });
            q.resolve();

            return q.promise;
        }


        getFileEntryFromUri(fileUri: string): ng.IPromise<FileEntry> {
            var q = this.$q.defer<FileEntry>();
            q.reject("cannot use filesystem on browser");
            return q.promise;
        }

        saveFile(objectType: string, category: string, fileUri: string): ng.IPromise<string> {
            var q = this.$q.defer<string>();
            q.reject("cannot use filesystem on browser");
            return q.promise;
        }
    }

    angular.module('lm.surveys').service('browserStorageService', BrowserStorageService);
}