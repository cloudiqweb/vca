import { Injectable } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FilterPreferance } from './data/filterpreferance';

@Injectable()
export class GlobalsService {

  isNewDropDownChanges: boolean = true;

  private parameters = {
    accessToken: '',
    patientId: '',
    hospitalId: '',
    orderId: '',
    userName: '',
    userId: '',
    startPage: ''
  };

  private filterPreference: FilterPreferance;
  isPatientComponentHide: boolean = false;
  public TimeSensitiveTaskDueInMinutes = 10;
  public TimeInsensitiveTaskDueInMinutes = 60;
  public taskDueConfigFetched = false;

  setFilterPreferance(sort: string, criticalCondition: boolean, visitFilter: number[], locationFilter: number[], resourceFilter: number[], departmentFilter: number[]) {
    this.filterPreference.SortBy = sort;
    this.filterPreference.SortCriticalFirst = criticalCondition;
    this.filterPreference.VisitIDs = visitFilter;
    this.filterPreference.LocationIDs = locationFilter;
    this.filterPreference.ResourceIDs = resourceFilter;
    this.filterPreference.DepartmentIDs = departmentFilter;
  }
  setFilterPref(input: FilterPreferance) {
    this.filterPreference = input;
  }

  getFilterPreferance() {
    return this.filterPreference;
  }

  private schedulerCurrentPage: number = -1;
  private schedulerCurrentDate: string = "";
  private whiteBoardToSchedulerNav: boolean = false;
  private schedulerCurrentHour: number = -1;

  public bannerHeight: number;
  public overAllHeight: number;
  private datePipe: DatePipe;

  public checkedInDate: Date;
  public numberOfDays: number;
  public visitDates: any[];

  public hostName: string;

  weekDays: string[] = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  private _baseUrl = "https://{0}/WoofwareWebAPI/API/";

  public getBaseUrl() {
    //local host and dev sites refer point to QA API
    if (this.hostName.indexOf('localhost') >= 0 || this.hostName.indexOf('lapmsdev05') >= 0) {
      return "https://lapmsqa-ns01.vcaantech.com/WoofwareWebAPI/API/";
    }
    return this._baseUrl.replace('{0}', this.hostName);
  }

  public setPatientBannerHeight(bannerHeight: any) {
    if (bannerHeight !== 0) {
      this.bannerHeight = bannerHeight;
    }
  }

  public setPatientOverallHeight(overAllHeight: any) {
    if (overAllHeight !== 0) {
      this.overAllHeight = overAllHeight;
    }
  }

  public setToken(patientDetail: any) {
    this.parameters = patientDetail;
    this.setParametersURL();
  }


  public getToken() {
    return this.parameters.accessToken;
  }

  public getPatientId() {
    return this.parameters.patientId;
  }

  public getOrderId() {
    return this.parameters.orderId;
  }

  public getStartPage() {
    return this.parameters.startPage;
  }

  public setPatientId(patientId: number) {
    //console.log("PatientID:" + patientId);
    this.parameters.patientId = patientId.toString();
  }


  public setOrderId(orderId: number) {
    //console.log("OrderId:" + orderId);
    this.parameters.orderId = orderId.toString();
  }

  public setStartPage(page: string) {
    this.parameters.startPage = page;
  }

  public getParameters() {
    return this.parameters;
  }

  public getHospitalId() {
    return this.parameters.hospitalId;
  }

  public getCurrentDateTime() {
    this.datePipe = new DatePipe("en-US");
    let dateString = this.datePipe.transform(new Date(), 'yyyy-MM-ddTHH:mm:ss');
    return dateString;
  }

  public getUserName() {
    return this.parameters.userName;
  }

  public getUserInitials() {
    let userInitials = "";
    if (this.parameters.userName) {
      let userNames = this.parameters.userName.split("\\");
      if (userNames.length > 1) {
        userInitials = userNames[1];
      }
      else {
        userInitials = userNames[0];
      }
      userNames = userInitials.split(".");
      if (userNames.length > 1) {
        userInitials = userNames[0].slice(0, 1) + userNames[1].slice(0, 1);
      }
      else {
        userInitials = userNames[0].slice(0, 1);
      }
    }
    return userInitials;
  }

  public getUserId() {
    return this.parameters.userId;
  }

  public getPageSize() {
    return 1000;
  }

  public getScheudlerCurrentPage() {
    return this.schedulerCurrentPage;
  }

  public setScheudlerCurrentPage(pageNumber: number) {
    this.schedulerCurrentPage = pageNumber;
  }

  public getScheudlerCurrentDate() {
    return this.schedulerCurrentDate;
  }

  public setScheudlerCurrentDate(currentDate: string) {
    this.schedulerCurrentDate = currentDate;
  }

  public getSchedulerCurrentHour() {
    return this.schedulerCurrentHour;
  }

  public setSchedulerCurrentHour(curentHour: number) {
    this.schedulerCurrentHour = curentHour;
  }

  public getWhiteBoardToSchedulerNav() {
    return this.whiteBoardToSchedulerNav;
  }

  public setWhiteBoardToSchedulerNav(val: boolean) {
    this.whiteBoardToSchedulerNav = val;
  }

  groupDate(noteDate: Date, option: string) {
    const d = new Date();
    let returnString: string = '';
    const date: string = noteDate.toString().split("T")[0];
    if (this.visitDates !== undefined) {
      const index = this.visitDates.findIndex((e): any => e.date === date);

    if (this.visitDates[index] !== undefined) {
      returnString = this.visitDates[index].dateString;
    }
    else {
      const n: string = this.weekDays[d.getDay()].substr(0, 3);
      this.datePipe = new DatePipe("en-US");
      let dateString = n + " " + this.datePipe.transform(noteDate, 'dd-MMM-yyyy');
      returnString = dateString;
    }
    if (option === 'Observation' || option === 'TimeLine') {
      if (returnString.startsWith('D')) {
        returnString = returnString.split(" - ")[1];
        return returnString.split(" ")[0] + ", " + returnString.split(" ")[1];
      }
      else {
        return "Post-Visit "+returnString.split(" ")[0] + ", " + returnString.split(" ")[1];
      }
    }
    else if (option === 'CareNote') {
      const time: string = noteDate.toString().split("T")[1].slice(0, 5);
      return time + " on " + returnString;
    }
  }
  }

  nameFormat(create: string) {
    if (create.indexOf('\\') !== -1) {
      create = create.split("\\")[1];
    }
    if (create.indexOf(':') !== -1) {
      create = create.split(":")[1];
    }
    const text = create.replace('.', " ");
    create = '';
    text.split(" ").forEach((e: string) => {
      create += e.charAt(0).toUpperCase() + e.substr(1).toLowerCase() + " ";

    });

    return create.length === 0 ? text : create;
  }


  /* Tooltip Content */
  public getFormattedToolTip(content: string) {
    let toolTipContent = "";
    toolTipContent += "<div class='custom_tooltip'>";
    toolTipContent += "<div><div class='cell txt margin'>" + content + "</div></div>";
    toolTipContent += "</div>";
    return toolTipContent;
  }



  public getFormattedDateTime(currentDateTime: string) {
    let formattedDateTime: string = "";
    if (currentDateTime.indexOf('T') > -1) {
      const dateArr = currentDateTime.split("T");
      formattedDateTime = dateArr[0];
      if (dateArr.length === 2) {
        const timeArr = dateArr[1].split(":");
        if (timeArr.length > 1) {
          formattedDateTime = formattedDateTime + " | " + timeArr[0] + ":" + timeArr[1];
        }
      }
    }
    return formattedDateTime;
  }

  _isNotNullOrEmpty(inputToValidate: any) {
    return inputToValidate !== null && inputToValidate !== "" && inputToValidate !== undefined;
  }

  queryStringURL = '';
  public setParametersURL() {
    this.queryStringURL = '';
    this.queryStringURL = '?hospitalId=' + this.getHospitalId();
    this.queryStringURL += '&patientId=' + this.getPatientId();
    this.queryStringURL += '&orderId=' + this.getOrderId();
    this.queryStringURL += '&userName=' + this.getUserName();
    this.queryStringURL += '&userId=' + this.getUserId();
    this.queryStringURL += '&accessToken=' + this.getToken();
  }

  public getParametersURL(startPage: string) {
    let redirectURL = this.queryStringURL;
    if (startPage && startPage !== '') {
      redirectURL += '&startPage=' + startPage;
    }
    return redirectURL;
  }

}
