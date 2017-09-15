import { Component } from '@angular/core';
import { Angulartics2GoogleAnalytics } from 'angulartics2';
import { Subscription } from "rxjs/Rx";
import { Router, NavigationStart, ActivatedRoute, Params } from '@angular/router';

import { GlobalsService } from './globals.service';
import { AppConfig } from './app.config';
import { TimerService } from './shared/timer.service';
import { GlobalErrorHandler } from './app.errorHandler';

@Component({
    selector: 'my-app',
    template: `
    <div #overallHeight (window:resize)="onResize($event)" (contextmenu)="onContextMenuRightClick($event)">
        <div *ngIf="!isPatientComponentHide" class="row">
            <patient></patient>
        </div>
        <router-outlet></router-outlet>
    </div>
  `
})
export class AppComponent {

    private subscription: Subscription;
    parameters: any;
    defaultTimerInterval: number = 60000;
    isPatientComponentHide: boolean = true;

    constructor(private activatedRoute: ActivatedRoute, private globalService: GlobalsService,
        angulartics2GoogleAnalytics: Angulartics2GoogleAnalytics, private config: AppConfig,
        private errorHandler: GlobalErrorHandler, private router: Router
    ) {

        if (this.config.getConfig("schedulerRefreshInterval")) {
            TimerService.getInstance().setTimeInterval(this.config.getConfig("schedulerRefreshInterval"));
        }
        else {
            TimerService.getInstance().setTimeInterval(this.defaultTimerInterval);
        }

    }

    ngOnInit() {
        this.getAndSetParams();
        this.router.events.subscribe((event) => {
            if (event instanceof NavigationStart) {
                if (event.url === '/whiteboard') {
                    this.globalService.isPatientComponentHide = true;
                    this.isPatientComponentHide = true;
                }
                else {
                    this.globalService.isPatientComponentHide = false;
                    this.isPatientComponentHide = false;
                }
            }
        });

    }

    onResize(event: any) {
        this.globalService.setPatientOverallHeight(event.target.innerHeight);
    }

    onContextMenuRightClick($event: MouseEvent) {
        $event.preventDefault();
        $event.stopPropagation();
    }

    private getAndSetParams() {
        try {
            if (this.globalService.getParameters().accessToken === "") {
                let currentEnvironment: string = this.config.getEnv('env');
                this.globalService.hostName = window.location.hostname;
                this.subscription = this.activatedRoute.queryParams.subscribe((params: Params) => {

                    if (params && Object.keys(params).length > 0) {
                        this.parameters = {
                            accessToken: params['accessToken'],
                            patientId: params['patientId'],
                            hospitalId: params['hospitalId'],
                            orderId: params['orderId'],
                            userName: params['userName'],
                            userId: params["userId"],
                            startPage: params["startPage"]
                        };

                        this.globalService.setToken(this.parameters);
                    }
                    else {
                        if (currentEnvironment === 'development') {
                            this.globalService.hostName = this.config.getConfig('API_Domain_Name');
                            this.parameters = {
                                accessToken: this.config.getConfig('accessToken'),
                                patientId: this.config.getConfig('patientId'),
                                hospitalId: this.config.getConfig('hospitalId'),
                                orderId: this.config.getConfig('orderId'),
                                userName: this.config.getConfig('userName'),
                                userId: this.config.getConfig('userId'),
                                startPage: this.config.getConfig('startPage')
                            };
                            this.globalService.setToken(this.parameters);
                        }
                    }


                    // if (this.globalService.getParameters().accessToken === "") {
                    //     if (currentEnvironment === 'development') {
                    //         this.globalService.hostName = this.config.getConfig('API_Domain_Name');
                    //         this.parameters = {
                    //             accessToken: this.config.getConfig('accessToken'),
                    //             patientId: this.config.getConfig('patientId'),
                    //             hospitalId: this.config.getConfig('hospitalId'),
                    //             orderId: this.config.getConfig('orderId'),
                    //             userName: this.config.getConfig('userName'),
                    //             userId: this.config.getConfig('userId'),
                    //             startPage: this.config.getConfig('startPage')
                    //         };
                    //         this.globalService.setToken(this.parameters);
                    //     }
                    //     else {
                    //         //this.globalService.hostName = this.config.getConfig('API_Domain_Name');
                    //         if (params && Object.keys(params).length > 0) {
                    //             this.parameters = {
                    //                 accessToken: params['accessToken'],
                    //                 patientId: params['patientId'],
                    //                 hospitalId: params['hospitalId'],
                    //                 orderId: params['orderId'],
                    //                 userName: params['userName'],
                    //                 userId: params["userId"],
                    //                 startPage: params["startPage"]
                    //             };

                    //             this.globalService.setToken(this.parameters);
                    //         }
                    //     }
                    // }

                });
            }
        }
        catch (error) {
            this.errorHandler.exceptionHandling(false, error);
        }
    }
}