import { Injectable } from '@angular/core';
import { Angulartics2 } from 'angulartics2';

import { AppConfig } from '../app.config';
import { GlobalsService } from '../globals.service';

@Injectable()
export class GoogleAnalyticsService {

    private angulartics2Svc: Angulartics2;
    private ga_hospitalID_dim_name: string;
    private ga_userID_dim_name: string;
    private isGAEnabled: boolean;

    constructor(angulartics2: Angulartics2, private config: AppConfig, private globalsService: GlobalsService) {
        this.angulartics2Svc = angulartics2;
        this.ga_hospitalID_dim_name = this.config.getConfig("ga_hospitalID_dim_name");
        this.ga_userID_dim_name = this.config.getConfig("ga_userID_dim_name");
        this.isGAEnabled = this.config.getConfig("isGAEnabled");
    }

    set_ApplicationLevl_GA_Dimensions() {
        if (this.isGAEnabled) {
            let dimObject: object = {};
            dimObject[this.ga_hospitalID_dim_name] = this.globalsService.getParameters().hospitalId;
            dimObject[this.ga_userID_dim_name] = this.globalsService.getParameters().userId;
            this.customeDimensionMultipleTracks(dimObject);
        }
    }

    pageTrack(path: string, location: string) {
        if (this.isGAEnabled) {
            this.angulartics2Svc.pageTrack.next({
                path: path,
                location: location
            });
        }
    }

    eventTrack(action: string, category: string, label: string, value: number) {
        if (this.isGAEnabled) {
            this.angulartics2Svc.eventTrack.next({
                action: action,
                properties: {
                    category: category,
                    label: label,
                    value: value
                }
            });
        }
    }

    exceptionTrack(exceptionMessage: string, isFatal: boolean) {
        if (this.isGAEnabled) {
            this.angulartics2Svc.exceptionTrack.next({
                description: exceptionMessage,
                fatal: isFatal
            });
        }
    }

    customeDimensionTrack(dimensionName: string, dimensionValue: any) {
        if (this.isGAEnabled) {
            let dimObject: object = {};
            dimObject[dimensionName] = dimensionValue;
            this.angulartics2Svc.setUserProperties.next(dimObject);
        }
    }

    customeDimensionMultipleTracks(dimObjects: Object) {
        if (this.isGAEnabled) {
            this.angulartics2Svc.setUserProperties.next(dimObjects);
        }
    }

    userTimingsTrack(category: string, variable: string, label: string, duration: number) {
        if (this.isGAEnabled) {
            this.angulartics2Svc.userTimings.next({
                timingCategory: category,
                timingVar: variable,
                timingLabel: label,
                timingValue: duration
            });
        }
    }


}