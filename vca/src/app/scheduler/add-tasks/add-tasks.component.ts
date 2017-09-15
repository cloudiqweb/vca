import { Component, Inject, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { SchedulerService } from '../scheduler.service';
import * as wjcCore from 'wijmo/wijmo';
import { GlobalsService } from '../../globals.service';
import { RootObject } from '../../data/optionalTasks';
import { GoogleAnalyticsService } from '../../shared/googleAnalytics.service';
import { Subscription } from "rxjs/Rx";
import { AppConfig } from '../../app.config';
import { GlobalErrorHandler } from '../../app.errorHandler';


@Component({
  selector: 'add-tasks',
  templateUrl: './add-tasks.component.html',
  providers: [
    GoogleAnalyticsService
  ]
})
export class AddTasksComponent implements OnChanges {
  optionalTasks: any;
  addedTasks: any;
  errorMessage: string;
  addedTaskInfo: RootObject;
  categoryList: any[];
  validationMessage: string;
  cvGroupedTasks: wjcCore.CollectionView;
  cvGroupedAddedTasks: wjcCore.CollectionView;
  @Input() showOptionalTasks: boolean;
  @Output() notifyShowOptionalTasks: EventEmitter<any> = new EventEmitter<any>();
  optTasksSub: Subscription;


  constructor(private dataSvc: SchedulerService, private globalsService: GlobalsService,
    private config: AppConfig,
    private googleAnalyticsService: GoogleAnalyticsService, private errorHandler: GlobalErrorHandler) {
  }

  ngOnChanges() {
    if (this.showOptionalTasks) {
      this.showOptionalTasks = false;
      this.getOptionalTasks();
      this.addedTasks = [];
      this.validationMessage = "";
    } else {
      this.addedTasks = [];
      this.validationMessage = "";
    }
  }

  ngOnDestroy() {
    if (this.optTasksSub) {
      this.optTasksSub.unsubscribe();
    }
  }

  getOptionalTasks() {
    let timeStart: number = performance.now();
    this.optTasksSub = this.dataSvc.getOptionalTasks()
      .subscribe(
      optionalTasks => {
        let timeEnd: number = performance.now();
        let responseTime: number = timeEnd - timeStart;
        this.googleAnalyticsService.userTimingsTrack(this.config.getConfig("GA_UserTiming_Category"),
          this.config.getConfig('GA_Orders_AggregatedData_URL'), "GET", responseTime);
        this.configureCollectionView(optionalTasks);
      },
      error => this.errorMessage = <any>error
      );
  }

  private configureCollectionView(optionalTasks: any) {
    try {
      this.optionalTasks = optionalTasks;
      this.cvGroupedTasks = new wjcCore.CollectionView(this.optionalTasks);
      this._applyGroupBy(this.cvGroupedTasks, "CategoryName");
      this.addedTasks = [];
    }
    catch (e) {
      this.handleError(e);
    }
  }

  onTaskSelection(addedTask: any) {
    try {
      if (addedTask !== null) {
        addedTask.Selected = "Selected";
        let index: number = this.addedTasks.indexOf(addedTask);
        if (index < 0) {
          this.addedTasks.push(addedTask);
          this.cvGroupedAddedTasks = new wjcCore.CollectionView(this.addedTasks);
          this._applyGroupBy(this.cvGroupedAddedTasks, "Selected");
        }

      }
    }
    catch (e) {
      this.handleError(e);
    }
  }

  private _applyGroupBy(groupTask: wjcCore.CollectionView, groupBy: string) {
    try {
      const cv = groupTask;
      cv.beginUpdate();
      cv.groupDescriptions.clear();
      const groupDesc = new wjcCore.PropertyGroupDescription(groupBy);
      cv.groupDescriptions.push(groupDesc);
      cv.refresh();
      cv.endUpdate();
      cv.moveCurrentToPosition(-1);
    }
    catch (e) {
      this.handleError(e);
    }
  }

  private configureTasksView(updatedTasks: any, isUpdated: boolean) {
    try {
      this.validationMessage = '';
      if (updatedTasks.ValidationMessage !== undefined) {
        this.validationMessage = updatedTasks.ValidationMessage;
      } else if (isUpdated) {
        this.optionalTasks = [];
        this.getOptionalTasks();
        this.notifyShowOptionalTasks.emit(this.showOptionalTasks);
      }
    }
    catch (e) {
      this.handleError(e);
    }
  }

  addTaskDetails() {
    try {
      for (let i = 0; i < this.addedTasks.length; i++) {
        this.addedTaskInfo = new RootObject();
        this.addedTaskInfo = this._setAddedTaskInfo(this.addedTasks[i]);
        let timeStart: number = performance.now();
        this.dataSvc.updateOptionalTasksInformation(this.globalsService.getParameters(), 0, this.addedTaskInfo)
          .subscribe(
          taskScheduled => {
            let timeEnd: number = performance.now();
            let responseTime: number = timeEnd - timeStart;
            this.googleAnalyticsService.userTimingsTrack(this.config.getConfig("GA_UserTiming_Category"),
              this.config.getConfig('GA_Orders_AggregatedData_URL'), "GET", responseTime);
            this.configureTasksView(taskScheduled.Data, i === this.addedTasks.length);
          },
          error => this.errorMessage = <any>error,
          () => {
            this.googleAnalyticsService.eventTrack("AddTask", this.config.getConfig("GA_EditTasks_URL"), "", 0);
          }
          );
      }
    }
    catch (e) {
      this.handleError(e);
    }
  }

  cancelAddTask() {
    try {
      this.addedTasks = [];
      this.showOptionalTasks = false;
      this.optionalTasks = [];
      this.cvGroupedTasks = new wjcCore.CollectionView(this.optionalTasks);
      this.cvGroupedAddedTasks = new wjcCore.CollectionView(this.addedTasks);
      this.notifyShowOptionalTasks.emit(this.showOptionalTasks);
    }
    catch (e) {
      this.handleError(e);
    }
  }

  deleteItem(addedTask: any) {
    try {
      let index: number = this.addedTasks.indexOf(addedTask);
      if (index !== -1) {
        this.addedTasks.splice(index, 1);
        this.cvGroupedAddedTasks = new wjcCore.CollectionView(this.addedTasks);
        this._applyGroupBy(this.cvGroupedAddedTasks, "Selected");
      }
    }
    catch (e) {
      this.handleError(e);
    }
  }


  _setAddedTaskInfo(addTask: any) {
    try {
      const taskInfo = new RootObject();
      taskInfo.TaskDefinitionId = addTask.TaskDefinitionId;
      taskInfo.TaskSeriesId = 0;
      taskInfo.HospitalId = parseInt(this.globalsService.getHospitalId(), 10);
      taskInfo.StartTime = this.globalsService.getCurrentDateTime();
      //taskInfo.EndTime = null;
      //taskInfo.Interval = null;
      taskInfo.IsTimeSensitive = false;
      taskInfo.Instructions = addTask.DefaultInstruction;
      taskInfo.QtyMustMatch = false;
      taskInfo.StatusId = 122;
      taskInfo.AsNeeded = false;
      taskInfo.CreatedBy = this.globalsService.getUserName();
      taskInfo.CreatedDate = this.globalsService.getCurrentDateTime();;
      taskInfo.LastModifiedBy = null;
      taskInfo.LastModifiedDate = null;
      taskInfo.VisitId = addTask.OrderId;
      taskInfo.IsTaskSeries = false;
      taskInfo.Status = "Active";
      //taskInfo.IntervalTimeUnit = "Hours";
      //taskInfo.EndsAtCheckout = false;
      //taskInfo.NoOfOccurrences = 1;
      if (addTask.VisitInvoiceItemId && addTask.VisitInvoiceItemId.length > 0) {
        taskInfo.VisitInvoiceItemId = addTask.VisitInvoiceItemId[0];
      }
      taskInfo.IsDeleted = false;
      return taskInfo;
    }
    catch (e) {
      this.handleError(e);
    }
  }

  private handleError(error: Response | any) {
    this.errorHandler.exceptionHandling(false, error);
  }

}
