import * as wjcCore from 'wijmo/wijmo';
import * as wjcGrid from 'wijmo/wijmo.grid';
import { GlobalErrorHandler } from '../app.errorHandler';


// Angular
import { Component, Inject, ViewChild, AfterViewInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Subscription } from 'rxjs/Subscription';

import { TimelineService } from './timeline.service';
import { TimelineDetailsFormatPipe } from '../shared/timelineDataFormat.pipe'
import { TaskOccurrenceTimeline } from '../data/timeline';
import { GlobalsService } from '../globals.service';
import { CareNote } from '../data/CareNote';
import { GoogleAnalyticsService } from '../shared/googleAnalytics.service';
import { AppConfig } from '../app.config';

// The application root component.
@Component({
  selector: 'timeline',
  templateUrl: './timeline.component.html',
  providers: [
    GoogleAnalyticsService
  ]
})

export class TimelineComponent implements AfterViewInit {
  appVersionNumber: string;
  timerExceuteTime: String;
  tasks: wjcCore.CollectionView;
  errorMessage: string;
  timeSeries: any[];
  globalService: GlobalsService;
  private statusList: wjcCore.ObservableArray;
  private categoryList: wjcCore.ObservableArray;
  grpTooltip: wjcCore.Tooltip;
  characterCount: number;
  categoryValue: any;
  statusValue: any;
  //private toFilter: any;
  protected dataSvc: TimelineService;
  categoryImages: any;
  careNotes: CareNote[];
  @ViewChild('flex') flex: wjcGrid.FlexGrid;
  height: number;

  private catImagesSub: Subscription;
  private tasksSub: Subscription;
  private careNotesSub: Subscription;
  setRowHeight: boolean;

  _isViewUpdated: boolean;

  private rowCount: number;
  private timerID: any;

  constructor( @Inject(TimelineService) dataSvc: TimelineService, globalsService: GlobalsService, private config: AppConfig,
    private googleAnalyticsService: GoogleAnalyticsService, private errorHandler: GlobalErrorHandler) {
    this.dataSvc = dataSvc;
    this.getCategoryImages();
    this.globalService = globalsService;
    this.characterCount = this.config.getConfig("CharacterCount");
    this.getCareNotes();
    this.getTasks();
  }

  ngOnInit() {
    this.appVersionNumber = this.config.getConfig("Version_Number");
    this.timerExceuteTime = new DatePipe("en-US").transform(new Date(), 'HH:mm:ss');
    this.googleAnalyticsService.set_ApplicationLevl_GA_Dimensions();
    this.googleAnalyticsService.pageTrack(this.config.getConfig("GA_TimeLine_URL"), "");
    this.grpTooltip = new wjcCore.Tooltip();
    this._isViewUpdated = false;
  }

  ngAfterViewInit() {
    // this.flex.cells.rows.defaultSize  =  40;
    // this.flex.autoSizeMode = wjcGrid.AutoSizeMode.Both;
    // this.flex.autoSizeRows(0, this.flex.cells.rows.length, false);
    //this._isViewUpdated = true;
  }

  ngOnDestroy() {
    if (this.catImagesSub) {
      this.catImagesSub.unsubscribe();
    }

    if (this.tasksSub) {
      this.tasksSub.unsubscribe();
    }

    if (this.careNotesSub) {
      this.careNotesSub.unsubscribe();
    }

    this.dataSvc.clearObjects();
  }


  onResize(event: any) {
    //this.height = this.globalService.overAllHeight - ( this.globalService.bannerHeight + 20 );
    // this.setFlexGridHeight();
  }


  setRowHeightAuto() {
    if (!this.setRowHeight) {
      this.setRowHeight = false;
      this.flex.autoSizeRows(0, this.flex.cells.rows.length, false);
    }
  }

  onFilterChange() {
    this._isViewUpdated = true;
  }

  onSortingColumns(e: any) {
    this._isViewUpdated = true;
  }

  updatedView(s: wjcGrid.FlexGrid, e: wjcCore.EventArgs) {
    //console.log('updatedview');
    this.timerID = setTimeout(() => { this.updatedViewAfterDelay(s); }, 50);
  }

  updatedViewAfterDelay(s: wjcGrid.FlexGrid) {
    if (this._isViewUpdated) {
      this._isViewUpdated = false;
      //console.log('updatedview autoSizeRows');
      s.autoSizeRows();
    }
    clearTimeout(this.timerID);
  }


  getCategoryImages() {
    if (this.catImagesSub) {
      this.catImagesSub.unsubscribe();
    }

    this.catImagesSub = this.dataSvc.getCategoryImages().subscribe(
      res => this.categoryImages = res,
      error => console.log(error)
    );
  }

  getTasks() {
    if (this.tasksSub) {
      this.tasksSub.unsubscribe();
    }

    let timeStart: number = performance.now();
    this.tasksSub = this.dataSvc.getTasks()
      .subscribe(
      tasks => {
        let timeEnd: number = performance.now();
        let responseTime: number = timeEnd - timeStart;
        this.send_GA_UserTimingData(this.config.getConfig('GA_Orders_TaskOccurrenceTimeLine_URL'), "GET", responseTime);
        this.configureCollectionView(tasks.TaskOccurrenceTimelines);
      },
      error => this.errorMessage = <any>error
      );
  }

  getCareNotes() {
    if (this.careNotesSub) {
      this.careNotesSub.unsubscribe();
    }

    let timeStart: number = performance.now();
    this.careNotesSub = this.dataSvc.getCareNotes()
      .subscribe(
      notes => {
        let timeEnd: number = performance.now();
        let responseTime: number = timeEnd - timeStart;
        this.send_GA_UserTimingData(this.config.getConfig('GA_Orders_CareNotes_URL'), "GET", responseTime);
        this.careNotes = notes;
      },
      error => this.errorMessage = <any>error
      );
  }


  private configureCollectionView(data: TaskOccurrenceTimeline[]) {
    //console.log(this.careNotes);
    try {
      const dataTrans: TaskOccurrenceTimeline[] = new Array();
      if (data !== null) {
        data.forEach(element => {
          if ((element.Status !== 'Unscheduled' && element.Status !== 'Scheduled' && element.Status !== 'Cancelled')) {
            //element.Day = datePipe.transform(element.ScheduledTime, 'dd-MMM-yyyy');
            element.Day = this.globalService.groupDate(element.StatusSetDate, 'TimeLine');
            element.Status = (element.Status === 'Complete') ? "Completed" : element.Status;
            element.StatusSetBy = this.getFormattedStaffName(element.StatusSetBy);
            dataTrans.push(element);
          }
        });
      }

      if (this.careNotes) {
        this.careNotes.forEach(notes => {
          const trans = new TaskOccurrenceTimeline();
          trans.ScheduledTime = notes.CreatedDate;
          if (notes.LastModifiedDate) {
            trans.ScheduledTime = notes.LastModifiedDate;
          }
          trans.StatusSetDate = trans.ScheduledTime;
          trans.Category = "Care Notes";
          trans.Status = "Care Notes";
          trans.StatusSetBy = (notes.LastModifiedBy) ? notes.LastModifiedBy : notes.CreatedBy;
          trans.StatusSetBy = this.getFormattedStaffName(trans.StatusSetBy);
          trans.Day = this.globalService.groupDate(trans.ScheduledTime, 'TimeLine');
          trans.TaskName = notes.Notes;
          dataTrans.push(trans);
        });
      };

      dataTrans.sort((a: TaskOccurrenceTimeline, b: TaskOccurrenceTimeline): number => {
        if (a.StatusSetDate > b.StatusSetDate) {
          return -1;
        }
        if (a.StatusSetDate < b.StatusSetDate) {
          return 1;
        }
        return 0;
      });
      this.rowCount = dataTrans.length;
      this.tasks = new wjcCore.CollectionView(dataTrans);
      const groupDesc = new wjcCore.PropertyGroupDescription('Day');
      this.tasks.groupDescriptions.push(groupDesc);
      this._isViewUpdated = true;
      this.statusList = new wjcCore.ObservableArray();
      this.categoryList = new wjcCore.ObservableArray();
    }
    catch (e) {
      this.handleError(e);
    }
  }

  getFormattedStaffName(userName: string) {
    let formattedName = "";
    if (userName) {
      formattedName = userName;
      let userNames: any;
      if (userName.indexOf(":") !== -1) {
        userNames = userName.split(":");
        if (userNames.length > 1) {
          formattedName = userNames[1];
        }
        else {
          formattedName = userNames[0];
        }
      }

      if (formattedName.indexOf("\\") !== -1) {
        userNames = formattedName.split("\\");
        if (userNames.length > 1) {
          formattedName = userNames[1];
        }
        else {
          formattedName = userNames[0];
        }
      }
    }
    return formattedName;
  }

  send_GA_UserTimingData(variable: string, label: string, duration: number) {
    this.googleAnalyticsService.userTimingsTrack(this.config.getConfig("GA_UserTiming_Category"),
      variable, label, duration);
  }

  private handleError(error: Response | any) {
    this.errorHandler.exceptionHandling(false, error);
  }



  showGroupToolTip(e: any, tValue: any) {
    let detailsText = new TimelineDetailsFormatPipe(this.dataSvc).transform(tValue);
    if (detailsText.length > this.characterCount) {
      let _ht = this.flex.hitTest(e);
      let cellBounds = this.flex.getCellBoundingRect(_ht.row, _ht.col);
      this.grpTooltip.show(this.flex.hostElement, this.globalService.getFormattedToolTip(detailsText), cellBounds);
    }
  }

  hideGroupToolTip() {
    this.grpTooltip.hide();
  }
}
