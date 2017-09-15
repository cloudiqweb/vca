import { Component, Inject, EventEmitter, Output, Input, ViewChild, ElementRef } from '@angular/core';
import { SchedulerService } from '.././scheduler.service';
import { DatePipe } from '@angular/common';
import * as wjcCore from 'wijmo/wijmo';
import { GlobalsService } from '../../globals.service';
import { AppConfig } from '../../app.config';
import { GoogleAnalyticsService } from '../../shared/googleAnalytics.service';
import { GlobalErrorHandler } from '../../app.errorHandler';
import { IPopup } from "ng2-semantic-ui";

@Component({
  selector: 'taskOccurance',
  templateUrl: './taskOccurance.component.html'
})
export class TaskOccuranceComponent {
  errorMessage: string;
  @Input() taskOccuranceOpenTime: Date;
  @Input() instructions: any;
  @Input() occurances: any[];
  customPattern: any;
  private datePipe: DatePipe;
  isQtyMatch: boolean;
  public medicineName: string;
  public specifiedUnit: string;
  dataSvc: SchedulerService;
  globalsService: GlobalsService;
  firstStausChange: boolean;
  @ViewChild('confirmqty') el: ElementRef;
  popuptext = '';
  popupTextNotify = '';



  constructor(dataSvc: SchedulerService, glService: GlobalsService,
    private config: AppConfig, private googleAnalyticsService: GoogleAnalyticsService,
    private errorHandler: GlobalErrorHandler) {
    this.globalsService = glService;
    this.dataSvc = dataSvc;
    this.dataSvc.occurrenceValidationMessage = "";
    this.dataSvc.selectedOccurrence = {};
    this.datePipe = new DatePipe("en-US");
    if (this.dataSvc.initialStatusValue === 126) {
      this.firstStausChange = false;
    }
    else {
      this.firstStausChange = true;
    }

  }

  ngOnChanges() {
    if (this.dataSvc.isPatientFinding) {
      this.loadPatientFindings(0);
      this.dataSvc.loadStatusData();
      this.dataSvc.occurrenceValidationMessage = "";
      this.dataSvc.isPatientFinding = false;
      this.validateInputs();
    }
  }

  ngOnDestroy() {
    this.dataSvc.occurrenceValidationMessage = "";
    this.dataSvc.buttonFlag = true;
    this.dataSvc.isPatientFinding = false;
    this.dataSvc.isValidOccurrenceModal = false;
    this.dataSvc.scheduledTime = undefined;
    this.dataSvc.scheduledDate = undefined;
    this.dataSvc.taskScheduleInfo = {};
    this.dataSvc.statusSetDate = undefined;
    this.dataSvc.statusSetDateValue = undefined;
    this.dataSvc.statusSetTime = undefined;
    this.dataSvc.taskSeriesName = undefined;
    this.dataSvc.selectedOccurrence = {};
    this.dataSvc.statusValue = undefined;
    this.dataSvc.mappedOccurance = {};
    this.dataSvc.comment = "";
    this.dataSvc.taskOccurances = [];
    this.dataSvc.specifiedQty = undefined;
    this.dataSvc.confirmQty = undefined;
    this.firstStausChange = false;
    this.dataSvc.createdBy = '';
    this.dataSvc.createdTime = '';
    this.dataSvc.modifiedBy = '';
    this.dataSvc.modifiedTime = '';
    this.dataSvc.statusTooltip = '';

  }



  validateInputs(dateInput: string = "", dateValue: string = "") {
    if (dateValue !== "" && dateInput === "statusSetDate") {
      this.dataSvc.statusSetDateValue = dateValue;
    }
    if (dateValue !== "" && dateInput === "scheduledDate") {
      this.dataSvc.scheduledDateValue = dateValue;
    }

    this.dataSvc.occurrenceValidationMessage = "";

    if (this.isQtyMatch) {
      if (this.dataSvc.statusValue === 126 && this.dataSvc.confirmQty !== this.dataSvc.specifiedQty && this.dataSvc.initialStatusValue !== 126) {
        this.dataSvc.occurrenceValidationMessage = "The entered quantity must match the order item quantity to complete the task.";
      }
    }
    if (dateInput === "scheduledTime") {
      this.dataSvc.scheduledTime = this.dataSvc.formatTime(this.dataSvc.scheduledTime);
      if (this.dataSvc.scheduledTime === "") {
        this.dataSvc.occurrenceValidationMessage = "Please provide Valid Time";
      }
    }
    if (dateInput === "statusSetTime") {
      this.dataSvc.statusSetTime = this.dataSvc.formatTime(this.dataSvc.statusSetTime);
      if (this.dataSvc.statusSetTime === "") {
        this.dataSvc.occurrenceValidationMessage = "Please provide Valid Time";
      }
    }
    if (this.globalsService.numberOfDays <= 7) {
      this.dataSvc.scheduledDate = this.dataSvc.scheduledDateValue ? this.dataSvc.scheduledDateValue.date : "";
      this.dataSvc.statusSetDate = this.dataSvc.statusSetDateValue ? this.dataSvc.statusSetDateValue.date : "";
    }
    if (dateInput !== "statusSetTime" && dateInput !== "statusSetDateValue" && dateInput !== "statusSetDate") {
      if (dateInput === "" || dateInput === "scheduledTime"
        || dateInput === "scheduledDate" && this.dataSvc.IsDateInVisit(this.dataSvc.scheduledDate)) {
        this.dataSvc.isValidOccurrenceModal = (this._isNotNullOrEmpty(this.dataSvc.scheduledDate) &&
          this._isNotNullOrEmpty(this.dataSvc.scheduledTime)) || (!this._isNotNullOrEmpty(this.dataSvc.scheduledDate) &&
            !this._isNotNullOrEmpty(this.dataSvc.scheduledTime));
        if (this.dataSvc.taskScheduleInfo && this.dataSvc.taskScheduleInfo.QtyMustMatch) {
          this.dataSvc.isValidOccurrenceModal = this.dataSvc.isValidOccurrenceModal && this.dataSvc.taskScheduleInfo.QtyMustMatch;
        }
      } else {
        this.dataSvc.occurrenceValidationMessage = "Please provide Valid Date";
      }
    }
  }

  loadPatientFindings(occurrenceId: any) {
    try {
      if (occurrenceId === 0 && this.occurances) {
        for (let i = 0; i < this.occurances.length; i++) {
          this.occurances[i].DisplayName = "";
          if (this.occurances[i].Name) {
            this.occurances[i].DisplayName = this.occurances[i].DisplayName + this.occurances[i].Name;
          } else {
            this.occurances[i].DisplayName = this.dataSvc.taskSeriesName;
          }
          if (this.occurances[i].ScheduledDateTime) {
            let startTime = this.occurances[i].ScheduledDateTime.split('T')[1];
            startTime = startTime === "" ? "" : startTime.split(':', 2).join(':');
            this.occurances[i].DisplayName = this.occurances[i].DisplayName + "-" + startTime;
          }
          else if (this.occurances[i].StatusSetDate) {
            let startTime = this.occurances[i].StatusSetDate.split('T')[1];
            startTime = startTime === "" ? "" : startTime.split(':', 2).join(':');
            this.occurances[i].DisplayName = this.occurances[i].DisplayName + "-" + startTime;
          }
        }

        if (this.occurances.length > 0) {
          this.dataSvc.selectedOccurrence = this.occurances[0];
          occurrenceId = this.occurances[0].TaskOccurrenceId;
        }
      }
      this.dataSvc.scheduledDate = undefined;
      this.dataSvc.scheduledTime = undefined;
      if (this.dataSvc.statusValue === -2) {
        let startTime = new Date();
        this.dataSvc.scheduledDate = this.datePipe.transform(startTime, 'yyyy-MM-dd');
        this.dataSvc.scheduledTime = this.datePipe.transform(new Date(), 'HH:mm');
      }
      if (occurrenceId && occurrenceId !== 0) {
        let timeStart: number = performance.now();
        this.dataSvc.getTaskOccuranceInfo(this.globalsService.getParameters(), occurrenceId.toString())
          .subscribe(
          mappedOccurance => {
            let timeEnd: number = performance.now();
            let responseTime: number = timeEnd - timeStart;
            this.send_GA_UserTimingData(this.config.getConfig('GA_TaskOccurance_URL'), "GET", responseTime);
            this.configureTaskOccuranceCollectionView(mappedOccurance);
          },
          error => this.errorMessage = <any>error
          );
      }
    }
    catch (e) {
      this.handleError(e);
    }
  }

  loadWhoAdded(mappedOccurance: any) {
    this.dataSvc.createdBy = this.globalsService.nameFormat(mappedOccurance.CreatedBy);
    this.dataSvc.createdTime = mappedOccurance.CreatedDate.toString().split('T')[1].substr(0, 5) + " (" + this.globalsService.groupDate(mappedOccurance.CreatedDate, 'Observation').split(" ")[1] + ")";
    if (mappedOccurance.LastModifiedBy !== null && mappedOccurance.LastModifiedBy !== '') {
      this.dataSvc.modifiedBy = this.globalsService.nameFormat(mappedOccurance.LastModifiedBy);
      this.dataSvc.modifiedTime = mappedOccurance.LastModifiedDate.toString().split('T')[1].substr(0, 5) + " (" + this.globalsService.groupDate(mappedOccurance.LastModifiedDate, 'Observation').split(" ")[1] + ")";
    }
    this.dataSvc.statusSetByTooltip = this.globalsService.nameFormat(mappedOccurance.StatusSetBy);
    this.dataSvc.statusSetTimeTooltip = mappedOccurance.StatusSetDate.toString().split('T')[1].substr(0, 5) + " (" + this.globalsService.groupDate(mappedOccurance.StatusSetDate, 'Observation').split(" ")[1] + ")";
    if (mappedOccurance.Status !== "Unscheduled") {
      this.dataSvc.statusTooltip = this.dataSvc.getStatusObjectByName(mappedOccurance.Status).DisplayName;
    }
  }

  private configureTaskOccuranceCollectionView(mappedOccurance: any) {
    try {
      this.loadWhoAdded(mappedOccurance.Data);
      this.dataSvc.mappedOccurance = mappedOccurance.Data;
      if (this.dataSvc.mappedOccurance !== null && this.dataSvc.mappedOccurance !== undefined) {
        this.dataSvc.initialComment=this.dataSvc.comment = this.dataSvc.mappedOccurance.Comment;
        if (this.dataSvc.mappedOccurance.ScheduledTime && this.dataSvc.mappedOccurance.ScheduledTime.indexOf('T') > 0) {
          this.dataSvc.scheduledDate = this.dataSvc.mappedOccurance.ScheduledTime.split('T')[0];
          let startTime = this.dataSvc.mappedOccurance.ScheduledTime.split('T')[1];
          this.dataSvc.scheduledTime = startTime === "" ? "" :
            startTime.split(':', 2).join(':');
          if (this.globalsService.numberOfDays <= 7) {
            this.dataSvc.scheduledDateValue = this.globalsService.visitDates.find((x: any) => x.date === this.dataSvc.scheduledDate);
          }
        }
        this.dataSvc.statusValue = this.dataSvc.mappedOccurance.StatusId === 125 ?
          ((this.dataSvc.statusValue === -1 || this.dataSvc.statusValue === -2) ? 124 : this.dataSvc.statusValue)
          : this.dataSvc.statusValue === 127 ? this.dataSvc.statusValue : this.dataSvc.mappedOccurance.StatusId;
        //Populate completed time info
        if (this.dataSvc.mappedOccurance.StatusId === 126) {
          if (this.dataSvc.mappedOccurance.StatusSetDate && this.dataSvc.mappedOccurance.StatusSetDate.indexOf('T') > 0) {
            this.dataSvc.statusSetDate = this.dataSvc.mappedOccurance.StatusSetDate.split('T')[0];
            let statusTime = this.dataSvc.mappedOccurance.StatusSetDate.split('T')[1];
            this.dataSvc.statusSetTime = statusTime === "" ? "" :
              statusTime.split(':', 2).join(':');
            if (this.globalsService.numberOfDays <= 7) {
              this.dataSvc.statusSetDateValue = this.globalsService.visitDates.find((x: any) => x.date === this.dataSvc.statusSetDate);
            }
          }
        }
        if (this.dataSvc.taskOccurances !== null) {
          for (let i = 0; i < this.dataSvc.taskOccurances.length; i++) {
            let occurance = this.dataSvc.taskOccurances[i];
            // this.dataSvc.taskOccurances[i]["selectedAnswerItem"] = {};
            occurance["selectedAnswerItem"] = null;
            this.customPattern = this.dataSvc.taskOccurances[i].Scale === "Integer" ? "/[^0-9]/g" :
              (this.dataSvc.taskOccurances[i].Scale === "Float" ? "/^[0-9]+(\.[0-9]{1,2})?$/" : "/^[a-zA-Z0-9.!@?#$%&:';()*\+,\/;\-=[\\\]\^_{|}<>~` ]+$/")
            if (this.dataSvc.mappedOccurance.PatientTaskFindings !== null) {
              let findings = this.dataSvc.mappedOccurance.PatientTaskFindings.find((t: any) => t.ObservationId == occurance.ObservationId);
              if (findings !== null && findings !== undefined && occurance.ObservationId === findings.ObservationId) {
                occurance.CommentsValue = findings.Comment;
                occurance.DisplayUnitId = findings.EnteredUnitId;
                occurance.SelectedDropdownValue = occurance.SelectedValue = (occurance.LOINCScale !== 'narrative') ?
                  findings.EnteredValue :
                  findings.RichTextValue;
                if (occurance.AnswerGroup && occurance.AnswerGroup.OrdinalAnswerItems) {
                  let selectedDDObject = this.getSelectedObjectForDropDown(occurance.AnswerGroup.OrdinalAnswerItems, occurance.SelectedDropdownValue);
                  occurance["selectedAnswerItem"] = selectedDDObject;
                  this.dataSvc.taskOccurances[i]["selectedAnswerItem"] = selectedDDObject;
                }

              } else {
                occurance.CommentsValue = "";
                occurance.DisplayUnitId = 0;
                occurance.SelectedDropdownValue = occurance.SelectedValue = undefined;
              }
            } else {
              occurance.CommentsValue = "";
              occurance.DisplayUnitId = 0;
              occurance.SelectedDropdownValue = occurance.SelectedValue = undefined;
            }
          }
        } else {
          this.customPattern = "";
        }
      }
      if (this.dataSvc.taskSeriesId) {
        let timeStart: number = performance.now();
        this.dataSvc.getScheduleInformation(this.globalsService.getParameters(), this.dataSvc.taskSeriesId)
          .subscribe(
          taskScheduleInfo => {
            let timeEnd: number = performance.now();
            let responseTime: number = timeEnd - timeStart;
            this.send_GA_UserTimingData(this.config.getConfig('GA_TaskSeries_URL'), "GET", responseTime);
            this.configureVerifyQuantityInformation(taskScheduleInfo.Data);
          },
          error => this.errorMessage = <any>error
          );
      }

      this.validateInputs();
    }
    catch (e) {
      this.handleError(e);
    }
  }

  private configureVerifyQuantityInformation(taskSeriesInfo: any) {
    try {
      this.dataSvc.taskScheduleInfo = taskSeriesInfo;
      this.medicineName = "";
      this.dataSvc.specifiedQty = 0;
      this.dataSvc.confirmQty = null;
      let visitInvoiceInfo = this.dataSvc.taskScheduleInfo.VisitInvoiceItemDetails;
      if (this.dataSvc.taskScheduleInfo.QtyMustMatch &&
        visitInvoiceInfo !== null && visitInvoiceInfo !== 0) {
        this.isQtyMatch = true;
        for (let i = 0; i < visitInvoiceInfo.length; i++) {
          if (visitInvoiceInfo[i].VisitInvoiceItemId === this.dataSvc.mappedOccurance.VisitInvoiceItemId) {
            this.medicineName = visitInvoiceInfo[i].Name;
            this.dataSvc.specifiedQty = visitInvoiceInfo[i].Qty;
            this.dataSvc.confirmQty = null;
            this.specifiedUnit = visitInvoiceInfo[i].Unit;
          }
        }
      } else {
        this.isQtyMatch = false;
      }
      this.setReadytoComplete();
      this.validateInputs();
    }
    catch (e) {
      this.handleError(e);
    }
  }

  getSelectedObjectForDropDown(sourceData: Array<any>, selectedValue: number) {
    if (sourceData) {
      const filterObj = sourceData.filter(x => x.Value === selectedValue);
      if (filterObj && filterObj.length > 0) {
        return filterObj[0];
      }
    }
    return null;
  }




  setReadytoComplete() {
    if (this.dataSvc.statusValue) {
      let statusFlag = this.dataSvc.readyToComplete = this.dataSvc.statusValue === 124 || this.dataSvc.statusValue === 126;
      if (this.isQtyMatch) {
        this.dataSvc.readyToComplete = statusFlag && (this.dataSvc.specifiedQty === this.dataSvc.confirmQty);
        this.dataSvc.readyToSave = this.dataSvc.statusValue !== 126 || (this.dataSvc.specifiedQty === this.dataSvc.confirmQty);
        if (this.dataSvc.initialStatusValue === 126) {
          this.dataSvc.readyToComplete = true;
          this.dataSvc.readyToSave = true;
        }
      } else {
        this.dataSvc.readyToComplete = statusFlag;
        this.dataSvc.readyToSave = true;
      }
    }
  }

  public getOrdinalReferenceRange(ordinalAnswerItem: any[], length: number) {
    let referredValues = "";
    if (ordinalAnswerItem) {
      ordinalAnswerItem.forEach(x => { referredValues += referredValues.length === 0 ? "Ref: " + x.Value : ", " + x.Value });
    }
    return length === 0 || referredValues.length < length ? referredValues : referredValues.substring(0, length - 1) + "...";
  }

  public getReferenceRange(low: any, high: any, length: number) {
    let referredValues = "";
    if (low || high) {
      referredValues = "Ref: " + (low ? low : "any") + " - " + (high ? high : "any")
    }
    return length === 0 || referredValues.length < length ? referredValues : referredValues.substring(0, length - 1) + "...";
  }

  _keyPress(event: any, occurance: any) {
    const pattern = occurance.Scale === "Integer" ? /[0-9]+/ :
      (occurance.Scale.includes('Float') !== -1 ? /^\d*\.?\d{0,2}$/ : /^[a-zA-Z0-9.!@?#$%&:';()*\+,\/;\-=[\\\]\^_{|}<>~` ]+$/);
    let inputChar = String.fromCharCode(event.charCode);
    if (!pattern.test(inputChar)) {
      // invalid character, prevent input
      event.preventDefault();
    }
  }

  _paste(event: any, occurance: any) {
    const pattern = occurance.Scale === "Integer" ? /^[0-9]+$/ :
      (occurance.Scale.includes('Float') !== -1 ? /^\d*\.?\d{0,2}$/ : /^[a-zA-Z0-9.!@?#$%&:';()*\+,\/;\-=[\\\]\^_{|}<>~` ]+$/);
    let inputChar = event.clipboardData.getData('text/plain');
    inputChar = inputChar.trim();

    //console.log('inputChar' + inputChar);
    if (!pattern.test(inputChar)) {
      occurance.SelectedValue = "";
      // invalid character, prevent input
      event.preventDefault();
    }
  }


  _keyPressByType(event: any, dataType: any, value: any) {
    const pattern = dataType === "Integer" ? /[0-9]+/ :
      (dataType === 'Float' ? /^\d*\.?\d{0,2}$/ : /^[a-zA-Z0-9.!@?#$%&:';()*\+,\/;\-=[\\\]\^_{|}<>~` ]+$/);
    let inputChar = String.fromCharCode(event.charCode);
    if (!pattern.test(inputChar)) {
      // invalid character, prevent input
      event.preventDefault();
    }
  }

  _pasteByType(event: any, dataType: any, value: any) {
    const pattern = dataType === "Integer" ? /^[0-9]+$/ :
      (dataType === 'Float' ? /^\d*\.?\d{0,2}$/ : /^[a-zA-Z0-9.!@?#$%&:';()*\+,\/;\-=[\\\]\^_{|}<>~` ]+$/);
    let inputChar = event.clipboardData.getData('text/plain');
    inputChar = inputChar.trim();

    //console.log('inputChar' + inputChar);
    if (!pattern.test(inputChar)) {
      value = '';
      //event.srcElement.value = '';
      // invalid character, prevent input
      event.preventDefault();
    }
  }

  setFixedPrecisionDecimal(occurance: any, selectedValue: any, index: number) {
    if (occurance && occurance.Scale && occurance.Scale.includes('Float') !== -1 && selectedValue && selectedValue !== '') {
      let fixedPrecisionValue = occurance.Scale.match(/\d+/);
      if (!fixedPrecisionValue) {
        return selectedValue;
      }
      let fixedPrecision = fixedPrecisionValue[0];
      return this.dataSvc.taskOccurances[index].SelectedValue = parseFloat(selectedValue).toFixed(fixedPrecision);
    } else {
      return selectedValue;
    }
  }

  _isNotNullOrEmpty(inputToValidate: any) {
    return inputToValidate !== null && inputToValidate !== "" && inputToValidate !== undefined;
  }

  send_GA_UserTimingData(variable: string, label: string, duration: number) {
    //this.googleAnalyticsService.set_ApplicationLevl_GA_Dimensions();
    this.googleAnalyticsService.userTimingsTrack(this.config.getConfig("GA_UserTiming_Category"),
      variable, label, duration);
  }

  private handleError(error: Response | any) {
    this.errorHandler.exceptionHandling(false, error);
  }

  testing() {
  }
  // this.el.nativeElement.disabled
  statusChange(e: Event) {
    this.firstStausChange = true;
  }

  public openPopup(Popup: IPopup, type: string, message: string) {
    if (type === "ref" && message.length > 20) {
      this.popuptext = message;
      Popup.open();
    }
    if (type === 'notify' && message.length > 90) {
      this.popupTextNotify = message;
      Popup.open();
    }


  }
}

