export interface Patient {
  PatientId: number;
  PetName: string;
  SpeciesId?: number;
  Breed?: string[];
  DisplayAge?: string;
  Weight?: number;
  NeuterStatus?: number;
  Sex?: number;
  Alert?: string;
  TaskOverdueCount: number;
  TaskDueCount: number;
  TaskNotScheduledCount: number;
  HourlyTasks?: HourlyTask[];
  Concerns: string[];
  Color?: string;
  WeightTakenDate?: Date;
  HasCareClubMembership: boolean;
  DateOfBirth?: Date;
  IsCritical: boolean;
}

export interface Client {
  ClientId: number;
  FirstName: string;
  LastName: string;
  Title?: string;
  CompanyName: string;
}

export interface VisitInvoiceItem {
  InvoiceItemId: number;
  PLNo: number;
  SeqNo: number;
  CompletionStatus: number;
}

export interface Visit {
  VisitId: number;
  AppointmentType: string;
  LocationId: number;
  Location?: string;
  DepartmentIDs: number[];
  VisitTypeIDs: number[];
  PrimaryResourceId?: any;
  NumberOfDays: number;
  CheckinDate: Date;
  PrimaryResourceDisplayName?: any;
  DisplayResourceNameWithDepartment:string;
  FullResourceNameWithDepartment:string;
  VisitInvoiceItems: VisitInvoiceItem[];
  AppointmentReason:string;
}

export class HourlyTask {
  constructor(
    public Date: Date,
    public Day: number,
    public Hour: string,
    public CompletedCount: number,
    public ScheduledCount: number,
    public CancelledCount: number,
    public SkippedCount: number,
    public OverdueCount: number,
    public DueCount: number,
    public TaskOccurrences: TaskOccurence[]) {

  }

  // get StatusCount(): number {
  //     return (this.CompletedCount > 0 ? 1 : 0) + (this.ScheduledCount > 0 ? 1 : 0) + (this.SkippedCount > 0 ? 1 : 0)
  //         + (this.OverdueCount > 0 ? 1 : 0) + (this.DueCount > 0 ? 1 : 0);
  // }
}

export interface TaskOccurence {
  Name: string;
  ScheduledTime: string;
  StatusSetDate: string;
  Status: string;
  IsTimeSensitive: boolean;
}

export interface CheckInPatientTask {
  VisitId: number;
  Patient: Patient;
  Client: Client;
  Visit: Visit;

}


export class Tooltip{
  Status: string;
  Time: string;
  Name: string;
  TimeSensitive:string;

  constructor() {
    this.Status='';
    this.Time='';
    this.Name='';
    this.TimeSensitive='';
  }
}
