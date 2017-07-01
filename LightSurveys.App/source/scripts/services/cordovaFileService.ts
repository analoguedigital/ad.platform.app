/// <reference path="../../../scripts/typings/cordova/plugins/filesystem.d.ts" />
/// <reference path="../../../scripts/typings/angularjs/angular.d.ts" />
/// <reference path="../../../scripts/typings/cordova/cordova.d.ts" />

module App.Services {
    "use strict";

    export interface ICordovaFileService {
        getDirectoryEntry(directoryName: string): angular.IPromise<DirectoryEntry>;
        getFileEntry(dir: DirectoryEntry, fileName: string, shouldCreate: boolean): angular.IPromise<FileEntry>;
        getFileEntryFromUri(fileUri: string): ng.IPromise<FileEntry>;
        getDirEntries(dirEntry: DirectoryEntry): angular.IPromise<Array<DirectoryEntry>>;
        getFileEntries(dirEntry: DirectoryEntry): angular.IPromise<Array<FileEntry>>;
        readFileAsText(fileEntry: FileEntry): ng.IPromise<string>;
        delete(fileEntry: FileEntry): angular.IPromise<void>;
    }

    class CordovaFileService implements ICordovaFileService {

        static $inject: string[] = ['$window', '$q'];


        constructor(
            private $window: Window,
            private $q: angular.IQService) { }

        ensureDirectoryExists(dirEntry: DirectoryEntry, name: string): ng.IPromise<DirectoryEntry> {

            var q = this.$q.defer();

            try {
                if (name == '') {
                    q.resolve(dirEntry);
                }
                else {
                    var pathSepIndex = name.indexOf('/');
                    var folder = name;
                    var rest = '';
                    if (pathSepIndex != -1) {
                        folder = name.substring(0, name.indexOf('/'));
                        rest = name.substring(name.indexOf('/') + 1);
                    }
                    dirEntry.getDirectory(folder, { create: true, exclusive: false },
                        (dir) => {
                            this.ensureDirectoryExists(dir, rest)
                                .then(
                                (dir) => { q.resolve(dir); },
                                (err) => { q.reject(err); });
                        },
                        (err) => { q.reject(err) });
                }
            } catch (e) {
                q.reject(e)
            }

            return q.promise;
        }


        getDirectoryEntry(directoryName: string): ng.IPromise<DirectoryEntry> {

            var q = this.$q.defer();

            try {

                var ensureDirPromise = this.requestFileSystem()
                    .then(
                    (dir: DirectoryEntry) => { return this.ensureDirectoryExists(dir, "files/" + directoryName); },
                    (err: FileError) => { q.reject(err); });

                ensureDirPromise
                    .then(
                    (dir: DirectoryEntry) => { q.resolve(dir); },
                    (err: FileError) => { q.reject(err); });

            } catch (e) {
                q.reject(e);
            }
            return q.promise;
        }


        requestFileSystem(): ng.IPromise<DirectoryEntry> {

            var q = this.$q.defer();

            try {
                window.requestFileSystem(LocalFileSystem.PERSISTENT, 0,
                    (fs) => { q.resolve(fs.root); },
                    (err) => {
                        console.log(err); q.reject(err);
                    });

            } catch (e) {
                q.reject(e);
            }

            return q.promise;
        }


        readFileAsText(fileEntry: FileEntry): ng.IPromise<string> {

            var q = this.$q.defer();

            try {
                fileEntry.file(
                    (file) => {
                        var reader = new FileReader();
                        reader.onloadend = (evt) => {
                            var target: any = evt.target;
                            q.resolve(target.result);
                        };
                        reader.readAsText(file);
                    },
                    (err) => { q.reject(err); });

            } catch (e) {
                q.reject(e);
            }

            return q.promise;
        }

        getFileEntry(dir: DirectoryEntry, fileName: string, shouldCreate: boolean): ng.IPromise<FileEntry> {

            var q = this.$q.defer();

            try {
                dir.getFile(fileName, { create: shouldCreate, exclusive: false },
                    (fileEntry) => { q.resolve(fileEntry); },
                    (err) => { q.reject(err); });

            } catch (e) {
                q.reject(e);
            }

            return q.promise;
        }

        getFileEntryFromUri(fileUri: string): ng.IPromise<FileEntry> {
            var q = this.$q.defer<FileEntry>();

            var url = fileUri;
            if (device.platform === 'iOS' && !_.startsWith(url, 'file://'))
                url = 'file://' + url;

            window.resolveLocalFileSystemURL(url,
                (fileEntry: FileEntry) => { q.resolve(fileEntry); },
                (err: FileError) => { q.reject(err); });

            return q.promise;
        }

        getEntries(dirEntry: DirectoryEntry, isFile: boolean): ng.IPromise<Array<Entry>> {

            var q = this.$q.defer();

            try {
                var reader = dirEntry.createReader();
                reader.readEntries(
                    (entries) => {
                        var promises: ng.IPromise<void>[] = [];
                        var result: Array<Entry> = [];
                        angular.forEach(entries, (entry) => {
                            var deferred = this.$q.defer<void>();
                            promises.push(deferred.promise);
                            if (isFile == null || entry.isFile == isFile) {
                                result.push(entry);
                                deferred.resolve();
                            }
                        });
                        this.$q.all(promises).then(() => { q.resolve(result); });
                    });
            } catch (e) {
                q.resolve(e);
            }

            return q.promise;
        }


        getFileEntries(dirEntry: DirectoryEntry): ng.IPromise<Array<FileEntry>> {

            return this.getEntries(dirEntry, true);
        }


        getDirEntries(dirEntry: DirectoryEntry): ng.IPromise<Array<DirectoryEntry>> {

            return this.getEntries(dirEntry, false);
        }


        delete(fileEntry: FileEntry): ng.IPromise<void> {

            var q = this.$q.defer<void>();

            fileEntry.remove(
                () => { q.resolve(); },
                (err) => { q.reject(err); });

            return q.promise;
        }
    }

    angular.module('lm.surveys').service("cordovaFileService", CordovaFileService);
}
