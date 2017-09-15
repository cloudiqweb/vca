import { NgModule }             from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { PageNotFoundComponent }    from './not-found.component';
import { CanDeactivateGuard }       from './can-deactivate-guard.service';
import { SelectivePreloadingStrategy } from './selective-preloading-strategy';
import {SchedulerComponent} from './scheduler/scheduler.component';
import {TimelineComponent} from './timeline/timeline.component';
import { Angulartics2Module, Angulartics2GoogleAnalytics, Angulartics2 } from 'angulartics2';
import { DefaultComponent } from './defaultComponent';
import { WhiteboardComponent } from './whiteboard/whiteboard.component';
import { ObservationComponent } from './observation/observation.component';


const appRoutes: Routes = [

  {
    path: 'whiteboard',
    component: WhiteboardComponent
  },
   {
    path: 'observation',
    component: ObservationComponent
  },
  {
    path: 'timeline',
    component: TimelineComponent
  },
  {
    path: 'scheduler',
    component: SchedulerComponent
  },
  { path: '',   component: DefaultComponent , pathMatch: 'full'},
  { path: '**', component: PageNotFoundComponent }
];

@NgModule({
  imports: [
    RouterModule.forRoot(
      appRoutes,
      { preloadingStrategy: SelectivePreloadingStrategy }
    ),
    Angulartics2Module.forRoot([ Angulartics2GoogleAnalytics ])
  ],
  exports: [
    RouterModule
  ],
  providers: [
    CanDeactivateGuard,
    SelectivePreloadingStrategy
  ]
})

export class AppRoutingModule {
   constructor(angulartics2: Angulartics2) {
        angulartics2.virtualPageviews(false);
     }

}
