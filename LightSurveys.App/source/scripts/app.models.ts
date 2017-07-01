
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
        public name: string;
        public projectId: string;
        public project: string;
        public isPublished: boolean;

        public colour: string;
        public calendarDateMeticId: string;
        public timelineBarMetricId: string;

        public survey: Survey;
    }

    export class Survey {
        public id: string;
        public error: string;
        public locations: Position[] = [];

        public dateCreated: number;
        public dateUpdated: number;
        public surveyDate: Date;
        public filledById: string;
        public projectId: string;
        public createdById: string;
        public formTemplateId: string;
        public formTemplate: FormTemplate;
        public formValues: FormValue[];

        public isSubmitted: boolean;

        constructor(filledById: string, projectId: string, formTemplateId: string) {

            this.id = _.now().toString();
            this.dateCreated = _.now();
            this.dateUpdated = _.now();
            this.surveyDate = new Date();
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
        public tempStorage: boolean;
        public uploadGuid: string;
        public uploadError: string;
    }

    export class FormValue {
        public textValue: string;
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
            public event: string) { }
    }
}