 export class TaskCategory {
        CategoryId: number;
        Category: string;
    }

    export class Resource {
        ResourceId: number;
        FirstName: string;
        LastName: string;
        ResourceName: string;
    }

    export class PatientTaskFinding {
        RichTextValue: string;
        IsNormal: boolean;
        ObservationDisplayText:string;
        ObservationDataType:number;
        ObservationName?: any;
        EnteredValue?: any;
        EnteredUnit: string;
        EnteredUnitName?: string;
        Comment?: any;
    }

    export class TaskOccurrenceTimeline {
        TaskName: string;
        TaskOccurrenceId: number;
        ScheduledTime: Date;
        Category: string;
        TaskDefinitionInstruction?: any;
        TaskSeriesInstruction?: any;
        TaskOccuranceInstruction?: any;
        Comment?: any;
        Status?: string;
        StatusSetBy: string;
        StatusSetDate: Date;
        CategoryId: number;
        QtyMustMatch: boolean;
        VisitInvoiceItemDetails: any;
        StatusId: number;
        Location?: any;
        LocationId?: any;
        IsInstructionsOnly:boolean;
        PatientTaskFindings: PatientTaskFinding[];
        Day: string;
        Unit:string;
        DoseQuantity:number;
    }

    export class TimelineData {
        TaskCategories: TaskCategory[];
        Resources: Resource[];
        TaskOccurrenceTimelines: TaskOccurrenceTimeline[];
    }
