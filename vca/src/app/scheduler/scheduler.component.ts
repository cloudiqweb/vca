// Angular
import {
  Component, Input,
  Inject, ViewChild, OnInit, Renderer2
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { ContextMenuComponent } from 'ngx-contextmenu';
import { ContextMenuService } from 'ngx-contextmenu';
import { Subscription } from 'rxjs/Subscription';

import * as wjcCore from 'wijmo/wijmo';
import * as wjcGrid from 'wijmo/wijmo.grid';


import { SchedulerService } from './scheduler.service';
import { GlobalsService } from '../globals.service';
import { AppConfig } from '../app.config';
import { DataGroupByPipe } from '../shared/categoryGroup.pipe';
import { GoogleAnalyticsService } from '../shared/googleAnalytics.service';
import { TimerService } from '../shared/timer.service';
import { TaskOccurrenceInfo } from '../data/optionalTasks';
import { GlobalErrorHandler } from '../app.errorHandler';

// The application root component.
@Component({
  selector: 'scheduler',
  templateUrl: './scheduler.component.html',
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

export class SchedulerComponent implements OnInit {
  popuptext: string = "";
  appVersionNumber: string;
  showAppointments: boolean;
  private showCareNotes: boolean;
  private notScheduledCount: number;
  occurances: any;
  protected dataSvc: SchedulerService;
  instructionsText: string;
  taskSeriesName: string;
  showDiscontinue: boolean;
  showCancelled: boolean;
  showOccurrenceOptions: boolean;
  currentOccurrence: any;
  reAssignSeries: any;
  selectedReassignSeries: string;
  private datePipe: DatePipe;
  height = 430;
  private firstTimeLoad: boolean = true;
  occuranceCount: number;

  tasks: wjcCore.CollectionView;
  errorMessage: string;
  timeSeries: any[];
  globalService: GlobalsService;
  patientFinding: any;
  showOptionalTasks: boolean;
  patientListFinding: any[];
  categoryImages: any;
  status: string;
  occuranceOpenTime: Date;
  optionalTasksOpenTime: Date;
  seriesOpenTime: Date;
  dateLoaded: string;
  pagination: any[] = [];
  pageIndex: number = -1;
  timeBarLeft: number = 0;
  timeBarLeftGrp: number = 0;
  timeBarCellPosition: number = 0;
  timeBarCurrentTime: string = "";
  timeBarAlignment: string = "right";
  isDisplayTimeBar: boolean = false;

  statusCompleted: string = 'Complete';
  statusSkipped: string = 'Skipped';
  statusCancelled: string = 'Cancelled';
  private statusScheduled: string = 'Scheduled';
  private statusDuenow: string = "Duenow";
  private statusOverdue: string = "Overdue";
  private statusActive = 'Active';
  private statusActiveID = 122;
  grpTooltip: wjcCore.Tooltip;
  frozenColumnCount: number = 1;
  timerExceuteTime: String;
  private toolTipTaskNameTxt = "Task name";
  private toolTipStatusTxt = "Status";

  private taskSub: Subscription;
  private timerSubscription: Subscription;
  private categoryImagesSub: Subscription;
  private occuranceInfoSub: Subscription;
  private scheduleInfoGetSub: Subscription;
  private scheduleInfoPutSub: Subscription;
  private taskOccuranceInfoSub: Subscription;

  private taskOptionSeries: any;
  showSeriesModal: boolean;
  showOccurrenceModal: boolean;
  modalOptions: any;
  listenFunc: Function;
  selectedCellTime: string;

  showComplete: boolean;

  private timeOut_TOccurance_SngClick = 500;
  private timeOut_TOccurance_DblClick = 100;
  private timeout_TOccurance_ID: any;
  private ignore_TOccurance_SngClicks = false;



  @ViewChild('flex') flex: wjcGrid.FlexGrid;
  @ViewChild('wjAddTask') wjAddTask: any;
  @ViewChild('wjAddCareNotes') wjAddCareNotes: any;
  @ViewChild(ContextMenuComponent) public contextMenu: ContextMenuComponent;
  @Input() patientBannerHeight: any;

  occurrenceMenuOptions: string[] = ['Edit', 'Complete', 'Cancel', 'Skip'];

  constructor( @Inject(SchedulerService) dataSvc: SchedulerService,
    private globalsService: GlobalsService, private config: AppConfig,
    private contextMenuService: ContextMenuService,
    private googleAnalyticsService: GoogleAnalyticsService,
    private errorHandler: GlobalErrorHandler,
    private renderer: Renderer2) {
    this.dataSvc = dataSvc;
    this.globalService = globalsService;
  }

  ngOnInit() {
    this.appVersionNumber = this.config.getConfig("Version_Number");
    this.googleAnalyticsService.set_ApplicationLevl_GA_Dimensions();
    this.googleAnalyticsService.pageTrack(this.config.getConfig("GA_Scheduler_URL"), "");
    this.showOptionalTasks = false;
    this.grpTooltip = new wjcCore.Tooltip();
    this.getCategoryImages();
    this.getDaysAndTime(1);
    this.dataSvc.loadStatusData();
    this.datePipe = new DatePipe("en-US");
    this.dateLoaded = this.datePipe.transform(new Date(), 'dd-MMM-yyyy');
    this.loadSchedulerData();
    this.pageVisibilityChanges();

    this.modalOptions = {
      "size": "small",
      "type": "default"
      //"closeable": true
    };
    if (!this.globalsService.taskDueConfigFetched) {
      this.dataSvc.getTaskDueConfig().subscribe(response => {
        this.globalService.TimeSensitiveTaskDueInMinutes = response.TimeSensitiveTaskDueInMinutes;
        this.globalService.TimeInsensitiveTaskDueInMinutes = response.TimeInsensitiveTaskDueInMinutes;
        this.globalsService.taskDueConfigFetched = true;
      });
    }
  }

  ngAfterViewInit() {
    try {
      const flex = this.flex;
      this.flex.cells.rows.defaultSize = 40;
      if (flex) {
        flex.allowMerging = wjcGrid.AllowMerging.ColumnHeaders;
        // add extra column header row
        const row = new wjcGrid.Row(),
          ch = flex.columnHeaders;
        row.allowMerging = true;
        row.wordWrap = true;
        for (let i = 0; i < flex.columns.length; i++) {
          flex.columns[i].allowMerging = true;
        }
        ch.rows.insert(0, row);
        this.setHeader(ch, 0, 0, 1, 0, 'Category');

        for (let index = 0; index < this.timeSeries.length; index++) {
          this.setHeader(ch, 1, index + this.frozenColumnCount, 1, index + this.frozenColumnCount, this.timeSeries[index].display);
        }
      }

      this.setGridFocusToCurrentTime(flex);
      this.timerSubscribe();
    }
    catch (e) {
      this.handleError(e);
    }

  }

  ngOnDestroy() {
    if (this.timerSubscription) {
      this.timerUnSubscribe();
    }

    this.listenFunc();

    if (this.taskSub) {
      this.taskSub.unsubscribe();
    }

    if (this.categoryImagesSub) {
      this.categoryImagesSub.unsubscribe();
    }
    if (this.occuranceInfoSub) {
      this.occuranceInfoSub.unsubscribe();
    }
    if (this.scheduleInfoGetSub) {
      this.scheduleInfoGetSub.unsubscribe();
    }
    if (this.scheduleInfoPutSub) {
      this.scheduleInfoPutSub.unsubscribe();
    }
    if (this.taskOccuranceInfoSub) {
      this.taskOccuranceInfoSub.unsubscribe();
    }

    this.dataSvc.taskScheduleInfoCompare = null;
    this.dataSvc.clearObjects();
  }


  /************************** Scheduler Grid Events - Start********************************* */
  loadSchedulerData() {
    if (this.grpTooltip) {
      this.grpTooltip.hide();
      this.grpTooltip.dispose();
    }
    if (this.taskSub) {
      this.taskSub.unsubscribe();
    }
    this.getTasks();
    this.displayTimeBarOnGrid();
  }

  private getTasks() {
    try {
      if (this.taskSub) {
        this.taskSub.unsubscribe();
      }

      if (this.firstTimeLoad && this.globalService.getScheudlerCurrentDate() !== "") {
        this.dateLoaded = this.globalService.getScheudlerCurrentDate();
      }

      const timeStart: number = performance.now();
      this.taskSub = this.dataSvc.getTasks(this.dateLoaded)
        .subscribe(
        res => {
          const timeEnd: number = performance.now();
          const responseTime: number = timeEnd - timeStart;
          this.send_GA_UserTimingData(this.config.getConfig('GA_Orders_AggregatedData_URL'), "GET", responseTime);
          this.configureCollectionView(res.Data);
          this.timerExceuteTime = new DatePipe("en-US").transform(new Date(), 'HH:mm:ss');
        },
        error => console.log(error)
        );
    }
    catch (e) {
      this.handleError(e);
    }
  }

  private configureCollectionView(res: any) {
    try {
      if (res !== null) {
        this.globalService.numberOfDays = res.NumberOfDays;
        this.pagination = [];
        const currentFormatedDate = this.dateLoaded;
        let visitReducedBelowLoadedDate = false;

        if (res.Dates) {
          const responseDates: Array<string> = res.Dates;
          for (let i = 0; i < responseDates.length; i++) {
            const pageDate: Date = new Date(responseDates[i]);
            this.pagination.push({ "day": i, "date": pageDate });

            if (i === responseDates.length - 1) {
              this.dataSvc.visitEndDate = this.datePipe.transform(pageDate, 'yyyy-MM-dd');
            }
            const pageFormatedData = this.datePipe.transform(pageDate, 'dd-MMM-yyyy');

            if (this.firstTimeLoad) {
              if (pageFormatedData === currentFormatedDate) {
                this.pageIndex = i;
              }
            }
            //when the visit end date falls below display date
            if (!this.firstTimeLoad && i === responseDates.length - 1 && new Date(currentFormatedDate) > pageDate) {
              this.pageIndex = i;
              this.dateLoaded = pageFormatedData;
              visitReducedBelowLoadedDate = true;
            }
          }
        }
        //navigate to reset page
        if (visitReducedBelowLoadedDate) {
          this.navigatePageItemByNum(this.pageIndex + 1);
        }
        if (this.firstTimeLoad) {
          this.firstTimeLoad = false;
          if (this.globalService.getScheudlerCurrentPage() > -1) {
            this.pageIndex = this.globalService.getScheudlerCurrentPage();
            this.navigatePageItemByNum(this.pageIndex + 1);
          }
          if (this.pageIndex >= 0) {
            this.navigatePageItemByNum(this.pageIndex + 1);
          }
          else {
            this.navigatePageItem('>');
          }
        }
        this.configureCollectionViewWithData(res);
      }
    }
    catch (e) {
      this.handleError(e);
    }
  }

  private configureCollectionViewWithData(res: any) {

    const currentDate = new Date();
    this.globalService.setScheudlerCurrentPage(this.pageIndex);
    this.globalService.setScheudlerCurrentDate(this.dateLoaded);


    const data: any = [];
    if (res.TaskCategories === null) {
      res.TaskCategories = [];
    }

    const timeDiffOverNow: number = this.globalService.TimeInsensitiveTaskDueInMinutes;
    const timeDiffSensitive: number = this.globalService.TimeSensitiveTaskDueInMinutes;
    this.globalService.visitDates = [];
    for (let value = 0; value < res.Dates.length; value++) {
      const inputDate = new Date(res.Dates[value]).toString().split(' ');
      this.globalService.visitDates.push({
        "dateString": "Day " + (value + 1) + " - " + inputDate[0] + " "
        + inputDate[2] + "-" + inputDate[1] + "-" + inputDate[3],
        "date": this.datePipe.transform(res.Dates[value], 'yyyy-MM-dd')
      });
    }
    for (const cat of res.TaskCategories) {
      const obj = {};
      for (let i = 0, j = cat.TaskSeries.length; i < j; i++) {
        obj[cat.TaskSeries[i].Name] = (obj[cat.TaskSeries[i].Name] || 0) + 1;
      }
      // Hide Cancelled Task Series Data if ShowCancelled Checkbox is Unchecked.
      cat.TaskSeries = cat.TaskSeries.filter((x: any) => this.showCancelled ? (x.StatusId === x.StatusId) : (x.StatusId !== 123));
      for (const task of cat.TaskSeries) {
        task["category"] = cat.CategoryName;
        task["name"] = task.Name;
        task["icon"] = this.categoryImages[cat.CategoryName];
        task["TaskSeriesCount"] = cat.TaskSeriesCount;
        //task["DisplayNameInstructions"] = task.Name + ((task.Instructions) ? (' | ' + task.Instructions) : "");
        for (let index = 0; index < 24; index++) {
          const temp = {};
          temp["day"] = 1;
          temp["id"] = index;
          //Display Hour Format Updated
          temp["display"] = (index.toString().length === 1 ? ('0' + index.toString()) : index.toString()) + ":00";
          temp["groupedTasks"] = [];
          task[temp["display"]] = temp;
        }
        const calcTimeDiffOverDue: number = (task.IsTimeSensitive) ? timeDiffSensitive : timeDiffOverNow;

        for (const ocr of task.HourlyTaskOccurrences) {
          if (ocr.Date) {
            const ocrFormatedDate = this.datePipe.transform(ocr.Date, 'dd-MMM-yyyy');
            const dataLoadedFormatedDate = this.datePipe.transform(this.dateLoaded, 'dd-MMM-yyyy');
            if (dataLoadedFormatedDate === ocrFormatedDate) {
              for (const v of ocr.TaskOccurrences) {
                if (v.StatusName === this.statusScheduled) {
                  if (v.ScheduledDateTime) {
                    const vScheduleDate = v.ScheduledDateTime.split('T')[0];
                    const vScheduleTime = v.ScheduledDateTime.split('T')[1];
                    const vDate = new Date(vScheduleDate + " " + vScheduleTime);
                    const timeDiff: number = currentDate.getTime() - vDate.getTime();
                    const timeDiffInMins = (timeDiff / 60000);
                    if (timeDiffInMins > 0 && timeDiffInMins <= calcTimeDiffOverDue) {
                      //Duenow
                      v.StatusName = this.statusDuenow;
                    }
                    else if (timeDiffInMins > 0 && timeDiffInMins > calcTimeDiffOverDue) {
                      //Duenow
                      v.StatusName = this.statusOverdue;
                    }
                  }
                }
              }
              let groupByData = new DataGroupByPipe().transform(ocr.TaskOccurrences, "StatusName");
              if (groupByData.length > 0) {
                groupByData = groupByData.filter(item => this.showCancelled || item.key !== "Cancelled");
              }
              //Display Hour Format Updated
              const hour = ocr.Hour.split(':')[0];
              const formattedHour = (hour.toString().length === 1 ? ('0' + hour.toString()) : hour.toString()) + ":00";
              task[formattedHour].groupedTasks = groupByData;

            }
          }
        }
        data[data.length] = task;
      }
    }

    this.tasks = new wjcCore.CollectionView(data);
    const groupDesc = new wjcCore.PropertyGroupDescription('category');
    this.tasks.groupDescriptions.push(groupDesc);

    this.updateColumnHeader(this.pageIndex + 1);
  }

  getUserInitials(userName: string) {
    let userInitials = "";
    try {
      if (userName) {
        userInitials = userName;
        let userNames: any;
        if (userName.indexOf(":") !== -1) {
          userNames = userName.split(":");
          if (userNames.length > 1) {
            userInitials = userNames[1];
          }
          else {
            userInitials = userNames[0];
          }
        }

        if (userInitials.indexOf("\\") !== -1) {
          userNames = userInitials.split("\\");
          if (userNames.length > 1) {
            userInitials = userNames[1];
          }
          else {
            userInitials = userNames[0];
          }
        }

        userNames = userInitials.split(".");
        if (userNames.length > 1) {
          userInitials = userNames[0].slice(0, 1) + userNames[1].slice(0, 1);
        }
        else {
          userInitials = userNames[0].slice(0, 1);
        }
      }
    }
    catch (e) {
      this.handleError(e);
    }
    return userInitials;
  }


  private getCategoryImages() {
    if (this.categoryImagesSub) {
      this.categoryImagesSub.unsubscribe();
    }

    this.categoryImagesSub = this.dataSvc.getCategoryImages().subscribe(
      res => {
        this.categoryImages = res;
      },
      error => console.log(error)
    );
  }

  private pageVisibilityChanges() {
    this.listenFunc = this.renderer.listen(document, 'visibilitychange', () => {
      if (document.hidden) {
        this.timerUnSubscribe();
      } else {
        this.loadSchedulerData();
        this.timerSubscribe();
      }
    });
  }

  private getDaysAndTime(numberOfDays: Number) {
    this.timeSeries = [];
    for (let day = 1; day <= numberOfDays; day++) {
      for (let index = 0; index < 24; index++) {
        const temp = {};
        temp["day"] = day;
        //Display Hour Format Updated
        temp["id"] = index;
        temp["display"] = (index.toString().length === 1 ? ('0' + index.toString()) : index.toString()) + ":00";
        temp["grid"] = (index.toString().length === 1 ? ('0' + index.toString()) : index.toString());
        this.timeSeries.push(temp);
      }
    }
  }


  getColumnHeader(currentDay: number) {
    const loadedDate = new Date(this.dateLoaded);
    return ('Day ' + currentDay + '  |  ' + this.globalService.weekDays[loadedDate.getDay()] + ' ' + this.dateLoaded);
  }


  private updateColumnHeader(currentDay: number) {
    //const ch = this.flex.columnHeaders;
    // for (let index = 0; index < this.timeSeries.length; index++) {
    //   let loadedDate = new Date(this.dateLoaded);
    //   // this.setHeader(ch, 0, index + this.frozenColumnCount, 0, index + this.frozenColumnCount, 'Day ' + currentDay + '  |  ' + this.weekDays[loadedDate.getDay()] + ' ' + this.dateLoaded);
    //   // this.setHeader(ch, 1, index + this.frozenColumnCount, 0, index + this.frozenColumnCount, this.timeSeries[index].display);
    // }
  }

  // set cell header
  private setHeader(p: wjcGrid.GridPanel, r1: number, c1: number, r2: number, c2: number, hdr: string) {
    for (let r = r1; r <= r2; r++) {
      for (let c = c1; c <= c2; c++) {
        p.setCellData(r, c, hdr);
        break;
      }
    }
  }


  /******************Paging Events Start ********************/
  navigatePageItem(action: string) {
    try {
      if (action === '+') {
        if (this.pagination.length - 1 > this.pageIndex) {
          this.pageIndex = this.pageIndex + 1;
        }
      }
      else if (action === '-') {
        if (this.pageIndex > 0) {
          this.pageIndex = this.pageIndex - 1;
        }
      }
      else if (action === '<') {
        this.pageIndex = 0;
      }
      else if (action === '>') {
        this.pageIndex = this.pagination.length - 1;
      }

      if (!this.firstTimeLoad) {
        this.googleAnalyticsService.eventTrack("ViewAnotherVisitDay", this.config.getConfig("GA_Scheduler_URL"), "", 0);
      }

      const cDate: Date = this.pagination[this.pageIndex].date;
      const cDateFormated = this.datePipe.transform(cDate, 'dd-MMM-yyyy');
      if (cDateFormated !== this.dateLoaded) {
        this.dateLoaded = cDateFormated;
        this.loadSchedulerData();
      }
    }
    catch (e) {
      this.handleError(e);
    }
  }

  navigatePageItemByInput(event: any) {
    try {
      if (event.returnValue) {
        const num: number = parseInt(event.target.value);
        this.navigatePageItemByNum(num);
        event.target.value = (this.pageIndex < 10) ? ("0" + (this.pageIndex + 1)) : (this.pageIndex + 1);
      }
    }
    catch (e) {
      this.handleError(e);
    }
  }

  navigatePageItemByNum(num: number) {
    if (num > 0 && num <= this.pagination.length) {
      if (!this.firstTimeLoad) {
        this.googleAnalyticsService.eventTrack("ViewAnotherVisitDay", this.config.getConfig("GA_Scheduler_URL"), "", 0);
      }
      this.pageIndex = num - 1;
      const cDate: Date = this.pagination[this.pageIndex].date;
      const cDateFormated = this.datePipe.transform(cDate, 'dd-MMM-yyyy');
      if (cDateFormated !== this.dateLoaded) {
        this.dateLoaded = cDateFormated;
        this.loadSchedulerData();
      }
    }
  }
  /******************Paging Events End ********************/

  setGridFocusToCurrentTime(flex: wjcGrid.FlexGrid) {
    try {
      let sColumnIndex = this.globalService.getSchedulerCurrentHour();
      sColumnIndex = (sColumnIndex > -1) ? sColumnIndex : new Date().getHours();

      let columnIndex: number = sColumnIndex + this.frozenColumnCount;
      if (columnIndex < 19) {
        columnIndex = columnIndex + 5;
      }
      else {
        columnIndex = 24;
      }
      flex.scrollIntoView(0, columnIndex);
      this.globalService.setSchedulerCurrentHour(-1);
    }
    catch (e) {
      console.error(e);
    }
  }

  displayTimeBarOnGrid() {
    const datePipe = new DatePipe("en-US");
    const currentDate: Date = new Date();
    const currentFormatedDate = datePipe.transform(currentDate, 'dd-MMM-yyyy');

    const dataLoadedFormatedData = datePipe.transform(this.dateLoaded, 'dd-MMM-yyyy');
    if (dataLoadedFormatedData === currentFormatedDate) {
      this.isDisplayTimeBar = true;
      this.timeBarCellPosition = currentDate.getHours();
      this.timeBarCurrentTime = datePipe.transform(currentDate, 'HH:mm');

      const currentMinutes: number = currentDate.getMinutes();
      this.timeBarLeft = (currentMinutes < 52) ? currentMinutes : 52;

      this.timeBarAlignment = (this.timeBarLeft < 40) ? "right" : "left";
      this.timeBarLeftGrp = this.timeBarLeft - 3;
    }
    else {
      this.isDisplayTimeBar = false;
    }
  }

  /************************** Scheduler Grid Events - End********************************* */


  /************************ Timer Events - Start**************************************** */
  timerSubscribe() {
    this.timerUnSubscribe();
    this.timerSubscription = TimerService.getInstance().timerInitiate$
      .subscribe(item => {
        const timerInitiate: boolean = item.valueOf();
        if (timerInitiate) {
          this.loadSchedulerData();
        }
      });
  }

  timerUnSubscribe() {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
  }
  /************************ Timer Events - End**************************************** */

  /************************ Tool tip Events - Start**************************************** */

  showToolTip(e: any, tValue: string, offset: number = 0) {
    let _ht = this.flex.hitTest(e);
    let ypos = _ht.col;
    if (tValue == "Number of overdue tasks.") {
      ypos += 1;
    }
    let cellBounds = this.flex.getCellBoundingRect(_ht.row, ypos);
    this.grpTooltip.gap = offset;
    this.grpTooltip.show(this.flex.hostElement, tValue, cellBounds);
  }



  showGroupToolTip(e: any, tValue: any, item: any, toolTip: any) {
    try {
      // this.grpTooltip = new wjcCore.Tooltip();
      const _ht = this.flex.hitTest(e);
      const cellBounds = this.flex.getCellBoundingRect(_ht.row, _ht.col);

      // if (_ht.col < 16) {
      //   cellBounds.left = cellBounds.left + 180;
      //   cellBounds.top = cellBounds.top + 48;
      // }
      // else {
      //   cellBounds.left = cellBounds.left + 180;
      //   cellBounds.top = cellBounds.top + 20;
      // }

      if (cellBounds) {
        cellBounds.top = e.clientY;
        cellBounds.left = e.clientX;
      }

      let tooltipContent = "";
      if (tValue) {
        tooltipContent = this.getGrpTooltipContent(tValue, toolTip);
      }
      else {
        if (item.NotScheduledCount === 0 && item.NotInvoiceable === true) {
          tooltipContent = "Cannot schedule additional occurrences of this task unless added to the order first.";
        }
        else {
          tooltipContent = "Double-click to schedule in this hour."; // Tooltip for Empty Cell Hover
        }
      }
      if (!tValue) {
        this.grpTooltip.show(e.srcElement, tooltipContent, cellBounds);
      }
    }
    catch (e) {

    }
  }

  tooltipArray = new Array<any[]>();
  TooltipCondition: boolean = false;

  getGrpTooltipContent(tValue: any, toolTip: any) {
    this.tooltipArray = [];
    let tooltipContent = `<div class="ui segments ">`;
    try {
      const tasksLength: number = tValue.value.length;
      let currentTaskIndex: number = 1;
      for (let t of tValue.value) {
        const keyValueArr: Array<any> = new Array<any>();
        let keyVal: [string, string];
        keyVal = [this.toolTipTaskNameTxt, t.Name];
        keyValueArr.push(keyVal);
        let timeString = "";
        let formattedStatus = this.getFormattedStatus(t.StatusName);
        if (t.StatusName === this.statusCompleted || t.StatusName === this.statusSkipped || t.StatusName === this.statusCancelled) {
          if (t.StatusSetDate) {
            const dateArr = t.StatusSetDate.split("T");
            if (dateArr.length === 2) {
              const timeArr = dateArr[1].split(":");
              if (timeArr.length > 1) {
                timeString = timeArr[0] + ":" + timeArr[1];
              }
            }
          }
        }
        else {
          if (t.ScheduledDateTime) {
            const dateArr = t.ScheduledDateTime.split("T");
            if (dateArr.length === 2) {
              const timeArr = dateArr[1].split(":");
              if (timeArr.length > 1) {
                timeString = timeArr[0] + ":" + timeArr[1];
              }
            }
          }
        }
        keyVal = [formattedStatus + " time", timeString];
        keyValueArr.push(keyVal);
        keyVal = [this.toolTipStatusTxt, formattedStatus];
        keyValueArr.push(keyVal);
        keyVal = ["PostVisitComplete", t.PostVisitComplete];
        keyValueArr.push(keyVal);
        //tooltipContent += this.getFormattedToolTip(keyValueArr, (currentTaskIndex !== tasksLength));
        this.tooltipArray.push(keyValueArr);
        currentTaskIndex = currentTaskIndex + 1;
      }
      if (this.tooltipArray.length > 0) {
        this.TooltipCondition = true;
      }
      toolTip.popup.elementRef.nativeElement.hidden = !this.TooltipCondition;
    }
    catch (e) {
      this.handleError(e);
    }
    const final = tooltipContent + "</div>";
    return final;

  }

  getFormattedToolTip(arrayValues: any, isMoreTasks: boolean) {
    let toolTipContent = "";
    const status = arrayValues[2][1].toLowerCase().replace(/\s/g, "");
    const postVisit = arrayValues[3][1] ? `<div>Completed post-visit</div>` : '';
    toolTipContent += `
        <div class="ui segment tooltip scheduler">
        <div class="scheduler occurence_border `+ status + `">
        <div class="icon">
                    <div>`;
    switch (status) {
      case 'duenow': {
        toolTipContent += "<span class='tIcon duenow'></span>";
        break;
      }
      case 'completed': {
        toolTipContent += "<span class='tIcon completed'></span>";
        break;
      }

      case 'overdue': {
        toolTipContent += "<span class='tIcon overdue'></span>";
        break;
      }
      case 'skipped': {
        toolTipContent += "<span class='tIcon skipped'></span>";
        break;
      }
      case 'scheduled': {
        toolTipContent += "<span class='tIcon scheduled'></span>";
        break;
      }
      case 'canceled': {
        toolTipContent += "<span class='tIcon canceled'></span>";
        break;
      }
    }
    toolTipContent += `</div></div></div>
    <div class='time scheduler'>`+ arrayValues[1][1] + `</div>
    <div class="description">`+
      arrayValues[0][1]
      + postVisit + `</div>
      `;
    return toolTipContent + "</div>";
  }

  hideGroupToolTip() {
    this.grpTooltip.hide();
    this.grpTooltip.dispose();
  }

  closeGridPopup(toolTip: any) {
    this.TooltipCondition = false;
    toolTip.popup.elementRef.nativeElement.hidden = !this.TooltipCondition;
    this.tooltipArray = [];
  }

  getFormattedStatus(statusName: string) {
    let formattedStatus = statusName;
    switch (statusName) {
      case "Duenow": {
        formattedStatus = "Duenow";
        break;
      }
      case "Complete": {
        formattedStatus = "Complete";
        break;
      }
      case "Cancelled": {
        formattedStatus = "Cancelled";
        break;
      }
      default: {
        break;
      }
    }
    return formattedStatus;
  }


  getFormattedDate(statusDate: string) {
    let timeString = "";
    const dateArr = statusDate.split("T");
    if (dateArr.length === 2) {
      const timeArr = dateArr[1].split(":");
      if (timeArr.length > 1) {
        timeString = timeArr[0] + ":" + timeArr[1];
      }
    }
    return timeString;
  }
  /************************ Tool tip Events - End**************************************** */

  /************************ Task Occurance Events - Start**************************************** */

  onTaskOccuranceSingleClick(taskSeriesId: number, taskSeriesName: string, instructions: string, time: string, occurances: any) {
    try {
      if (!this.ignore_TOccurance_SngClicks) {
        clearTimeout(this.timeout_TOccurance_ID);

        this.timeout_TOccurance_ID = setTimeout(() => {
          if (!this.ignore_TOccurance_SngClicks) {
            this.onTaskOccuranceClicked(taskSeriesId, taskSeriesName, instructions, time, occurances);
          }
        }, this.timeOut_TOccurance_SngClick);
      }
    }
    catch (e) {
      this.handleError(e);
    }
  }

  onTaskOccuranceDoubleClick($event: MouseEvent, taskSeries: any, taskOccurrence: any, currentTime: any) {
    try {
      clearTimeout(this.timeout_TOccurance_ID);
      this.ignore_TOccurance_SngClicks = true;

      setTimeout(() => {
        if (this.ignore_TOccurance_SngClicks) {
          this.ignore_TOccurance_SngClicks = false;
        }
      }, this.timeOut_TOccurance_DblClick);
      this.onTaskOccuranceDoubleClicked(taskSeries, taskOccurrence, currentTime);

    }
    catch (e) {
      this.handleError(e);
    }
  }

  onTaskOccuranceClicked(taskSeriesId: number, taskSeriesName: string, instructions: string, time: string, occurances: any, status: number = 0) {
    try {
      this.taskSeriesName = taskSeriesName;
      const currentDate: Date = new Date();
      currentDate.setMinutes(0);
      if (time) {
        currentDate.setHours(Number(time.split(":")[0]));
      }
      this.instructionsText = instructions;
      const parameterInfo = this.globalsService.getParameters();
      if (occurances) {
        this.occurances = occurances;

        this.dataSvc.initialStatusValue = this.occurances[0].StatusId;
        this.dataSvc.statusValue = status === 127 ? status : this.occurances[0].StatusId;
        if (this.occurances[0].StatusId === 126) {
          this.dataSvc.statusSetDate = this.occurances[0].StatusSetDate.split("T")[0];
          this.dataSvc.statusSetDateValue = this.globalService.visitDates.find((x: any) => x.date === this.dataSvc.statusSetDate);
          this.dataSvc.statusSetTime = this.occurances[0].StatusSetDate.split("T")[1].split(":")[0] + ":" + this.occurances[0].StatusSetDate.split("T")[1].split(":")[1];
        }
        else {
          this.dataSvc.statusSetDate = "";
          this.dataSvc.statusSetTime = "";
        }
      }
      else {
        const cDate = new Date(this.dateLoaded);
        this.dataSvc.scheduledDate = this.datePipe.transform(cDate, 'y-MM-dd');
        this.dataSvc.scheduledTime = this.datePipe.transform(currentDate, 'HH:mm');
      }
      this.dataSvc.taskSeriesId = taskSeriesId;
      this.getTaskOccurance(parameterInfo, taskSeriesId);
      this.googleAnalyticsService.pageTrack(this.config.getConfig("GA_EditTasks_URL"), "");
    }
    catch (e) {
      this.handleError(e);
    }
  }

  onNotScheduledSingleClick(item: any) {
    try {
      if (!this.ignore_TOccurance_SngClicks) {
        clearTimeout(this.timeout_TOccurance_ID);

        this.timeout_TOccurance_ID = setTimeout(() => {
          if (!this.ignore_TOccurance_SngClicks) {
            console.log("Not scheduled single click");
            this.taskOptionSeries = item;
            this.dataSvc.isNotScheduledPopup = true;
            this.saveOrInvokeTaskOccurrenceNotScheduled(125);
          }
        }, this.timeOut_TOccurance_SngClick);
      }
    }
    catch (e) {
      this.handleError(e);
    }
  }

  onNotScheduledDoubleClick($event: MouseEvent, taskSeries: any) {
    try {
      clearTimeout(this.timeout_TOccurance_ID);
      this.ignore_TOccurance_SngClicks = true;

      setTimeout(() => {
        if (this.ignore_TOccurance_SngClicks) {
          this.ignore_TOccurance_SngClicks = false;
        }
      }, this.timeOut_TOccurance_DblClick);
      this.taskOptionSeries = taskSeries;
      this.saveOrInvokeTaskOccurrenceNotScheduled(126);
    }
    catch (e) {
      this.handleError(e);
    }
  }

  onTaskOccuranceDoubleClicked(taskSeries: any, taskOccurrence: any, currentTime: any) {
    try {
      if (this.ignore_TOccurance_SngClicks && !this.showOccurrenceModal) {
        if (taskOccurrence && taskOccurrence.value.length === 1) {
          this.taskOptionSeries = taskSeries;
          this.selectedCellTime = currentTime;
          if (taskSeries.QuantityMustMatch || taskSeries.IsObservationsMetadataPresent) {
            this.editOccurrence(taskOccurrence, -1);
          }
          else {
            this.editOccurrence(taskOccurrence, 126);
            this.googleAnalyticsService.eventTrack("QuickTaskComplete", this.config.getConfig("GA_Scheduler_URL"), "", 0);
          }

        }
      }
    }
    catch (e) {
      this.handleError(e);
    }
  }


  getTaskOccurance(parameterInfo: any, taskSeriesId: number) {
    if (this.occuranceInfoSub) {
      this.occuranceInfoSub.unsubscribe();
    }
    const timeStart: number = performance.now();
    // Call Task Series Meta Data API to fetch the Observation Data
    this.occuranceInfoSub = this.dataSvc.getValidOccuranceInformation(parameterInfo, taskSeriesId)
      .subscribe(
      taskOccurance => {
        const timeEnd: number = performance.now();
        const responseTime: number = timeEnd - timeStart;
        this.send_GA_UserTimingData(this.config.getConfig('GA_TaskSeries_ObservationMetadata_URL'), "GET", responseTime);
        this.configureOccuranceCollectionView(taskOccurance.Data);
      },
      error => this.errorMessage = <any>error
      );
  }

  private configureOccuranceCollectionView(tasks: any) {
    this.dataSvc.taskOccurances = tasks;
    this.occuranceOpenTime = new Date();
    this.showOccurrenceModal = true;
    this.dataSvc.isPatientFinding = true;
    this.timerUnSubscribe();
  }

  _getPatientFinding() {
    return {
      "PatientTaskFindingId": 0,
      "PatientFindingId": 0,
      "TaskOccurrenceId": 0,
      "HospitalId": 0,
      "RichTextValue": "string",
      "Low": 0,
      "High": 0,
      "IsNormal": true,
      "CreatedBy": "string",
      "CreatedDate": "",
      "LastModifiedBy": "",
      "LastModifiedDate": "",
      "PatientId": 0,
      "ObservationId": 0,
      "EnteredUnitId": 0,
      "UnitId": 0,
      "Comment": "string",
      "EffectiveDate": "",
      "EnteredValue": "string",
      "Value": "string"
    };
  }


  // Save Task Occurance Information
  savePatientFindings(isCompleteAndSave: boolean) {
    this.dataSvc.occurrenceValidationMessage = "";
    try {
      this.dataSvc.buttonFlag = !this.dataSvc.buttonFlag;
      const inputOccuranceInfo = this.dataSvc.mappedOccurance;

      if (this.dataSvc.statusSetDate === '') {
        // this.dataSvc.statusSetDate = this.datePipe.transform(new Date(), 'yyyy-MM-dd');
        // console.log(this.dataSvc.statusSetDate);
        // this.dataSvc.statusSetTime = "00:00";
      } else if (!this.dataSvc.IsDateInVisit(this.dataSvc.statusSetDate)) {
        this.dataSvc.occurrenceValidationMessage = "Please provide a date in between the visit dates";
        this.dataSvc.buttonFlag = true;
      }
      //validate complete time when date exists
      if (this.dataSvc.statusSetDate !== '' && (!this.dataSvc.statusSetTime || this.dataSvc.statusSetTime === '')) {
        this.dataSvc.occurrenceValidationMessage = "Please provide valid completed time";
        this.dataSvc.buttonFlag = true;
        return;
      }

      if (inputOccuranceInfo !== undefined) {
        if (isCompleteAndSave) {
          const complteStatusObj = this.dataSvc.getStatusObjectByName(this.statusCompleted);
          if (complteStatusObj !== null && inputOccuranceInfo.StatusId !== complteStatusObj.StatusId) {
            this.dataSvc.statusValue = complteStatusObj.StatusId;
            inputOccuranceInfo.StatusId = complteStatusObj.StatusId;
            inputOccuranceInfo.Status = complteStatusObj.Status;
          }
        }
        else {
          const complteStatusObj = this.dataSvc.getStatusObjectByID(this.dataSvc.statusValue);
          if (complteStatusObj !== null && inputOccuranceInfo.StatusId !== complteStatusObj.StatusId) {
            inputOccuranceInfo.StatusId = complteStatusObj.StatusId;
            inputOccuranceInfo.Status = complteStatusObj.Status;
          }
        }

        //Completion time updates
        inputOccuranceInfo.StatusSetDate = this.dataSvc.statusSetDate === '' ?
          this.globalService.getCurrentDateTime() : this.dataSvc.statusSetDate + 'T' + this.dataSvc.statusSetTime;
        if (this.dataSvc.scheduledDate && this.dataSvc.scheduledTime) {
          inputOccuranceInfo.ScheduledTime = this.dataSvc.scheduledDate + "T" + this.dataSvc.scheduledTime;
        }
        inputOccuranceInfo.Comment = this.dataSvc.comment;
        // Validation for Verify Quantity to Check if the Entered Quantity & Specified Quantity are same.
        // Specified Quantity is Zero
        if (this.dataSvc.specifiedQty === 0
          || inputOccuranceInfo.Status !== this.statusCompleted
          || ((this.dataSvc.specifiedQty === this.dataSvc.confirmQty || this.dataSvc.initialStatusValue === 126)
            && inputOccuranceInfo.Status === this.statusCompleted)) {
          if (this.dataSvc.taskOccurances !== null) {
            for (let i = 0; i < this.dataSvc.taskOccurances.length; i++) {
              const occurance = this.dataSvc.taskOccurances[i];
              if (occurance.selectedAnswerItem) {
                if (occurance.AnswerGroup !== null && occurance.AnswerGroup.OrdinalAnswerItems.length > 4) {
                  occurance.SelectedValue = occurance.selectedAnswerItem.Value;
                }
              }

              if (inputOccuranceInfo.PatientTaskFindings === null || inputOccuranceInfo.PatientTaskFindings === undefined) {
                inputOccuranceInfo.PatientTaskFindings = [];
              }
              // Check if Finding is already available for the Current Observation.
              const findings = inputOccuranceInfo.PatientTaskFindings.find((x: any) => x.ObservationId === occurance.ObservationId);
              if (findings) {
                findings.Comment = occurance.CommentsValue;
                findings.EnteredUnitId = occurance.PropertyMeasureUnitId;
                findings.EnteredValue = (occurance.LOINCScale !== 'narrative') ? occurance.SelectedValue : '';
                findings.RichTextValue = (occurance.LOINCScale === 'narrative') ? occurance.SelectedValue : '';
                findings.IsNormal = true;
                if (occurance.LOINCScale && occurance.LOINCScale.toLowerCase() === 'quantitative' && !occurance.AnswerGroup && occurance.Low && occurance.High) {
                  findings.IsNormal = findings.EnteredValue && parseFloat(findings.EnteredValue) >= occurance.Low && parseFloat(findings.EnteredValue) <= occurance.High;
                }
                findings.UnitId = occurance.PropertyMeasureUnitId;
              } else {
                // Create new finding information & add it to Findings
                const patientFind = this._getPatientFinding();
                patientFind.IsNormal = true;
                if (occurance.LOINCScale && occurance.LOINCScale.toLowerCase() === 'quantitative' && !occurance.AnswerGroup && occurance.Low && occurance.High) {
                  patientFind.IsNormal = patientFind.EnteredValue && parseFloat(patientFind.EnteredValue) >= occurance.Low && parseFloat(patientFind.EnteredValue) <= occurance.High;
                }
                patientFind.Comment = occurance.CommentsValue;
                patientFind.EnteredUnitId = occurance.PropertyMeasureUnitId;
                patientFind.EnteredValue = (occurance.LOINCScale !== 'narrative') ? occurance.SelectedValue : '';
                patientFind.RichTextValue = (occurance.LOINCScale === 'narrative') ? occurance.SelectedValue : '';
                patientFind.UnitId = occurance.PropertyMeasureUnitId;
                patientFind.ObservationId = occurance.ObservationId;
                patientFind.HospitalId = occurance.HospitalId;
                patientFind.PatientTaskFindingId = 0;
                patientFind.PatientFindingId = 0;
                patientFind.PatientId = +this.globalService.getPatientId();
                patientFind.TaskOccurrenceId = this.dataSvc.selectedOccurrence.TaskOccurrenceId;
                patientFind.CreatedDate = this.globalService.getCurrentDateTime();
                inputOccuranceInfo.PatientTaskFindings.push(patientFind);
              }
            }
          }
          if (this.taskOccuranceInfoSub) {
            this.taskOccuranceInfoSub.unsubscribe();
          }

          const timeStart: number = performance.now();
          this.taskOccuranceInfoSub = this.dataSvc.putTaskOccuranceInfo(this.globalsService.getParameters(), inputOccuranceInfo,
            this.dataSvc.selectedOccurrence.TaskOccurrenceId.toString()).subscribe(
            taskOccurance => {
              const timeEnd: number = performance.now();
              const responseTime: number = timeEnd - timeStart;
              this.send_GA_UserTimingData(this.config.getConfig('GA_TaskOccurance_URL'), "PUT", responseTime);
              this.loadResultData(taskOccurance.Data);
            },
            error => this.errorMessage = <any>error,
            () => {
              this.send_GA_EditTaskEvents(inputOccuranceInfo, isCompleteAndSave);
            }
            );

        } else {
          this.dataSvc.occurrenceValidationMessage = "The entered quantity must match the order item quantity to complete the task.";
          this.dataSvc.buttonFlag = true;
        }
      }
    }
    catch (e) {
      this.dataSvc.occurrenceValidationMessage = e;
      this.dataSvc.buttonFlag = !this.dataSvc.buttonFlag;
      this.handleError(e);
    }
  }

  private loadResultData(taskOccuranceInfo: any) {
    if (taskOccuranceInfo) {
      this.dataSvc.occurrenceValidationMessage = taskOccuranceInfo.ValidationMessage;
      this.dataSvc.validationMessage = taskOccuranceInfo.ValidationMessage;
    }
    // Save Occurrence - Posting Successful!!!
    if (this.dataSvc.occurrenceValidationMessage === undefined) {
      this.loadSchedulerData();
      this.showOccurrenceModal = false;
      this.showSeriesModal = false;
    }
  }

  closeOccurrenceModal() {
    this.showOccurrenceModal = false;
    this.timerSubscribe();
  }

  closeOccurrenceModalFromUI() {
    this.showOccurrenceModal = false;
    this.googleAnalyticsService.eventTrack("Cancel", this.config.getConfig("GA_EditTasks_URL"), "", 0);
    this.timerSubscribe();
  }

  /***************** New Tasks start */

  onScheduleNewTaskDblClick(item: any, taskSeriesId: number, displayTime: string, isDoubleClicked: boolean = false) {
    this.googleAnalyticsService.eventTrack("QuickTaskSchedule", this.config.getConfig("GA_Scheduler_URL"), "", 0);
    this.onScheduleNewTaskClick(item, taskSeriesId, displayTime, isDoubleClicked);
  }

  onScheduleNewTaskClick(item: any = 0, taskSeriesId: number, displayTime: string, isDoubleClicked: boolean = false) {
    if (item.NotScheduledCount === 0 && item.NotInvoiceable === true) {
      console.log("Cannot add Task");
    }
    else {
      const displayDate = displayTime ? new Date(this.dateLoaded).setHours(parseInt(displayTime.split(':')[0], 0))
        : new Date(this.dateLoaded).setHours(0);
      const scheduledDate = new Date(displayDate).toLocaleString();
      this.getTaskScheduleInfoBy_TaskSeriesID(taskSeriesId, scheduledDate, isDoubleClicked);
    }

  }

  getTaskScheduleInfoBy_TaskSeriesID(taskSeriesId: number, scheduledDate: string, isDoubleClicked: boolean = false) {
    const timeStart: number = performance.now();
    this.scheduleInfoGetSub = this.dataSvc.getScheduleInformation(this.globalsService.getParameters(), taskSeriesId)
      .subscribe(
      taskScheduleInfo => {
        const timeEnd: number = performance.now();
        const responseTime: number = timeEnd - timeStart;
        this.send_GA_UserTimingData(this.config.getConfig('GA_TaskSeries_URL'), "GET", responseTime);
        // Double-Click of an Empty Cell
        if (isDoubleClicked) {
          taskScheduleInfo.Data.VisitInvoiceItemDetails = {};
          taskScheduleInfo.Data.VisitInvoiceItemId = null;
        }
        this.createNewTaskOccuranceInfo(taskSeriesId, scheduledDate, taskScheduleInfo.Data);
      },
      error => this.errorMessage = <any>error
      );
  }

  createNewTaskOccuranceInfo(taskSeriesId: number, scheduledDate: string, tasks: any) {
    try {
      //Form the Task Occurrence Information with Input provided.
      const taskOccurrenceInfo: TaskOccurrenceInfo = new TaskOccurrenceInfo();
      taskOccurrenceInfo.TaskOccurrenceId = 0;
      taskOccurrenceInfo.TaskSeriesId = taskSeriesId;
      taskOccurrenceInfo.HospitalId = tasks.HospitalId;
      taskOccurrenceInfo.ScheduledTime = scheduledDate;
      taskOccurrenceInfo.StatusId = this.dataSvc.statusData.filter(x => x.Status === this.statusScheduled)[0].StatusId;
      taskOccurrenceInfo.CreatedBy = this.globalService.getUserName();
      taskOccurrenceInfo.CreatedDate = this.globalService.getCurrentDateTime();
      taskOccurrenceInfo.LastModifiedBy = this.globalService.getUserName();
      taskOccurrenceInfo.LastModifiedDate = this.globalService.getCurrentDateTime();
      taskOccurrenceInfo.StatusSetBy = this.globalService.getUserName();
      taskOccurrenceInfo.StatusSetDate = this.globalService.getCurrentDateTime();
      taskOccurrenceInfo.TaskDefinitionId = tasks.TaskDefinitionId;
      taskOccurrenceInfo.Status = this.statusScheduled;

      if (this.taskOccuranceInfoSub) {
        this.taskOccuranceInfoSub.unsubscribe();
      }
      this._saveTaskOccurrence(taskOccurrenceInfo);
    }
    catch (e) {
      this.dataSvc.occurrenceValidationMessage = e;
      this.handleError(e);
    }
  }

  _saveTaskOccurrence(taskOccurrenceInfo: any) {
    const timeStart: number = performance.now();
    this.taskOccuranceInfoSub = this.dataSvc.putTaskOccuranceInfo(this.globalsService.getParameters(), taskOccurrenceInfo,
      taskOccurrenceInfo.TaskOccurrenceId.toString()).subscribe(
      taskOccurance => {
        const timeEnd: number = performance.now();
        const responseTime: number = timeEnd - timeStart;
        this.send_GA_UserTimingData(this.config.getConfig('GA_TaskOccurance_URL'), "PUT", responseTime);
        this.loadResultData(taskOccurance.Data);
      },
      error => this.errorMessage = <any>error,
      () => {
        this.send_GA_EditTaskEvents(taskOccurrenceInfo, false);
      }
      );
  }

  /***************** New Tasks End */

  /************************ Task Occurance Events - End**************************************** */

  /************************ Task Series Events - End**************************************** */

  onTaskScheduleInvoked(taskSeriesId: any, taskSeriesName: string, notes: any, notScheduledCount: number) {
    try {
      this.dataSvc.taskScheduleInfoCompare = null;
      this.taskSeriesName = taskSeriesName;
      const parameterInfo = this.globalsService.getParameters();
      this.dataSvc.taskSeriesId = taskSeriesId;
      this.getTaskScheduleInfo(parameterInfo, notes, taskSeriesId, notScheduledCount);
      this.googleAnalyticsService.pageTrack(this.config.getConfig("GA_ScheduleTaskSeries_URL"), "");
    }
    catch (e) {
      this.dataSvc.occurrenceValidationMessage = e;
      this.handleError(e);
    }
  }

  getTaskScheduleInfo(parameterInfo: any, notes: any, taskSeriesId: any, notScheduledCount: number,
    isDiscontinue: boolean = false, isCancelled: boolean = false) {
    if (this.scheduleInfoGetSub) {
      this.scheduleInfoGetSub.unsubscribe();
    }

    const timeStart: number = performance.now();
    // Get Task Series Scheduling Information with Task Series Id
    this.scheduleInfoGetSub = this.dataSvc.getScheduleInformation(parameterInfo, taskSeriesId)
      .subscribe(
      taskScheduleInfo => {
        const timeEnd: number = performance.now();
        const responseTime: number = timeEnd - timeStart;
        this.send_GA_UserTimingData(this.config.getConfig('GA_TaskSeries_URL'), "GET", responseTime);
        this.configureScheduleCollectionView(taskScheduleInfo.Data, notes, notScheduledCount,
          isDiscontinue, isCancelled);
      },
      error => this.errorMessage = <any>error
      );
  }

  private configureScheduleCollectionView(tasks: any, notes: any, notScheduledCount: number,
    isDiscontinue: boolean, isCancelled: boolean = false) {
    try {
      if (!isDiscontinue) {
        this.instructionsText = notes;
        this.showAppointments = true;
        this.showSeriesModal = true;
        this.dataSvc.taskScheduleInfo = tasks;
        this.notScheduledCount = notScheduledCount;
        this.seriesOpenTime = new Date();
        this.dataSvc.scheduleCollection = true;
        this.timerUnSubscribe();
      } else {
        // Discontinue Option is Selected
        this.dataSvc.taskScheduleInfo = tasks;
        this.dataSvc.taskScheduleInfo.EndTime = this.globalService.getCurrentDateTime();

        if (isCancelled) {
          this.dataSvc.taskScheduleInfo.Status = "Cancelled";
          this.dataSvc.taskScheduleInfo.StatusId = 123;
        } else {
          this.dataSvc.taskScheduleInfo.IsDiscontinued = isDiscontinue;
        }

        if (this.scheduleInfoPutSub) {
          this.scheduleInfoPutSub.unsubscribe();
        }

        const timeStart: number = performance.now();
        // Save Task Series Scheduling Information
        this.scheduleInfoPutSub = this.dataSvc.putScheduleInformation(this.globalsService.getParameters(), this.dataSvc.taskSeriesId, this.dataSvc.taskScheduleInfo)
          .subscribe(
          taskScheduled => {
            const timeEnd: number = performance.now();
            const responseTime: number = timeEnd - timeStart;
            this.send_GA_UserTimingData(this.config.getConfig('GA_TaskSeries_URL'), "PUT", responseTime);
            this.configureSchedulerView(taskScheduled.Data, isDiscontinue);
          },
          error => this.errorMessage = <any>error
          );
      }
    }
    catch (e) {
      this.dataSvc.occurrenceValidationMessage = e;
      this.handleError(e);
    }
  }

  //Save Task Series Scheduling Information
  savePatientScheduleInfo() {
    try {
      const startDate = this.dataSvc.taskScheduleInfo.StartDate;
      const startTime = this.dataSvc.taskScheduleInfo.StartTimeInput;
      const endDate = this.dataSvc.taskScheduleInfo.EndDate;
      const endTime = this.dataSvc.taskScheduleInfo.EndTimeInput;
      this.dataSvc.taskScheduleInfo.StartTime = startDate + "T" + startTime;
      this.dataSvc.taskScheduleInfo.EndTime = endDate + "T" + endTime;
      if (this.dataSvc.taskScheduleInfo.EndsAtCheckout === false) {
        this.dataSvc.taskScheduleInfo.EndTime = this.dataSvc.taskScheduleInfo.EndTime;
      }
      else {
        this.dataSvc.taskScheduleInfo.EndTime = null;
      }
      // EndsAtCheckout is Selected
      if (this.dataSvc.taskScheduleInfo.EndsAtCheckout !== 0 && this.dataSvc.taskScheduleInfo.EndsAtCheckout !== false) {
        this.dataSvc.taskScheduleInfo.EndDate = null;
        this.dataSvc.taskScheduleInfo.EndTimeInput = null;
        this.dataSvc.taskScheduleInfo.NoOfOccurrences = null;
      } else if (this.dataSvc.taskScheduleInfo.EndsAtCheckout === false) {
        this.dataSvc.taskScheduleInfo.EndDate = null;
        this.dataSvc.taskScheduleInfo.EndTimeInput = null;
      } else if (this.dataSvc.taskScheduleInfo.EndsAtCheckout === 0) { // EndTime is provided
        this.dataSvc.taskScheduleInfo.NoOfOccurrences = null;
      }
      if (this.dataSvc.taskScheduleInfo) {
        if (this.scheduleInfoPutSub) {
          this.scheduleInfoPutSub.unsubscribe();
        }
        /*****************
         * TODO:Handle code for Metadata not changed!!!
         */
        const anyMetaDataChanges: boolean = this.compareTaskSheduleInfoMetaData();
        if (anyMetaDataChanges) {
          this.dataSvc.taskScheduleInfo.StatusId = this.statusActiveID;
          this.dataSvc.taskScheduleInfo.Status = this.statusActive;

          // IsDiscontinued set to 'false' while posting Series Scheduling Information
          this.dataSvc.taskScheduleInfo.IsDiscontinued = false;

          const timeStart: number = performance.now();
          this.scheduleInfoPutSub = this.dataSvc.putScheduleInformation(this.globalsService.getParameters(), this.dataSvc.taskSeriesId, this.dataSvc.taskScheduleInfo)
            .subscribe(
            taskScheduled => {
              this.configureSchedulerView(taskScheduled.Data);
              const timeEnd: number = performance.now();
              const responseTime: number = timeEnd - timeStart;
              this.send_GA_UserTimingData(this.config.getConfig('GA_TaskSeries_URL'), "PUT", responseTime);
            },
            error => this.errorMessage = <any>error,
            () => {
              this.googleAnalyticsService.eventTrack("Save", this.config.getConfig("GA_ScheduleTaskSeries_URL"), "", 0);
              if (this.dataSvc.taskScheduleInfo.IsTimeSensitive) {
                this.googleAnalyticsService.eventTrack("MarkTimeSensitive", this.config.getConfig("GA_ScheduleTaskSeries_URL"), "", 0);
              }
            }
            );
        }
        else {
          const timeStart: number = performance.now();
          // Set the Provided Start Time as Scheduled Time for scheduling with Once as recurrence type.
          this.dataSvc.scheduledTime = this.dataSvc.taskScheduleInfo.StartTime;
          // Reset the scheduling parameters to post data when their is no change before posting
          this.dataSvc.taskScheduleInfo.StartTime = null;
          this.dataSvc.taskScheduleInfo.EndTime = null;
          this.dataSvc.taskScheduleInfo.Interval = null;
          this.dataSvc.taskScheduleInfo.NoOfOccurrences = null;
          this.dataSvc.taskScheduleInfo.IntervalTimeUnit = null;
          this.scheduleInfoPutSub = this.dataSvc.putScheduleInformation(this.globalsService.getParameters(), this.dataSvc.taskSeriesId, this.dataSvc.taskScheduleInfo)
            .subscribe(
            taskScheduled => {
              this.configureSchedulerView(taskScheduled.Data);
              const timeEnd: number = performance.now();
              const responseTime: number = timeEnd - timeStart;
              this.send_GA_UserTimingData(this.config.getConfig('GA_TaskSeries_URL'), "PUT", responseTime);
            },
            error => this.errorMessage = <any>error,
            () => {
              this.googleAnalyticsService.eventTrack("Save", this.config.getConfig("GA_ScheduleTaskSeries_URL"), "", 0);
              if (this.dataSvc.taskScheduleInfo.IsTimeSensitive) {
                this.googleAnalyticsService.eventTrack("MarkTimeSensitive", this.config.getConfig("GA_ScheduleTaskSeries_URL"), "", 0);
              }
            }
            );
        }
      }
    }
    catch (e) {
      this.dataSvc.occurrenceValidationMessage = e;
      this.handleError(e);
    }
  }

  // Compare the Task Series Scheduling Information to check for Scheduling Parameters.
  private compareTaskSheduleInfoMetaData() {
    const orgTaskScheduleInfoCompare: any = this.dataSvc.taskScheduleInfoCompare;
    const changedTaskScheduleInfoCompare: any = this.dataSvc.taskScheduleInfo;

    let isChangedAttributes: boolean = false;

    if (!this.dataSvc.taskScheduleInfoOnce) {
      isChangedAttributes = (orgTaskScheduleInfoCompare.StartDate !== changedTaskScheduleInfoCompare.StartDate);
      if (!isChangedAttributes) {
        isChangedAttributes = (orgTaskScheduleInfoCompare.StartTimeInput !== changedTaskScheduleInfoCompare.StartTimeInput);
      }

      if (!isChangedAttributes) {
        isChangedAttributes = (orgTaskScheduleInfoCompare.Interval != changedTaskScheduleInfoCompare.Interval);
      }
      if (!isChangedAttributes) {
        isChangedAttributes = (orgTaskScheduleInfoCompare.IntervalTimeUnit !== changedTaskScheduleInfoCompare.IntervalTimeUnit);
      }
      if (!isChangedAttributes) {
        isChangedAttributes = (orgTaskScheduleInfoCompare.EndsAtCheckout != changedTaskScheduleInfoCompare.EndsAtCheckout);
        if (!isChangedAttributes) {
          if (!changedTaskScheduleInfoCompare.EndsAtCheckout) {
            isChangedAttributes = (orgTaskScheduleInfoCompare.EndDate !== changedTaskScheduleInfoCompare.EndDate);
            if (!isChangedAttributes) {
              isChangedAttributes = (orgTaskScheduleInfoCompare.EndTimeInput !== changedTaskScheduleInfoCompare.EndTimeInput);
            }
          }
        }
      }
    }
    this.dataSvc.taskScheduleInfoChanged = isChangedAttributes;
    return isChangedAttributes;
  }

  private configureSchedulerView(taskScheduled: any, isDiscontinue: boolean = false) {
    this.dataSvc.validationMessage = taskScheduled.ValidationMessage;
    if (!isDiscontinue) {
      if (!this.dataSvc.taskScheduleInfoOnce && this.dataSvc.validationMessage === undefined) {
        this.loadSchedulerData();
        this.closeSeriesModal();
      } else if (this.dataSvc.taskScheduleInfoOnce && this.dataSvc.validationMessage === undefined) {
        // Post the Task Occurrences Information if Once recurrence type is selected.
        const taskOccurrenceInfo: TaskOccurrenceInfo = new TaskOccurrenceInfo();
        taskOccurrenceInfo.TaskOccurrenceId = 0;
        taskOccurrenceInfo.HospitalId = parseInt(this.globalService.getHospitalId(), 10);
        taskOccurrenceInfo.TaskSeriesId = taskScheduled.TaskSeriesId;
        taskOccurrenceInfo.ScheduledTime = this.dataSvc.scheduledTime;
        taskOccurrenceInfo.VisitInvoiceItemId = taskScheduled.VisitInvoiceItemId;
        taskOccurrenceInfo.StatusId = 124;
        taskOccurrenceInfo.Instruction = null;
        taskOccurrenceInfo.Comment = null;
        taskOccurrenceInfo.StatusSetBy = this.globalService.getUserName();
        taskOccurrenceInfo.StatusSetDate = this.globalService.getCurrentDateTime();
        taskOccurrenceInfo.TaskDefinitionId = taskScheduled.TaskDefinitionId;
        taskOccurrenceInfo.PatientTaskFindings = null;
        taskOccurrenceInfo.IsTimeSensitive = false;
        if (this.taskOccuranceInfoSub) {
          this.taskOccuranceInfoSub.unsubscribe();
        }

        const timeStart: number = performance.now();
        this.taskOccuranceInfoSub = this.dataSvc.putTaskOccuranceInfo(this.globalsService.getParameters(), taskOccurrenceInfo,
          "0").subscribe(
          taskOccurance => {
            const timeEnd: number = performance.now();
            const responseTime: number = timeEnd - timeStart;
            this.send_GA_UserTimingData(this.config.getConfig('GA_TaskOccurance_URL'), "PUT", responseTime);
            this.loadResultData(taskOccurance.Data);
          },
          error => this.errorMessage = <any>error,
          () => {
            this.send_GA_EditTaskEvents(taskOccurrenceInfo, false);
          }
          );
      }
    } else {
      if (this.dataSvc.validationMessage === undefined) {
        this.loadSchedulerData();
      }
    }
  }

  closeSeriesModal() {
    this.showSeriesModal = false;
    this.dataSvc.taskScheduleInfoOnce = false;
    this.dataSvc.taskScheduleInfoCompare = null;
    this.dataSvc.taskScheduleInfoChanged = null;
    this.timerSubscribe();
  }

  closeSeriesModalFromUI() {
    this.showSeriesModal = false;
    this.dataSvc.taskScheduleInfoOnce = false;
    this.dataSvc.taskScheduleInfoCompare = null;
    this.dataSvc.taskScheduleInfoChanged = null;
    this.googleAnalyticsService.eventTrack("Cancel", this.config.getConfig("GA_ScheduleTaskSeries_URL"), "", 0);
    this.timerSubscribe();
  }

  // Discontinue Task Series Information
  discontinueSeries(taskSeriesId: any) {
    //set scheduled date as undefined. Quick fix. Need to know why this is used inside
    //configureScheduleCollectionView for conditional flow
    this.dataSvc.scheduledDate = undefined;
    this.dataSvc.taskSeriesId = taskSeriesId;
    this.getTaskScheduleInfo(this.globalsService.getParameters(), "", taskSeriesId, 0, true);
  }

  // Cancel Task Series
  cancelSeries(taskSeriesId: number) {
    //configureScheduleCollectionView for conditional flow
    this.dataSvc.taskSeriesId = taskSeriesId;
    this.getTaskScheduleInfo(this.globalsService.getParameters(), "", taskSeriesId, 0, true, true);
  }

  /************************ Tool Series Events - End**************************************** */


  /******************************* Context Menu Events - Start ****************************************/

  public contextMenuActions = [
    {
      html: () => 'Edit series...',
      click: (item: any, $event: MouseEvent) => {
        this.onTaskScheduleInvoked(item.TaskSeriesId, item.Name, item.Instructions, item.NotScheduledCount);
        this.googleAnalyticsService.eventTrack("RightClickEditTaskSeries", this.config.getConfig("GA_ScheduleTaskSeries_URL"), "", 0);
      },
      enabled: (item: any) => true,
      visible: (item: boolean) => true,
      name: "Edit series",
      showOption: true,
      action: 'Edit Series',
      type: 'Action'
    },
    {
      html: () => 'Discontinue series',
      click: (item: any, $event: MouseEvent) => {
        this.discontinueSeries(item.TaskSeriesId);
        this.googleAnalyticsService.eventTrack("RightClickDiscontinueTaskSeries", this.config.getConfig("GA_ScheduleTaskSeries_URL"), "", 0);
      },
      enabled: (item: any) => true,
      visible: (item: boolean) => true,
      name: "Discontinue",
      showOption: true,
      action: 'Discontinue Series',
      type: 'Action'
    },
    {
      html: () => 'Cancel series',
      click: (item: any, $event: MouseEvent) => {
        this.cancelSeries(item.TaskSeriesId);
        this.googleAnalyticsService.eventTrack("RightClickCancelTaskSeries", this.config.getConfig("GA_ScheduleTaskSeries_URL"), "", 0);
      },
      enabled: (item: any) => true,
      visible: (item: boolean) => true,
      name: "Cancel",
      showOption: true,
      action: 'Cancel Series',
      type: 'Action'
    },
    {
      html: () => this.occuranceCount > 1 ? 'Edit...' : 'Edit',
      click: (item: any, $event: MouseEvent) => {
        this.editOccurrence(item, -1);
        this.googleAnalyticsService.eventTrack("RightClickEdit", this.config.getConfig("GA_Scheduler_URL"), "", 0);
      },
      enabled: (item: any) => true,
      visible: (item: boolean) => true,
      name: -1,
      showOption: true,
      action: 'Edit Occurances',
      type: 'Action'

    },
    {
      html: () => 'Schedule', //this.occuranceCount > 1 ? 'Schedule...' : 'Schedule',
      click: (item: any, $event: MouseEvent) => {
        // if (this.occuranceCount > 1) {
        //     this.editOccurrence(item, -2);
        // } else {
        this.scheduleOccurrence(item, -2);
        this.googleAnalyticsService.eventTrack("RightClickScheduleTask", this.config.getConfig("GA_Scheduler_URL"), "", 0);
        // }
      },
      enabled: (item: any) => true,
      visible: (item: boolean) => true,
      name: -2,
      showOption: true,
      action: 'Schedule Task',
      type: 'Action'
    },
    {
      html: () => this.occuranceCount > 1 ? 'Schedule...' : 'Schedule',
      click: (item: any, $event: MouseEvent) => {
        this.editOccurrence(item, -2);
        this.googleAnalyticsService.eventTrack("RightClickScheduleTask", this.config.getConfig("GA_Scheduler_URL"), "", 0);
      },
      enabled: (item: any) => true,
      visible: (item: boolean) => true,
      name: -2,
      showOption: true,
      action: 'Schedule Occurrence',
      type: 'Action'
    },
    {
      html: () => this.occuranceCount > 1 ? 'Plan...' : 'Plan',
      click: (item: any, $event: MouseEvent) => {
        if (this.occuranceCount > 1) {
          this.editOccurrence(item, -1);
          this.googleAnalyticsService.eventTrack("RightClickScheduleTask", this.config.getConfig("GA_Scheduler_URL"), "", 0);
        } else {
          this.editOccurrence(item, 124);
          this.googleAnalyticsService.eventTrack("RightClickScheduleTask", this.config.getConfig("GA_Scheduler_URL"), "", 0);
        }
      },
      enabled: (item: any) => true,
      visible: (item: boolean) => true,
      name: 124,
      showOption: true,
      action: 'Plan Task',
      type: 'Status-Action'
    },
    {
      html: () => this.occuranceCount > 1 ? this.statusCompleted + '...' : this.statusCompleted,
      click: (item: any, $event: MouseEvent) => {
        if (this.occuranceCount > 1) {

          this.editOccurrence(item, -1);
          this.googleAnalyticsService.eventTrack("RightClickEdit", this.config.getConfig("GA_Scheduler_URL"), "", 0);
        } else {
          this.editOccurrence(item, 126);
          this.googleAnalyticsService.eventTrack("RightClickMarkComplete", this.config.getConfig("GA_Scheduler_URL"), "", 0);
        }
      },
      enabled: (item: any) => true,
      visible: (item: boolean) => true,
      name: 126,
      showOption: true,
      action: 'Complete Task',
      type: 'Status-Action'
    },
    {
      html: () => this.occuranceCount > 1 ? 'Skip...' : 'Skip',
      click: (item: any, $event: MouseEvent) => {
        if (this.occuranceCount > 1) {
          this.editOccurrence(item, -1);
          this.googleAnalyticsService.eventTrack("RightClickEdit", this.config.getConfig("GA_Scheduler_URL"), "", 0);
        } else {
          this.editOccurrence(item, 127);
          //console.log(item.value);

          this.googleAnalyticsService.eventTrack("RightClickSkip", this.config.getConfig("GA_ScheduleTaskSeries_URL"), "", 0);
        }
      },
      enabled: (item: any) => true,
      visible: (item: boolean) => true,
      name: 127,
      showOption: true,
      action: 'Skip Task',
      type: 'Status-Action'
    },
    {
      html: () => this.dataSvc.isNotScheduledPopup && this.occuranceCount > 1 ? 'Cancel one' : (this.occuranceCount > 1 ? 'Cancel...' : 'Cancel'),
      click: (item: any, $event: MouseEvent) => {
        if ((this.dataSvc.isNotScheduledPopup && this.occuranceCount > 1) || this.occuranceCount === 1) {
          this.editOccurrence(item, 128);
          this.googleAnalyticsService.eventTrack("RightClickCancel", this.config.getConfig("GA_Scheduler_URL"), "", 0);
        } else {
          this.editOccurrence(item, -1);
          this.googleAnalyticsService.eventTrack("RightClickEdit", this.config.getConfig("GA_Scheduler_URL"), "", 0);
        }
      },
      enabled: (item: any) => true,
      visible: (item: boolean) => true,
      name: 128,
      showOption: true,
      action: 'Cancel Task',
      type: 'Status-Action'
    },
    {
      html: () => 'Unschedule',
      click: (item: any, $event: MouseEvent) => {
        this.editOccurrence(item, 125);
        this.googleAnalyticsService.eventTrack("RightClickUnschedule", this.config.getConfig("GA_ScheduleTaskSeries_URL"), "", 0);
      },
      enabled: (item: any) => true,
      visible: (item: boolean) => true,
      name: 125,
      showOption: true,
      action: 'Unschedule Task',
      type: 'Status-Action'
    }
  ];



  // Update the Occurence Status for the respective Occurrence Information
  private updateStatusOccurence(parameterInfo: any, occurrenceId: number, status: number) {
    const timeStart: number = performance.now();
    this.dataSvc.getTaskOccuranceInfo(this.globalsService.getParameters(), occurrenceId.toString())
      .subscribe(
      occurrenceResponse => {
        const timeEnd: number = performance.now();
        const responseTime: number = timeEnd - timeStart;
        this.send_GA_UserTimingData(this.config.getConfig('GA_TaskOccurance_URL'), "GET", responseTime);
        if (occurrenceResponse.Data !== null && occurrenceResponse.Data) {
          this.saveOccurrenceStatus(occurrenceResponse.Data, status);
        }
      },
      error => this.errorMessage = <any>error
      );
  }

  // Edit the Occurrence Information
  private editOccurrence(occurrence: any, status: number) {


    this.dataSvc.statusValue = status;

    if (!this.dataSvc.isNotScheduledPopup) {
      // Validation for Valid Status Scenario
      if (status < 0 || status === 127) {
        this.onTaskOccuranceClicked(this.taskOptionSeries.TaskSeriesId, this.taskOptionSeries.Name, this.taskOptionSeries.Instructions, this.selectedCellTime, occurrence.value, status);
      }
      else {
        this.updateStatusOccurence(this.globalService.getParameters(), occurrence.value[0].TaskOccurrenceId, status);
      }
    } else {
      this.saveOrInvokeTaskOccurrenceNotScheduled(status, true);
    }
  }

  private saveOrInvokeTaskOccurrenceNotScheduled(status: number, readyToComplete: boolean = false) {
    if (!readyToComplete) {
      readyToComplete = !(this.taskOptionSeries.QuantityMustMatch || this.taskOptionSeries.IsObservationsMetadataPresent)
        && this.taskOptionSeries.NotScheduledCount === 1;
    }
    const timeStart: number = performance.now();
    this.dataSvc.getScheduleInformation(this.globalsService.getParameters(), this.taskOptionSeries.TaskSeriesId)
      .subscribe(
      taskOccurrenceInfo => {
        const timeEnd: number = performance.now();
        const responseTime: number = timeEnd - timeStart;
        this.send_GA_UserTimingData(this.config.getConfig('GA_TaskSeries_URL'), "GET", responseTime);
        if (readyToComplete && status === 126) {
          this.saveOccurrenceStatus(taskOccurrenceInfo.Data.TaskOccurences[0], status);
        } else {
          this.invokeTaskOccurrence(taskOccurrenceInfo.Data, status);
        }

      },
      error => this.errorMessage = <any>error
      );
  }

  private invokeTaskOccurrence(taskOccurrence: any, status: number) {
    this.dataSvc.taskOccurances = taskOccurrence.TaskOccurences.filter((x: any) => x.Status === 'Unscheduled');
    if (status === 128) {
      this.updateStatusOccurence(this.globalService.getParameters(), this.dataSvc.taskOccurances[0].TaskOccurrenceId, status);
    } else {
      this.dataSvc.taskSeriesName = this.taskOptionSeries.Name;
      this.onTaskOccuranceClicked(this.taskOptionSeries.TaskSeriesId, this.taskOptionSeries.Name,
        this.taskOptionSeries.Instructions, this.selectedCellTime, this.dataSvc.taskOccurances);
    }
  }

  private scheduleOccurrence(occurrence: any, status: number) {
    if (status === -2) {
      this.onScheduleNewTaskClick(occurrence, this.taskOptionSeries.TaskSeriesId, this.selectedCellTime);
    }
  }

  private saveOccurrenceStatus(taskOccurrence: any, status: number) {
    if (taskOccurrence.StatusId !== status) {
      taskOccurrence.StatusSetDate = this.globalService.getCurrentDateTime();
      taskOccurrence.StatusSetBy = this.globalService.getUserName();
    }
    taskOccurrence.StatusId = status;
    // For Unscheduled Status
    if (status === 125) {
      taskOccurrence.ScheduledTime = null;
    }
    const statusInfo = this.dataSvc.statusData.find(s => s.StatusId === status);
    if (statusInfo !== null && statusInfo !== undefined) {
      taskOccurrence.Status = statusInfo.status;
    }
    this._saveTaskOccurrence(taskOccurrence);
  }

  private setOptionsVisible(statuses: Array<string>, status: number) {
    this.contextMenuActions.forEach(option => {
      if (this.showComplete && option.name === 126) {
        option.showOption = false;
      }
      else if (statuses.indexOf(option.action) > -1) {
        option.showOption = true;
      }
      else if (status > 0 && option.type === "Status-Action" && option.name !== status) {
        option.showOption = (option.name === 125 && this.occuranceCount > 1) ? false : true;
      }
      else {
        option.showOption = false;
      }
      // Added this condition to show only 'Edit' for Occurrences with Completed / Skipped / Cancelled status
      if ((status === 126 || status === 127 || status === 128)) {
        option.showOption = (option.name === -1) ? true : false;
      }
      //console.log('option: ' + option.name + 'state: ' + option.showOption);
    });
  }

  public onContextMenu($event: MouseEvent, taskSeriesInfo: any): void {
    this.contextMenuService.show.next({
      contextMenu: this.contextMenu,
      event: $event,
      item: taskSeriesInfo,
    });
    this.showDiscontinue = true;
    this.showOccurrenceOptions = true;
    const optionsArr: Array<string> = new Array<string>();
    optionsArr.push("Edit Series");
    optionsArr.push("Discontinue Series");
    if (taskSeriesInfo.CompletedCount === 0 && taskSeriesInfo.SkippedCount === 0) {
      optionsArr.push("Cancel Series");
    }
    this.setOptionsVisible(optionsArr, 0);
    $event.preventDefault();
    $event.stopPropagation();
  }

  public onContextNotScheduledOccurancesMenu($event: MouseEvent, taskSeriesId: number, taskSeriesName: string,
    instructions: any, notScheduledCount: number): void {
    if (notScheduledCount > 0) {
      this.contextMenuService.show.next({
        contextMenu: this.contextMenu,
        event: $event,
        item: taskSeriesId,
      });
      this.showDiscontinue = false;
      this.showOccurrenceOptions = true;
      const optionsArr: Array<string> = new Array<string>();
      this.dateLoaded = this.globalService.getScheudlerCurrentDate();
      this.occuranceCount = notScheduledCount;
      this.taskOptionSeries = {};
      this.taskOptionSeries.TaskSeriesId = taskSeriesId;
      this.taskOptionSeries.Name = taskSeriesName;
      this.taskOptionSeries.Instructions = instructions;
      this.dataSvc.isNotScheduledPopup = true;
      optionsArr.push("Edit Occurances");
      optionsArr.push("Schedule Occurrence");
      optionsArr.push("Cancel Task");
      optionsArr.push("Complete Task");
      this.setOptionsVisible(optionsArr, 0);
      $event.preventDefault();
      $event.stopPropagation();
    }
  }

  public onContextOccurrenceMenu($event: MouseEvent, taskSeries: any, taskOccurrence: any, currentTime: any): void {

    if ((taskSeries.NotInvoiceable === true && taskSeries.NotScheduledCount !== 0) || taskSeries.NotInvoiceable === false || taskSeries.NotInvoiceable === null) {
      this.selectedCellTime = currentTime;
      this.dataSvc.isNotScheduledPopup = false;
      this.contextMenuService.show.next({
        contextMenu: this.contextMenu,
        event: $event,
        item: taskOccurrence,
      });
      this.taskOptionSeries = taskSeries;
      this.showOccurrenceOptions = true;
      this.showDiscontinue = false;
      this.showComplete = this.taskOptionSeries.QuantityMustMatch || this.taskOptionSeries.IsObservationsMetadataPresent;
      this.occuranceCount = 0;

      if (!taskOccurrence.key) {
        const optionsArr: Array<string> = new Array<string>();
        optionsArr.push("Schedule Task");
        this.setOptionsVisible(optionsArr, 0);
      }
      else if (taskOccurrence.value.length >= 1) {
        const optionsArr: Array<string> = new Array<string>();
        optionsArr.push("Edit Occurances");
        this.occuranceCount = taskOccurrence.value.length;
        this.setOptionsVisible(optionsArr, taskOccurrence.value[0].StatusId);
      }
      $event.preventDefault();
      $event.stopPropagation();
    }
  }
  /******************************* Context Menu Events - End ****************************************/


  /******************************* GA Events - Start ****************************************/
  send_GA_UserTimingData(variable: string, label: string, duration: number) {
    this.googleAnalyticsService.userTimingsTrack(this.config.getConfig("GA_UserTiming_Category"),
      variable, label, duration);
  }

  send_GA_EditTaskEvents(taskOccurrenceInfo: any, isCompleteAndSave: boolean) {
    if (taskOccurrenceInfo) {
      if (isCompleteAndSave) {
        this.googleAnalyticsService.eventTrack("Complete & Save", this.config.getConfig("GA_EditTasks_URL"), "", 0);
      }
      else {
        this.googleAnalyticsService.eventTrack("Save", this.config.getConfig("GA_EditTasks_URL"), "", 0);
      }
    }
    if (taskOccurrenceInfo.Status === this.statusScheduled) {
      this.googleAnalyticsService.eventTrack("MarkPlanned", this.config.getConfig("GA_EditTasks_URL"), "", 0);
    }
    else if (taskOccurrenceInfo.Status === this.statusCompleted) {
      this.googleAnalyticsService.eventTrack("MarkComplete", this.config.getConfig("GA_EditTasks_URL"), "", 0);
    }
    else if (taskOccurrenceInfo.Status === "Skipped") {
      this.googleAnalyticsService.eventTrack("MarkSkip", this.config.getConfig("GA_EditTasks_URL"), "", 0);
    }
    else if (taskOccurrenceInfo.Status === "Cancelled") {
      this.googleAnalyticsService.eventTrack("MarkCanceled", this.config.getConfig("GA_EditTasks_URL"), "", 0);
    }

    if (taskOccurrenceInfo.Comment && taskOccurrenceInfo.Comment.length > 0) {
      this.googleAnalyticsService.eventTrack("AddTaskNote", this.config.getConfig("GA_EditTasks_URL"), "", 0);
    }
  }
  /******************************* GA Events - End ****************************************/

  /******************************* Popup Events - Start ****************************************/
  showing_WJ_Popup(evt: any) {
    this.timerUnSubscribe();
  }

  hiding_WJ_Popup(evt: any) {
    if (this.showOptionalTasks || this.showCareNotes) {
      evt.cancel = true;
    }
    else {
      this.timerSubscribe();
    }
  }

  onOptionalTasksShow($event: any) {
    this.showOptionalTasks = $event;
    this.loadSchedulerData();
    this.wjAddTask.hide();
  }

  onCloseCareNotes($event: any) {
    this.showCareNotes = $event;
    this.wjAddCareNotes.hide();
  }

  /******************************* Popup Events - End ****************************************/

  private handleError(error: Response | any) {
    this.errorHandler.exceptionHandling(false, error);
  }

  testing(t: any) {
    console.log(t);
  }

  getCount( count: any){
    return count && count > 5 ? 5 : count;
  }
}
