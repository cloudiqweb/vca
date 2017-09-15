import { Component, OnInit, ViewChild, Renderer2 } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { Subscription } from 'rxjs/Subscription';
import * as wjcCore from 'wijmo/wijmo';
import * as wjcGrid from 'wijmo/wijmo.grid';
import { WhiteboardService } from './whiteboard.service';
import { CheckInPatientTask, HourlyTask, Patient,Tooltip  } from '../data/checkinpatienttasks.model';
import { FilterPreferance } from '../data/filterpreferance';
import { GlobalErrorHandler } from '../app.errorHandler';
import { GlobalsService } from '../globals.service';
import { TimerService } from '../shared/timer.service';
import { GoogleAnalyticsService } from '../shared/googleAnalytics.service';
import { AppConfig } from '../app.config';
import { IPopup } from "ng2-semantic-ui";

@Component({
  selector: 'app-whiteboard',
  templateUrl: './whiteboard.component.html',
  styles: [`
  .arrow[direction="right"]{
    z-index: -1;
    width:2em;
    height:2em
  }
  `],
  providers: [
    GoogleAnalyticsService,
    TimerService
  ]
})

export class WhiteboardComponent implements OnInit {
  popuptext: string = "";
  appVersionNumber: string;
  defaultRowHeight = 100;
  gridSource: wjcCore.CollectionView;
  TimeArray: string[] = [];
  index: number = 0;
  currentDate: Date;
  displayDate: String;
  errorLog: String = "";
  checkedInPatientsTasks: CheckInPatientTask[];
  SortOn: string = 'Patient';
  imageUrl: any;
  hourlyTask: HourlyTask;
  // private _opened: boolean = false;
  criticalFirst: boolean = false;
  visitFilter: number[] = [2, 3, 4];
  timeBarCellPosition: number = 0;
  timeBarCurrentTime: string = "";
  timeBarLeft: number = 0;
  timeBarLeftGrp: number = 0;
  timeBarAlignment: string = "right";
  isDisplayTimeBar: boolean = false;
  isFutureDay: boolean = false;
  currentHour: string;
  grpTooltip: wjcCore.Tooltip;
  timerExceuteTime: String;
  private whiteBoardDataSub: Subscription;

  FilteredPatients = new Array<CheckInPatientTask>();
  @ViewChild('flex2') flex2: wjcGrid.FlexGrid;
  private timerSubscription: Subscription;
  private filterSubscription: Subscription;
  listenFunc: Function;
  private datePipe: DatePipe;

  constructor(private errorHandler: GlobalErrorHandler, private whiteBoardSvc: WhiteboardService,
    private globalsService: GlobalsService, private router: Router,
    private googleAnalyticsService: GoogleAnalyticsService,
    private config: AppConfig,
    private renderer: Renderer2) {

    this.datePipe = new DatePipe("en-US");
    this.timeset();
    this.displayTimeBarOnGrid();

  }


  ngOnInit() {
    this.appVersionNumber = this.config.getConfig("Version_Number");
    this.googleAnalyticsService.set_ApplicationLevl_GA_Dimensions();
    this.googleAnalyticsService.pageTrack(this.config.getConfig("GA_WhiteBoard_URL"), "");

    for (let i = 0; i < 24; i++) {
      if (i.toString().length === 1) {
        this.TimeArray.push(i.toString() + ":00");
      }
      else {
        this.TimeArray.push(i.toString() + ":00");
      }
    }

    this.filterSubscription = this.whiteBoardSvc.getFilter().subscribe((filter: FilterPreferance) => {
      this.applyFilter(filter);
    });
    this.loadWhiteboardData();
    this.pageVisibilityChanges();



    if (!this.globalsService.taskDueConfigFetched) {
      this.whiteBoardSvc.getTaskDueConfig().subscribe(response => {
        this.globalsService.TimeSensitiveTaskDueInMinutes = response.TimeSensitiveTaskDueInMinutes;
        this.globalsService.TimeInsensitiveTaskDueInMinutes = response.TimeInsensitiveTaskDueInMinutes;
        this.globalsService.taskDueConfigFetched = true;
      });
    }
  }

  ngAfterViewInit() {
    try {
      this.flex2.cells.rows.defaultSize = this.defaultRowHeight;
      this.setGridFocusToCurrentTime(this.flex2);
      this.timerSubscribe();
    }
    catch (e) {
      this.handleError(e);
    }
  }

  timerControl(control: boolean) {
    try {
      if (control) {
        this.timerSubscribe();
      }
      else {
        this.googleAnalyticsService.pageTrack(this.config.getConfig("GA_WhiteBoardFilters_URL"), "");
        this.timerUnSubscribe();
      }
    }
    catch (e) {
      this.handleError(e);
    }
  }

  ngOnDestroy() {
    if (this.whiteBoardDataSub) {
      this.whiteBoardDataSub.unsubscribe();
    }
    if (this.timerSubscription) {
      this.timerUnSubscribe();
    }
    if (this.filterSubscription) {
      this.filterSubscription.unsubscribe();
    }
    this.listenFunc();
    this.whiteBoardSvc.clearObjects();
  }

  loadWhiteboardData() {
    try {
      if (this.grpTooltip) {
        this.grpTooltip.hide();
      }
      let timeStart: number = performance.now();
      this.whiteBoardSvc.getWhiteBoardData(this.currentDate).subscribe(
        (response: CheckInPatientTask[]) => {
          let timeEnd: number = performance.now();
          let responseTime: number = timeEnd - timeStart;
          this.send_GA_UserTimingData(this.config.getConfig('GA_Patients_CheckedInPatients_TaskOccurrenceStatusCount_URL'), "GET", responseTime);

          //console.log("getWhiteBoardData received from API");
          this.timerExceuteTime = new DatePipe("en-US").transform(new Date(), 'HH:mm:ss');
          if (response === null) {
            //console.log("null data recieved");
          }
          this.checkedInPatientsTasks = response;
          //console.log("WhiteBoardComponent-loadData:" + new Date());
          this.applyFilter(this.globalsService.getFilterPreferance());
        }
      );
    }
    catch (e) {
      this.handleError(e);
    }
  }

  private pageVisibilityChanges() {
    this.listenFunc = this.renderer.listen(document, 'visibilitychange', () => {
      if (document.hidden) {
        this.timerUnSubscribe();
      } else {
        this.loadWhiteboardData();
        this.timerSubscribe();
      }
    });
  }



  /************************ Timer Events - Start**************************************** */
  timerSubscribe() {
    this.timerUnSubscribe();
    this.timerSubscription = TimerService.getInstance().timerInitiate$
      .subscribe(item => {
        let timerInitiate: boolean = item.valueOf();
        if (timerInitiate) {
          this.loadWhiteboardData();
        }
      });
  }

  timerUnSubscribe() {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
  }
  /************************ Timer Events - End**************************************** */

  configureCollectionView(inputTasks: CheckInPatientTask[]) {
    try {
      if (inputTasks !== undefined && inputTasks !== null) {
        inputTasks.sort((a: CheckInPatientTask, b: CheckInPatientTask): number => {
          if (this.criticalFirst && a.Patient.IsCritical !== b.Patient.IsCritical) {
            return a.Patient.IsCritical ? -1 : 1;
          }
          if (this.SortOn === "Patient") {
            return a.Patient.PetName < b.Patient.PetName ? -1 : 1;
          }
          else if (this.SortOn === "Client") {
            return a.Client.LastName === b.Client.LastName ? 0 : a.Client.LastName < b.Client.LastName ? -1 : 1;
          }

        });
      }
      this.gridSource = new wjcCore.CollectionView(inputTasks);
      this.gridSource.refresh();
      this.displayTimeBarOnGrid();
    }
    catch (e) {
      this.handleError(e);
    }
  }

  displayTimeBarOnGrid() {
    let currentDate: Date = new Date();
    const currentFormatedDate = this.datePipe.transform(currentDate, 'dd-MMM-yyyy');

    const dataLoadedFormatedData = this.datePipe.transform(this.currentDate, 'dd-MMM-yyyy');

    this.isFutureDay = false;
    if (dataLoadedFormatedData === currentFormatedDate) {
      //console.log("IN");
      this.isDisplayTimeBar = true;
      this.timeBarCellPosition = currentDate.getHours();
      this.timeBarCurrentTime = this.datePipe.transform(currentDate, 'HH:mm');

      let currentMinutes: number = currentDate.getMinutes();
      this.timeBarLeft = (currentMinutes < 52) ? currentMinutes * 1.5 : 90;
      //console.log(this.timeBarLeft);
      this.timeBarAlignment = (this.timeBarLeft > 40) ? "right" : "left";
      this.timeBarLeftGrp = this.timeBarLeft - 3;
    }
    else {
      this.isDisplayTimeBar = false;
      //console.log('dataLoadedFormatedData > currentFormatedDate');
      //console.log(dataLoadedFormatedData > currentFormatedDate);
      if (dataLoadedFormatedData > currentFormatedDate) {
        this.isFutureDay = true;
      }
    }
  }

  setGridFocusToCurrentTime(flex2: wjcGrid.FlexGrid) {
    try {
      let columnIndex: number = new Date().getHours();
      if (columnIndex < 5) {
        flex2.scrollIntoView(0, 5);
      }
      else if (columnIndex > 20) {
        flex2.scrollIntoView(0, 24);
      }
      else {
        flex2.scrollIntoView(0, columnIndex + 4);
      }


    }
    catch (e) {
      this.handleError(e);
      console.error(e);
    }
  }


  setPassedData(PatientData: Patient, OrderId: number, columnIndex: number) {
    try {
      this.globalsService.setSchedulerCurrentHour(-1);
      this.globalsService.setPatientId(PatientData.PatientId);
      this.globalsService.setOrderId(OrderId);
      const cDateFormated = this.datePipe.transform(this.currentDate, 'dd-MMM-yyyy');
      this.globalsService.setScheudlerCurrentPage(-1);
      this.globalsService.setWhiteBoardToSchedulerNav(true);
      if (PatientData.HourlyTasks !== null) {
        this.globalsService.setScheudlerCurrentDate(cDateFormated);
        //this.globalsService.setSchedulerCurrentHour(columnIndex);
      }
      else {
        this.globalsService.setScheudlerCurrentDate("");
        //this.globalsService.setSchedulerCurrentHour(-1);
      }

      let reloadPageType = this.config.getConfig("ReloadPageType");
      if (reloadPageType === 'scheduler' || reloadPageType === 'both') {
        this.globalsService.setParametersURL();
        const schedulerURL = this.globalsService.getParametersURL('');
        window.location.href = schedulerURL;
      }
      else {
        this.router.navigateByUrl('/scheduler');
      }
    }
    catch (e) {
      this.handleError(e);
    }
  }

  timeset() {
    this.currentDate = new Date;
    this.displayDate = this.currentDate.toDateString();
    this.currentHour = this.currentDate.getHours().toString() + ":00";
  }

  dateChanger(Selection: string) {
    try {
      if (this.whiteBoardDataSub) {
        this.whiteBoardDataSub.unsubscribe();
      }

      const dayOfMonth: number = this.currentDate.getDate();

      if (Selection === 'next') {
        this.currentDate.setDate(dayOfMonth + 1);
      }
      else if (Selection === 'prev') {
        this.currentDate.setDate(dayOfMonth - 1);
      }
      this.displayDate = this.currentDate.toDateString();
      //console.log('date: ' + this.displayDate);

      let timeStart: number = performance.now();
      this.whiteBoardDataSub = this.whiteBoardSvc.getWhiteBoardData(this.currentDate).subscribe(
        (response: CheckInPatientTask[]) => {

          let timeEnd: number = performance.now();
          let responseTime: number = timeEnd - timeStart;
          this.send_GA_UserTimingData(this.config.getConfig('GA_Patients_CheckedInPatients_TaskOccurrenceStatusCount_URL'), "GET", responseTime);

          this.checkedInPatientsTasks = response;
          this.applyFilter(this.globalsService.getFilterPreferance());
        },
        (error) => console.log(error),
      );

      this.googleAnalyticsService.eventTrack("ViewAnotherVisitDay", this.config.getConfig("GA_WhiteBoard_URL"), "", 0);
    }
    catch (e) {
      this.handleError(e);
    }
  }

  getphotoUrl(patientId: number) {
    return this.whiteBoardSvc.getPhotoURL(patientId);
  }

  updateUrl() {
    return "assets/images/Noimage_Unknow.png";
  }


  getStatusCount(hourlyTask: HourlyTask) {
    return (hourlyTask.CompletedCount > 0 ? 1 : 0) + (hourlyTask.ScheduledCount > 0 ? 1 : 0) + (hourlyTask.SkippedCount > 0 ? 1 : 0)
      + (hourlyTask.OverdueCount > 0 ? 1 : 0) + (hourlyTask.DueCount > 0 ? 1 : 0);
  }

  /********************* Filters - Start************************* */

  applyFilter(jsonData: FilterPreferance) {
    try {
      if (jsonData !== undefined && jsonData !== null) {
        this.SortOn = jsonData.SortBy;
        this.criticalFirst = jsonData.SortCriticalFirst;
      }

      if (this.criticalFirst) {
        this.googleAnalyticsService.eventTrack("SortCritcalPatientsFirst", this.config.getConfig("GA_WhiteBoardFilters_URL"), "", 0);
      }

      if (this.SortOn) {
        this.googleAnalyticsService.eventTrack((this.SortOn === "Patient") ? "SortPetName" : "SortClientName",
          this.config.getConfig("GA_WhiteBoardFilters_URL"), "", 0);
      }

      if (this.isFilterPresent(jsonData)) {
        this.filter(jsonData);

        this.send_GA_FilterPref_Events(jsonData);

        this.configureCollectionView(this.FilteredPatients);
      }
      else {
        this.configureCollectionView(this.checkedInPatientsTasks);
      }
    }
    catch (e) {
      this.handleError(e);
    }
  }

  filter(filterData: FilterPreferance) {
    if (this.checkedInPatientsTasks !== undefined && this.checkedInPatientsTasks !== null) {
      this.FilteredPatients = this.checkedInPatientsTasks.filter((a): any => {
        return ((filterData.ResourceIDs.length === 0 || filterData.ResourceIDs.findIndex(s => s === a.Visit.PrimaryResourceId) > -1)
          && (filterData.LocationIDs.length === 0 || filterData.LocationIDs.findIndex(s => s === a.Visit.LocationId || (s === 0 && !a.Visit.LocationId)) > -1)
          && (filterData.DepartmentIDs.length === 0 || a.Visit.DepartmentIDs.some(s => { return (filterData.DepartmentIDs.indexOf(s) > -1); }))
          && (filterData.VisitIDs.length === 0 || a.Visit.VisitTypeIDs.some(s => { return (filterData.VisitIDs.indexOf(s) > -1); })));
      });
    }
  }

  isFilterPresent(jsonData: FilterPreferance): boolean {
    if (jsonData === undefined || jsonData === null || (jsonData.DepartmentIDs.length === 0) && (jsonData.ResourceIDs.length === 0) && (jsonData.LocationIDs.length === 0) && (jsonData.VisitIDs.length === 0)) {
      return false;
    }
    else {
      return true;
    }
  }

  /********************* Filters - End************************* */
  @ViewChild('tooltip') tooltip: any;
  //@ViewChild('label') label:any;

  showToolTip(e: any, tValue: string, condition: string) {
    try {
      let _ht = this.flex2.hitTest(e);
      let celldata = this.flex2.getCellBoundingRect(_ht.row, _ht.col);
      if (celldata) {
        celldata.top = e.clientY - 10;
        celldata.left = e.clientX - 280;
      }
      let displayString = "";
      if (condition === 'Number of Overdue Tasks.') {
        displayString += "<div class='general'>" + tValue + "</div>";
      }
      else if (condition === 'AppointmentReason') {
        if (tValue.length > 50) {
          displayString += "<div class='general'>" + tValue + "</div>";
        }
      }
      else if (condition === 'Resource') {
        displayString += "<div class='general'>" + tValue + "</div>";
      }
      if (displayString.length > 0) {
        this.grpTooltip = new wjcCore.Tooltip();
        this.grpTooltip.show(this.tooltip.nativeElement, displayString, celldata);
      }

    }
    catch (e) {
      //this.handleError(e);
    }
  }


  hideGroupToolTip() {
    this.grpTooltip.hide();
  }

  // showTaskOccurenceToolTip(e: any, item: Patient, time: string) {
  //   try {
  //     this.grpTooltip = new wjcCore.Tooltip();
  //     let displayString = "";
  //     let schTime: string = '';
  //     let _ht = this.flex2.hitTest(e);
  //     let cellBounds = this.flex2.getCellBoundingRect(_ht.row, _ht.col);
  //     //cellBounds.left = cellBounds.left + 210;
  //     // if (_ht.row > 0) {
  //     //   cellBounds.top = cellBounds.top + 115;
  //     // }
  //     // else {
  //     //   cellBounds.top = cellBounds.top - 120;
  //     // }

  //     cellBounds.left = e.clientX + 100;
  //     if (_ht.row > 0) {
  //       cellBounds.top = e.clientY;
  //     }
  //     else {
  //       cellBounds.top = e.clientY - 120;
  //     }
  //     if (item.HourlyTasks !== null) {
  //       displayString += `<div class="ui segments ">`;
  //       item.HourlyTasks.forEach(element => {
  //         if (time === element.Hour) {
  //           if (element.TaskOccurrences !== null) {
  //             element.TaskOccurrences.forEach(inner => {
  //               let status: string = inner.Status.toLowerCase();
  //               if (status === 'cancelled') {
  //                 status = "canceled";
  //               }
  //               if (status === 'scheduled') {

  //                 const today = new Date;
  //                 let calcTimeDiffOverDue: number = (inner.IsTimeSensitive) ? this.globalsService.TimeSensitiveTaskDueInMinutes : this.globalsService.TimeInsensitiveTaskDueInMinutes;
  //                 if (inner.ScheduledTime) {
  //                   let vScheduleDateArray = inner.ScheduledTime.split(' ');
  //                   if (vScheduleDateArray && vScheduleDateArray.length > 2) {
  //                     let vScheduleDate = vScheduleDateArray[0];
  //                     let vScheduleTime = vScheduleDateArray[1] + ' ' + vScheduleDateArray[2];
  //                     const vDate = new Date(vScheduleDate + " " + vScheduleTime);
  //                     let timeDiff: number = today.getTime() - vDate.getTime();
  //                     let timeDiffInMins = (timeDiff / 60000);
  //                     if (timeDiffInMins > 0 && timeDiffInMins <= calcTimeDiffOverDue) {
  //                       //Duenow
  //                       status = "duenow";
  //                     }
  //                     else if (timeDiffInMins > 0 && timeDiffInMins > calcTimeDiffOverDue) {
  //                       //Duenow
  //                       status = "overdue";
  //                     }
  //                   }
  //                 }
  //               }

  //               if (status === 'complete' || status === 'completed' || status === 'skipped' || status === 'canceled') {
  //                 schTime = inner.StatusSetDate;
  //               }
  //               else {
  //                 schTime = inner.ScheduledTime;
  //               }
  //               const name: string = inner.Name;
  //               const sensitive: string = inner.IsTimeSensitive ? "<div>Time Sensitive</div>" : " ";

  //               displayString += `
  //             <div class="ui segment tooltip">
  //           <div class="occurence_border `+ status + `"></div>
  //             `;
  //               displayString += "<div class='time'>" + this.getTimeAndMinute(schTime) + "</div>";
  //               displayString += "<div class='description'>" + name + sensitive + "</div></div>";

  //             }
  //             );
  //           }
  //         };
  //       });
  //       displayString += "</div>";

  //     }
  //     if ((displayString !== `<div class="ui segments "></div>`) && (displayString.length !== 0)) {
  //       this.grpTooltip.show(this.tooltip.nativeElement, this.globalsService.getFormattedToolTip(displayString), cellBounds);
  //     }
  //   }
  //   catch (e) {
  //     this.handleError(e);
  //   }
  // }

  tooltipArray = new Array<Tooltip>();
  TooltipCondition: boolean = false;

  suiOccurenceToolTip(item: Patient, time: string, toolTip: any) {
    this.TooltipCondition = false;
    try {
      if (item.HourlyTasks !== null) {
        item.HourlyTasks.forEach(element => {
          if (time === element.Hour) {
            if (element.TaskOccurrences !== null) {
              this.tooltipArray = [];
              element.TaskOccurrences.forEach(inner => {

                var tt = new Tooltip();
                tt.Status = inner.Status.toLowerCase();
                if (tt.Status === 'cancelled') {
                  tt.Status = "canceled";
                }
                if (tt.Status === 'scheduled') {

                  var today = new Date;
                  let calcTimeDiffOverDue: number = (inner.IsTimeSensitive) ? this.globalsService.TimeSensitiveTaskDueInMinutes : this.globalsService.TimeInsensitiveTaskDueInMinutes;
                  if (inner.ScheduledTime) {
                    let vScheduleDateArray = inner.ScheduledTime.split(' ');
                    if (vScheduleDateArray && vScheduleDateArray.length > 2) {
                      let vScheduleDate = vScheduleDateArray[0];
                      let vScheduleTime = vScheduleDateArray[1] + ' ' + vScheduleDateArray[2];
                      var vDate = new Date(vScheduleDate + " " + vScheduleTime);
                      let timeDiff: number = today.getTime() - vDate.getTime();
                      let timeDiffInMins = (timeDiff / 60000);
                      if (timeDiffInMins > 0 && timeDiffInMins <= calcTimeDiffOverDue) {
                        //Duenow
                        tt.Status = "duenow";
                      }
                      else if (timeDiffInMins > 0 && timeDiffInMins > calcTimeDiffOverDue) {
                        //Duenow
                        tt.Status = "overdue";
                      }
                    }
                  }
                }

                if (tt.Status === 'complete' || tt.Status === 'completed' || tt.Status === 'skipped' || tt.Status === 'canceled') {
                  tt.Time = this.getTimeAndMinute(inner.StatusSetDate);
                }
                else {
                  tt.Time = this.getTimeAndMinute(inner.ScheduledTime);
                }
                tt.Name = inner.Name;
                tt.TimeSensitive = inner.IsTimeSensitive ? "Time Sensitive" : "";
                this.tooltipArray.push(tt);
                if (this.tooltipArray.length > 0) {
                  this.TooltipCondition = true;
                }
              }
              );
            }
          };
        });
      }

      toolTip.popup.elementRef.nativeElement.hidden = !this.TooltipCondition;
    }
    catch (e) {
      this.handleError(e);
    }
  }




  closeGridPopup(toolTip: any) {
    this.TooltipCondition = false;
    toolTip.popup.elementRef.nativeElement.hidden = !this.TooltipCondition;
    this.tooltipArray = [];
  }

  shortTime(time: string) {
    const time1 = time.split(":")[0];
    if (time1.length === 1) {
      return "0" + time;
    }
    else {
      return time;
    }

  }

  getTimeAndMinute(date: string) {
    let value = 'No time specified';
    if (date && date.indexOf(' ') > 0) {
      const time = date.split(' ')[1];
      if (time.indexOf(':') > 0) {
        value = time.substring(0, time.lastIndexOf(':'));
      }
    }
    return value.length === 4 ? '0' + value : value;
  }

  isNoData(hourlyTasks: HourlyTask[], hour: string, i: any, position: any) {

    return hourlyTasks && hourlyTasks.length > 0 && hourlyTasks.findIndex(t => t.Hour == hour) == -1;
  }



  send_GA_FilterPref_Events(jsonData: FilterPreferance) {
    if (jsonData.VisitIDs.length > 0) {
      this.googleAnalyticsService.eventTrack("FilterVisitTypes",
        this.config.getConfig("GA_WhiteBoardFilters_URL"), "", 0);
    }
    if (jsonData.LocationIDs.length > 0) {
      this.googleAnalyticsService.eventTrack("FilterLocations",
        this.config.getConfig("GA_WhiteBoardFilters_URL"), "", 0);
    }
    if (jsonData.ResourceIDs.length > 0) {
      this.googleAnalyticsService.eventTrack("FilterResources",
        this.config.getConfig("GA_WhiteBoardFilters_URL"), "", 0);
    }
    if (jsonData.DepartmentIDs.length > 0) {
      this.googleAnalyticsService.eventTrack("FilterDepartments",
        this.config.getConfig("GA_WhiteBoardFilters_URL"), "", 0);
    }
  }

  send_GA_UserTimingData(variable: string, label: string, duration: number) {
    //this.googleAnalyticsService.set_ApplicationLevl_GA_Dimensions();
    this.googleAnalyticsService.userTimingsTrack(this.config.getConfig("GA_UserTiming_Category"),
      variable, label, duration);
  }

  private handleError(error: Response | any) {
    this.errorHandler.exceptionHandling(false, error);
  }

  public openPopup(input: IPopup, AppointmentReason: string) {
    if (AppointmentReason.length > 50) {
      this.popuptext = AppointmentReason;
      input.open();
    }
  }
}
