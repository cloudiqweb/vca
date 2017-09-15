export class TaskSeriesObservation {
    TaskSeriesObservationId: number;
    TaskSeriesId: number;
    ObservationId: number;
    IsVisible: boolean;
    HospitalId: number;
    NotifyText: string;
    ExamFindingId: number;
    ScaleId: number;
    Name: string;
    Scale: string;
    Method: string;
    AnswerGroupId: number;
    AnswerGroup: string;
    Abbreviation: string;
    PreferredStorageUnit: number;
    DisplayUnitId: number;
}

export class RootObject {
    TaskSeriesId: number;
    HospitalId: number;
    StartTime: string;
    EndTime: string;
    Interval: string;
    IsTimeSensitive: boolean;
    Instructions: string;
    QtyMustMatch: boolean;
    StatusId: number;
    AsNeeded: boolean;
    CreatedBy: string;
    CreatedDate: string;
    LastModifiedBy: string;
    LastModifiedDate: Date;
    TaskDefinitionId: number;
    VisitId: number;
    IsTaskSeries: boolean;
    TaskSeriesObservations: TaskSeriesObservation[];
    IntervalTimeUnit: string;
    EndsAtCheckout: boolean;
    NoOfOccurrences: number;
    VisitInvoiceItemId: number;
    IsDeleted: boolean;
    Rowversion: string;
    Status : string;
    IsDiscontinued: boolean;
}

 export class TaskOccurrenceInfo {
           TaskOccurrenceId:number;
           TaskSeriesId: number;
           VisitInvoiceItemId: number;
           HospitalId: number;
           ScheduledDate?: string;
           ScheduledTime:string;
           StatusId: number;
           Instruction?: string;
           Comment?: string;
           StatusSetBy?:string;
           StatusSetDate?:string;
           CreatedBy:string;
           CreatedDate:string;
           LastModifiedBy?:string;
           LastModifiedDate?:string;
           TaskDefinitionId: number;
           TaskSeriesObservations?: any;
           Status:string;
           InvoiceItemId?: number;
           PatientTaskFindings?: any;
           IsTimeSensitive: boolean;
           IsDeleted: boolean;
           MedicineName?: string;
           SpecifiedQty?: number;
           ConfirmQty?: number;

    }

