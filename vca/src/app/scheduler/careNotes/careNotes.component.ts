import { Component, Inject, EventEmitter, Output, Input, OnChanges } from '@angular/core';
import { SchedulerService } from '.././scheduler.service';
import { GlobalsService } from '../../globals.service';
import { CareNote } from '../../data/CareNote';
import { GoogleAnalyticsService } from '../../shared/googleAnalytics.service';
import { AppConfig } from '../../app.config';
import { GlobalErrorHandler } from '../../app.errorHandler';

@Component({
  selector: 'careNotes',
  templateUrl: './careNotes.component.html',
  providers: [
    GoogleAnalyticsService
  ]
})
export class CareNotesComponent implements OnChanges {
  errorMessage: string;
  careNotes: CareNote[];
  newCareNote: CareNote;
  editCareNote: CareNote;
  currDate: Date;
  @Input() showCareNotes: boolean;

  constructor(private dataSvc: SchedulerService, private globalsService: GlobalsService,
    private config: AppConfig,
    private googleAnalyticsService: GoogleAnalyticsService, private errorHandler: GlobalErrorHandler) {
  }

  @Output() notifyCloseCareNotes: EventEmitter<any> = new EventEmitter<any>();

  ngOnInit() {
    this.reset();
    this.currDate = new Date();
  }

  ngOnChanges() {
    if (this.showCareNotes) {
      let timeStart: number = performance.now();
      this.dataSvc.getCareNotes().subscribe(
        res => {
          let timeEnd: number = performance.now();
          let responseTime: number = timeEnd - timeStart;
          this.googleAnalyticsService.userTimingsTrack(this.config.getConfig("GA_UserTiming_Category"),
            this.config.getConfig('GA_Orders_CareNotes_URL'), "GET", responseTime);
          this.careNotes = res;
        },
        error => console.log(error)
      );
    }
    this.showCareNotes = false;
  }

  ngOnDestroy() {
    this.newCareNote = null;
    this.editCareNote = null;
    this.currDate = null;
    this.notifyCloseCareNotes.unsubscribe();
    //console.log('CareNotesComponent destroy');
  }

  saveCareNotes() {

    if (this.newCareNote.Notes.trim() === "") {
      this.errorMessage = "Notes cannot be empty";
      return;
    }

    let timeStart: number = performance.now();
    this.dataSvc.putCareNotes(this.newCareNote).subscribe(

      careNote => {
        let timeEnd: number = performance.now();
        let responseTime: number = timeEnd - timeStart;
        this.googleAnalyticsService.userTimingsTrack(this.config.getConfig("GA_UserTiming_Category"),
          this.config.getConfig('GA_Orders_CareNotes_URL'), "PUT", responseTime);
        this.getCareNotes();
        if (careNote.StatusCode !== 200) {
          //console.log(careNote);
          // alert(careNote.Data.ValidationMessage);
          this.validationString = careNote.Data.ValidationMessage;

        }
      },

      error => this.errorMessage = <any>error,
      () => {
        this.googleAnalyticsService.eventTrack("AddCareNote", this.config.getConfig("GA_EditTasks_URL"), "", 0);
      }
    );
    this.reset();
    //console.log(this.careNotes);
  }


  validationString: string = '';

  getCareNotes() {
    let timeStart_0: number = performance.now();
    this.dataSvc.getCareNotes().subscribe(
      res => {
        let timeEnd: number = performance.now();
        let responseTime: number = timeEnd - timeStart_0;
        this.googleAnalyticsService.userTimingsTrack(this.config.getConfig("GA_UserTiming_Category"),
          this.config.getConfig('GA_Orders_CareNotes_URL'), "GET", responseTime);
        this.careNotes = res;
      },
      error => this.errorMessage = <any>error,
    );
  }

  removeNote(note: CareNote) {
    // this.careNotes = this.careNotes.filter(obj => obj !== note);
    this.dataSvc.postRemoveNote(note).subscribe(
      res => {
        if (res.Data.StatusCode !== 200) {
          this.validationString = res.Data.ValidationMessage;
        }
      }
    );
    this.getCareNotes();
    // To reload Care Notes
    this.getCareNotes();
  }

  showRemove(note: CareNote) {
    this.removeNoteId = note.CareNotesId;
    this.validationString = '';

  }

  hideRemove() {
    this.removeNoteId = 0;
  }

  editEligibilty(note: CareNote) {
    const eventStartTime = new Date(note.CreatedDate);
    const eventEndTime = Date.now();
    const duration = eventEndTime.valueOf() - eventStartTime.valueOf();
    // console.log("difference "+eventStartTime+"-"+eventEndTime+"="+duration);
    return duration > 86400000 ? false : true;

  }




  removeNoteId: number = 0;
  toEditCare: number = 0;

  editCare(note: CareNote) {
    if (this.editEligibilty(note)) {
      this.toEditCare = note.CareNotesId;
      this.editCareNote = new CareNote(this.globalsService.getOrderId(), this.globalsService.getHospitalId(), this.globalsService.getUserName());
      this.editCareNote = note;
    }

  }
  passEditCareNote() {
    this.newCareNote = this.editCareNote;
    this.toEditCare = 0;
    this.validationString = '';

  }

  reset() {
    this.newCareNote = new CareNote(this.globalsService.getOrderId(), this.globalsService.getHospitalId(), this.globalsService.getUserName());
    this.toEditCare = 0;
    this.validationString = '';
  }


  closeModal() {
    this.notifyCloseCareNotes.emit(false);
  }

  private handleError(error: Response | any) {
    this.errorHandler.exceptionHandling(false, error);
  }

}
