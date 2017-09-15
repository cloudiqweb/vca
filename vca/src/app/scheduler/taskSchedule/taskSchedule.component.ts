import { Component, Inject, EventEmitter, Output, Input, ElementRef, OnChanges } from '@angular/core';
import { SchedulerService } from '.././scheduler.service';
import { DatePipe } from '@angular/common';
import { GlobalsService } from '../../globals.service';
import { GlobalErrorHandler } from '../../app.errorHandler';

@Component({
  selector: 'taskSchedule',
  templateUrl: './taskSchedule.component.html'
})
export class TaskScheduleComponent implements OnChanges {
  protected dataSvc: SchedulerService;
  errorMessage: string;
  @Input() showAppointments: boolean;
  @Input() taskSeriesId: number;
  @Input() taskSeriesOpenTime: Date;
  summaryInformation: string;
  private panels: Array<any>;
  private dataPanel: Array<any>;
  private accordOption: any;
  // private openSummaryAccord: boolean;
  isOnceDisabled: boolean;
  isOnceSelected: boolean;

  constructor( @Inject(SchedulerService) dataSvc: SchedulerService,
    private globalsService: GlobalsService, private errorHandler: GlobalErrorHandler) {
    this.dataSvc = dataSvc;
    if (!dataSvc.taskScheduleInfo) {
      dataSvc.taskScheduleInfo = {};
    }
    // this.isOnceSelected = false;
    this.accordOption = {
      "styled": false,
      "fluid": true,
      "inverted": false,
      "allowMultiple": false
    }
    // this.openSummaryAccord = true;
    this.panels = [
      {
        title: 'Schedule: ' + (this.globalsService._isNotNullOrEmpty(this.summaryInformation) ? this.summaryInformation : ''),
        content: `SummaryInfo`,
        active: 'true'
      }
    ];

    this.dataPanel = [
      {
        title: 'Data to collect ' + this.dataPanelText(),
        content: `Data`,
        active: 'false'
      }
    ];
  }




  ngOnChanges() {
    if (this.dataSvc.scheduleCollection) {
      this.isOnceSelected = false;
      this.dataSvc.taskScheduleInfo.StartDate = this.dataSvc.taskScheduleInfo.StartTime !== null ?
        this.dataSvc.taskScheduleInfo.StartTime.split('T')[0] : "";

      if (!this.dataSvc.taskScheduleInfo.EndsAtCheckout) {
        if (this.dataSvc.taskScheduleInfo.EndDate === null || this.dataSvc.taskScheduleInfo.EndDate === "") {
          this.dataSvc.taskScheduleInfo.EndDate = this.dataSvc.visitEndDate;
        }
      } else {
        this.dataSvc.taskScheduleInfo.EndDate = this.dataSvc.taskScheduleInfo.EndTime !== null
          ? this.dataSvc.taskScheduleInfo.EndTime.split('T')[0] : "";
      }

      if (this.globalsService.numberOfDays <= 7) {
        if (this.dataSvc.taskScheduleInfo.StartTime !== null) {
          this.dataSvc.taskScheduleInfo.StartDateValue = this.globalsService.visitDates.find((x: any) => x.date === this.dataSvc.taskScheduleInfo.StartTime.split('T')[0]);
        }
        if (this.dataSvc.taskScheduleInfo.EndTime !== null) {
          this.dataSvc.taskScheduleInfo.EndDateValue =
            this.globalsService.visitDates.find((x: any) => x.date === this.dataSvc.taskScheduleInfo.EndTime.split('T')[0]);
        } else if (!this.dataSvc.taskScheduleInfo.EndsAtCheckout) {
          this.dataSvc.taskScheduleInfo.EndDateValue = this.globalsService.visitDates[this.globalsService.visitDates.length - 1];
        }
      }
      let startTime = this.dataSvc.taskScheduleInfo.StartTime !== null
        ? this.dataSvc.taskScheduleInfo.StartTime.split('T')[1] : "";
      this.dataSvc.taskScheduleInfo.StartTimeInput = startTime !== "" ?
        (startTime.split(':')[0] + ':' + startTime.split(':')[1]) : "";
      this.dataSvc.taskScheduleInfo.EndDate = this.dataSvc.taskScheduleInfo.EndTime !== null
        ? this.dataSvc.taskScheduleInfo.EndTime.split('T')[0] : "";

      let endTime = this.dataSvc.taskScheduleInfo.EndTime !== null
        ? this.dataSvc.taskScheduleInfo.EndTime.split('T')[1] : "";
      this.dataSvc.taskScheduleInfo.EndTimeInput = endTime !== "" ?
        (endTime.split(':')[0] + ':' + endTime.split(':')[1]) : "";
      this.isOnceDisabled = (this.dataSvc.taskScheduleInfo.EndTime !== null ||
        this.dataSvc.taskScheduleInfo.EndsAtCheckout) ? true : false;
      // this.dataSvc.taskScheduleInfo.EndsAtCheckout === true ?
      //         this.dataSvc.taskScheduleInfo.EndsAtCheckout = true :
      //         (this.dataSvc.taskScheduleInfo.EndTime !== null ?
      //         (this.dataSvc.taskScheduleInfo.EndsOn = true) :
      //         (this.dataSvc.taskScheduleInfo.AfterCertainOccurrences = true));

      // this.dataSvc.taskScheduleInfo.EndsAtCheckout =
      //     (this.dataSvc.taskScheduleInfo.EndsAtCheckout === true) ? true :
      //         // changing the value to true as after certain occurences is removed
      //         (this.dataSvc.taskScheduleInfo.EndTime !== null ? 0 : true);

      //EndsAtCheckout option should be disabled, and not selected for billable tasks.
      if (this.dataSvc.taskScheduleInfo.TaskDefinition && this.dataSvc.taskScheduleInfo.TaskDefinition.BillingTypeId) {
        if (this.dataSvc.taskScheduleInfo.TaskDefinition.BillingTypeId === 1) {
          //this.dataSvc.taskScheduleInfo.EndsAtCheckout = (this.dataSvc.taskScheduleInfo.EndTime !== null ? 0 : true);
          this.dataSvc.taskScheduleInfo.EndsAtCheckout = (this.dataSvc.taskScheduleInfo.EndsAtCheckout === true) ? true : 0;
        }
        else {
          this.dataSvc.taskScheduleInfo.EndsAtCheckout = 0;
        }
      }
      else {
        // this.dataSvc.taskScheduleInfo.EndsAtCheckout =
        // (this.dataSvc.taskScheduleInfo.EndsAtCheckout === true) ? true :
        //     // changing the value to true as after certain occurences is removed
        //     (this.dataSvc.taskScheduleInfo.EndTime !== null ? 0 : true);
        this.dataSvc.taskScheduleInfo.EndsAtCheckout = (this.dataSvc.taskScheduleInfo.EndsAtCheckout === true) ? true : 0;
      }


      this.dataSvc.taskScheduleInfo.IntervalTimeUnit =
        (this.dataSvc.taskScheduleInfo.IntervalTimeUnit !== 'Minutes'
          && this.dataSvc.taskScheduleInfo.IntervalTimeUnit !== 'Hours')
          ? 'Hours' : this.dataSvc.taskScheduleInfo.IntervalTimeUnit;


      this.loadSummaryInformation();
      this.dataSvc.validationMessage = "";
      this.dataSvc.scheduleCollection = false;
    }
  }

  ngOnDestroy() {
    this.dataSvc.taskScheduleInfoCompare = null;
    this.dataSvc.validationMessage = "";
    this.dataSvc.scheduleCollection = false;
    this.dataSvc.taskScheduleInfo = {};
    this.dataSvc.isValidSeriesModal = false;
    this.dataSvc.taskScheduleInfoOnce = false;
    this.dataSvc.taskScheduleInfoChanged = false;
    this.dataSvc.taskScheduleOtherChange = false;
  }

  loadSummaryInformation(validatedItem: string = "", event: any = null) {
    try {
      if (event && validatedItem === 'startDate') {
        this.dataSvc.taskScheduleInfo.StartDateValue = event;
      }
      if (event && validatedItem === 'endDate') {
        this.dataSvc.taskScheduleInfo.EndDateValue = event;
      }
      if (event && validatedItem === 'startTime') {
        this.dataSvc.taskScheduleInfo.StartTimeInput = event.value;
      }
      if (event && validatedItem === 'endTime') {
        this.dataSvc.taskScheduleInfo.EndTimeInput = event.value;
      }

      if (this.globalsService.numberOfDays <= 7) {
        this.dataSvc.taskScheduleInfo.EndDate = this.dataSvc.taskScheduleInfo.EndDateValue ? this.dataSvc.taskScheduleInfo.EndDateValue.date : "";
        this.dataSvc.taskScheduleInfo.StartDate = this.dataSvc.taskScheduleInfo.StartDateValue ? this.dataSvc.taskScheduleInfo.StartDateValue.date : "";
      }
      this.dataSvc.validationMessage = "";

      let StartTimeBeforeFormat = this.dataSvc.taskScheduleInfo.StartTimeInput;
      let endTimeBeforeFormat = this.dataSvc.taskScheduleInfo.EndTimeInput;

      this.dataSvc.taskScheduleInfo.EndTimeInput = this.dataSvc.formatTime(this.dataSvc.taskScheduleInfo.EndTimeInput);
      this.dataSvc.taskScheduleInfo.StartTimeInput = this.dataSvc.formatTime(this.dataSvc.taskScheduleInfo.StartTimeInput);

      if ((validatedItem == 'startTime' && this.dataSvc.taskScheduleInfo.StartTimeInput === "" && StartTimeBeforeFormat !== "") ||
        (validatedItem == 'endTime' && this.dataSvc.taskScheduleInfo.EndTimeInput === "" && endTimeBeforeFormat !== "")) {
        this.dataSvc.validationMessage = "Please provide a valid time";
        this.dataSvc.isValidSeriesModal = false;
      }
      let datePipe = new DatePipe("en-US");

      if (validatedItem === "" ||
        (this.dataSvc.validationMessage === "" && (validatedItem === 'endTime' || validatedItem === 'startTime')) ||
        (validatedItem === 'startDate' && this.dataSvc.IsDateInVisit(this.dataSvc.taskScheduleInfo.StartDate)) ||
        (validatedItem === 'endDate' && this.dataSvc.IsDateInVisit(this.dataSvc.taskScheduleInfo.EndDate))) {
        if (this.globalsService._isNotNullOrEmpty(this.dataSvc.taskScheduleInfo.StartTimeInput) && this.globalsService._isNotNullOrEmpty(this.dataSvc.taskScheduleInfo.StartDate)
          && this.globalsService._isNotNullOrEmpty(this.dataSvc.taskScheduleInfo.Interval) && this.globalsService._isNotNullOrEmpty(this.dataSvc.taskScheduleInfo.IntervalTimeUnit)
          && (
            (this.globalsService._isNotNullOrEmpty(this.dataSvc.taskScheduleInfo.EndDate) && this.globalsService._isNotNullOrEmpty(this.dataSvc.taskScheduleInfo.EndTimeInput))
            || this.dataSvc.taskScheduleInfo.EndsAtCheckout)) {
          this.summaryInformation = "Starts at " + this.dataSvc.taskScheduleInfo.StartTimeInput + " on " + datePipe.transform(this.dataSvc.taskScheduleInfo.StartDate, 'dd-MMM-yyyy')
            + " repeating every " + this.dataSvc.taskScheduleInfo.Interval + " " + this.dataSvc.taskScheduleInfo.IntervalTimeUnit.toLowerCase() +
            (this.dataSvc.taskScheduleInfo.EndsAtCheckout ? " , until checkout." :
              this.dataSvc.taskScheduleInfo.EndsAtCheckout === false ? ""
                : ", at " + this.dataSvc.taskScheduleInfo.EndTimeInput + " on " + datePipe.transform(this.dataSvc.taskScheduleInfo.EndDate, 'dd-MMM-yyyy'));
          this.panels[0].title = 'Schedule: ' + (this.globalsService._isNotNullOrEmpty(this.summaryInformation) ? this.summaryInformation : '');
        } else {
          this.summaryInformation = "";
        }

        this.dataSvc.taskScheduleInfoOnce = this.isOnceSelected;
        if (this.dataSvc.taskScheduleInfoCompare === null) {
          // this.dataSvc.taskScheduleInfoCompare = Object.assign({}, this.dataSvc.taskScheduleInfo);
          this.dataSvc.taskScheduleInfoCompare = JSON.parse(JSON.stringify(this.dataSvc.taskScheduleInfo));
        }

        this.compareTaskSheduleInfoMetaData();
        this.validateInputs();
      } else if (validatedItem !== "endTime" && validatedItem !== "startTime") {
        this.dataSvc.validationMessage = "Please provide a Valid Date";
        this.dataSvc.isValidSeriesModal = false;
      }
    }
    catch (e) {
      this.handleError(e);
    }

  }

  validateInputs() {

    this.dataSvc.isValidSeriesModal = true;
    if (this.dataSvc.taskScheduleInfo) {
      if (this.dataSvc.taskScheduleInfoChanged) {
        if (this.isOnceSelected) {
          this.dataSvc.isValidSeriesModal = this.globalsService._isNotNullOrEmpty(this.dataSvc.taskScheduleInfo.StartDate) && this.globalsService._isNotNullOrEmpty(this.dataSvc.taskScheduleInfo.StartTimeInput);
        }
        else {
          this.dataSvc.isValidSeriesModal = this.globalsService._isNotNullOrEmpty(this.dataSvc.taskScheduleInfo.StartDate) && this.globalsService._isNotNullOrEmpty(this.dataSvc.taskScheduleInfo.StartTimeInput);
          this.dataSvc.isValidSeriesModal = this.dataSvc.isValidSeriesModal && this.globalsService._isNotNullOrEmpty(this.dataSvc.taskScheduleInfo.Interval);
          if (this.dataSvc.taskScheduleInfo.EndsAtCheckout === 0) {
            this.dataSvc.isValidSeriesModal = this.dataSvc.isValidSeriesModal && this.globalsService._isNotNullOrEmpty(this.dataSvc.taskScheduleInfo.EndDate)
              && this.globalsService._isNotNullOrEmpty(this.dataSvc.taskScheduleInfo.EndTimeInput);
          }
          else if (this.dataSvc.taskScheduleInfo.EndsAtCheckout) {
            this.dataSvc.isValidSeriesModal = this.dataSvc.isValidSeriesModal;
          }
        }
      }

    }
  }

  setRepeatType(type: any) {
    this.dataSvc.taskScheduleInfo.IntervalTimeUnit = type;
    this.loadSummaryInformation();
  }



  private compareTaskSheduleInfoMetaData() {

    try {
      let orgTaskScheduleInfoCompare: any = this.dataSvc.taskScheduleInfoCompare;
      let changedTaskScheduleInfoCompare: any = this.dataSvc.taskScheduleInfo;


      this.dataSvc.taskScheduleOtherChange = false;
      let isChangedAttributes: boolean = false;

      if (!this.dataSvc.taskScheduleInfoOnce) {
        isChangedAttributes = (orgTaskScheduleInfoCompare.StartDate !== changedTaskScheduleInfoCompare.StartDate);
        if (!isChangedAttributes) {
          isChangedAttributes = (orgTaskScheduleInfoCompare.StartTimeInput !== changedTaskScheduleInfoCompare.StartTimeInput);
        }

        if (!isChangedAttributes) {
          isChangedAttributes = (orgTaskScheduleInfoCompare.Interval != changedTaskScheduleInfoCompare.Interval);
        }
        if (!isChangedAttributes) {
          isChangedAttributes = (orgTaskScheduleInfoCompare.IntervalTimeUnit !== changedTaskScheduleInfoCompare.IntervalTimeUnit);
        }
        if (!isChangedAttributes) {
          isChangedAttributes = (orgTaskScheduleInfoCompare.EndsAtCheckout != changedTaskScheduleInfoCompare.EndsAtCheckout);
          if (!isChangedAttributes) {
            if (!changedTaskScheduleInfoCompare.EndsAtCheckout) {
              isChangedAttributes = (orgTaskScheduleInfoCompare.EndDate !== changedTaskScheduleInfoCompare.EndDate);
              if (!isChangedAttributes) {
                isChangedAttributes = (orgTaskScheduleInfoCompare.EndTimeInput !== changedTaskScheduleInfoCompare.EndTimeInput);
              }
            }
          }
        }
      }
      else {
        isChangedAttributes = true;
      }
      this.dataSvc.taskScheduleInfoChanged = isChangedAttributes;
      if (this.dataSvc.taskScheduleInfoChanged) {
        this.dataSvc.taskScheduleOtherChange = true;
      }
      else {

        if (orgTaskScheduleInfoCompare.Instructions === null && changedTaskScheduleInfoCompare.Instructions === '') {
          this.dataSvc.taskScheduleOtherChange = false;
        }
        else if (!this.dataSvc.taskScheduleOtherChange) {
          this.dataSvc.taskScheduleOtherChange = (orgTaskScheduleInfoCompare.Instructions !== changedTaskScheduleInfoCompare.Instructions);
        }

        if (!this.dataSvc.taskScheduleOtherChange) {
          this.dataSvc.taskScheduleOtherChange = (orgTaskScheduleInfoCompare.IsTimeSensitive !== changedTaskScheduleInfoCompare.IsTimeSensitive);
        }


        if (!this.dataSvc.taskScheduleOtherChange) {
          if (orgTaskScheduleInfoCompare.TaskSeriesObservations && orgTaskScheduleInfoCompare.TaskSeriesObservations.length > 0) {
            for (let i = 0; i < orgTaskScheduleInfoCompare.TaskSeriesObservations.length; i++) {
              if (!this.dataSvc.taskScheduleOtherChange) {
                this.dataSvc.taskScheduleOtherChange = (orgTaskScheduleInfoCompare.TaskSeriesObservations[i].IsVisible !== changedTaskScheduleInfoCompare.TaskSeriesObservations[i].IsVisible);
              }
              if (orgTaskScheduleInfoCompare.TaskSeriesObservations[i].NotifyText === null && changedTaskScheduleInfoCompare.TaskSeriesObservations[i].NotifyText === '') {
                this.dataSvc.taskScheduleOtherChange = false;
              }
              else if (!this.dataSvc.taskScheduleOtherChange) {
                this.dataSvc.taskScheduleOtherChange = (orgTaskScheduleInfoCompare.TaskSeriesObservations[i].NotifyText !== changedTaskScheduleInfoCompare.TaskSeriesObservations[i].NotifyText);
              }
              if (this.dataSvc.taskScheduleOtherChange) {
                break;
              }
            }
          }
        }

      }

      return isChangedAttributes;
    }
    catch (e) {
      this.handleError(e);
    }
  }


  refreshDataPanel() {
    this.dataPanel[0].title = 'Data to collect ' + this.dataPanelText();
    this.loadSummaryInformation();
  }

  dataPanelText() {
    let selectedCount = 0;
    if (this.dataSvc.taskScheduleInfo.TaskSeriesObservations) {
      this.dataSvc.taskScheduleInfo.TaskSeriesObservations.forEach((element: any) => {
        if (element.IsVisible === true) {
          selectedCount++;
        }
      });
      return "(" + selectedCount + "/" + this.dataSvc.taskScheduleInfo.TaskSeriesObservations.length + " selected) ";
    }
    else {
      return "(" + selectedCount + "/0" + " selected) ";
    }
  }



  private handleError(error: Response | any) {
    this.errorHandler.exceptionHandling(false, error);
  }

  validateNumber(event: any) {
    const pattern = /[0-9]+/;
    let inputChar = String.fromCharCode(event.charCode);
    if (!pattern.test(inputChar)) {
      // invalid number, prevent input
      event.preventDefault();
    }
  }
}
