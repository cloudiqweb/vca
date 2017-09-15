import { RequestOptions } from '@angular/http';
import { Injectable } from '@angular/core';
import { Http, Headers } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/Rx';
import { Subject } from 'rxjs/Subject';
import { GlobalsService } from '../globals.service';
import { GlobalErrorHandler } from '../app.errorHandler';
import { FilterPreferance } from '../data/filterpreferance';
import { VisitType, DepartmentType, ResourceType, LocationType } from '../data/filtertypes';
import { AppConfig } from '../app.config';

@Injectable()
export class WhiteboardService {


  private filter: FilterPreferance;
  private subject: Subject<FilterPreferance> = new Subject<FilterPreferance>();
  private userPreferenceAPIPath: string = "UserPreferences/";
  private userPreferenceTypeId: number = 17;

  public VisitTypes: VisitType[];
  public LocationTypes: LocationType[];
  public DepartmentTypes: DepartmentType[];
  public ResourceTypes: ResourceType[];

  completeDate: Date;

  constructor(public http: Http, private config: AppConfig, private globals: GlobalsService, private errorHandler: GlobalErrorHandler) {

  }

  clearObjects() {
    this.VisitTypes = null;
    this.LocationTypes = null;
    this.DepartmentTypes = null;
    this.ResourceTypes = null;
    this.filter = null;
    //this.subject.unsubscribe();
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


  setFilter(filter: FilterPreferance): void {
    this.filter = filter;
    this.subject.next(filter);
  }

  getFilter(): Observable<FilterPreferance> {
    return this.subject.asObservable();
  }


  getVisitTypes() {
    let headers = new Headers();
    headers.append("Authorization", "bearer " + this.globals.getToken());
    headers.append("x-hospital-id", this.globals.getHospitalId());
    headers.append("UserName", this.globals.getUserName());
    headers.append("ApplicationName", this.config.getConfig("ApplicationName"));
    let options = new RequestOptions({ headers: headers });
    let baseUrl = this.globals.getBaseUrl();
    let url = baseUrl + "/VisitTypes";
    return this.http.get(url, options)
      .map(res => res.json().Data)
      .catch((e) => {
        return this.handleError(e);
      });

  };


  getLocationTypes() {
    let headers = new Headers();
    headers.append("Authorization", "bearer " + this.globals.getToken());
    headers.append("x-hospital-id", this.globals.getHospitalId());
    headers.append("UserName", this.globals.getUserName());
    headers.append("ApplicationName", this.config.getConfig("ApplicationName"));
    let options = new RequestOptions({ headers: headers });
    let baseUrl = this.globals.getBaseUrl();
    let url = baseUrl + "/Hospitals/LocationsAndCages";
    return this.http.get(url, options)
      .map(res => res.json().Data)
      .catch((e) => {
        return this.handleError(e);

      });

  };

  getDepartments() {
    let headers = new Headers();
    headers.append("Authorization", "bearer " + this.globals.getToken());
    headers.append("x-hospital-id", this.globals.getHospitalId());
    headers.append("UserName", this.globals.getUserName());
    headers.append("ApplicationName", this.config.getConfig("ApplicationName"));
    let options = new RequestOptions({ headers: headers });
    let baseUrl = this.globals.getBaseUrl();
    let url = baseUrl + "/Departments";
    return this.http.get(url, options)
      .map(res => res.json().Data)
      .catch((e) => {
        return this.handleError(e);
      });

  };


  getResources() {
    let headers = new Headers();
    headers.append("Authorization", "bearer " + this.globals.getToken());
    headers.append("x-hospital-id", this.globals.getHospitalId());
    headers.append("UserName", this.globals.getUserName());
    headers.append("ApplicationName", this.config.getConfig("ApplicationName"));
    let options = new RequestOptions({ headers: headers });
    let baseUrl = this.globals.getBaseUrl();
    let url = baseUrl + "/VisitResources";
    return this.http.get(url, options)
      .map(res => res.json().Data)
      .catch((e) => {
        return this.handleError(e);
      });

  };


  getWhiteBoardData(date: Date) {
    let headers = new Headers();
    headers.append("Authorization", "bearer " + this.globals.getToken());
    headers.append("x-hospital-id", this.globals.getHospitalId());
    headers.append("UserName", this.globals.getUserName());
    headers.append("ApplicationName", this.config.getConfig("ApplicationName"));
    let options = new RequestOptions({ headers: headers });

    let re = /\//gi;
    const localdate = date.toISOString().replace(re, "-");
    //console.log("**********" + localdate + "to be displayed");
    let baseUrl = this.globals.getBaseUrl();
    let url = baseUrl + "/CheckedInPatients/" + localdate + "/TaskOccurrenceStatusCount";

    return this.http.get(url, options)
      .map(res => res.json().Data)
      .catch((e) => {
        return this.handleError(e);
      });

  };

  getPhotoURL(patientId: number) {
    let baseUrl = this.globals.getBaseUrl();
    return baseUrl + "Patients/" + patientId + "/PatientPhotos";
  };

  getFilterPreferences() {
    return this.http.get("./assets/data/userPreferance.json")
      .map(response => response.json());

  }

  getUserPreferences() {
    let headers = new Headers();
    headers.append("Authorization", "bearer " + this.globals.getToken());
    headers.append("x-hospital-id", this.globals.getHospitalId());
    headers.append("UserName", this.globals.getUserName());
    headers.append("ApplicationName", this.config.getConfig("ApplicationName"));
    let options = new RequestOptions({ headers: headers });
    let baseUrl = this.globals.getBaseUrl();
    let url = baseUrl + this.userPreferenceAPIPath + this.getLoginName(this.globals.getUserName()) + "/" + this.userPreferenceTypeId;

    //console.log("getUserPreferences URL: " + url)
    return this.http.get(url, options)
      .map(res => res.json().Data)
      .catch((e) => {
        return this.handleError(e);
      });
  }

  saveUserPreference(details: any) {
    let headers = new Headers();
    headers.append("Authorization", "bearer " + this.globals.getToken());
    headers.append("x-hospital-id", this.globals.getHospitalId());
    headers.append("UserName", this.globals.getUserName());
    headers.append("ApplicationName", this.config.getConfig("ApplicationName"));
    let options = new RequestOptions({ headers: headers });
    let url = this.globals.getBaseUrl() + this.userPreferenceAPIPath + this.getLoginName(this.globals.getUserName()) + "/" + this.userPreferenceTypeId;
    return this.http.put(url, details, options)
      .map(response => response.json())
      .catch((e) => {
        return this.handleError(e);
      });
  }

  public getLoginName(userName: string) {
    return userName.substring(userName.indexOf('\\') + 1);
  }

  private handleError(error: Response | any) {
    this.errorHandler.exceptionHandling(true, error);
    return Observable.throw(error);
  }


}



