
'use strict';

import { Injectable } from '@angular/core';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/map';
import { Observable } from 'rxjs/Observable';
import { TimelineData } from '../data/timeline';
import { GlobalsService } from '../globals.service';
import { CareNote } from '../data/CareNote';
import { GlobalErrorHandler } from '../app.errorHandler';

// Common data service
@Injectable()
export class TimelineService {
  // private _dataUrl = 'app/data/timeline.json';
  private _dataUrl = "Orders/{0}/TaskOccurrenceTimeLine/1000/1";
  private _imagesData = 'assets/data/categoryImages.json';
  private _careNotesUrl = 'Orders/{0}/CareNotes';


  constructor(private http: Http, private globals: GlobalsService,
    private errorHandler: GlobalErrorHandler) {

    }

  clearObjects() {

  }

  getCategoryImages() {
    return this.http.get(this._imagesData)
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
      .map(res => res.json().Data)
      .catch((e) => {
        return this.handleError(e);
      });
  }

  getTasks() {
    let headers = new Headers();
    headers.append("Authorization", "bearer " + this.globals.getToken());
    headers.append("x-hospital-id", this.globals.getHospitalId());
    headers.append("UserName", this.globals.getUserName())
    let options = new RequestOptions({ headers: headers });
    let url = this.globals.getBaseUrl()
      + this._dataUrl.replace('{0}', this.globals.getOrderId());
    return this.http.get(url, options)
      .map(res => res.json().Data)
      .catch((e) => {
        return this.handleError(e);
      });
  }

  private handleError(error: Response | any) {
    this.errorHandler.exceptionHandling(true, error);
    return Observable.throw(error);
  }



}
