export class ObservationGrid {
  Day:string;
  StatusSetDate: Date;
  AlternatePatientTaskFindings: AlteredPatientTaskFinding[];
}

export class ObservationTime{
  Day:string;
  StatusSetDate: Date;
}

export class Observation{
  Category: string;
  ObservationName: string;
  TaskName: string;
  ObservationDisplayText:string;
  ObservationDataType:number;
  observationCommonString:string;
  width:number;
  unit:string;
  TaskDisplayName:string;
  IsInstructionOnly:boolean;

}
export class ObservationValue{
  ShortValue: string;
  LongValue: string;
  Comment:string;
  IsNormal:boolean;
  constructor (){
  }
}

export class AlteredPatientTaskFinding {
  RichTextValue: string;
  IsNormal: boolean;
  ObservationDisplayText:string;
  ObservationName?: any;
  EnteredValue?: any;
  EnteredUnit: string;
  EnteredUnitName?: string;
  Comment?: any;
  Category: string;
  Status?: string;
  TaskName: string;
  StatusSetDate: Date;
  Day: string;
  // TaskDisplayName:string;
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
  StatusId: number;
  Location?: any;
  LocationId?: any;
  AlternatePatientTaskFindings: AlteredPatientTaskFinding[];
  Day: string;
}
