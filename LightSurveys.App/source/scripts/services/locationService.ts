/// <reference path="../../../scripts/typings/cordova/cordova.d.ts" />
/// <reference path="../../../scripts/typings/angularjs/angular.d.ts" />
/// <reference path="../app.models.ts" />

module App.Services {
    "use strict";

    export interface ILocationService {
        getCurrentPosition(): ng.IPromise<Models.Position>;
    }


    class LocationService implements ILocationService {

        static $inject: string[] = ['$q', 'localStorageService'];

        constructor(
            private $q: ng.IQService,
            private localStorageService: ng.local.storage.ILocalStorageService
        ) { }


        getCurrentPosition(): ng.IPromise<Models.Position> {
            this.localStorageService.set<boolean>('capture-in-progress', true);

            var q = this.$q.defer<Models.Position>();

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    this.localStorageService.set<boolean>('capture-in-progress', false);

                    var result = new Models.Position(position.coords.latitude, position.coords.longitude, position.coords.accuracy, '', '');
                    q.resolve(result);
                },
                (err) => {
                    this.localStorageService.set<boolean>('capture-in-progress', false);
                    q.reject(new Models.Position(null, null, null, err.message, ''));
                },
                { maximumAge: 60000, timeout: 15000, enableHighAccuracy: true });

            return q.promise;
        }
    }

    angular.module('lm.surveys').service("locationService", LocationService);
}