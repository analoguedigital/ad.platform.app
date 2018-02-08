/// <reference path="../../../scripts/typings/angularjs/angular.d.ts" />
/// <reference path="userservice.ts" />

module App.Services {
    "use strict";


    export interface IHttpService {
        getAuthenticationToken(loginData: ILoginData): angular.IPromise<any>;
        getUserInfo(): angular.IPromise<any>;
        getFormTemplate(id: string): angular.IPromise<angular.IHttpPromiseCallbackArg<Models.FormTemplate>>;
        getFormTemplates(): angular.IPromise<angular.IHttpPromiseCallbackArg<Array<Models.FormTemplate>>>;
        getProjects(): angular.IPromise<angular.IHttpPromiseCallbackArg<Array<Models.Project>>>;
        uploadSurvey(survey: Models.Survey): angular.IPromise<angular.IHttpPromiseCallbackArg<any>>;
        register(registerData: IRegisterData): ng.IPromise<any>;
        deleteFormTemplate(id: string): ng.IPromise<any>;
        uploadFile(attchment: Models.Attachment): angular.IPromise<string>
        uploadFeedback(feedback: IFeedbackData): ng.IPromise<void>;
        forgotPassword(model: Models.IForgotPasswordModel): ng.IPromise<void>;
        getDataList(id: string): angular.IPromise<angular.IHttpPromiseCallbackArg<Models.DataListItem[]>>;
        getUserSurveys(projectId: string): ng.IPromise<Array<Models.Survey>>;
        getServiceBase(): string;
        updateProfile(model: Models.IProfileModel): ng.IPromise<void>;
        changePassword(model: Models.IChangePasswordModel): ng.IPromise<void>;
    }

    export class HttpService implements IHttpService {
        public static serviceBase: string = 'https://platform.onrecord.tech/';

        static $inject: string[] = ['$http', 'authService', '$q'];
        constructor(
            private $http: ng.IHttpService,
            private authService: IAuthService,
            private $q: ng.IQService) { }

        getServiceBase(): string {
            return HttpService.serviceBase;
        }

        forgotPassword(model: Models.IForgotPasswordModel): ng.IPromise<void> {
            var deferred = this.$q.defer<void>();

            this.$http.post(HttpService.serviceBase + 'api/account/forgotpassword', JSON.stringify(model))
                .success((data) => { deferred.resolve(); })
                .error((data, status) => { deferred.reject(this.onError(data, status)); });

            return deferred.promise;
        }

        getAuthenticationToken(loginData: ILoginData): ng.IPromise<any> {

            var deferred = this.$q.defer();
            var data = "grant_type=password&username=" + loginData.email + "&password=" + loginData.password;

            this.$http.post(HttpService.serviceBase + 'token', data, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })
                .success((value) => { deferred.resolve(value); })
                .error((value, status) => { deferred.reject(this.onError(value, status)); });

            return deferred.promise;
        }

        register(registerData: IRegisterData): ng.IPromise<any> {

            var deferred = this.$q.defer();

            this.$http.post(HttpService.serviceBase + 'api/account/register', JSON.stringify(registerData))
                .success((value) => { deferred.resolve(value); })
                .error((value, status) => { deferred.reject(this.onError(value, status)); });

            return deferred.promise;
        }

        getUserInfo(): angular.IPromise<angular.IHttpPromiseCallbackArg<any>> {

            var deferred = this.$q.defer();

            this.$http.get(HttpService.serviceBase + 'api/account/userinfo/')
                .success((data) => { deferred.resolve(data); })
                .error((data, status) => { deferred.reject(this.onError(data, status)); });

            return deferred.promise;
        }

        getProjects(): angular.IPromise<angular.IHttpPromiseCallbackArg<Array<Models.Project>>> {

            var deferred = this.$q.defer();

            this.$http.get(HttpService.serviceBase + 'api/projects/')
                .success((data) => {
                    deferred.resolve(data);
                })
                .error((data, status) => {
                    deferred.reject(this.onError(data, status));
                });

            return deferred.promise;
        }

        getFormTemplates(): angular.IPromise<angular.IHttpPromiseCallbackArg<Array<Models.FormTemplate>>> {

            var deferred = this.$q.defer();

            this.$http.get(HttpService.serviceBase + 'api/formtemplates/')
                .success((data) => { deferred.resolve(data); })
                .error((data, status) => { deferred.reject(this.onError(data, status)); });

            return deferred.promise;
        }

        getFormTemplate(id: string): angular.IPromise<angular.IHttpPromiseCallbackArg<Models.FormTemplate>> {

            var deferred = this.$q.defer();

            this.$http.get(HttpService.serviceBase + 'api/formtemplates/' + id)
                .success((data) => { deferred.resolve(data); })
                .error((data, status) => { deferred.reject(this.onError(data, status)); });

            return deferred.promise;
        }

        cloneFormTemplate(id: string, title: string, colour: string, projectId: string) {
            var deferred = this.$q.defer();

            this.$http.post(HttpService.serviceBase + 'api/formtemplates/' + id + '/clone',
                JSON.stringify({ title: title, colour: colour, projectId: projectId }))
                .success((data) => { deferred.resolve(data); })
                .error((data, status) => { deferred.reject(this.onError(data, status)); });

            return deferred.promise;
        }

        editFormTemplate(formTemplate: Models.FormTemplate) {
            var deferred = this.$q.defer();

            this.$http.put(HttpService.serviceBase + 'api/formtemplates/' + formTemplate.id + '/details',
                JSON.stringify(formTemplate))
                .success((data) => { deferred.resolve(data); })
                .error((data, status) => { deferred.reject(this.onError(data, status)); });

            return deferred.promise;
        }

        deleteFormTemplate(id: string): ng.IPromise<any> {
            var deferred = this.$q.defer();

            this.$http.delete(HttpService.serviceBase + 'api/formtemplates/' + id + '/publish')
                .success((data) => { deferred.resolve(data); })
                .error((data, status) => { deferred.reject(this.onError(data, status)); });

            return deferred.promise;
        }


        uploadSurvey(survey: Models.Survey): angular.IPromise<angular.IHttpPromiseCallbackArg<any>> {

            var deferred = this.$q.defer();

            this.$http.post(HttpService.serviceBase + 'api/surveys/', JSON.stringify(survey))
                .success((data) => { deferred.resolve(data); })
                .error((data, status) => { deferred.reject(this.onError(data, status)); });

            return deferred.promise;
        }

        private getFileExtension(attachment: Models.Attachment) {
            if (!attachment.type || !attachment.type.length)
                return '';

            switch (attachment.type) {
                case 'image/jpeg': {
                    return '.jpg';
                }
                case 'image/png': {
                    return '.png';
                }
                case 'video/mp4': {
                    return '.mp4';
                }
                case 'video/MP2T': {
                    return '.m3u8';
                }
                case 'application/x-mpegURL': {
                    return '.ts';
                }
                case 'video/quicktime': {
                    return '.mov';
                }
                case 'audio/wav': {
                    return '.wav';
                }
                case 'audio/amr': {
                    return '.amr';
                }
                case 'audio/mpeg': {
                    return '.mp3';
                }
                case 'audio/aac': {
                    return '.aac';
                }
                case 'audio/ogg': {
                    return '.oga';
                }
                case 'application/pdf': {
                    return '.pdf';
                }
                case 'application/msword': {
                    return '.doc';
                }
            }
        }

        uploadFile(attchment: Models.Attachment): angular.IPromise<string> {
            var deferred = this.$q.defer<string>();

            var options = <FileUploadOptions>{};
            options.fileKey = "file";
            options.fileName = attchment.fileUri.substr(attchment.fileUri.lastIndexOf('/') + 1);

            if (options.fileName.lastIndexOf('.') === -1) {
                var fileExtension = this.getFileExtension(attchment);
                options.fileName += fileExtension;
            }

            options.mimeType = attchment.type;
            options.params = {};
            options.httpMethod = "POST";
            var headers: any = {};
            options.headers = headers;
            options.headers['timezoneOffset'] = new Date().getTimezoneOffset();

            var authData = this.authService.getExistingAuthData();
            if (authData) {
                options.headers['Authorization'] = 'Bearer ' + authData.token;
            }

            var ft = new FileTransfer();

            ft.upload(attchment.fileUri, encodeURI(HttpService.serviceBase + 'api/files'),
                (response: FileUploadResult) => {
                    deferred.resolve(response.response.replace(/\"/g, ""));
                },
                (err) => {
                    deferred.reject(err);
                },
                options);

            return deferred.promise;

        }

        uploadFeedback(feedback: IFeedbackData): ng.IPromise<void> {
            var deferred = this.$q.defer<void>();

            this.$http.post(HttpService.serviceBase + 'api/feedbacks', JSON.stringify(feedback))
                .success((data) => { deferred.resolve(); })
                .error((data, status) => { deferred.reject(this.onError(data, status)); });

            return deferred.promise;
        }

        getDataList(id: string): angular.IPromise<angular.IHttpPromiseCallbackArg<Models.DataListItem[]>> {
            var deferred = this.$q.defer();

            var url = HttpService.serviceBase + "api/dataLists/" + id;
            this.$http.get(url)
                .success((data) => {
                    deferred.resolve(data);
                })
                .error((data, status) => {
                    deferred.reject(this.onError(data, status));
                });

            return deferred.promise;
        }

        getUserSurveys(projectId: string): ng.IPromise<Array<Models.Survey>> {
            var deferred = this.$q.defer<Array<Models.Survey>>();

            this.$http.get(HttpService.serviceBase + 'api/surveys/user/' + projectId)
                .success((data: Models.Survey[]) => { deferred.resolve(data); })
                .error((data, status) => { deferred.reject(this.onError(data, status)); });

            return deferred.promise;
        }

        onError(err: any, status: number) {

            if (err) {
                if (err.error_description) {
                    return err.error_description;
                }
                else {
                    return err;
                }
            }
            else {
                return status + ': Server connection failed!';
            }
        }

        updateProfile(model: Models.IProfileModel): ng.IPromise<void> {
            var deferred = this.$q.defer<void>();

            this.$http.post(HttpService.serviceBase + 'api/account/updateprofile', model)
                .success((result: any) => {
                    deferred.resolve(result);
                })
                .error((err, status) => {
                    deferred.reject(this.onError(err, status));
                });

            return deferred.promise;
        }

        changePassword(model: Models.IChangePasswordModel): ng.IPromise<void> {
            var deferred = this.$q.defer<void>();

            this.$http.post(HttpService.serviceBase + 'api/account/changePassword', model)
                .success((result: any) => {
                    deferred.resolve(result);
                })
                .error((err, status) => {
                    deferred.reject(this.onError(err, status));
                });

            return deferred.promise;
        }
    }

    angular.module('lm.surveys').service("httpService", HttpService);
}