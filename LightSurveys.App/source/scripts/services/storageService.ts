/// <reference path="../../../scripts/typings/cordova/cordova.d.ts" />

module App.Services {
    "use strict";

    export interface IStorageService {

        save<T>(objectType: string, category: string, key: string, value: T): ng.IPromise<T>;
        getObj<T>(objectType: string, key: string): ng.IPromise<Object>;
        getObjByCat<T>(objectType: string, category: string, key: string): ng.IPromise<T>;
        count(objectType: string, category: string): ng.IPromise<number>;
        list<T>(objectType: string, category: string): ng.IPromise<Array<T>>;
        getAll<T>(objectType: string, category: string): ng.IPromise<Array<T>>;
        delete(objectType: string, key: string): ng.IPromise<void>;
        softDelete(objectType: string, key: string): ng.IPromise<void>;
        deleteByCat(objectType: string, category: string, key: string): ng.IPromise<void>;
        getFileEntryFromUri(fileUri: string): ng.IPromise<FileEntry>;
        saveFile(objectType: string, category: string, fileUri: string): ng.IPromise<string>;
        deleteAllObjectsOfType(objectType: string): ng.IPromise<void>;
    }

    StorageService.$inject = ['$window', '$injector'];
    function StorageService($window: Window, $injector: ng.auto.IInjectorService): IStorageService {

        if ($window.cordova) {
            return $injector.get('fileStorageService');
        }
        else {
            return $injector.get('browserStorageService');
        }
    }

    angular.module('lm.surveys').factory('storageService', StorageService);
}
