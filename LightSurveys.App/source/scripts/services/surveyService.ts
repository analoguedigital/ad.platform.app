﻿
module App.Services {
    "use strict";

    export interface ISurveyService {
        getFormTemplates(): ng.IPromise<Array<Models.FormTemplate>>;
        getFormTemplate(id: string): ng.IPromise<Models.FormTemplate>;
        refreshData(): ng.IPromise<void>;
        saveTemplate(template: Models.FormTemplate): ng.IPromise<Models.FormTemplate>;
        uploadAllSurveys(): ng.IPromise<void>;
        startSurvey(template: Models.FormTemplate): ng.IPromise<Models.Survey>;
        getSurvey(id: string): ng.IPromise<Models.Survey>;
        saveDraft(survey: Models.Survey): ng.IPromise<Models.Survey>;
        submitSurvey(survey: Models.Survey): ng.IPromise<Models.Survey>;
        delete(id: string): ng.IPromise<void>;
        getDrafts(formTemplateId: string): ng.IPromise<Array<Models.Survey>>;
        getSubmittedSurveys(formTemplateId: string): ng.IPromise<Array<Models.Survey>>;
        getAllSubmittedSurveys(): ng.IPromise<Array<Models.Survey>>;
        getAllSavedSurveys(formTemplateId: string): ng.IPromise<Array<Models.Survey>>;
        getProjects(): ng.IPromise<Array<Models.Project>>;
        getTemplateWithValues(surveyId: string): ng.IPromise<Models.FormTemplate>;
    }

    export class UploadProgress {
        totalNumber: number = 0;
        totalProcessed: number = 0;
        totalSuccessful: number = 0;
        totalErrors: number = 0;
        errorMessages: string[] = [];
    }

    class SurveyService implements ISurveyService {

        static $inject: string[] = ['$q', '$timeout', 'storageService', 'httpService', 'userService', 'locationService'];

        SURVEY_OBJECT_TYPE: string = 'survey';
        FORM_TEMPLATE_OBJECT_TYPE: string = 'formTemplate';
        PROJECT_OBJECT_TYPE: string = 'project';
        ATTACHMENT_OBJECT_TYPE: string = "attachment";

        formTemplates: Models.FormTemplate[];
        projects: Models.Project[];

        constructor(
            private $q: ng.IQService,
            private $timeout: ng.ITimeoutService,
            private storageService: IStorageService,
            private httpService: IHttpService,
            private userService: IUserService,
            private locationService: ILocationService) { }


        refreshData(): ng.IPromise<void> {
            return this.refreshProjects()
                .then(() => { return this.refreshTemplates(); });
        }

        refreshTemplates(): ng.IPromise<void> {

            var q = this.$q.defer<void>();

            this.httpService.getFormTemplates()
                .then(
                (forms) => {
                    var promises: Array<ng.IPromise<void>> = [];

                    angular.forEach(forms, (form) => {

                        var deferred = this.$q.defer<void>();
                        promises.push(deferred.promise);

                        this.storageService.save(this.FORM_TEMPLATE_OBJECT_TYPE, null, form.id, form)
                            .then(() => { deferred.resolve(); }, (err) => { deferred.reject(err); });
                    });

                    this.$q.all(promises).then(() => {
                        this.formTemplates = undefined;
                        q.resolve();
                    });
                },
                (err) => { q.reject(err); });

            return q.promise
        }

        saveTemplate(form: Models.FormTemplate): ng.IPromise<Models.FormTemplate> {
            return this.storageService.save(this.FORM_TEMPLATE_OBJECT_TYPE, null, form.id, form);
        }

        refreshProjects(): ng.IPromise<void> {

            var q = this.$q.defer<void>();

            this.httpService.getProjects()
                .then(
                (projects) => {
                    var promises: Array<ng.IPromise<void>> = [];

                    angular.forEach(projects, (project) => {

                        var deferred = this.$q.defer<void>();
                        promises.push(deferred.promise);

                        this.storageService.save(this.PROJECT_OBJECT_TYPE, null, project.id, project)
                            .then(() => { deferred.resolve(); }, (err) => { deferred.reject(err); });
                    });

                    this.$q.all(promises).then(() => {
                        this.projects = undefined;
                        q.resolve();
                    });
                },
                (err) => { q.reject(err); });

            return q.promise
        }


        uploadAllSurveys(): ng.IPromise<void> {

            var q = this.$q.defer<void>();

            var progressStates = {};

            this.getFormTemplates()
                .then(
                (templates) => {
                    var promises: Array<ng.IPromise<void>> = [];

                    angular.forEach(templates, (template) => {

                        var deferred = this.$q.defer<void>();
                        promises.push(deferred.promise);

                        this.getSubmittedSurveys(template.id)
                            .then((surveys) => {

                                this.uploadSurveys(surveys)
                                    .then(
                                    () => { deferred.resolve(); },
                                    (err) => { },
                                    (state: UploadProgress) => {
                                        progressStates[template.id] = state;

                                        var progress = new UploadProgress();
                                        angular.forEach(progressStates, (state: UploadProgress) => {
                                            progress.totalNumber += state.totalNumber;
                                            progress.totalProcessed += state.totalProcessed;
                                            progress.totalSuccessful += state.totalSuccessful;
                                            progress.totalErrors += state.totalErrors;
                                            angular.forEach(state.errorMessages, (err) => {
                                                progress.errorMessages.push(err);
                                            });
                                        });

                                        q.notify(progress);
                                    });
                            });
                    });

                    this.$q.all(promises).then(() => { q.resolve(); });

                },
                (err) => { q.reject(err); });

            return q.promise;
        }


        private uploadSurveys(surveys: Array<Models.Survey>): ng.IPromise<void> {

            var q = this.$q.defer<void>();
            var uploadPromises: Array<ng.IPromise<void>> = [];

            var progress = new UploadProgress();
            progress.totalNumber = surveys.length;

            angular.forEach(surveys, (survey) => {

                var deferredUpload = this.$q.defer<void>();
                uploadPromises.push(deferredUpload.promise);

                this.uploadSurvey(survey)
                    .then(
                    () => {
                        progress.totalProcessed++
                        progress.totalSuccessful++;
                        deferredUpload.resolve();
                        q.notify(progress);
                    },
                    (err) => {
                        progress.totalProcessed++
                        progress.totalErrors++;
                        progress.errorMessages.push(err);
                        deferredUpload.resolve();
                        q.notify(progress);
                    });


            });

            this.$q.all(uploadPromises).then(() => { q.resolve(); });

            return q.promise;
        }

        private uploadAttachments(survey: Models.Survey): ng.IPromise<Models.Survey> {

            var q = this.$q.defer<Models.Survey>();

            var promises: Array<ng.IPromise<void>> = [];

            survey.formValues.forEach((formValue) => {
                if (!formValue.attachments) return;

                var fvPromises: Array<ng.IPromise<void>> = [];

                formValue.attachments.forEach((attachment) => {
                    if (attachment.uploadGuid && attachment.uploadGuid !== '') return;

                    var deferred = this.$q.defer<void>();
                    promises.push(deferred.promise);
                    fvPromises.push(deferred.promise);

                    this.httpService.uploadFile(attachment).then
                        ((guid) => {
                            attachment.uploadGuid = guid;
                            attachment.uploadError = '';
                            deferred.resolve();
                        },
                        (err) => {
                            attachment.uploadGuid = '';
                            attachment.uploadError = err;
                            deferred.reject(deferred);
                        });;
                });

                if (fvPromises.length) {
                    this.$q.all(fvPromises).then(() => {
                        formValue.textValue = _.map(formValue.attachments, 'uploadGuid').join(',');
                    })
                }

            });

            if (promises.length) {
                this.$q.all(promises).then
                    (() => {
                        this.storageService.save(this.SURVEY_OBJECT_TYPE, survey.formTemplateId, survey.id, survey)
                            .then(
                            (survey) => {

                                q.resolve(survey);
                            },
                            (err) => {
                                q.reject(err);
                            })
                    },
                    (err) => { q.reject(err); });
            }
            else {
                q.resolve(survey);
            }

            return q.promise;
        }

        private uploadSurvey(survey: Models.Survey): ng.IPromise<void> {
            var q = this.$q.defer<void>();

            this.uploadAttachments(survey).then(
                (updatedSurvey) => {
                    this.httpService.uploadSurvey(updatedSurvey)
                        .then(
                        () => {
                            // this.softDelete(survey.id)
                            //     .then(() => { q.resolve(); });
                            q.resolve();
                        },
                        (err) => {
                            survey.error = err;
                            this.saveSurvey(updatedSurvey)
                                .then(
                                () => { q.reject(err); },
                                () => { q.reject(err); });
                        });
                },
                (err) => { q.reject(err); });

            return q.promise;
        }

        private filterForProject(source: Array<Models.FormTemplate>): Array<Models.FormTemplate> {
            return _.filter(source, (template) => {
                return template.isPublished && (template.projectId === null || template.projectId === this.userService.current.project.id);
            });
        }

        getFormTemplates(): ng.IPromise<Array<Models.FormTemplate>> {

            var q = this.$q.defer<Array<Models.FormTemplate>>();
            if (this.formTemplates === undefined) {
                this.storageService.getAll(this.FORM_TEMPLATE_OBJECT_TYPE, null)
                    .then((templates: Array<Models.FormTemplate>) => {
                        this.formTemplates = templates;
                        q.resolve(this.filterForProject(this.formTemplates));
                    }, (err) => { q.reject(err); });
            }
            else {
                q.resolve(this.filterForProject(this.formTemplates));
            }

            return q.promise;
        }


        getFormTemplate(id: string): ng.IPromise<Models.FormTemplate> {

            if (this.formTemplates !== undefined) {
                var q = this.$q.defer<Models.FormTemplate>();
                q.resolve(_.find(this.formTemplates, { 'id': id }));
                return q.promise;
            }

            return this.storageService.getObj(this.FORM_TEMPLATE_OBJECT_TYPE, id);
        }


        startSurvey(template: Models.FormTemplate): ng.IPromise<Models.Survey> {
            var survey = new Models.Survey(this.userService.current.userId, this.userService.current.project.id, template.id);
            return this.storageService.save(this.SURVEY_OBJECT_TYPE, template.id, survey.id, survey);
        }


        getSurvey(id: string): ng.IPromise<Models.Survey> {
            return this.storageService.getObj(this.SURVEY_OBJECT_TYPE, id);
        }

        deleteFormTemplate(formTemplate: Models.FormTemplate) {
            var q = this.$q.defer();
            formTemplate.isPublished = false;

            this.httpService.deleteFormTemplate(formTemplate.id)
                .then(() => {
                    this.storageService.save(this.FORM_TEMPLATE_OBJECT_TYPE, null, formTemplate.id, formTemplate)
                        .then((survey) => { q.resolve(survey); }, (err) => { q.reject(err); });
                },
                (err) => { q.reject(err); });

            return q.promise;
        }

        saveSurvey(survey: Models.Survey): ng.IPromise<Models.Survey> {

            var q = this.$q.defer();

            this.storageService.save(this.SURVEY_OBJECT_TYPE, survey.formTemplateId, survey.id, survey)
                .then((survey) => {

                    var promises: Array<ng.IPromise<void>> = [];

                    survey.formValues.forEach((formValue) => {
                        if (!formValue.attachments) return;

                        formValue.attachments.forEach((attachment) => {
                            if (!attachment.tempStorage) return;

                            var deferred = this.$q.defer<void>();
                            promises.push(deferred.promise);

                            this.storageService.saveFile(this.ATTACHMENT_OBJECT_TYPE, "", attachment.fileUri).then
                                ((newFileUri) => {
                                    attachment.fileUri = newFileUri;
                                    attachment.tempStorage = false;
                                    deferred.resolve();
                                },
                                (err) => { deferred.reject(deferred); });;
                        });

                    });

                    this.$q.all(promises).then
                        (() => {
                            this.storageService.save(this.SURVEY_OBJECT_TYPE, survey.formTemplateId, survey.id, survey)
                                .then(
                                (survey) => { q.resolve(survey) },
                                (err) => { q.reject(err); })
                        },
                        (err) => { q.reject(err); });

                },
                (err) => { q.reject(err); });

            return q.promise;
        }


        saveDraft(survey: Models.Survey): ng.IPromise<Models.Survey> {
            survey.dateUpdated = _.now();
            survey.projectId = this.userService.current.project.id;
            return this.saveSurvey(survey);
        }


        submitSurvey(survey: Models.Survey): ng.IPromise<Models.Survey> {

            var q = this.$q.defer();
            survey.dateUpdated = _.now();
            survey.projectId = this.userService.current.project.id;
            survey.isSubmitted = true;
            this.saveSurvey(survey).then((survey) => {
                q.resolve(survey);
                this.updateLocation(survey, Models.PositionEvents.Submission).then(() => {
                    this.uploadSurvey(survey);
                }, (err) => {
                    this.uploadSurvey(survey);
                });
            });

            return q.promise;
        }

        updateLocation(survey: Models.Survey, event: string): ng.IPromise<void> {

            var q = this.$q.defer<void>();

            this.locationService.getCurrentPosition()
                .then(
                (position) => {
                    position.event = event;
                    if (survey.locations === undefined)
                        survey.locations = [];
                    survey.locations.push(position);
                    this.saveSurvey(survey)
                        .then(() => { q.resolve(); });
                },
                (errPosition) => {
                    if (survey.locations === undefined)
                        survey.locations = [];
                    survey.locations.push(errPosition);
                    this.saveSurvey(survey)
                        .then(() => { q.reject(); });
                });

            return q.promise;
        }

        delete(id: string): ng.IPromise<void> {
            return this.storageService.delete(this.SURVEY_OBJECT_TYPE, id);
        }

        softDelete(id: string): ng.IPromise<void> {
            return this.storageService.softDelete(this.SURVEY_OBJECT_TYPE, id);
        }


        getDraftsNumber(formTemplateId: string): ng.IPromise<number> {
            var q = this.$q.defer<number>();

            this.getAllSavedSurveys(formTemplateId)
                .then((surveys: Array<Models.Survey>) => {
                    q.resolve(_.filter(surveys, { 'projectId': this.userService.current.project.id }).length);
                });

            return q.promise;
        }


        getAllSavedSurveys(formTemplateId: string): ng.IPromise<Array<Models.Survey>> {
            var q = this.$q.defer<Array<Models.Survey>>();

            this.storageService.getAll(this.SURVEY_OBJECT_TYPE, formTemplateId)
                .then((surveys: Array<Models.Survey>) => {
                    q.resolve(_.filter(surveys, { 'projectId': this.userService.current.project.id }));
                });

            return q.promise;
        }


        getAllSubmittedSurveys(): ng.IPromise<Array<Models.Survey>> {

            var allSurveys = [];
            var q = this.$q.defer<Array<Models.Survey>>();

            this.getFormTemplates()
                .then(
                (templates) => {
                    var promises: Array<ng.IPromise<void>> = [];

                    angular.forEach(templates, (template) => {

                        var deferred = this.$q.defer<void>();
                        promises.push(deferred.promise);

                        this.getSubmittedSurveys(template.id)
                            .then((surveys) => {
                                for (var i = 0; i < surveys.length; i++)
                                    surveys[i].formTemplate = template;
                                allSurveys = allSurveys.concat(surveys);
                                deferred.resolve();
                            });
                    });

                    this.$q.all(promises).then(() => { q.resolve(allSurveys); });

                },
                (err) => { q.reject(err); });

            return q.promise;
        }



        getDrafts(formTemplateId: string): ng.IPromise<Array<Models.Survey>> {
            return this.getAllSavedSurveys(formTemplateId)
                .then(
                (savedSurveys) => {
                    return _.filter(savedSurveys, { 'isSubmitted': false });
                });
        }


        getSubmittedSurveys(formTemplateId: string): ng.IPromise<Array<Models.Survey>> {
            return this.getAllSavedSurveys(formTemplateId)
                .then(
                (savedSurveys) => {
                    return _.filter(savedSurveys, { 'isSubmitted': true });
                });
        }


        getProjects(): ng.IPromise<Array<Models.Project>> {
            return this.storageService.getAll(this.PROJECT_OBJECT_TYPE, null);
        }


        getTemplateWithValues(surveyId: string): ng.IPromise<Models.FormTemplate> {
            var q = this.$q.defer();

            this.getSurvey(surveyId)
                .then(
                (survey) => {

                    var formValues = survey.formValues;

                    this.getFormTemplate(survey.formTemplateId)
                        .then(
                        (formTemplate) => {
                            formTemplate.survey = survey;
                            q.resolve(formTemplate);
                        },
                        (err) => { q.reject(err); });
                },
                (err) => { q.reject(err); });

            return q.promise;
        }
    }

    angular.module('lm.surveys').service('surveyService', SurveyService);
}