/// <reference path="../../../scripts/typings/toastr/toastr.d.ts" />

module App.Services {
    "use strict";

    export interface IAlertService {
        show(msg: string): void;
    }

    class AlertService implements IAlertService {

        static $inject: string[] = ['toastr'];

        constructor(
            private toastr: Toastr) { }

        show(msg: string) {
            this.toastr.clear();
            this.toastr.info(msg, '', { allowHtml: true, positionClass: 'toast-bottom-center' });
        }
    }

    angular.module('lm.surveys').service("alertService", AlertService);
}