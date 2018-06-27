/// <reference path="../app.models.ts" />
/// <reference path="../../../scripts/typings/angularjs/angular.d.ts" />
/// <reference path="authservice.ts" />
/// <reference path="storageservice.ts" />

module App.Services {
    "use strict";

    export interface IFeedbackService {
        sendFeedback: (feedback: Models.IFeedbackData) => ng.IPromise<void>;
    }

    class FeedbackService implements IFeedbackService {
        static $inject: string[] = ['httpService'];

        constructor(private httpService: IHttpService) { }

        sendFeedback(feedback: Models.IFeedbackData): ng.IPromise<void> {
            return this.httpService.uploadFeedback(feedback);
        }
    }

    angular.module('lm.surveys').service('feedbackService', FeedbackService);

}