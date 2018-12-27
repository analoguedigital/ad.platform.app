/// <reference path="../../../scripts/typings/lodash/lodash.d.ts" />
/// <reference path="../../../scripts/typings/angularjs/angular.d.ts" />
/// <reference path="storageservice.ts" />
/// <reference path="authservice.ts" />
/// <reference path="cordovafileservice.ts" />

module App.Services {
    "use strict";

    class FileStorageService implements IStorageService {

        static $inject: string[] = ['$q', 'authService', 'cordovaFileService']

        constructor(
            private $q: ng.IQService,
            private authService: IAuthService,
            private cordovaFileService: ICordovaFileService) { }


        private getMergedPath(objectType: string, category: string): string {
            var email = this.authService.getExistingAuthData().email;

            var folder = '';
            if (objectType)
                folder = email + '/' + objectType + '/';

            if (category != null)
                folder += category + '/';

            return folder;
        }


        private getDirEntry(objectType: string, category: string): ng.IPromise<DirectoryEntry> {
            var q = this.$q.defer();

            try {
                var mergedPath = this.getMergedPath(objectType, category);
                this.cordovaFileService.getDirectoryEntry(mergedPath)
                    .then((dir) => {
                        q.resolve(dir);
                    }, (err) => {
                        q.reject(err);
                    });
            } catch (e) {
                console.error('could not get dir entry', e);
                q.reject(e);
            }

            return q.promise;
        }


        private getObjects<T>(fileEntries: Array<FileEntry>): ng.IPromise<Array<T>> {

            var q = this.$q.defer<Array<T>>();

            try {
                var promises: Array<ng.IPromise<void>> = [];
                var result: Array<T> = [];

                angular.forEach(fileEntries, (item) => {

                    var deferred = this.$q.defer<void>();
                    promises.push(deferred.promise);

                    this.cordovaFileService.readFileAsText(item)
                        .then((text) => {
                            try {
                                result.push(JSON.parse(text));
                                deferred.resolve();
                            } catch (e) {
                                q.reject(e);
                            }
                        }, (err) => {
                            q.reject((err));
                        });
                });

                this.$q.all(promises).then(() => { q.resolve(result); }, (err) => { q.reject(err); });

            } catch (e) {
                q.resolve(e);
            }

            return q.promise;
        }


        private getFileEntryByTypeAndCatAndKey(objectType: string, category: string, key: string): ng.IPromise<FileEntry> {

            var q = this.$q.defer();

            try {

                var fileEntryPromise = this.getDirEntry(objectType, category)
                    .then
                    ((dir) => { return this.cordovaFileService.getFileEntry(dir, key + ".json", false); },
                    (err) => { q.reject(err); });

                fileEntryPromise
                    .then((fileEntry) => { q.resolve(fileEntry); }, (err) => { q.reject(err); });

            } catch (e) {
                q.reject(e);
            }

            return q.promise;
        }


        private getFileEntryByTypeAndKey(objectType: string, key: string): ng.IPromise<FileEntry> {
            var q = this.$q.defer();

            this.getFileEntryByTypeAndCatAndKey(objectType, null, key)
                .then(
                    (obj) => { q.resolve(obj); },
                    (err) => {
                        this.getDirEntry(objectType, null)
                            .then((dirEntry) => { return this.cordovaFileService.getDirEntries(dirEntry); })
                            .then(
                                (dirEntries) => {

                                    var promises: Array<ng.IPromise<void>> = [];
                                    var fileEntry: FileEntry = null;

                                    angular.forEach(dirEntries, (dirEntry) => {

                                        var deferred = this.$q.defer<void>();
                                        promises.push(deferred.promise);
                                        var cat = dirEntry.name;

                                        this.getFileEntryByTypeAndCatAndKey(objectType, cat, key)
                                            .then((entry) => { fileEntry = entry; deferred.resolve(); }, (err) => { deferred.resolve(); });

                                    });

                                    this.$q.all(promises).then(() => { q.resolve(fileEntry); });

                                },
                                (err) => { q.reject(err); });
                    },
                    (err) => { q.reject(err); });

            return q.promise;
        }

        saveFile(objectType: string, category: string, fileUri: string): ng.IPromise<string> {
            var q = this.$q.defer<string>();

            this.cordovaFileService.getFileEntryFromUri(fileUri)
                .then((fileEntry) => {
                    this.getDirEntry(objectType, category)
                        .then((dirEntry) => {
                            fileEntry.copyTo(dirEntry, fileEntry.name,
                                (entry: FileEntry) => {
                                    q.resolve(entry.toURL());
                                }, (err) => {
                                    console.error('could not copy file to dir', err);
                                    q.reject(err);
                                });
                        }, (err) => {
                            console.error('could not get dir entry', err);
                            q.reject(err);
                        });
                }, (err) => {
                    console.error('could not get file entry from uri', err);
                    q.reject(err);
                });

            return q.promise;
        }

        save<T>(objectType: string, category: string, key: string, value: T): ng.IPromise<T> {

            var q = this.$q.defer<T>();

            try {

                var fileEntryPromise = this.getDirEntry(objectType, category)
                    .then(
                        (dir) => { return this.cordovaFileService.getFileEntry(dir, key + ".json", true); },
                        (err) => { q.reject(err); });

                fileEntryPromise
                    .then(
                        (fileEntry) => {
                            fileEntry.createWriter(
                                (writer) => {
                                    writer.onwrite = () => { q.resolve(value); };
                                    var val: any = JSON.stringify(value);
                                    writer.write(val);
                                },
                                (err) => { q.reject(err); });
                        },
                        (err) => {
                            q.reject(err);
                        });
            }
            catch (e) {
                console.error('ERROR saving to storage', e);
                q.reject(e);
            }

            return q.promise;
        }

        getObj<T>(objectType: string, key: string): ng.IPromise<T> {
            var q = this.$q.defer();

            this.getFileEntryByTypeAndKey(objectType, key)
                .then((fileEntry) => { return this.cordovaFileService.readFileAsText(fileEntry); })
                .then((text) => {
                    var json = JSON.parse(text);
                    if (json.formValues && json.formValues.length) {
                        _.forEach(json.formValues, (fv) => {
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
                    }

                    q.resolve(json);
                }, (err) => { q.reject(err); });

            return q.promise;
        }


        getObjByCat(objectType: string, category: string, key: string): ng.IPromise<Object> {

            var q = this.$q.defer();

            this.getFileEntryByTypeAndCatAndKey(objectType, category, key)
                .then((fileEntry) => { return this.cordovaFileService.readFileAsText(fileEntry); })
                .then((text) => { q.resolve(JSON.parse(text)); }, (err) => { q.reject(err); });

            return q.promise;
        }

        count(objectType: string, category: string): ng.IPromise<number> {
            var q = this.$q.defer();

            try {
                this.list(objectType, category)
                    .then((entries) => { q.resolve(entries.length); }, (err) => { q.reject(err); });
            }
            catch (err) {
                q.reject(err);
            }

            return q.promise;
        }


        list<T>(objectType: string, category: string): ng.IPromise<Array<T>> {

            var q = this.$q.defer();

            this.getDirEntry(objectType, category)
                .then((dirEntry) => { return this.cordovaFileService.getFileEntries(dirEntry); })
                .then(
                    (fileEntries) => {
                        var fileKeys = _.map(fileEntries, entry => entry.name.substring(0, entry.name.indexOf('.')));
                        q.resolve(fileKeys);
                    },
                    (err) => { q.reject(err); });

            return q.promise;
        }


        getAll<T>(objectType: string, category: string): ng.IPromise<Array<T>> {

            var q = this.$q.defer();

            this.getDirEntry(objectType, category)
                .then((dirEntry) => { return this.cordovaFileService.getFileEntries(dirEntry); })
                .then((fileEntries) => { return this.getObjects(fileEntries); })
                .then((objects) => { q.resolve(objects); }, (err) => { q.reject(err); });

            return q.promise;
        }


        delete(objectType: string, key: string): ng.IPromise<void> {
            var q = this.$q.defer<void>();

            this.getFileEntryByTypeAndKey(objectType, key)
                .then((fileEntry) => { return this.cordovaFileService.delete(fileEntry); })
                .then(() => { q.resolve(); }, (err) => { q.reject(err); });

            return q.promise;
        }

        deleteAllObjectsOfType(objectType: string): ng.IPromise<void> {

            var q = this.$q.defer<void>();

            try {

                this.getDirEntry(objectType, null)
                    .then
                    ((dir) => {
                        return dir.removeRecursively(
                            () => { q.resolve(); },
                            (err: FileError) => { q.reject(err); });
                    },
                    (err) => { q.reject(err); });

            } catch (e) {
                q.reject(e);
            }

            return q.promise;
        }


        softDelete(objectType: string, key: string): ng.IPromise<void> {
            var q = this.$q.defer<void>();

            this.getFileEntryByTypeAndKey(objectType, key)
                .then((fileEntry) => {

                    var fileEntryPromise = this.getDirEntry(objectType, ".deleted")
                        .then
                        ((dir) => {
                            fileEntry.moveTo(dir, fileEntry.name, (entry: Entry) => { q.resolve(); }, (err) => { q.reject(err); });
                        },
                        (err) => { q.reject(err); });
                })
                .then(() => { q.resolve(); }, (err) => { q.reject(err); });

            return q.promise;
        }


        deleteByCat(objectType: string, category: string, key: string): ng.IPromise<void> {
            var q = this.$q.defer<void>();

            this.getFileEntryByTypeAndCatAndKey(objectType, category, key)
                .then((fileEntry) => { return this.cordovaFileService.delete(fileEntry); })
                .then(() => { q.resolve(); }, (err) => { q.reject(err); });

            return q.promise;
        }

        getFileEntryFromUri(fileUri: string): ng.IPromise<FileEntry> {
            return this.cordovaFileService.getFileEntryFromUri(fileUri);
        }


    }

    angular.module('lm.surveys').service('fileStorageService', FileStorageService);
}