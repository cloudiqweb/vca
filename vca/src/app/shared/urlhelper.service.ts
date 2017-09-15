import { Injectable } from '@angular/core';
import { ResponseContentType, Http,RequestOptions, Headers } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import { Subscriber } from 'rxjs/Subscriber';
import { GlobalsService } from '../globals.service';

 
@Injectable()
export class UrlHelperService {
    dummyImageURL = 'assets/images/dummy.png';
    
    constructor(
        private http: Http, /* Your favorite Http requester */
        private globals: GlobalsService
    ) {
    }
 
    getToken(accessToken : any) {
    let token = "bearer " + accessToken;
    return token;
    }

    get(url: string): Observable<any> {
        return new Observable((observer: Subscriber<any>) => {
            let objectUrl: string = null;
            let parameters =  this.globals.getParameters();
            let headers = new Headers();
            headers.append("Authorization",this.getToken(parameters.accessToken));
            headers.append("x-hospital-id",parameters.hospitalId);
            let options = new RequestOptions({ headers: headers , responseType: ResponseContentType.Blob});
            this.http
                .get(url, options)
                .subscribe(m => {
                    if (m.blob().size === 0) {
                        objectUrl = this.dummyImageURL;
                    } else {
                        objectUrl = URL.createObjectURL(m.blob());
                    }
                    observer.next(objectUrl);
                });
 
            return () => {
                if (objectUrl) {
                    URL.revokeObjectURL(objectUrl);
                    objectUrl = null;
                }
            };
        });
    }
 
    getHeaders(): Headers {
        let headers = new Headers();
 
        ////let token = this.authService.getCurrentToken();
        let token = { access_token: 'ABCDEF' }; // Get this from your auth service.
        if (token) {
            headers.set('Authorization', 'Bearer ' + token.access_token);
        }
 
        return headers;
    }
}