/// <reference path="../app.models.ts" />
/// <reference path="../../../scripts/typings/angularjs/angular.d.ts" />
/// <reference path="authservice.ts" />
/// <reference path="storageservice.ts" />

module App.Services {
    "use strict";

    export interface IFeedbackData {
        addedById: string;
        organisationId: string;
        comment: string;
    }

    export interface IFeedbackService {
        sendFeedback: (feedback: IFeedbackData) => ng.IPromise<any>;
    }

    class FeedbackService implements IFeedbackService {
        static $inject: string[] = ['$q', 'storageService', 'authService', 'httpService', 'gettextCatalog'];

        constructor(
            private $q: angular.IQService,
            private storageService: IStorageService,
            private authService: IAuthService,
            private httpService: IHttpService,
            private gettextCatalog: any) { }

        sendFeedback(feedback: IFeedbackData): ng.IPromise<any> {
            var deferred = this.$q.defer();

            this.httpService.uploadFeedback(feedback)
                .then((response) => { deferred.resolve(response); }, (err) => { deferred.reject(err); });

            return deferred.promise;
        }
    }

    angular.module('lm.surveys').service('feedbackService', FeedbackService);

}