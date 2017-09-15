// Angular

import { Component, ViewChild, OnInit, OnDestroy, Renderer2 } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Subscription } from "rxjs/Rx";
import * as wjcCore from 'wijmo/wijmo';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Params } from '@angular/router';
import { IPopup } from "ng2-semantic-ui";
import { GlobalsService } from '../globals.service';
import { PatientService } from './patient.service';
import { AppConfig } from '../app.config';
import { GoogleAnalyticsService } from '../shared/googleAnalytics.service';
import { TimerService } from '../shared/timer.service';
import { GlobalErrorHandler } from '../app.errorHandler';


// The application root component.
@Component({
  selector: 'patient',
  templateUrl: './patient.component.html',
  providers: [
    GoogleAnalyticsService,
    TimerService
  ]
})

export class PatientComponent implements OnInit, OnDestroy {
  private subscription: Subscription;

  patientDetails: any;
  locationDetails: any;
  cageDetails: any[];
  petNameTruncate: boolean;
  clientNameTruncate: boolean;
  errorMessage: string;
  grpTooltip: wjcCore.Tooltip;
  selectedCage: any;
  imageUrl: any;
  sanitizer: DomSanitizer;
  parameters: any;
  selectedLocation: any;
  LocationName: any;
  CageName: any;
  timerSubscription: Subscription;
  defaultTimerInterval: number = 60000;
  selectedLocationID: number = 0;
  datePipe: DatePipe;
  selectedCageName: string = "";
  patientColor: string = "";
  listenFunc: Function;
  popuptext: string = "";
  isDataTransformed: boolean;
  bottomleft: any;
  topleft: any;
  position: any;
  reloadPageType = '';

  @ViewChild('tooltip') tooltip: any;

  constructor(private patientService: PatientService,
    sanitizer: DomSanitizer, private globalsService: GlobalsService,
    private config: AppConfig,
    private googleAnalyticsService: GoogleAnalyticsService,
    private errorHandler: GlobalErrorHandler,
    private renderer: Renderer2,
    private activatedRoute: ActivatedRoute) {
    this.sanitizer = sanitizer;
    this.datePipe = new DatePipe("en-US");
    if (this.config.getConfig("schedulerRefreshInterval")) {
      TimerService.getInstance().setTimeInterval(this.config.getConfig("schedulerRefreshInterval"));
    }
    else {
      TimerService.getInstance().setTimeInterval(this.defaultTimerInterval);
    }
    this.isDataTransformed = false;
    this.reloadPageType = this.config.getConfig("ReloadPageType");
  }


  ngOnInit() {
    this.imageUrl = "assets/images/Noimage_Unknow.png";
    try {
      if (this.globalsService.getParameters().accessToken === "") {
        const currentEnvironment: string = this.config.getEnv('env');
        this.globalsService.hostName = window.location.hostname;
        this.subscription = this.activatedRoute.queryParams.subscribe((params: Params) => {
          if (currentEnvironment === 'development') {
            this.globalsService.hostName = this.config.getConfig('API_Domain_Name');
            this.parameters = {
              accessToken: this.config.getConfig('accessToken'),
              patientId: this.config.getConfig('patientId'),
              hospitalId: this.config.getConfig('hospitalId'),
              orderId: this.config.getConfig('orderId'),
              userName: this.config.getConfig('userName'),
              userId: this.config.getConfig('userId'),
              startPage: this.config.getConfig('startPage')
            };
            this.globalsService.setToken(this.parameters);
            this.loadPatientDetails();
          }
          else {
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
              this.globalsService.setToken(this.parameters);
              this.loadPatientDetails();
            }
          }
        });
      }
      else {
        this.loadPatientDetails();
      }

    }
    catch (e) {
      this.handleError(e);
    }

    this.pageVisibilityChanges();
  }

  ngAfterViewInit() {
    this.timerSubscribe();
  }

  ngOnDestroy() {
    this.isDataTransformed = false;
    this.cageDetails = null;
    this.selectedLocation = null;
    this.cageDetails = null;
    this.patientColor = '';
    this.selectedCage = null;
    this.CageName = '';
    this.LocationName = '';
    this.selectedCageName = '';
    this.imageUrl = '';
    this.datePipe = null;


    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    this.timerUnSubscribe();
    this.listenFunc();

    if (this.locDetailsSubscription) {
      this.locationDetails = null;
      this.locDetailsSubscription.unsubscribe();
      this.locDetailsSubscription = null;
    }

    if (this.patDetailsSubscription) {
      this.patientDetails = null;
      this.patDetailsSubscription.unsubscribe();
      this.patDetailsSubscription = null;
    }

    if (this.locCageDetailsSubscription) {
      this.locCageDetailsSubscription.unsubscribe();
      this.locCageDetailsSubscription = null;
    }
  }

  loadPatientDetails() {
    this.getPatientAndLocationDetails();
    this.googleAnalyticsService.set_ApplicationLevl_GA_Dimensions();
  }

  pageVisibilityChanges() {

    this.listenFunc = this.renderer.listen(document, 'visibilitychange', () => {
      if (document.hidden) {
        this.timerUnSubscribe();
      } else {
        this.getPatientAndLocationDetails();
        this.timerSubscribe();
      }
    });
  }

  /***** Timer Changes - Start *****/
  timerSubscribe() {
    // TimerService.getInstance().setMessage("testing...");
    // TimerService.getInstance().getMessage();
    this.timerSubscription = TimerService.getInstance().timerInitiate$
      .subscribe(item => {
        const timerInitiate: boolean = item.valueOf();
        if (timerInitiate) {
          this.getPatientAndLocationDetails();
        }
      });
  }

  timerUnSubscribe() {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
  }

  /***** Timer Changes - End *****/
  private patDetailsSubscription: Subscription;
  private locDetailsSubscription: Subscription;
  private locCageDetailsSubscription: Subscription;

  getPatientAndLocationDetails() {
    if (this.grpTooltip) {
      this.grpTooltip.hide();
    }
    if (this.globalsService.getParameters().accessToken &&
      this.globalsService.getParameters().accessToken !== "") {
      const parameterInfo = this.globalsService.getParameters();

      const timeStart_0: number = performance.now();
      this.patDetailsSubscription = this.patientService.getPatientDetails(parameterInfo).subscribe(
        responseJson => {
          const timeEnd: number = performance.now();
          const responseTime: number = timeEnd - timeStart_0;
          this.send_GA_UserTimingData(this.config.getConfig('GA_Patients_CheckedInPatients_URL'), "GET", responseTime);
          responseJson = this.transformData(responseJson, this.globalsService, parameterInfo);
        },
        error => {
          this.errorMessage = <any>error;
        });

      const timeStart_1: number = performance.now();
      this.locDetailsSubscription = this.patientService.getLocations(parameterInfo).subscribe(
        responseJson => {
          const timeEnd: number = performance.now();
          const responseTime: number = timeEnd - timeStart_1;
          this.send_GA_UserTimingData(this.config.getConfig('GA_Hospitals_LocationsAndCages_URL'), "GET", responseTime);
          this.locationDetails = this.getLocationsData(responseJson);
        },
        error => {
          this.errorMessage = <any>error;
        });

      const timeStart_2: number = performance.now();
      this.locCageDetailsSubscription = this.patientService.getLocationCageForVisit(parameterInfo).subscribe(
        response => {
          const timeEnd: number = performance.now();
          const responseTime: number = timeEnd - timeStart_2;
          this.send_GA_UserTimingData(this.config.getConfig('GA_Orders_LocationsAndCages_URL'), "GET", responseTime);
          this.setSelectedLocationCage(response.Data);
        },
        error => {
          this.errorMessage = <any>error;
        }
      );

      this.imageUrl = this.patientService.getPhotoUrl(parameterInfo);
    }
  }

  private setSelectedLocationCage(data: any) {
    try {
      if (data !== null) {
        this.CageName = data.CageName;
        this.LocationName = data.LocationName;
        this.selectedLocation = {};
        this.selectedLocation.LocationName = data.LocationName;
        this.selectedLocation.LocationId = data.LocationId;
        this.selectedLocationID = this.selectedLocation.LocationId;
        if (data.CageName !== null && data.CageName !== "") {
          this.selectedCage = {};
          this.selectedCage.CageName = data.CageName;
          this.selectedCageName = this.selectedCage.CageName;
        }

      }
    }
    catch (e) {
      this.handleError(e);
    }
  }
  private transformData(responseJson: any | any, globalsService: GlobalsService, parameterInfo: any) {
    try {
      if (responseJson.Data !== null && responseJson.Data) {
        globalsService.checkedInDate = responseJson.Data[0].Visit.CheckinDate;
        globalsService.numberOfDays = responseJson.Data[0].Visit.NumberOfDays;

        this.patientDetails = responseJson.Data[0];
        if (this.patientDetails && this.patientDetails.Patient && this.patientDetails.Patient.HourlyTasks) {
          this.patientDetails.Patient.HourlyTasks = null;
        }
        if (this.patientDetails && this.patientDetails.Visit) {
          if (this.patientDetails.Visit.DepartmentIDs) {
            this.patientDetails.Visit.DepartmentIDs = null;
          }
          if (this.patientDetails.Visit.VisitInvoiceItems) {
            this.patientDetails.Visit.VisitInvoiceItems = null;
          }
          if (this.patientDetails.Visit.VisitTypeIDs) {
            this.patientDetails.Visit.VisitTypeIDs = null;
          }
        }
        if (this.imageUrl === null || this.imageUrl === undefined) {
          this.imageUrl = this.patientDetails !== undefined ?
            (this.patientDetails.Patient.SpeciesId === 1 ? "assets/images/Noimage_Dog.png" :
              (this.patientDetails.Patient.SpeciesId === 2 ? "assets/images/Noimage_Cat.png" :
                "assets/images/Noimage_Unknow.png"))
            : "assets/images/Noimage_Unknow.png";
        }
        this.patientDetails.Patient.DisplayInformation = "";
        return this.patientService.getSpeciesDisplayName(parameterInfo).subscribe(
          responseJson => this.patientDetails = this.transformPatientData(responseJson, this.globalsService, this.patientDetails.Patient.SpeciesId),
          error => this.errorMessage = <any>error);

      }

    }
    catch (e) {
      this.handleError(e);
    }
  }

  updateUrl(evt: any) {

    this.imageUrl = this.patientDetails !== undefined ?
      (this.patientDetails.Patient.SpeciesId === 1 ? "assets/images/Noimage_Dog.png" :
        (this.patientDetails.Patient.SpeciesId === 2 ? "assets/images/Noimage_Cat.png" :
          "assets/images/Noimage_Unknow.png"))
      : "assets/images/Noimage_Unknow.png";

  }

  private transformPatientData(responseJson: any | any, globalsService: GlobalsService, speciesId: number) {
    const resourceInfo = speciesId !== 0 ? responseJson.Data.find((x: any) => x.SpeciesId === speciesId) : undefined;
    const petNameLength = this.globalsService._isNotNullOrEmpty(this.patientDetails.Patient.PetName) ? this.patientDetails.Patient.PetName.length : 0;
    const clientNameLength = this.globalsService._isNotNullOrEmpty(this.patientDetails.Client.LastName) ? this.patientDetails.Client.LastName.length : 0;
    const length = petNameLength + clientNameLength;
    if (length > 24) {
      this.petNameTruncate = petNameLength > 12;
      this.clientNameTruncate = clientNameLength > 12;
    }
    this.isDataTransformed = true;

    if (resourceInfo) {
      this.patientDetails.Patient.SpeciesName = resourceInfo.SpeciesName;
    }
    this.patientDetails.Patient.DisplayInformation = "";
    if (this.patientDetails) {
      const patientInfo = this.patientDetails.Patient;
      // Adding Species Name to Display Info
      if (patientInfo.SpeciesName) {
        this.patientDetails.Patient.DisplayInformation += patientInfo.SpeciesName;
      }
      // Adding Breed to Display Info
      if (patientInfo.Breed) {
        this.patientDetails.Patient.DisplayInformation = this.appendInfo(this.patientDetails.Patient.DisplayInformation
          , patientInfo.Breed);
      }
      // Adding Color to Display Info
      if (patientInfo.Color) {
        this.patientDetails.Patient.DisplayInformation = this.appendInfo(this.patientDetails.Patient.DisplayInformation
          , patientInfo.Color);
        this.patientColor = patientInfo.Color;
      }
      // Adding Sex to Display Info
      if (patientInfo.Sex) {
        this.patientDetails.Patient.DisplayInformation = this.appendInfo(this.patientDetails.Patient.DisplayInformation
          , (this.globalsService._isNotNullOrEmpty(patientInfo.Sex) ?
            ((patientInfo.Sex === 1 ? 'Male' : (patientInfo.Sex === 2 ? 'Female' : ""))) : ""));
      }
      // Adding Age to Display Info
      if (patientInfo.DisplayAge) {
        this.patientDetails.Patient.DisplayInformation = this.appendInfo(this.patientDetails.Patient.DisplayInformation
          , patientInfo.DisplayAge);
      }
      // Adding Weight to Display Info
      if (patientInfo.Weight) {
        this.patientDetails.Patient.DisplayInformation = this.appendInfo(this.patientDetails.Patient.DisplayInformation
          , (this.globalsService._isNotNullOrEmpty(patientInfo.Weight) ?
            (patientInfo.Weight + ' kg ') : ""));
      }
      // Adding Weight Taken Date to Display Info
      if (patientInfo.WeightTakenDate) {
        this.patientDetails.Patient.DisplayInformation = this.appendInfo(this.patientDetails.Patient.DisplayInformation,
          (this.globalsService._isNotNullOrEmpty(patientInfo.WeightTakenDate) ?
            this.datePipe.transform(patientInfo.WeightTakenDate, 'dd-MMM-yyyy') : ""), " on ");
      }
    }
    return this.patientDetails;
  }

  private appendInfo(firstElement: any, secondElement: any, separator: string = ", ") {
    let returnString = "";
    if (this.globalsService._isNotNullOrEmpty(firstElement)) {
      returnString += firstElement;
    }
    returnString += (this.globalsService._isNotNullOrEmpty(returnString) && this.globalsService._isNotNullOrEmpty(secondElement))
      ? separator + secondElement
      : secondElement;
    return returnString;
  }

  private getLocationsData(responseJson: any | any) {
    try {
      responseJson.Data.sort((a: any, b: any) => {
        if (a.LocationName < b.LocationName) {
          return -1;
        } else if (a.LocationName > b.LocationName) {
          return 1;
        } else {
          return 0;
        }
      });
      responseJson.Data = responseJson.Data.filter((a: any) => {
        if (a.IsActive) {
          return a;
        }
      });
      if (this.selectedLocation && this.selectedLocation.LocationId) {
        this.selectedLocation.Cages = this.cageDetails = responseJson.Data ?
          responseJson.Data.filter((x: any) => this.selectedLocation.LocationId === x.LocationId)[0].Cages : [];
      }
      return responseJson.Data;
    }
    catch (e) {
      this.handleError(e);
    }
  }

  onLocationChange(selectedLocation: any) {
    try {
      if (selectedLocation !== undefined) {
        if (selectedLocation.Cages) {
          this.cageDetails = selectedLocation.Cages.sort(function (a: any, b: any) {
            if (a.CageName < b.CageName) {
              return -1;
            }
            if (a.CageName > b.CageName) {
              return 1;
            }
            return 0;
          });
        }
        this.selectedCage = undefined;

        let isUpdate = true;
        if (this.selectedLocationID > 0 && selectedLocation) {
          isUpdate = (this.selectedLocationID !== selectedLocation.LocationId);
        }

        this.selectedLocation = selectedLocation;
        if (isUpdate) {
          this.updateLocationCageDetails();
        }

      } else {
        this.selectedCage = undefined;
      }
    }
    catch (e) {
      this.handleError(e);
    }
  }

  onCageChange(selectedCage: any) {
    try {
      let isUpdate = true;
      if (this.selectedCageName !== "" && selectedCage) {
        isUpdate = (this.selectedCageName !== selectedCage.CageName);
      }
      this.selectedCage = selectedCage;
      if (selectedCage !== undefined && isUpdate) {
        this.updateLocationCageDetails();
      }
    }
    catch (e) {
      this.handleError(e);
    }
  }

  updateLocationCageDetails() {
    try {
      const details = {
        "VisitId": this.globalsService.getOrderId(),
        "CageId": this.selectedCage ? this.selectedCage.CageId : null,
        "CageTypeId": this.selectedCage ? this.selectedCage.CageTypeId : this.selectedLocation.LocationId,
        "UpdatedBy": this.globalsService.getUserName(),
        "UpdatedDate": this.globalsService.getCurrentDateTime()
      };

      const timeStart: number = performance.now();
      this.patientService.putLocationCage(details).subscribe(
        cage => {
          const timeEnd: number = performance.now();
          const responseTime: number = timeEnd - timeStart;
          this.send_GA_UserTimingData(this.config.getConfig('GA_Orders_LocationsAndCages_URL'), "PUT", responseTime);
        },
        error => {
          this.errorMessage = <any>error;
        },
        () => {
          this.googleAnalyticsService.eventTrack("UpdateLocation", this.config.getConfig("GA_Scheduler_URL"), "", 0);
          this.googleAnalyticsService.eventTrack("UpdateCage", this.config.getConfig("GA_Scheduler_URL"), "", 0);
        }
      );
    }
    catch (e) {
      this.handleError(e);
    }
  }

  send_GA_UserTimingData(variable: string, label: string, duration: number) {
    this.googleAnalyticsService.userTimingsTrack(this.config.getConfig("GA_UserTiming_Category"),
      variable, label, duration);
  }

  private handleError(error: Response | any) {
    this.errorHandler.exceptionHandling(false, error);
  }

  formattedWeightTakenDate(date: any) {
    if (!date) {
      return "";
    }
    const datePipe = new DatePipe("en-US");
    date = datePipe.transform(date, 'dd-MMM-yyyy');
    return date;
  }

  public openPopup(petNamePopup: IPopup, type: string) {
    if (this.petNameTruncate) {
      petNamePopup.open();
      if (type === "pet") {
        this.popuptext = this.patientDetails.Patient.PetName;
      }
    }
    if (this.clientNameTruncate) {
      petNamePopup.open();
      if (type === "client") {
        this.popuptext = this.patientDetails.Client.LastName;
      }
    }
  }

}
