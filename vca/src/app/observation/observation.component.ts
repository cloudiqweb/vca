import { TimelineService } from '../timeline/timeline.service';
import { Component, OnInit, ViewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TaskOccurrenceTimeline, PatientTaskFinding, TaskCategory } from '../data/timeline';
import { ObservationGrid, AlteredPatientTaskFinding, Observation, ObservationTime, ObservationValue } from '../data/observationgrid';
import * as wjcCore from 'wijmo/wijmo';
import * as wjcGrid from 'wijmo/wijmo.grid';
import { GlobalErrorHandler } from '../app.errorHandler';
import { GlobalsService } from '../globals.service';
import { GoogleAnalyticsService } from '../shared/googleAnalytics.service';
import { AppConfig } from '../app.config';
import { Subscription } from 'rxjs/Subscription';

@Component({
  moduleId: module.id,
  selector: 'app-observation',
  templateUrl: './observation.component.html',
})

export class ObservationComponent implements OnInit {
  appVersionNumber: string;
  timerExceuteTime: String;
  private tasksSub: Subscription;
  frozenColumnCount: number = 1;
  isColumnGroupingSet: boolean = true;
  gridSource: wjcCore.CollectionView;
  size: number = 0;
  gridData: ObservationGrid[] = [];
  findings: AlteredPatientTaskFinding[] = [];
  dataArray: any[] = [];
  observationNames = new Set();
  categories: string[] = [];
  Observations: Observation[] = [];
  grpTooltip: wjcCore.Tooltip;
  @ViewChild('tooltip') tooltip: any;
  @ViewChild('flex') flex: wjcGrid.FlexGrid;

  constructor(private TimelineSvc: TimelineService, private errorHandler: GlobalErrorHandler, private googleAnalyticsService: GoogleAnalyticsService, private config: AppConfig,
    private globalsvc: GlobalsService) {
  }

  ngOnInit() {
    this.appVersionNumber = this.config.getConfig("Version_Number");
    this.googleAnalyticsService.set_ApplicationLevl_GA_Dimensions();
    this.googleAnalyticsService.pageTrack(this.config.getConfig("GA_Observations_URL"), "");
    this.timerExceuteTime = new DatePipe("en-US").transform(new Date(), 'HH:mm:ss');
    this.getTimelines();
  }

  ngAfterViewInit() {
  }

  //set Column Headers Group
  setColumnHeaderGrouping() {
    try {
      if (this.observationNames.size >= 1 && this.isColumnGroupingSet) {
        this.isColumnGroupingSet = false;
        //console.log("initialized");
        const flex = this.flex;
        this.flex.cells.rows.defaultSize = 30;

        if (flex) {
          flex.allowMerging = wjcGrid.AllowMerging.ColumnHeaders;
          // add extra column header row
          let row0 = new wjcGrid.Row();
          let chCategory = flex.columnHeaders;
          let row1 = new wjcGrid.Row();
          row0.allowMerging = true;
          row1.allowMerging = true;
          row0.wordWrap = true;
          row1.wordWrap = true;

          for (let i = 0; i < flex.columns.length; i++) {
            flex.columns[i].allowMerging = true;
          }

          chCategory.rows.insert(0, row0);
          chCategory.rows.insert(1, row1);

          if (chCategory.rows[2]) {
            chCategory.rows[2].wordWrap = true;
          }

          this.setHeader(chCategory, 0, 0, 1, 0, 'Observation Time1');
          this.setHeader(chCategory, 1, 0, 1, 0, 'Observation Time2');

          for (let index = 2; index < flex.columns.length; index++) {
            chCategory.setCellData(0, index, this.Observations[index - 2].Category);
            chCategory.setCellData(1, index, this.Observations[index - 2].TaskName);
            //chCategory.setCellData(2,index,this.Observations[index-2].ObservationName);
          }
        }
      }

    }
    catch (e) {
      this.handleError(e);
    }
  }

  setHeader(p: wjcGrid.GridPanel, r1: number, c1: number, r2: number, c2: number, hdr: string) {
    for (let r = r1; r <= r2; r++) {
      for (let c = c1; c <= c2; c++) {
        //console.log("setheader" + c);
        p.setCellData(r, c, hdr);
        break;
      }
    }
  }

  modelConverter(ptf: PatientTaskFinding, Category: string, date: Date, status: string, taskName: string, day: string, isInstructionsOnly: boolean, TaskInstruction: string) {
    try {
      const input = new AlteredPatientTaskFinding;
      input.Category = Category;
      input.Comment = ptf.Comment;
      input.EnteredUnit = ptf.EnteredUnit;
      input.EnteredUnitName = ptf.EnteredUnitName;
      input.EnteredValue = ptf.EnteredValue;
      input.IsNormal = ptf.IsNormal;
      input.ObservationName = ptf.ObservationName;
      input.ObservationDisplayText = ptf.ObservationDisplayText;
      input.RichTextValue = ptf.RichTextValue;
      input.StatusSetDate = date;
      input.Status = status;
      input.TaskName = taskName;
      // input.TaskDisplayName = TaskInstruction;
      input.Day = day;
      if (ptf.EnteredValue !== null && ptf.EnteredValue !== "") {
        this.findings.push(input);
      }
      else if (ptf.Comment !== null && ptf.Comment !== '') {
        this.findings.push(input);
      }
    }
    catch (e) {
      this.handleError(e);
    }
  }


  modelConverterNullPTF(data: TaskOccurrenceTimeline, Day: string) {
    try {
      const input = new AlteredPatientTaskFinding;
      input.Category = data.Category;
      input.Comment = data.Comment;
      //input.EnteredUnit = ptf.EnteredUnit;
      //input.EnteredUnitName = ptf.EnteredUnitName;
      input.EnteredValue = data.TaskName + "(" + data.DoseQuantity + " " + data.Unit + ")";
      //input.IsNormal = ptf.IsNormal;
      input.ObservationName = data.Category;
      input.ObservationDisplayText = data.Category;
      //input.RichTextValue = ptf.RichTextValue;
      input.StatusSetDate = data.StatusSetDate;
      input.Status = data.Status;
      input.TaskName = data.TaskName;
      input.Day = Day;
      if ((input.EnteredValue !== null && input.EnteredValue !== "") || (input.Comment !== null && input.Comment)) {
        this.findings.push(input);
      }
    }
    catch (e) {
      this.handleError(e);
    }
  }

  setGridSource() {
    try {
      this.findings.forEach(element => {
        const index = this.gridData.findIndex((a): any => a.StatusSetDate === element.StatusSetDate);
        if (index > -1) {
          this.gridData[index].AlternatePatientTaskFindings.push(element);
        }
        else {
          const a = new ObservationGrid();
          a.Day = element.Day;
          a.StatusSetDate = element.StatusSetDate;
          a.AlternatePatientTaskFindings = [];
          a.AlternatePatientTaskFindings.push(element);

          this.gridData.push(a);
        }
      });
      this.gridData.sort((a: ObservationGrid, b: ObservationGrid): number => {
        if (a.StatusSetDate < b.StatusSetDate) {
          return 1;
        }
        if (a.StatusSetDate > b.StatusSetDate) {
          return -1;
        }
        return 0;
      });
      //this.gridSource = new wjcCore.CollectionView(this.gridData);
      this.gridData.forEach(element => {
        const data: any = {};
        let obsTime = new ObservationTime();
        obsTime.Day = element.Day;
        obsTime.StatusSetDate = element.StatusSetDate;
        data["time"] = obsTime;
        element.AlternatePatientTaskFindings.forEach(aptf => {
          let obsValue = new ObservationValue();
          let display: string = '';

          if (aptf.EnteredValue !== null && aptf.EnteredValue !== "") {
            display = aptf.EnteredValue;
          }
          else if (display.length === 0 && aptf.Comment !== null && aptf.Comment !== "") {
            display = aptf.Comment;
          }

          // if (aptf.Comment && aptf.Comment !== "") {
          //   display += ' - ' + aptf.Comment;
          // }
          // if (aptf.EnteredValue === null && aptf.Comment === "") {
          //   display = "";
          // }

          obsValue.Comment = (aptf.Comment !== null && aptf.Comment !== "") ? aptf.Comment : "";
          obsValue.LongValue = display;
          if (aptf.Category === "Medication") {
            // obsValue.ShortValue = display.slice(0, 30) + "...";
            obsValue.ShortValue = display && display.length > 30 ? display.slice(0, 30) + "..." : display;
            data[aptf.Category] = obsValue;
          }
          else {
            obsValue.ShortValue = display && display.length > 10 ? display.slice(0, 10) + "..." : display;
            data[aptf.ObservationName + aptf.TaskName + aptf.Category] = obsValue;
          }
          if (aptf.IsNormal !== null && aptf.IsNormal !== undefined) {
            obsValue.IsNormal = aptf.IsNormal;
          }
          else {
            obsValue.IsNormal = true;
          }
          //data[aptf.ObservationName+aptf.TaskName+aptf.Category] = obsValue;

        });

        this.dataArray.push(data);
      });
      this.gridSource = new wjcCore.CollectionView(this.dataArray);
      const groupDesc = new wjcCore.PropertyGroupDescription('time.Day');
      this.gridSource.groupDescriptions.push(groupDesc);
    }
    catch (e) {
      this.handleError(e);
    }
  }



  showGroupToolTip(e: any, tValue: string, observation: Observation, condition: string) {
    let showTip: boolean;
    if (condition === "Observation") {
      showTip = tValue.length > 10;
    }
    if (condition === "Comment") {
      showTip = true;
    }
    if(condition === "TaskName"){
      showTip = tValue.length>31;
    }
    this.grpTooltip = new wjcCore.Tooltip();
    let _ht = this.flex.hitTest(e);
    let celldata = this.flex.getCellBoundingRect(_ht.row, _ht.col);
    if (celldata) {
      celldata.top = e.clientY - 2;
      celldata.left = e.clientX - 40;
    }
    if (showTip) {
      this.grpTooltip.show(this.flex.hostElement, tValue, celldata);
    }
  }

  hideGroupToolTip() {
    this.grpTooltip.hide();
  }


  modelDatePipe = new DatePipe("en-US");

  processTimelineData(data: TaskOccurrenceTimeline[]) {
    try {
      this.observationNames.clear();
      this.Observations = [];
      if (data !== null) {
        data.forEach(element => {
          if (element.PatientTaskFindings && element.PatientTaskFindings.length !== 0) {
            if (element.StatusId === 126) {
              element.PatientTaskFindings.forEach(ptf => {
                this.modelConverter(ptf, element.Category, element.StatusSetDate, element.Status, element.TaskName, this.globalsvc.groupDate(element.StatusSetDate, 'Observation'), element.IsInstructionsOnly, element.TaskSeriesInstruction);
                let categoryTaskObs = element.Category + element.TaskName + ptf.ObservationName;
                if (!this.observationNames.has(categoryTaskObs)) {
                  this.observationNames.add(categoryTaskObs);
                  let obs = new Observation();
                  obs.Category = element.Category;
                  obs.TaskName = element.TaskName;
                  obs.IsInstructionOnly = element.IsInstructionsOnly;
                  obs.TaskDisplayName = element.TaskSeriesInstruction;
                  obs.ObservationName = ptf.ObservationName;
                  obs.ObservationDisplayText = ptf.ObservationName + element.TaskName + element.Category;;
                  obs.ObservationDataType = ptf.ObservationDataType;
                  obs.width = this.getColumnWidth(obs);
                  obs.unit = ptf.EnteredUnitName;
                  obs.observationCommonString = ptf.ObservationDisplayText;
                  this.Observations.push(obs);

                }
              });
            }
          }
          else {
            if (element.StatusId === 126) {
              if (element.Category === 'Medication') {
                this.modelConverterNullPTF(element, this.globalsvc.groupDate(element.StatusSetDate, 'Observation'));
                let categoryTaskObs = element.Category;
                if (!this.observationNames.has(categoryTaskObs)) {
                  this.observationNames.add(categoryTaskObs);
                  let obs = new Observation();
                  obs.Category = element.Category;
                  obs.TaskName = "";
                  obs.ObservationName = element.Category;
                  obs.ObservationDisplayText = element.Category;
                  obs.ObservationDataType = 14;
                  obs.width = this.getColumnWidth(obs);

                  // obs.observationCommonString=element.TaskName+element.Category;

                  this.Observations.push(obs);

                }
              }
            }
          }
        });
      }
      this.Observations = this.Observations.sort((a: Observation, b: Observation) => {
        return ((this.categories.indexOf(b.Category) === this.categories.indexOf(a.Category)) && (a.TaskName === b.TaskName) ? 0 : (this.categories.indexOf(b.Category) === this.categories.indexOf(a.Category)) && (a.TaskName < b.TaskName) ? -1 : (this.categories.indexOf(b.Category) === this.categories.indexOf(a.Category)) && (a.TaskName < b.TaskName) ? 1 : (this.categories.indexOf(b.Category) > this.categories.indexOf(a.Category) ? -1 : 1));
      });
      this.setGridSource();
    }
    catch (e) {
      this.handleError(e);
    }
  }

  processData(data: TaskCategory[]) {
    data.forEach(category => {
      this.categories.push(category.Category);
    });
  }


  getTimelines() {
    try {
      if (this.tasksSub) {
        this.tasksSub.unsubscribe();
      }
      let timeStart: number = performance.now();
      this.tasksSub = this.TimelineSvc.getTasks()
        .subscribe(
        tasks => {
          let timeEnd: number = performance.now();
          let responseTime: number = timeEnd - timeStart;
          this.processData(tasks.TaskCategories);
          this.processTimelineData(tasks.TaskOccurrenceTimelines);
        },
      );
    }
    catch (e) {
      this.handleError(e);
    }
  }

  getColumnWidth(obs: Observation) {
    let dataType = obs.ObservationDataType;
    //different length for narrative type
    if (dataType === 4) {
      return 140;
    }
    if (dataType === 14) {
      return 250;
    }
    else {
      return 110;
    }
  }

  getObservationHeaderText(observation: Observation, index: number) {
    if (index === 0) {
      return observation.Category;
    }
    if (index === 1) {
      if (observation.IsInstructionOnly&&observation.TaskDisplayName!==null) {
        return observation.TaskDisplayName;
      }
      else {
        return observation.TaskName;
      }
    }
    if (observation.Category !== 'Medication') {
      if (observation.unit !== '' && observation.unit !== null) {
        return observation.observationCommonString + " (" + observation.unit + ")";
      }
      else {
        return observation.observationCommonString;
      }
    }
  }

  onResize(event: any) { }

  private handleError(error: Response | any) {
    this.errorHandler.exceptionHandling(false, error);
  }
}
