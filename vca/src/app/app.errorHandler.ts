import { ErrorHandler, Injectable } from '@angular/core';
import { GoogleAnalyticsService } from './shared/googleAnalytics.service';
import { Response } from '@angular/http';


@Injectable()
export class GlobalErrorHandler implements ErrorHandler {

  constructor(private googleAnalytics: GoogleAnalyticsService) { }

  exceptionHandling(isApi: boolean, error: Response | any) {

    let errMsg: string;
    if (error instanceof Response) {
      const body = error.json() || '';
      const err = body.error || JSON.stringify(body);
      errMsg = `${error.status} - ${error.statusText || ''} ${err}`;
    }
    else {
      errMsg = error.message ? error.message : error.toString();
    }

    if (isApi) {

    }
    this.handleError(errMsg);
  }

  handleError(error: any) {
    const message = error.message ? error.message : error.toString();
    this.googleAnalytics.exceptionTrack(message, false);
    console.error(message);
    throw error;
  }

}