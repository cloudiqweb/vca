'use strict';

import { Injectable } from '@angular/core';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/map';
import { Observable } from 'rxjs/Observable';
import { GlobalsService } from '../globals.service';
import { CareNote } from '../data/CareNote';
import { AppConfig } from '../app.config';
import { GlobalErrorHandler } from '../app.errorHandler';

// Common data service
@Injectable()
export class SchedulerService {

  private _dataUrl = "Orders/{0}/AggregatedData/{1}/{2}";
  private _taskSeriesMetaDataUrl = "TaskSeries/{0}/ObservationMetadata";
  private _getTaskOccuranceUrl = "TaskOccurrence/{0}";
  private _dataSchedulerUrl = 'TaskSeries/{0}';
  private _tasksDataUrl = 'Orders/{0}/OptionalTasks';
  private _imagesData = 'assets/data/categoryImages.json';
  private _careNotesUrl = 'Orders/{0}/CareNotes';

  public confirmQty: number;
  public selectedOccurrence: any;
  public statusValue: any;
  public taskSeriesId: number;
  public taskOccurances: any[];
  public taskScheduleInfo: any;
  public taskScheduleInfoCompare: any;
  public taskScheduleInfoOnce: boolean;
  public taskScheduleInfoChanged: boolean;
  public taskScheduleOtherChange: boolean;
  public taskSeriesName: string;
  public comment: any;
  public scheduledTime: any;
  public scheduledDate: any;
  public scheduledDateValue: any;
  public mappedOccurance: any;
  public specifiedQty: number;
  public occurrenceValidationMessage: string;
  public validationMessage: string;
  public scheduleCollection: boolean;
  public isValidOccurrenceModal: boolean;
  public isValidSeriesModal: boolean;
  public isPatientFinding: boolean;
  public isNotScheduledPopup: boolean;
  public visitEndDate: string;
  public readyToComplete: boolean;
  public readyToSave: boolean;
  errorMessage: string;

  careNotes: CareNote[];
  public statusData: any[];
  statusSetDate: string = '';
  statusSetTime: string = '';
  statusSetDateValue: any;
  initialStatusValue: number = 0;
  initialComment:string='';
  public buttonFlag: boolean = true;

  createdBy = '';
  createdTime = '';
  modifiedBy = '';
  modifiedTime = '';
  statusSetByTooltip = '';
  statusSetTimeTooltip = '';
  statusTooltip = '';

  constructor(private http: Http, private globals: GlobalsService,
    private config: AppConfig, private errorHandler: GlobalErrorHandler) {

  }

  clearObjects() {
    this.selectedOccurrence = null;
    this.taskOccurances = null;
    this.taskScheduleInfo = null;
    this.taskScheduleInfoCompare = null;
    this.comment = null;
    this.scheduledTime = null;
    this.scheduledDate = null;
    this.scheduledDateValue = null;
    this.mappedOccurance = null;
    this.occurrenceValidationMessage = null;
    this.validationMessage = null;
    this.visitEndDate = null;
    this.errorMessage = null;
    this.careNotes = null;
    this.statusSetDate = '';
    this.statusSetTime = '';
    this.statusSetDateValue = null;
  }

  getTaskDueConfig() {
    let headers = new Headers();
    headers.append("Authorization", "bearer " + this.globals.getToken());
    headers.append("x-hospital-id", this.globals.getHospitalId());
    let options = new RequestOptions({ headers: headers });
    const dataUrl = this.globals.getBaseUrl() + 'TaskDueConfiguration';
    return this.http.get(dataUrl, options)
      .map(res => res.json().Data)
      .catch((e) => {
        return this.handleError(e);
      });
  }

  getCategoryImages() {
    return this.http.get(this._imagesData)
      .map(res => res.json())
      .catch((e) => {
        return this.handleError(e);
      });
  }

  getTasks(date: string) {
    let headers = new Headers();
    headers.append("Authorization", "bearer " + this.globals.getToken());
    headers.append("x-hospital-id", this.globals.getHospitalId());
    let options = new RequestOptions({ headers: headers });
    let dataUrl = this._dataUrl.replace('{0}', this.globals.getOrderId());
    dataUrl = dataUrl.replace('{1}', date + " 00:00");
    dataUrl = dataUrl.replace('{2}', date + " 23:59");
    let url = this.globals.getBaseUrl() + dataUrl;
    return this.http.get(url, options)
      .map(res => res.json())
      .catch((e) => {
        return this.handleError(e);
      });
  }


  getCareNotes() {
    let headers = new Headers();
    headers.append("Authorization", "bearer " + this.globals.getToken());
    headers.append("x-hospital-id", this.globals.getHospitalId());
    let options = new RequestOptions({ headers: headers });
    let url = this.globals.getBaseUrl() + this._careNotesUrl.replace('{0}', this.globals.getOrderId());
    return this.http.get(url, options)
      .map(res => this.careNotes = res.json().Data)
      .catch((e) => {
        return this.handleError(e);
      });
  }

  getOptionalTasks() {
    let headers = new Headers();
    headers.append("Authorization", "bearer " + this.globals.getToken());
    headers.append("x-hospital-id", this.globals.getHospitalId());
    let options = new RequestOptions({ headers: headers });
    const dataUrl = this._tasksDataUrl.replace('{0}', this.globals.getOrderId());
    let url = this.globals.getBaseUrl() + dataUrl;
    return this.http.get(url, options)
      .map(res => res.json().Data)
      .catch((e) => {
        return this.handleError(e);
      });
  }

  getOccuranceInformation() {
    return this.http.get("./assets/data/occurance.json")
      .map(response => response.json())
      .catch((e) => {
        return this.handleError(e);
      });
  }

  getScheduleInformation(parameters: any, taskSeriesId: any) {
    let headers = new Headers();
    headers.append("Authorization", "bearer " + this.globals.getToken());
    headers.append("x-hospital-id", this.globals.getHospitalId());
    let options = new RequestOptions({ headers: headers });
    let url = this.globals.getBaseUrl() + this._dataSchedulerUrl.replace('{0}', taskSeriesId);
    return this.http.get(url, options)
      .map(response => response.json())
      .catch((e) => {
        return this.handleError(e);
      });
  }

  putScheduleInformation(parameters: any, taskSeriesId: any, taskSchedulerInfo: any) {
    //console.log("Before Posting : ");
    //console.log(JSON.stringify(taskSchedulerInfo));
    let headers = new Headers();
    headers.append("Authorization", "bearer " + this.globals.getToken());
    headers.append("x-hospital-id", this.globals.getHospitalId());
    headers.append("UserName", this.globals.getUserName());
    headers.append("ApplicationName", this.config.getConfig("ApplicationName"));
    let options = new RequestOptions({ headers: headers });
    let url = this.globals.getBaseUrl() + this._dataSchedulerUrl.replace('{0}', taskSeriesId);
    return this.http.put(url, taskSchedulerInfo, options)
      .map(response => response.json())
      .catch((e) => {
        return this.handleError(e);
      });
  }

  updateOptionalTasksInformation(parameters: any, taskDefinitionId: any, taskSchedulerInfo: any) {
    let headers = new Headers();
    headers.append("Authorization", "bearer " + this.globals.getToken());
    headers.append("x-hospital-id", this.globals.getHospitalId());
    headers.append("UserName", this.globals.getUserName());
    headers.append("ApplicationName", this.config.getConfig("ApplicationName"));
    let options = new RequestOptions({ headers: headers });
    let url = this.globals.getBaseUrl() + this._dataSchedulerUrl.replace('{0}', taskDefinitionId);
    return this.http.put(url, taskSchedulerInfo, options)
      .map(response => response.json())
      .catch((e) => {
        return this.handleError(e);
      });
  }

  getToken(accessToken: any) {
    let token = "bearer " + accessToken;
    return token;
  }

  getValidOccuranceInformation(parameters: any, taskSeriesId: any) {
    let headers = new Headers();
    headers.append("Authorization", "bearer " + this.globals.getToken());
    headers.append("x-hospital-id", this.globals.getHospitalId());
    let options = new RequestOptions({ headers: headers });
    let url = this.globals.getBaseUrl() + this._taskSeriesMetaDataUrl.replace('{0}', taskSeriesId);
    if (this.config.getConfig("fromJSON") === true) {
      return this.getOccuranceInformation();
    } else {
      return this.http.get(url, options)
        .map(response => response.json())
        .catch((e) => {
          return this.handleError(e);
        });
    }
  }

  getTaskOccuranceInfo(parameters: any, occuranceId: string) {
    let headers = new Headers();
    headers.append("Authorization", "bearer " + this.globals.getToken());
    headers.append("x-hospital-id", this.globals.getHospitalId());
    let options = new RequestOptions({ headers: headers });
    let url = this.globals.getBaseUrl() + this._getTaskOccuranceUrl.replace('{0}', occuranceId);
    return this.http.get(url, options)
      .map(response => response.json())
      .catch((e) => {
        return this.handleError(e);
      });
  }

  putTaskOccuranceInfo(parameters: any, taskOccurance: any, occuranceId: string) {
    //console.log(JSON.stringify(taskOccurance));
    if (taskOccurance.PatientTaskFindings !== undefined && taskOccurance.PatientTaskFindings !== null) {
      taskOccurance.PatientTaskFindings.forEach((element: any) => {
        if (element.IsNormal === null) {
          element.IsNormal = true;
        }
      });
    }

    let headers = new Headers();
    headers.append("Authorization", "bearer " + this.globals.getToken());
    headers.append("x-hospital-id", this.globals.getHospitalId());
    headers.append("UserName", this.globals.getUserName());
    headers.append("ApplicationName", this.config.getConfig("ApplicationName"));
    let options = new RequestOptions({ headers: headers });
    let url = this.globals.getBaseUrl() + this._getTaskOccuranceUrl.replace('{0}', occuranceId);
    return this.http.put(url, taskOccurance, options)
      .map(response => response.json())
      .catch((e) => {
        return this.handleError(e);
      });
  }

  putCareNotes(careNotes: CareNote) {
    let headers = new Headers();
    headers.append("Authorization", "bearer " + this.globals.getToken());
    headers.append("x-hospital-id", this.globals.getHospitalId());
    headers.append("UserName", this.globals.getUserName())
    let options = new RequestOptions({ headers: headers });
    let url = this.globals.getBaseUrl() + this._careNotesUrl.replace('{0}', this.globals.getOrderId());
    return this.http.put(url, careNotes, options)
      .map(response => response.json())
      .catch((e) => {
        return this.handleError(e);
      });

  }

  public loadStatusData() {
    this.statusData = [
      // {
      //   "StatusId": 122,
      //   "Status": "Active",
      //   "DisplayName": "Active"
      // },
      {
        "StatusId": 124,
        "Status": "Scheduled",
        "DisplayName": "Planned"
      },
      {
        "StatusId": 126,
        "Status": "Complete",
        "DisplayName": "Completed"
      },
      {
        "StatusId": 127,
        "Status": "Skipped",
        "DisplayName": "Skipped"
      },
      {
        "StatusId": 128,
        "Status": "Cancelled",
        "DisplayName": "Canceled"
      }
    ];
  }

  getStatusObjectByName(statusName: string) {
    if (this.statusData) {
      const filterObj = this.statusData.filter(x => x.Status === statusName);
      if (filterObj && filterObj.length > 0) {
        return filterObj[0];
      }
    }
    return null;
  }

  getStatusObjectByID(statusID: number) {
    if (this.statusData) {
      const filterObj = this.statusData.filter(x => x.StatusId === statusID);
      if (filterObj && filterObj.length > 0) {
        return filterObj[0];
      }
    }
    return null;
  }

  postRemoveNote(note: CareNote) {
    //console.log(note);
    const id = note.CareNotesId;
    let headers = new Headers();
    headers.append("Authorization", "bearer " + this.globals.getToken());
    headers.append("x-hospital-id", this.globals.getHospitalId());
    headers.append("UserName", this.globals.getUserName())
    let options = new RequestOptions({ headers: headers });
    let url = this.globals.getBaseUrl() + this._careNotesUrl.replace('{0}', id.toString());
    //console.log(url);
    return this.http.post(url, note, options)
      .map(response => response.json())
      .catch((e) => {
        return this.handleError(e);
      });
  }

  private handleError(error: Response | any) {
    this.errorHandler.exceptionHandling(true, error);
    return Observable.throw(error);
  }

  public IsValidDate(date: Date) {
    //return new Date(date) > new Date(this.config.getConfig("MinDate")) && new Date(date) < new Date(this.config.getConfig("MaxDate"));
    return true;
  }

  public IsDateInVisit(dateValue: any) {
    return this.globals.visitDates.find((x: any) => x.date === dateValue) !== undefined;
  }

  public formatTime(timeValue: string) {
    let timeStamp = timeValue ? timeValue.replace(/[^0-9]/gi, '') : "";
    if (timeStamp.length !== 0) {
      for (let i = 0; timeStamp.length < 4; i++) {
        if ((timeStamp.length === 3 || timeStamp.length === 1) && i === 0) {
          timeStamp = "0" + timeStamp;
        } else {
          timeStamp = timeStamp + "0";
        }
      }
      let hoursValue = timeStamp.substr(0, 2) === "" ? "00" : timeStamp.substr(0, 2);
      let minutesValue = timeStamp.substr(2, 2) === "" ? "00" : timeStamp.substr(2, 2);
      if (timeValue.toLowerCase().indexOf('p') !== -1) {
        hoursValue = (parseInt(hoursValue) + 12).toString();
      }
      if (parseInt(hoursValue) < 0 || parseInt(hoursValue) > 24) {
        return "";
      }
      else if ((parseInt(hoursValue) === 24) && (timeValue.toLowerCase().indexOf('p') !== -1)) {
        return "12" + ':' + minutesValue;
      }
      else if ((parseInt(hoursValue) === 12) && (timeValue.toLowerCase().indexOf('p') === -1)) {
        if (parseInt(hoursValue) === 12) {
          return "12" + ':' + minutesValue;
        }
        else {
          return "00" + ':' + minutesValue;
        }
      }

      else {
        return (parseInt(hoursValue) === 24 ? "00" : hoursValue) + ':' + minutesValue;
      }
    }
    return "";
  }

}
