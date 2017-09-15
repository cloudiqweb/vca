'use strict';

import { Injectable } from '@angular/core';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/map';
import { Observable } from 'rxjs/Observable';
import { GlobalsService } from '../globals.service';
import { AppConfig } from '../app.config';
import { GlobalErrorHandler } from '../app.errorHandler';

// Common data service
@Injectable()
export class PatientService {

  private _dataUrl = "CheckedInPatients/{date}/TaskOccurrenceStatusCount?patientId={0}";
  private _photoUrl = "Patients/{0}/PatientPhotos";
  private _locationUrl = "Hospitals/LocationsAndCages";
  private _cageLocationUrl = "Orders/{0}/LocationsAndCages";
  private _masterDataUrl = "Species";

  //private _locationUrl = "app/data/location.json";
  // private _dataUrl = "app/data/PatientDetails.json";

  constructor(private http: Http, private globals: GlobalsService,
    private config: AppConfig, private errorHandler: GlobalErrorHandler) {
  }

  getToken(accessToken: any) {
    let token = "bearer " + accessToken;
    return token;
  }

  getPhotoUrl(parameters: any) {
    return this.globals.getBaseUrl() + this._photoUrl.replace('{0}', parameters.patientId);
  }

  getLocations(parameters: any) {
    let headers = new Headers();
    headers.append("Authorization", this.getToken(parameters.accessToken));
    headers.append("x-hospital-id", parameters.hospitalId);
    headers.append("UserName", this.globals.getUserName());
    headers.append("ApplicationName", this.config.getConfig("ApplicationName"));    
    let options = new RequestOptions({ headers: headers });
    let url = this.globals.getBaseUrl() + this._locationUrl.replace('{1}', parameters.hospitalId);
    return this.http.get(url, options)
      .map(res => res.json())
      .catch((e) => {
        return this.handleError(e);
      });
  }

  getPatientPhoto(parameters: any) {
    let headers = new Headers();
    headers.append("Authorization", this.getToken(parameters.accessToken));
    headers.append("x-hospital-id", parameters.hospitalId);
    headers.append("UserName", this.globals.getUserName());
    headers.append("ApplicationName", this.config.getConfig("ApplicationName"));    

    let options = new RequestOptions({ headers: headers });
    //this._photoUrl = this.globals.getBaseUrl() + this._photoUrl.replace('{0}', parameters.patientId);
    let url = this.globals.getBaseUrl() + this._photoUrl.replace('{0}', parameters.patientId);
    return this.http.get(url, options)
      .map(res => res)
      .catch((e) => {
        return this.handleError(e);
      });
  }

  getPatientDetails(parameters: any) {
    let currentDate = new Date();
    let date:string = currentDate.toLocaleDateString().replace('/','-').replace('/','-');
    let headers = new Headers();
    headers.append("Authorization", this.getToken(parameters.accessToken));
    headers.append("x-hospital-id", parameters.hospitalId);
    headers.append("UserName", this.globals.getUserName());
    headers.append("ApplicationName", this.config.getConfig("ApplicationName"));    
    let options = new RequestOptions({ headers: headers });
    let url = this.globals.getBaseUrl() + this._dataUrl.replace('{date}',date).replace('{0}', parameters.patientId);;
    //this._dataUrl = this.globals.getBaseUrl() + this._dataUrl.replace('{0}', parameters.patientId);
    //console.log(url);
    return this.http.get(url, options)
      .map(res => res.json())
      .catch((e) => {
        return this.handleError(e);
      });
  }

  getSpeciesDisplayName(parameters: any) {
    let headers = new Headers();
    headers.append("Authorization", this.getToken(parameters.accessToken));
    headers.append("x-hospital-id", parameters.hospitalId);
    let options = new RequestOptions({ headers: headers });
    let url = this.globals.getBaseUrl() + this._masterDataUrl;
    return this.http.get(url, options)
      .map(res => res.json())
      .catch((e) => {
        return this.handleError(e);
      });
  }

  getLocationCageForVisit(parameterInfo: any) {
    let headers = new Headers();
    headers.append("Authorization", this.getToken(parameterInfo.accessToken));
    headers.append("x-hospital-id", parameterInfo.hospitalId);
    headers.append("UserName", this.globals.getUserName());
    headers.append("ApplicationName", this.config.getConfig("ApplicationName"));    

    let options = new RequestOptions({ headers: headers });
    let url = this.globals.getBaseUrl() + this._cageLocationUrl.replace('{0}', parameterInfo.orderId);
    //console.log(url);
    return this.http.get(url, options)
      .map(res => res.json())
      .catch((e) => {
        return this.handleError(e);
      });

  }

  putLocationCage(details: any) {
    let headers = new Headers();
    headers.append("Authorization", "bearer " + this.globals.getToken());
    headers.append("x-hospital-id", this.globals.getHospitalId());
    headers.append("UserName", this.globals.getUserName());
    headers.append("ApplicationName", this.config.getConfig("ApplicationName"));
    let options = new RequestOptions({ headers: headers });
    let url = this.globals.getBaseUrl() + this._cageLocationUrl.replace('{0}', this.globals.getOrderId());
    return this.http.put(url, details, options)
      .map(response => response.json())
      .catch((e) => {
        return this.handleError(e);
      });
  }

  private handleError(error: Response | any) {
    this.errorHandler.exceptionHandling(true, error);
    return Observable.throw(error);
  }

}
