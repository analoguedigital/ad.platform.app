
module App.Models {
    "use strict";

    export class Project {
        public id: string;
        public name: string;
        constructor(id: string, name: string) {
            this.id = id;
            this.name = name;
        }
    }

    export class FormTemplate {
        public id: string;
        public name: string;    // deprecated! we have a title, not a name.
        public title: string;
        public projectId: string;
        public project: string;
        public isPublished: boolean;

        public colour: string;
        public calendarDateMetricId: string;
        public timeMetricId: string;
        public timelineBarMetricId: string;

        public descriptionFormat: string;
        public metricGroups: Models.MetricGroup[];

        public survey: Survey;
    }

    export class Survey {
        public id: string;
        public error: string;
        public locations: Position[] = [];

        public dateCreated: Date;
        public dateUpdated: Date;
        public dateUploaded: Date;
        public surveyDate: Date;
        public filledById: string;
        public projectId: string;
        public createdById: string;
        public formTemplateId: string;
        public formTemplate: FormTemplate;
        public formValues: FormValue[];
        public description: string;

        public isSubmitted: boolean;
        public isRead?: boolean;

        constructor(filledById: string, projectId: string, formTemplateId: string) {

            this.id = _.now().toString();

            var utcNow = new Date(new Date().toISOString());
            this.dateCreated = utcNow;
            this.dateUpdated = utcNow;
            this.surveyDate = utcNow;
            this.dateUploaded = null;

            this.formValues = [];
            this.isSubmitted = false;

            this.filledById = filledById;
            this.projectId = projectId;
            this.formTemplateId = formTemplateId;
        }
    }

    export class Attachment {
        public type: string;
        public mediaType: string;
        public fileUri: string;
        public oneTimeAccessId: string;
        public tempStorage: boolean;
        public uploadGuid: string;
        public uploadError: string;
    }

    export class FormValue {
        public metricId: string;
        public textValue: string;
        public dateValue: Date;
        public numericValue: number;
        public timeValue: number;
        public attachments: Attachment[];
    }

    export class PositionEvents {
        static Submission = "Submission";
    }

    export class Position {
        constructor(
            public latitude: number,
            public longitude: number,
            public accuracy: number,
            public error: string,
            public event: string,
            public address?: string,) { }
    }

    export class Metric {
        public id: string;
        public type: string;
        public shortTitle: string;
        public description: string;
        public metricGroupId: string;
        public mandatory: boolean;
        public sectionTitle: string;
        public order: number;
        public isDeleted: boolean;
        public hasTimeValue: boolean;
    }

    export class MetricGroup {
        public id: string;
        public title: string;
        public page: number;
        public helpContext: string;
        public isRepeater: boolean;
        public isDataListRepeater: boolean;
        public isAdHoc: boolean;
        public adHocItems: DataListItem[];
        public type: string;
        public dataListId: string;
        public numberOfRows: number;
        public canAddMoreRows: boolean;
        public order: number;
        public formTemplateId: string;
        public metrics: Metric[];
        public isDeleted: boolean;
    }

    export class DataListItem {
        public id: string;
        public text: string;
        public description: string;
        public value: number;
        public order: number;
        public attributes: DataListItemAttr[];

        public isDeleted: boolean;
    }

    export class DataListItemAttr {
        public id: string;
        public relationshipId: string;
        public valueId: string;
    }

    export class Subscription {

    }

    export class SubscriptionPlan {
        public name: string;
        public description: string;
        public price: number;
        public length: number;
        public isLimited: boolean;
        public monthlyQuota?: number;
        public pdfExport: boolean;
        public zipExport: boolean;
        public subscriptions: Subscription[];
    }

    export interface IGetDescriptionMetricsDTO {
        descriptionFormat: string;
        descriptionMetrics: Metric[];
    }

    export interface IForgotPasswordModel {
        email: string;
    }

    export interface ISendConfirmationEmailModel {
        email: string;
    }

    export interface IResetPasswordModel {
        email: string;
        code: string;
        password: string;
        confirmPassword: string;
    }

    export interface IProfileModel {
        firstName: string;
        surname: string;
        gender?: number;
        birthdate: string;
        address: string;
    }

    export interface IChangePasswordModel {
        userId: string;
        oldPassword: string;
        newPassword: string;
        confirmPassword: string;
    }

    export interface IOrgRequestModel {
        name: string;
        address: string;
        contactName: string;
        email: string;
        telNumber: string;
        postcode: string;
    }

    export interface IFeedbackData {
        addedById: string;
        organisationId: string;
        comment: string;
    }
}