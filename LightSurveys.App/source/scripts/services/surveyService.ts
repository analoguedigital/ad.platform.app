declare var moment: any;

module App.Services {
    "use strict";

    export interface ISurveyService {
        refreshData(): ng.IPromise<void>;

        getProjects(): ng.IPromise<Array<Models.Project>>;
        getFormTemplates(): ng.IPromise<Array<Models.FormTemplate>>;
        getAdviceThreads(): ng.IPromise<Array<Models.FormTemplate>>;
        getUserSurveys(projectId: string): ng.IPromise<Array<Models.Survey>>;

        getFormTemplate(id: string): ng.IPromise<Models.FormTemplate>;
        getTemplateWithValues(surveyId: string): ng.IPromise<Models.FormTemplate>;
        getSurvey(id: string): ng.IPromise<Models.Survey>;
        getDrafts(formTemplateId: string): ng.IPromise<Array<Models.Survey>>;
        getSubmittedSurveys(formTemplateId: string): ng.IPromise<Array<Models.Survey>>;
        getAllSubmittedSurveys(): ng.IPromise<Array<Models.Survey>>;
        getAllSavedSurveys(formTemplateId: string): ng.IPromise<Array<Models.Survey>>;

        startSurvey(template: Models.FormTemplate): ng.IPromise<Models.Survey>;
        saveDraft(survey: Models.Survey): ng.IPromise<Models.Survey>;
        saveTemplate(template: Models.FormTemplate): ng.IPromise<Models.FormTemplate>;

        submitSurvey(survey: Models.Survey): ng.IPromise<Models.Survey>;
        uploadAllSurveys(): ng.IPromise<void>;

        delete(id: string): ng.IPromise<void>;
        clearLocalData(): ng.IPromise<void>;
        deleteSubmittedSurveys(): ng.IPromise<void>;
    }

    export class UploadProgress {
        totalNumber: number = 0;
        totalProcessed: number = 0;
        totalSuccessful: number = 0;
        totalErrors: number = 0;
        errorMessages: string[] = [];
    }

    class SurveyService implements ISurveyService {
        static $inject: string[] = ['$q', '$timeout', 'storageService', 'localStorageService', 'httpService', 'userService', 'locationService', 'toastr', '$ionicLoading'];

        SURVEY_OBJECT_TYPE: string = 'survey';
        FORM_TEMPLATE_OBJECT_TYPE: string = 'formTemplate';
        ADVICE_THREAD_OBJECT_TYPE: string = 'adviceThread';
        PROJECT_OBJECT_TYPE: string = 'project';
        ATTACHMENT_OBJECT_TYPE: string = "attachment";

        SURVEY_KEY = 'survey/';
        FORM_TEMPLATE_KEY = 'thread/';
        ADVICE_THREAD_KEY = 'adviceThread/';
        PROJECT_KEY = 'project/';

        CAPTURE_IN_PROGRESS_KEY = 'capture-in-progress';
        WELLDONE_POPUP_KEY = 'WELL_DONE_POPUP_SHOWN';
        APP_BOOTSTRAPPED_KEY = 'APP_BOOTSTRAPPED';

        projects: Models.Project[];
        formTemplates: Models.FormTemplate[];
        adviceThreads: Models.FormTemplate[];

        config = {
            keepUploadedSurveys: true,
        };

        constructor(
            private $q: ng.IQService,
            private $timeout: ng.ITimeoutService,
            private storageService: IStorageService,
            private localStorageService: ng.local.storage.ILocalStorageService,
            private httpService: IHttpService,
            private userService: IUserService,
            private locationService: ILocationService,
            private toastr: any,
            private $ionicLoading: ionic.loading.IonicLoadingService) { }

        clearLocalData(): ng.IPromise<void> {
            let q = this.$q.defer<void>();

            this.localStorageService.clearAll(/(project)\//i);
            this.localStorageService.clearAll(/(thread)\//i);
            this.localStorageService.clearAll(/(adviceThread)\//i);
            this.localStorageService.clearAll(/(survey)\//i);
            this.localStorageService.clearAll(/(scrollPosition)\//i);

            this.localStorageService.remove(this.CAPTURE_IN_PROGRESS_KEY);
            this.localStorageService.remove(this.WELLDONE_POPUP_KEY);
            this.localStorageService.remove(this.APP_BOOTSTRAPPED_KEY);

            this.storageService.deleteAllObjectsOfType(this.ATTACHMENT_OBJECT_TYPE).then(() => {
                q.resolve();
            }, (err) => {
                q.reject(err);
            });

            return q.promise;
        }

        deleteSubmittedSurveys(): ng.IPromise<void> {
            let q = this.$q.defer<void>();

            let lsKeys = this.localStorageService.keys();
            let surveyKeys = _.filter(lsKeys, (key) => { return _.startsWith(key, this.SURVEY_KEY); });

            let submittedSurveys = [];
            _.forEach(surveyKeys, (skey) => {
                let survey: any = this.localStorageService.get(skey);
                if (survey.isSubmitted == true) {
                    submittedSurveys.push(skey);
                }
            });

            _.forEach(submittedSurveys, (item) => {
                this.localStorageService.remove(item);
            });

            q.resolve();

            return q.promise;
        }

        refreshData(): ng.IPromise<void> {
            let deferred = this.$q.defer<void>();

            let promises: Array<ng.IPromise<void>> = [];
            promises.push(this.refreshProjects());
            promises.push(this.refreshTemplates());
            promises.push(this.refreshAdviceThreads());

            this.$q.all(promises).then(() => {
                deferred.resolve();
            }, (err) => {
                deferred.reject();
            });

            return deferred.promise;
        }

        refreshProjects(): ng.IPromise<void> {
            let q = this.$q.defer<void>();

            this.httpService.getProjects().then((projects) => {
                angular.forEach(projects, (project) => {
                    let key = this.PROJECT_KEY + project.id;
                    this.localStorageService.set(key, project);
                });

                this.projects = undefined;
                q.resolve();
            }, (err) => {
                q.reject(err);
            });

            return q.promise
        }

        refreshTemplates(): ng.IPromise<void> {
            let q = this.$q.defer<void>();

            // pass in the discriminator:
            // 0 - regular threads
            // 1 - advice threads

            this.httpService.getFormTemplates(0)
                .then((forms) => {
                    angular.forEach(forms, (form) => {
                        let key = this.FORM_TEMPLATE_KEY + form.id;
                        this.localStorageService.set(key, form);
                    });

                    this.formTemplates = undefined;
                    q.resolve();
                }, (err) => {
                    q.reject(err);
                });

            return q.promise
        }

        refreshAdviceThreads(): ng.IPromise<void> {
            let q = this.$q.defer<void>();

            // pass in the discriminator:
            // 0 - regular threads
            // 1 - advice threads

            this.httpService.getFormTemplates(1)
                .then((forms) => {
                    angular.forEach(forms, (form) => {
                        let key = this.ADVICE_THREAD_KEY + form.id;
                        this.localStorageService.set(key, form);
                    });

                    this.adviceThreads = undefined;
                    q.resolve();
                }, (err) => {
                    q.reject(err);
                });

            return q.promise
        }

        saveTemplate(form: Models.FormTemplate): ng.IPromise<Models.FormTemplate> {
            let deferred = this.$q.defer<Models.FormTemplate>();

            let key = this.FORM_TEMPLATE_KEY + form.id;
            let stored = this.localStorageService.set(key, form);
            deferred.resolve(form);

            return deferred.promise;
        }

        uploadAllSurveys(): ng.IPromise<void> {
            let q = this.$q.defer<void>();
            let progressStates = {};

            this.getFormTemplates().then((templates) => {
                let promises: Array<ng.IPromise<void>> = [];

                angular.forEach(templates, (template) => {
                    let deferred = this.$q.defer<void>();
                    promises.push(deferred.promise);

                    this.getSubmittedSurveys(template.id)
                        .then((surveys) => {
                            let surveysToUpload = _.filter(surveys, (survey) => { return survey.dateUploaded === null; });
                            if (surveysToUpload.length) {
                                this.uploadSurveys(surveysToUpload)
                                    .then(() => {
                                        deferred.resolve();
                                    }, (err) => {
                                        deferred.reject();
                                    }, (state: UploadProgress) => {
                                        progressStates[template.id] = state;

                                        let progress = new UploadProgress();
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
                            } else {
                                deferred.resolve();
                            }
                        }, (err) => {
                            deferred.reject(err);
                        });
                });

                this.$q.all(promises).then(() => {
                    q.resolve();
                });
            }, (err) => {
                q.reject(err);
            });

            return q.promise;
        }

        private uploadSurveys(surveys: Array<Models.Survey>): ng.IPromise<void> {
            let q = this.$q.defer<void>();
            let uploadPromises: Array<ng.IPromise<void>> = [];

            let progress = new UploadProgress();
            progress.totalNumber = surveys.length;

            angular.forEach(surveys, (survey) => {
                let deferredUpload = this.$q.defer<void>();
                uploadPromises.push(deferredUpload.promise);

                this.uploadSurvey(survey)
                    .then(() => {
                        progress.totalProcessed++
                        progress.totalSuccessful++;
                        deferredUpload.resolve();
                        q.notify(progress);
                    }, (err) => {
                        progress.totalProcessed++
                        progress.totalErrors++;
                        progress.errorMessages.push(err);
                        deferredUpload.resolve();
                        q.notify(progress);
                        // deferredUpload.reject(err);
                    });
            });

            this.$q.all(uploadPromises).then(() => {
                q.resolve();
            }, (err) => {
                q.reject(err);
            });

            return q.promise;
        }

        private uploadAttachments(survey: Models.Survey): ng.IPromise<Models.Survey> {
            let self = this;

            let surveyPromise = this.$q.defer<Models.Survey>();
            let promises: Array<ng.IPromise<void>> = [];

            survey.formValues.forEach((formValue) => {
                if (!formValue.attachments) return;

                let attachmentPromises: Array<ng.IPromise<void>> = [];

                let fvPromise = this.$q.defer<void>();
                promises.push(fvPromise.promise);

                formValue.attachments.forEach((attachment) => {
                    if (attachment.uploadGuid && attachment.uploadGuid !== '') return;

                    let deferred = this.$q.defer<void>();
                    attachmentPromises.push(deferred.promise);

                    this.httpService.uploadFile(attachment)
                        .then((guid) => {
                            attachment.uploadGuid = guid;
                            attachment.uploadError = '';
                            deferred.resolve();
                        }, (err) => {
                            attachment.uploadGuid = '';
                            attachment.uploadError = err;
                            deferred.reject(err);
                        });;
                });

                if (attachmentPromises.length) {
                    this.$ionicLoading.show({
                        template: '<i class="fa fa-circle-o-notch fa-spin fa-fw"></i> Uploading attachments...'
                    });

                    this.$q.all(attachmentPromises).then(() => {
                        this.$ionicLoading.hide();
                        formValue.textValue = _.map(formValue.attachments, 'uploadGuid').join(',');
                        fvPromise.resolve();
                    }, (err) => {
                        fvPromise.reject();
                    });
                } else {
                    fvPromise.resolve();
                }
            });

            if (promises.length) {
                this.$q.all(promises).then(() => {
                    let key = this.SURVEY_KEY + survey.id;
                    this.localStorageService.set(key, survey);
                    surveyPromise.resolve(survey);
                }, (err) => {
                    surveyPromise.reject(err);
                });
            }
            else {
                surveyPromise.resolve(survey);
            }

            return surveyPromise.promise;
        }

        private uploadSurvey(survey: Models.Survey): ng.IPromise<void> {
            let q = this.$q.defer<void>();

            this.uploadAttachments(survey)
                .then((updatedSurvey) => {
                    this.saveSurvey(updatedSurvey).then(() => {
                        this.httpService.uploadSurvey(updatedSurvey).then(() => {
                            updatedSurvey.dateUploaded = new Date(new Date().toISOString());
                            updatedSurvey.isSubmitted = true;

                            this.saveSurvey(updatedSurvey).then(() => {
                                this.userService.getExistingProfiles().then((profiles) => {
                                    let profile = profiles[0];
                                    let noStoreEnabled = profile.settings.noStoreEnabled;

                                    this.config.keepUploadedSurveys = !noStoreEnabled;
                                    if (!this.config.keepUploadedSurveys) {
                                        this.softDelete(survey.id).then(() => {
                                            q.resolve();
                                        });
                                    } else {
                                        q.resolve();
                                    }
                                });
                            }, (err) => {
                                q.reject(err);
                            });
                        }, (err) => {
                            survey.error = err;

                            if (err && err.length) {
                                let statusCode = err.substring(0, 3);
                                if (statusCode === '401') {
                                    this.toastr.error('Unauthorized to upload record!');
                                    this.softDelete(survey.id).then(() => { q.reject(err); });
                                }
                                else {
                                    this.saveSurvey(updatedSurvey)
                                        .then(() => { q.reject(err); }, (err) => { q.reject(err); });
                                }
                            } else {
                                this.saveSurvey(updatedSurvey).then(() => { q.reject(err); }, () => { q.reject(err); });
                            }
                        });
                    });
                }, (err) => {
                    q.reject(err);
                });

            return q.promise;
        }

        private filterForProject(source: Array<Models.FormTemplate>): Array<Models.FormTemplate> {
            return _.filter(source, (template) => {
                return template.isPublished && (template.projectId === null || template.projectId === this.userService.current.project.id);
            });
        }

        getFormTemplateMetadata(formTemplate: Models.FormTemplate): ng.IPromise<Models.FormTemplate> {
            let d = this.$q.defer<Models.FormTemplate>();

            _.forEach(formTemplate.metricGroups, (group) => {
                if (!group.isRepeater) {
                    _.forEach(group.metrics, (metric) => {
                        if (_.includes(metric.type.toLowerCase(), 'time')) {
                            formTemplate.timeMetricId = metric.id;
                        }
                    });
                }
            });

            d.resolve(formTemplate);

            return d.promise;
        }

        getFormTemplates(): ng.IPromise<Array<Models.FormTemplate>> {
            let q = this.$q.defer<Array<Models.FormTemplate>>();

            if (this.formTemplates === undefined) {
                let lsKeys = this.localStorageService.keys();
                let threadKeys = _.filter(lsKeys, (key) => { return _.startsWith(key, this.FORM_TEMPLATE_KEY); });

                let templates = [];
                _.forEach(threadKeys, (tk) => {
                    templates.push(this.localStorageService.get(tk));
                });

                this.formTemplates = templates;
                let result = this.filterForProject(this.formTemplates);

                _.forEach(result, (template) => {
                    this.getFormTemplateMetadata(template).then((t) => { template = t; });
                });

                q.resolve(result);
            }
            else {
                let templates = this.filterForProject(this.formTemplates);
                _.forEach(templates, (template) => {
                    this.getFormTemplateMetadata(template).then((t) => { template = t; });
                });

                q.resolve(templates);
            }

            return q.promise;
        }

        getAdviceThreads(): ng.IPromise<Array<Models.FormTemplate>> {
            let q = this.$q.defer<Array<Models.FormTemplate>>();

            if (this.adviceThreads === undefined) {
                let lsKeys = this.localStorageService.keys();
                let adviceThreadKeys = _.filter(lsKeys, (key) => { return _.startsWith(key, this.ADVICE_THREAD_KEY); });

                let templates = [];
                _.forEach(adviceThreadKeys, (atk) => {
                    templates.push(this.localStorageService.get(atk));
                });

                this.adviceThreads = templates;
                let result = this.filterForProject(this.adviceThreads);

                _.forEach(result, (template) => {
                    this.getFormTemplateMetadata(template).then((t) => { template = t; });
                });

                q.resolve(result);
            }
            else {
                let templates = this.filterForProject(this.adviceThreads);

                _.forEach(templates, (template) => {
                    this.getFormTemplateMetadata(template).then((t) => { template = t; });
                });

                q.resolve(templates);
            }

            return q.promise;
        }

        getFormTemplate(id: string): ng.IPromise<Models.FormTemplate> {
            let q = this.$q.defer<Models.FormTemplate>();

            if (this.formTemplates !== undefined) {
                let template = _.find(this.formTemplates, { 'id': id });
                if (template !== undefined) {
                    this.getFormTemplateMetadata(template).then((t) => {
                        template = t;
                        q.resolve(template);
                    }, (err) => {
                        q.reject(err);
                    });
                } else {
                    this.httpService.getFormTemplate(id)
                        .then((data: any) => {
                            this.getFormTemplateMetadata(data).then((t) => {
                                data = t;
                                q.resolve(data);
                            }, (err) => {
                                q.reject(err);
                            });
                        }, (err) => {
                            q.reject(err);
                        });
                }

                return q.promise;
            }

            let key = this.FORM_TEMPLATE_KEY + id;
            let formTemplate: Models.FormTemplate = <Models.FormTemplate>this.localStorageService.get(key);

            if (formTemplate !== undefined) {
                this.getFormTemplateMetadata(formTemplate).then((template) => {
                    formTemplate = template;
                    q.resolve(template);
                });
            } else {
                this.httpService.getFormTemplate(id).then((data: any) => {
                    this.getFormTemplateMetadata(data).then((t) => { data = t; });
                    q.resolve(data);
                });
            }

            return q.promise;
        }

        startSurvey(template: Models.FormTemplate): ng.IPromise<Models.Survey> {
            let deferred = this.$q.defer<Models.Survey>();
            let survey = new Models.Survey(this.userService.current.userId, this.userService.current.project.id, template.id);

            let key = this.SURVEY_KEY + survey.id;
            this.localStorageService.set(key, survey);
            deferred.resolve(survey);

            return deferred.promise;
        }

        getSurvey(id: string): ng.IPromise<Models.Survey> {
            let d = this.$q.defer<Models.Survey>();

            let key = this.SURVEY_KEY + id;
            let survey: any = this.localStorageService.get(key);

            this.getSurveyMetadata(survey).then((s) => {
                d.resolve(s);
            });

            return d.promise;
        }

        deleteFormTemplate(formTemplate: Models.FormTemplate) {
            let q = this.$q.defer();
            formTemplate.isPublished = false;

            this.httpService.deleteFormTemplate(formTemplate.id)
                .then(() => {
                    let key = this.FORM_TEMPLATE_KEY + formTemplate.id;
                    this.localStorageService.set(key, formTemplate);

                    q.resolve(formTemplate);
                }, (err) => {
                    q.reject(err);
                });

            return q.promise;
        }

        saveSurvey(survey: Models.Survey): ng.IPromise<Models.Survey> {
            let q = this.$q.defer<Models.Survey>();

            this.getFormTemplate(survey.formTemplateId)
                .then((template) => {
                    let promises: Array<ng.IPromise<void>> = [];
                    let attachmentPromises: Array<ng.IPromise<void>> = [];

                    _.forEach(survey.formValues, (fv: Models.FormValue) => {
                        if (fv.dateValue) {
                            let deferred = this.$q.defer<void>();
                            promises.push(deferred.promise);

                            let dateMetric: Models.Metric = undefined;

                            _.forEach(template.metricGroups, (metricGroup) => {
                                dateMetric = _.find(metricGroup.metrics, (metric) => { return metric.id == fv.metricId });
                            });

                            if (dateMetric) {
                                let dateValue = fv.dateValue;
                                if (!dateMetric.hasTimeValue) {
                                    dateValue.setUTCHours(0);
                                    dateValue.setUTCMinutes(0);
                                    dateValue.setUTCSeconds(0);
                                    dateValue.setUTCMilliseconds(0);
                                }

                                let isoString = dateValue.toISOString();
                                fv.dateValue = new Date(isoString);

                                deferred.resolve();
                            } else {
                                deferred.reject();
                            }
                        }
                    });

                    _.forEach(survey.formValues, (formValue) => {
                        if (!formValue.attachments) return;

                        formValue.attachments.forEach((attachment) => {
                            if (!attachment.tempStorage) return;

                            let attPromise = this.$q.defer<void>();
                            attachmentPromises.push(attPromise.promise);

                            this.storageService.saveFile(this.ATTACHMENT_OBJECT_TYPE, 'attachments_' + survey.id, attachment.fileUri)
                                .then((newFileUri) => {
                                    attachment.fileUri = newFileUri;
                                    attachment.tempStorage = false;
                                    console.log('attachment file saved: ' + attachment.mediaType);
                                    attPromise.resolve();
                                }, (err) => {
                                    console.error('could not save attachment file');
                                    console.error(err);
                                    attPromise.reject(err);
                                });
                        });
                    });

                    let allDateMetricPromises = this.$q.all(promises);
                    let allAttachmentPromises = this.$q.all(attachmentPromises);

                    this.$q.all([allDateMetricPromises, allAttachmentPromises]).then(() => {
                        let key = this.SURVEY_KEY + survey.id;
                        this.localStorageService.set(key, survey);
                        q.resolve(survey);
                    }, (err) => {
                        q.reject(err);
                    });
                }, (err) => {
                    q.reject(err);
                });

            return q.promise;
        }

        saveDraft(survey: Models.Survey): ng.IPromise<Models.Survey> {
            let deferred = this.$q.defer<Models.Survey>();

            this.getFormTemplate(survey.formTemplateId)
                .then((template) => {
                    survey.dateUpdated = new Date(new Date().toISOString());
                    survey.projectId = template.projectId;
                    // survey.projectId = this.userService.current.project.id;

                    this.saveSurvey(survey).then((value) => {
                        deferred.resolve(value);
                    }, (err) => {
                        deferred.reject(err);
                    });
                }, (err) => {
                    deferred.reject(err);
                });

            return deferred.promise;
        }

        submitSurvey(survey: Models.Survey): ng.IPromise<Models.Survey> {
            let q = this.$q.defer<Models.Survey>();

            survey.dateUpdated = new Date(new Date().toISOString());

            this.getFormTemplate(survey.formTemplateId).then((thread: Models.FormTemplate) => {
                // shouldn't use the current projectId, because
                // it wouldn't work for shared threads. instead, 
                // read the ID from the survey template.
                // survey.projectId = this.userService.current.project.id;
                survey.projectId = thread.projectId;

                this.saveSurvey(survey).then((survey) => {
                    this.updateLocation(survey, Models.PositionEvents.Submission).then(() => {
                        this.uploadSurvey(survey).then((res) => {
                            q.resolve(survey);
                        }, (err) => {
                            q.reject(err);
                        });
                    }, (err) => {
                        q.reject(err);
                    });
                }, (err) => {
                    q.reject(err);
                });
            }, (err) => {
                q.reject(err);
            });

            return q.promise;
        }

        updateLocation(survey: Models.Survey, event: string): ng.IPromise<void> {
            let q = this.$q.defer<void>();

            this.locationService.getCurrentPosition()
                .then((position) => {
                    position.event = event;

                    if (survey.locations === undefined)
                        survey.locations = [];

                    survey.locations.push(position);

                    this.saveSurvey(survey).then(() => {
                        q.resolve();
                    }, (err) => {
                        q.reject(err);
                    });
                }, (errPosition) => {
                    if (survey.locations === undefined)
                        survey.locations = [];

                    survey.locations.push(errPosition);

                    this.saveSurvey(survey).then(() => {
                        q.resolve();
                    }, (err) => {
                        q.reject(err);
                    });
                });

            return q.promise;
        }

        delete(id: string): ng.IPromise<void> {
            let deferred = this.$q.defer<void>();

            let key = this.SURVEY_KEY + id;
            this.localStorageService.remove(key);
            deferred.resolve();

            return deferred.promise;
        }

        softDelete(id: string): ng.IPromise<void> {
            let deferred = this.$q.defer<void>();

            let key = this.SURVEY_KEY + id;
            this.localStorageService.remove(key);
            deferred.resolve();

            return deferred.promise;
        }

        deleteAllData(): ng.IPromise<void> {
            let deferred = this.$q.defer<void>();

            this.localStorageService.clearAll(/(survey)\//i);
            deferred.resolve();

            return deferred.promise;
        }

        getDraftsNumber(formTemplateId: string): ng.IPromise<number> {
            let q = this.$q.defer<number>();

            this.getAllSavedSurveys(formTemplateId)
                .then((surveys: Array<Models.Survey>) => {
                    let count = _.filter(surveys, { 'projectId': this.userService.current.project.id }).length;
                    q.resolve(count);
                }, (err) => {
                    q.reject(err);
                });

            return q.promise;
        }

        getAllSavedSurveys(formTemplateId: string): ng.IPromise<Array<Models.Survey>> {
            let q = this.$q.defer<Array<Models.Survey>>();

            let lsKeys = this.localStorageService.keys();
            let surveyKeys = _.filter(lsKeys, (key) => { return _.startsWith(key, this.SURVEY_KEY); });

            let surveys = [];
            _.forEach(surveyKeys, (skey) => {
                let surveyData: any = this.localStorageService.get(skey);
                if (surveyData.formTemplateId === formTemplateId) {
                    surveys.push(surveyData);
                }
            });

            // old code. filter surveys by current project.
            // let result = _.filter(surveys, { 'projectId': this.userService.current.project.id });

            _.forEach(surveys, (survey) => {
                this.getSurveyMetadata(survey).then((result) => {
                    survey = result;
                });
            });

            q.resolve(surveys);

            return q.promise;
        }

        getAllSubmittedSurveys(): ng.IPromise<Array<Models.Survey>> {
            let q = this.$q.defer<Array<Models.Survey>>();
            let allSurveys = [];

            this.getFormTemplates()
                .then((templates) => {
                    let promises: Array<ng.IPromise<void>> = [];

                    angular.forEach(templates, (template) => {
                        let deferred = this.$q.defer<void>();
                        promises.push(deferred.promise);

                        this.getSubmittedSurveys(template.id)
                            .then((surveys) => {
                                _.forEach(surveys, (survey) => {
                                    survey.formTemplate = template;
                                });

                                allSurveys = allSurveys.concat(surveys);
                                deferred.resolve();
                            });
                    });

                    this.$q.all(promises).then(() => {
                        q.resolve(allSurveys);
                    }, (err) => {
                        q.reject(err);
                    });
                }, (err) => {
                    q.reject(err);
                });

            return q.promise;
        }

        getDrafts(formTemplateId: string): ng.IPromise<Array<Models.Survey>> {
            let deferred = this.$q.defer<Array<Models.Survey>>();

            this.getAllSavedSurveys(formTemplateId)
                .then((savedSurveys) => {
                    let result = _.filter(savedSurveys, { 'isSubmitted': false });
                    deferred.resolve(result);
                }, (err) => {
                    deferred.reject(err);
                });

            return deferred.promise;
        }

        getSubmittedSurveys(formTemplateId: string): ng.IPromise<Array<Models.Survey>> {
            let deferred = this.$q.defer<Array<Models.Survey>>();

            this.getAllSavedSurveys(formTemplateId)
                .then((savedSurveys) => {
                    let result = _.filter(savedSurveys, { 'isSubmitted': true });
                    deferred.resolve(result);
                }, (err) => {
                    deferred.reject(err);
                });

            return deferred.promise;
        }

        getProjects(): ng.IPromise<Array<Models.Project>> {
            let deferred = this.$q.defer<Array<Models.Project>>();

            let lsKeys = this.localStorageService.keys();
            let projectKeys = _.filter(lsKeys, (key) => { return _.startsWith(key, this.PROJECT_KEY); });
            let projects = [];

            _.forEach(projectKeys, (pk) => {
                projects.push(this.localStorageService.get(pk));
            });

            deferred.resolve(projects);

            return deferred.promise;
        }

        getTemplateWithValues(surveyId: string): ng.IPromise<Models.FormTemplate> {
            let q = this.$q.defer<Models.FormTemplate>();

            this.getSurvey(surveyId).then((survey) => {
                let formValues = survey.formValues;

                this.getFormTemplate(survey.formTemplateId)
                    .then((formTemplate) => {
                        formTemplate.survey = survey;
                        q.resolve(formTemplate);
                    }, (err) => {
                        q.reject(err);
                    });
            }, (err) => {
                q.reject(err);
            });

            return q.promise;
        }

        getFormValueText(formValue: Models.FormValue, metric: Models.Metric): string {
            if (formValue.textValue)
                return formValue.textValue;

            if (formValue.dateValue) {
                if (metric.hasTimeValue === true) {
                    return moment(formValue.dateValue).format('DD/MM/YYYY hh:mm A');
                }

                return formValue.dateValue.toLocaleDateString();
            }

            if (formValue.numericValue)
                return formValue.numericValue.toString();
        }

        getDescirptionMetrics(formTemplate: Models.FormTemplate): ng.IPromise<Models.IGetDescriptionMetricsDTO> {
            let d = this.$q.defer<Models.IGetDescriptionMetricsDTO>();

            let descFormat = formTemplate.descriptionFormat;
            if (descFormat && descFormat.length) {
                let descMetrics = [];
                let pattern = /{{([^}]+)}}/g;
                let titles = [];
                let currentMatch = undefined;
                while (currentMatch = pattern.exec(descFormat)) {
                    titles.push(currentMatch[1]);
                }

                let foundMetrics = [];
                _.forEach(formTemplate.metricGroups, (metricGroup: Models.MetricGroup) => {
                    _.forEach(metricGroup.metrics, (metric: Models.Metric) => {
                        let shortTitle = _.toLower(metric.shortTitle);
                        if (_.includes(titles, shortTitle)) {
                            foundMetrics.push(metric);
                        }
                    });
                });

                let result: Models.IGetDescriptionMetricsDTO = {
                    descriptionFormat: descFormat,
                    descriptionMetrics: foundMetrics
                };

                d.resolve(result);
            }

            return d.promise;
        }

        getDescription(survey: Models.Survey, descriptionMetrics: Models.IGetDescriptionMetricsDTO): string {
            let self = this;
            let q = this.$q.defer();
            let result: string = descriptionMetrics.descriptionFormat;

            _.forEach(descriptionMetrics.descriptionMetrics, (metric: Models.Metric) => {
                let formValue = _.find(survey.formValues, (fv) => { return fv.metricId == metric.id; });
                if (formValue) {
                    let value = self.getFormValueText(formValue, metric);
                    if (value == undefined) value = '';

                    let segment = "{{" + _.toLower(metric.shortTitle) + "}}";
                    result = _.replace(result, segment, value);
                }
            });

            if (result === descriptionMetrics.descriptionFormat) result = '';

            return result;
        }

        getSurveyMetadata(survey: Models.Survey): ng.IPromise<Models.Survey> {
            let d = this.$q.defer<Models.Survey>();

            this.getFormTemplate(survey.formTemplateId).then((template) => {
                this.getDescirptionMetrics(template).then((descMetrics) => {
                    survey.description = this.getDescription(survey, descMetrics);
                });

                let dateFormValue = _.find(survey.formValues, { 'metricId': template.calendarDateMetricId });
                if (dateFormValue) {
                    let utcDate = moment.utc(dateFormValue.dateValue);
                    let hours = utcDate.hour();
                    let minutes = utcDate.minutes();

                    let localDate = utcDate.local().toDate();
                    if (hours == 0 && minutes == 0) {
                        localDate.setHours(0);
                        localDate.setMinutes(0);
                        localDate.setSeconds(0);
                        localDate.setMilliseconds(0);
                    }

                    survey.surveyDate = localDate;
                } else {
                    let utcDate = moment.utc(survey.surveyDate);
                    let hours = utcDate.hour();
                    let minutes = utcDate.minutes();

                    let localDate = utcDate.local().toDate();
                    if (hours == 0 && minutes == 0) {
                        localDate.setHours(0);
                        localDate.setMinutes(0);
                        localDate.setSeconds(0);
                        localDate.setMilliseconds(0);
                    }

                    survey.surveyDate = localDate;
                }
            });

            d.resolve(survey);

            return d.promise;
        }

        getUserSurveys(projectId: string): ng.IPromise<Array<Models.Survey>> {
            let q = this.$q.defer<Array<Models.Survey>>();

            this.httpService.getUserSurveys(projectId)
                .then((data) => {
                    _.map(data, function(item: Models.Survey) {
                        return item.isSubmitted = true;
                    });

                    q.resolve(data);
                }, (err) => {
                    q.reject(err);
                });

            return q.promise;
        }
    }

    angular.module('lm.surveys').service('surveyService', SurveyService);
}