import { NgModule, APP_INITIALIZER, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpModule, JsonpModule } from '@angular/http';
import { WjGridModule } from 'wijmo/wijmo.angular2.grid';
import { WjGridFilterModule } from 'wijmo/wijmo.angular2.grid.filter';
import { WjInputModule } from 'wijmo/wijmo.angular2.input';
import { Angulartics2Module, Angulartics2GoogleAnalytics } from 'angulartics2';
import { TruncateModule } from 'ng2-truncate';
import { SuiModule } from 'ng2-semantic-ui';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app.router';
import { TimelineService } from './timeline/timeline.service';
import { SchedulerComponent } from './scheduler/scheduler.component';
import { PageNotFoundComponent } from './not-found.component';
import { SchedulerService } from './scheduler/scheduler.service';
import { PatientService } from './patient/patient.service';
import { PatientComponent } from './patient/patient.component';
import { TaskOccuranceComponent } from './scheduler/taskOccurance/taskOccurance.component';
import { TaskScheduleComponent } from './scheduler/taskSchedule/taskSchedule.component';
import { CareNotesComponent } from './scheduler/careNotes/careNotes.component';
import { AuthGuard } from './auth-guard.service';
import { TimelineComponent } from './timeline/timeline.component';
import { GlobalsService } from './globals.service';
import { UrlHelperService } from './shared/urlhelper.service';
import { SecurePipe } from './shared/secure.pipe';
import { CareNotesDateFormatPipe, TimelineDateFormatPipe, TimelineTimeFormatPipe, TimelineFormatDate, TimeFormatWhiteboard } from './shared/dateFormat.pipe';
import { TimelineDetailsFormatPipe } from './shared/timelineDataFormat.pipe';
import { GroupByPipe, DataGroupByPipe } from './shared/categoryGroup.pipe';
import { GoogleAnalyticsService } from './shared/googleAnalytics.service';
import { TimerService } from './shared/timer.service';
import { GlobalErrorHandler } from './app.errorHandler';
import { WhiteboardService } from './whiteboard/whiteboard.service';
import { ObservationService } from './observation/observation.service';
import { DefaultComponent } from './defaultComponent';
import { AppConfig } from './app.config';
import { L_SEMANTIC_UI_MODULE } from 'angular2-semantic-ui';
import { initConfig } from './util';
import { RootObject, TaskOccurrenceInfo } from '././data/optionalTasks';
import { ContextMenuModule } from 'ngx-contextmenu';
import { ContextMenuService } from 'ngx-contextmenu';
import { AddTasksComponent } from './scheduler/add-tasks/add-tasks.component';
import { WhiteboardComponent } from './whiteboard/whiteboard.component';
import { LengthPipe } from './whiteboard/maxLength.pipe';
// import { SidebarModule } from 'ng-sidebar';
import { WhiteboardFilterComponent } from './whiteboard/whiteboard-filter/whiteboard-filter.component';
import { ObservationComponent } from './observation/observation.component';
// import { AngularMultiSelectModule } from 'angular2-multiselect-dropdown/angular2-multiselect-dropdown';
// import { PopoverModule } from "ng2-popover";

@NgModule({
  imports: [
    WjInputModule, WjGridModule, WjGridFilterModule,
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    TruncateModule,
    L_SEMANTIC_UI_MODULE,
    ContextMenuModule,
    AppRoutingModule, HttpModule, JsonpModule,
    Angulartics2Module,
    SuiModule,
    BrowserAnimationsModule
  ],
  declarations: [
    AppComponent,
    PatientComponent,
    PageNotFoundComponent,
    TimelineComponent,
    SchedulerComponent,
    DefaultComponent,
    TaskOccuranceComponent,
    TaskScheduleComponent, CareNotesComponent,
    GroupByPipe,
    DataGroupByPipe,
    SecurePipe,
    CareNotesDateFormatPipe,
    TimelineDateFormatPipe, TimelineTimeFormatPipe, TimelineFormatDate, TimeFormatWhiteboard, TimelineDetailsFormatPipe, AddTasksComponent, WhiteboardComponent,
    LengthPipe, WhiteboardFilterComponent, ObservationComponent
  ],
  providers: [
    ObservationService,
    WhiteboardService,
    SchedulerService,
    PatientService,
    TimelineService,
    RootObject,
    ContextMenuService,
    AuthGuard,
    GlobalsService,
    UrlHelperService,
    AppConfig,
    Angulartics2GoogleAnalytics,
    GoogleAnalyticsService,
    TimerService,
    GlobalErrorHandler,
    // {
    //   provide: ErrorHandler,
    //   useClass: GlobalErrorHandler
    // },
    { provide: APP_INITIALIZER, useFactory: initConfig, deps: [AppConfig], multi: true }
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  bootstrap: [AppComponent]
})
export class AppModule { }
