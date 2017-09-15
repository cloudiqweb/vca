declare module namespace {

    export interface TaskOccurrence {
        TaskOccurrenceId: number;
        Name: string;
        StatusId: number;
        StatusName: string;
        UpdatedBy?: any;
        ScheduledDateTime?: any;
        PostVisitComplete:boolean;
    }

    export interface HourlyTaskOccurrence {
        Hour: string;
        Day: string;
        Date: string;
        TaskOccurrences: TaskOccurrence[];
    }

    export interface TaskSeries {
        TaskSeriesId: number;
        Name: string;
        DueCount: number;
        CompletedCount: number;
        OverdueCount: number;
        NotScheduledCount: number;
        StatusId: number;
        StatusName: string;
        Instructions?: any;
        HourlyTaskOccurrences: HourlyTaskOccurrence[];
    }

    export interface TaskCategory {
        CategoryId: number;
        CategoryName: string;
        TaskSeriesCount: number;
        TaskSeries: TaskSeries[];
    }

    export interface Data {
        OrderId: number;
        NumberOfDays: number;
        TaskCategories: TaskCategory[];
    }

    export interface Link {
        Rel: string;
        Href: string;
        MethodType: string;
    }

    export interface RootObject {
        StatusCode: number;
        Data: Data;
        Links: Link[];
    }

}

