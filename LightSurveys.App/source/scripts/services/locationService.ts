/// <reference path="../../../scripts/typings/cordova/cordova.d.ts" />
/// <reference path="../../../scripts/typings/angularjs/angular.d.ts" />
/// <reference path="../app.models.ts" />

module App.Services {
    "use strict";

    export interface ILocationService {
        getCurrentPosition(): ng.IPromise<Models.Position>;
    }


    class LocationService implements ILocationService {

        static $inject: string[] = ['$q'];

        constructor(
            private $q: ng.IQService
            ) { }


        getCurrentPosition(): ng.IPromise<Models.Position> {

            var q = this.$q.defer();

            navigator.geolocation.getCurrentPosition(
                (position) => { q.resolve(new Models.Position(position.coords.latitude, position.coords.longitude, position.coords.accuracy, '', '')); },
                (err) => { q.reject(new Models.Position(null, null, null, err.message, '')); },
                { maximumAge: 60000, timeout: 15000, enableHighAccuracy: true });

            return q.promise;
        }
    }

    angular.module('lm.surveys').service("locationService", LocationService);
}