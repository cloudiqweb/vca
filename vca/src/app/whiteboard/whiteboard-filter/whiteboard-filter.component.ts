import { Component, OnInit, EventEmitter, Output, ViewChild } from '@angular/core';
import { WhiteboardService } from '../whiteboard.service';
import { VisitType, DepartmentType, ResourceType, LocationType } from '../../data/filtertypes';
import { FilterPreferance } from '../../data/filterpreferance';
import { UserPreference, UserPreferencePutRequest } from '../../data/userPreference';
import * as wjcCore from 'wijmo/wijmo';
import { GlobalsService } from '../../globals.service';
import { GoogleAnalyticsService } from '../../shared/googleAnalytics.service';
import { AppConfig } from '../../app.config';
import { GlobalErrorHandler } from '../../app.errorHandler';
import { IPopup } from "ng2-semantic-ui";

@Component({
  selector: 'app-whiteboard-filter',
  templateUrl: './whiteboard-filter.component.html',
  providers: [
    GoogleAnalyticsService
  ]

})
export class WhiteboardFilterComponent implements OnInit {
  visitTypes: VisitType[] = []
  locationTypes: LocationType[] = []
  departmentTypes: DepartmentType[] = []
  resourceTypes: ResourceType[] = []
  filterTypeSource: wjcCore.CollectionView;
  //showCritical: boolean;
  //sortOption: string = '';
  selectedFilter = '';
  isClient: boolean = false;
  squareTwovisible: boolean = false;
  sq3: boolean;
  jsonFilter: FilterPreferance;
  grpTooltip: wjcCore.Tooltip;
  runTimer: boolean = false;
  selectedVariable: boolean = false;
  filterState: string = "OFF";
  errorMessage: string;
  constClient: string = 'Client';
  constVisit: string = 'Visit';
  constDepartment: string = 'Department';
  constResourcestring = 'Resource';
  constLocation: string = 'Location';
  popuptext: string = "";

  @Output() passFilter = new EventEmitter();
  @Output() timerControl = new EventEmitter();
  @ViewChild('tooltip') tooltip: any;

  constructor(private WhiteBoardSvc: WhiteboardService, private GlobalSvc: GlobalsService,
    private googleAnalyticsService: GoogleAnalyticsService,
    private config: AppConfig,
    private errorHandler: GlobalErrorHandler) {

  }


  ngOnInit() {
    this.jsonFilter = this.GlobalSvc.getFilterPreferance();
    this.getFilterData();
  }

  getFilterData() {
    if (this.jsonFilter === undefined || this.jsonFilter === null) {
      this.jsonFilter = new FilterPreferance();
      this.jsonFilter.DepartmentIDs = [];
      this.jsonFilter.VisitIDs = [];
      this.jsonFilter.LocationIDs = [];
      this.jsonFilter.ResourceIDs = [];
      this.jsonFilter.SortBy = 'Patient';
      this.jsonFilter.SortCriticalFirst = true;
      this.jsonFilter.allDepartments = this.jsonFilter.allLocations = this.jsonFilter.allResources = this.jsonFilter.allVisits = true;
      this.WhiteBoardSvc.getUserPreferences().subscribe((response: UserPreference) => {
        if (response != null && response.UserPreferencesValue != null && response.UserPreferencesValue !== '') {
          this.jsonFilter = JSON.parse(response.UserPreferencesValue);;
          //console.log(response);
        }
        this.GlobalSvc.setFilterPref(this.jsonFilter);
        //this.sortOption = this.jsonFilter.SortBy;
       // this.showCritical = this.jsonFilter.SortCriticalFirst;
        //this.isClient = this.jsonFilter.SortBy === this.constClient ? true : false;
        this.setFilterState();
        this.WhiteBoardSvc.setFilter(this.jsonFilter);
        this.loadFilterData();
      });
    }
    else {
      this.setFilterState();
    }
  }

  showGroupToolTip(e: any, filter: string) {
    this.grpTooltip = new wjcCore.Tooltip();
    this.grpTooltip.show(this.tooltip.nativeElement, this.selectionDisplay(filter));
  }

  hideGroupToolTip() {
    this.grpTooltip.hide();
  }

  setSort(sort: string) {
    this.jsonFilter.SortBy = sort;
  }

  applyFilter() {
    //this.jsonFilter.SortCriticalFirst = this.showCritical;
   // this.jsonFilter.SortBy = this.sortOption;
    //this.passFilter.next(this.jsonFilter);
    if (this.jsonFilter.VisitIDs.length === this.visitTypes.length) {
      this.jsonFilter.allVisits = true;
      this.jsonFilter.VisitIDs = [];
    }
    if (this.jsonFilter.LocationIDs.length === this.locationTypes.length) {
      this.jsonFilter.allLocations = true;
      this.jsonFilter.LocationIDs = [];
    }
    if (this.jsonFilter.ResourceIDs.length === this.resourceTypes.length) {
      this.jsonFilter.allResources = true;
      this.jsonFilter.ResourceIDs = [];
    }
    if (this.jsonFilter.DepartmentIDs.length === this.departmentTypes.length) {
      this.jsonFilter.allDepartments = true;
      this.jsonFilter.DepartmentIDs = [];
    }
    this.saveUserPreference();
    this.WhiteBoardSvc.setFilter(this.jsonFilter);
    this.setFilterState();

  }

  saveUserPreference() {
    let userPreferencePut: UserPreferencePutRequest = new UserPreferencePutRequest();
    userPreferencePut.Value = JSON.stringify(this.jsonFilter);
    //console.log("saveUserPreference");
    //console.log(userPreferencePut);
    this.WhiteBoardSvc.saveUserPreference(userPreferencePut);

    try {
      let userPreferencePut: UserPreferencePutRequest = new UserPreferencePutRequest();
      userPreferencePut.Value = JSON.stringify(this.jsonFilter);

      let timeStart: number = performance.now();
      this.WhiteBoardSvc.saveUserPreference(userPreferencePut).subscribe(
        response => {
          let timeEnd: number = performance.now();
          let responseTime: number = timeEnd - timeStart;
          this.send_GA_UserTimingData(this.config.getConfig('GA_Orders_LocationsAndCages_URL'), "PUT", responseTime);
        },
        error => {
          this.errorMessage = <any>error;
        },
        () => {
          this.googleAnalyticsService.eventTrack("UpdateLocation", "/scheduler", "", 0);
          this.googleAnalyticsService.eventTrack("UpdateCage", "/scheduler", "", 0);
        }
      );
    }
    catch (e) {
      this.handleError(e);
    }

  }

  send_GA_UserTimingData(variable: string, label: string, duration: number) {
    //this.googleAnalyticsService.set_ApplicationLevl_GA_Dimensions();
    this.googleAnalyticsService.userTimingsTrack(this.config.getConfig("GA_UserTiming_Category"),
      variable, label, duration);
  }

  private handleError(error: Response | any) {
    this.errorHandler.exceptionHandling(false, error);
  }

  getCSSClassesCaller() {
    this.squareTwovisible = !this.squareTwovisible;
    this.sq3 = this.squareTwovisible;
  }


  changeTimer(control: string) {
    if (control === 'Pause') {
      this.timerControl.next(this.runTimer);
    }
    else {
      this.timerControl.next(!this.runTimer);
    }
  }

  selectionCheckDisplay(id: number, Filter: string) {

    switch (Filter) {

      case this.constVisit: {
        return this.selectionCheckDisplayByID(this.jsonFilter.VisitIDs, id);
      }

      case this.constDepartment: {
        return this.selectionCheckDisplayByID(this.jsonFilter.DepartmentIDs, id);
      }

      case this.constResourcestring: {
        return this.selectionCheckDisplayByID(this.jsonFilter.ResourceIDs, id);
      }

      case this.constLocation: {
        return this.selectionCheckDisplayByID(this.jsonFilter.LocationIDs, id);
      }
    }
  }

  selectionCheckDisplayByID(filters: Array<number>, id: number) {
    if (filters && filters.findIndex((a): any => a === id) > -1) {
      return true;
    }
    else {
      return false;
    }
  }


  setFilterState() {
    this.filterState = (this.jsonFilter !== undefined && this.jsonFilter !== null &&this.jsonFilter.SortCriticalFirst&&this.jsonFilter.SortBy==='Patient' && this.jsonFilter.VisitIDs.length === 0 && this.jsonFilter.ResourceIDs.length === 0 &&
      this.jsonFilter.LocationIDs.length === 0 && this.jsonFilter.DepartmentIDs.length === 0) ? 'OFF' : 'ON';
  }

  loadVisitFilterData() {
    if (this.WhiteBoardSvc.VisitTypes === undefined || this.WhiteBoardSvc.VisitTypes === null) {
      this.WhiteBoardSvc.getVisitTypes().subscribe(
        (response: VisitType[]) => {
          if (response === null) {
            //console.log("loadVisitFilterData-null data recieved");
          }
          this.WhiteBoardSvc.VisitTypes = response;
          this.visitTypes = response;
        },
      );
    }
    else {
      this.visitTypes = this.WhiteBoardSvc.VisitTypes;
    }
  }

  loadLocationFilterData() {
    if (this.WhiteBoardSvc.LocationTypes === undefined || this.WhiteBoardSvc.LocationTypes === null) {
      this.WhiteBoardSvc.getLocationTypes().subscribe(
        (response: LocationType[]) => {
          if (response === null) {
            //console.log("loadLocationFilterData-null data recieved");
          }
          response = response.filter((a: LocationType) => {
            return a.IsActive;
          });
          this.WhiteBoardSvc.LocationTypes = response;
          this.locationTypes = response;
        },
      );
    } else {
      this.locationTypes = this.WhiteBoardSvc.LocationTypes;
    }
  }

  loadDepartmentFilterData() {
    if (this.WhiteBoardSvc.DepartmentTypes === undefined || this.WhiteBoardSvc.DepartmentTypes === null) {
      this.WhiteBoardSvc.getDepartments().subscribe(
        (response: DepartmentType[]) => {
          if (response === null) {
            // console.log("loadDepartmentFilterData-null data recieved");
          }
          this.WhiteBoardSvc.DepartmentTypes = response;
          this.departmentTypes = this.WhiteBoardSvc.DepartmentTypes;
        },
      );
    } else {
      this.departmentTypes = this.WhiteBoardSvc.DepartmentTypes;
    }
  }

  loadResourceFilterData() {
    if (this.WhiteBoardSvc.ResourceTypes === undefined || this.WhiteBoardSvc.ResourceTypes === null) {
      this.WhiteBoardSvc.getResources().subscribe(
        (response: ResourceType[]) => {
          if (response === null) {
            // console.log("loadResourceFilterData-null data recieved");
          }
          this.WhiteBoardSvc.ResourceTypes = response;
          this.resourceTypes = this.WhiteBoardSvc.ResourceTypes;
        },
      );
    } else {
      this.resourceTypes = this.WhiteBoardSvc.ResourceTypes;
    }
  }

  setFilterType(filter: string) {
    this.selectedFilter = filter;
    switch (filter) {
      case this.constVisit: {
        this.filterTypeSource = new wjcCore.CollectionView(this.visitTypes);
        if (this.jsonFilter.allVisits) {
          this.jsonFilter.VisitIDs = [];
          this.visitTypes.forEach(element => {
            this.jsonFilter.VisitIDs.push(element.VisitTypeId);
          });
        }
        break;
      }
      case this.constResourcestring: {
        this.filterTypeSource = new wjcCore.CollectionView(this.resourceTypes);
        if (this.jsonFilter.allResources) {
          this.jsonFilter.ResourceIDs = [];
          this.resourceTypes.forEach(element => {
            this.jsonFilter.ResourceIDs.push(element.ResourceId);
          });
        }
        break;
      }
      case this.constLocation: {
        this.filterTypeSource = new wjcCore.CollectionView(this.locationTypes);
        if (this.jsonFilter.allLocations) {
          this.jsonFilter.LocationIDs = [];
          this.locationTypes.forEach(element => {
            this.jsonFilter.LocationIDs.push(element.LocationId);
          });
        }
        break;
      }
      case this.constDepartment: {
        this.filterTypeSource = new wjcCore.CollectionView(this.departmentTypes);
        if (this.jsonFilter.allDepartments) {
          this.jsonFilter.DepartmentIDs = [];
          this.departmentTypes.forEach(element => {
            this.jsonFilter.DepartmentIDs.push(element.DepartmentId);
          });
        }
        break;
      }

    }
  }

  selectAllCheck() {
    switch (this.selectedFilter) {
      case this.constVisit: {
        return this.jsonFilter.VisitIDs.length === this.visitTypes.length;
      }
      case this.constResourcestring: {
        return this.jsonFilter.ResourceIDs.length === this.resourceTypes.length;
      }
      case this.constLocation: {
        return this.jsonFilter.LocationIDs.length === this.locationTypes.length;
      }
      case this.constDepartment: {
        return this.jsonFilter.DepartmentIDs.length === this.departmentTypes.length;
      }
    }
  }


  selectionDisplay(type: string) {
    switch (type) {
      case this.constVisit: {
        if (this.jsonFilter.allVisits) {
          return "All visit types selected";
        }
        else if (this.jsonFilter.VisitIDs.length !== 0) {
          let displayString: string = "";
          this.jsonFilter.VisitIDs.forEach(element => {
            this.visitTypes.find((Type): any => {
              if (Type.VisitTypeId === element) {
                displayString = (displayString + "," + Type.VisitType);
              }
            });
          });
          return displayString.substr(1);
        }
        else {
          return "No visit type selected";
        }
      }

      case this.constResourcestring: {
        if (this.jsonFilter.allResources) {
          return "All resources selected";
        }
        else if (this.jsonFilter.ResourceIDs.length !== 0) {
          let displayString: string = "";
          this.jsonFilter.ResourceIDs.forEach(element => {
            this.resourceTypes.find((Type): any => {
              if (Type.ResourceId === element) {
                displayString = displayString + "," + Type.DisplayName;
              }
            });
          });
          return displayString.substr(1);;
        }
        else {
          return "No resource selected";
        }
      }

      case this.constLocation: {
        if (this.jsonFilter.allLocations) {
          return "All locations selected";
        }

        else if (this.jsonFilter.LocationIDs.length !== 0) {
          let displayString: string = "";
          this.jsonFilter.LocationIDs.forEach(element => {
            this.locationTypes.find((Type): any => {
              if (Type.LocationId === element) {
                displayString = displayString + "," + Type.LocationName;
              }
            });
          });
          return displayString.substr(1);;
        }
        else {
          return "No location selected";
        }
      }

      case this.constDepartment: {
        if (this.jsonFilter.allDepartments) {
          return "All departments selected";
        }

        else if (this.jsonFilter.DepartmentIDs.length !== 0) {
          let displayString: string = "";
          this.jsonFilter.DepartmentIDs.forEach(element => {
            this.departmentTypes.find((Type): any => {
              if (Type.DepartmentId === element) {
                displayString = displayString + "," + Type.DepartmentName;
              }
            });
          });
          return displayString.substr(1);;
        }
        else {
          return "No department selected";
        }
      }

    }
  }




  selectAll() {
    switch (this.selectedFilter) {
      case this.constVisit: {
        if (this.jsonFilter.VisitIDs.length === this.visitTypes.length) {
          this.jsonFilter.VisitIDs = [];
          this.jsonFilter.allVisits = false;
        }
        else {
          this.jsonFilter.VisitIDs = [];
          this.visitTypes.forEach(element => {
            this.jsonFilter.VisitIDs.push(element.VisitTypeId);
          });
          this.jsonFilter.allVisits = true;
        }
        break;
      }
      case this.constResourcestring: {
        if (this.jsonFilter.ResourceIDs.length === this.resourceTypes.length) {
          this.jsonFilter.ResourceIDs = [];
          this.jsonFilter.allResources = false;
        }
        else {
          this.jsonFilter.ResourceIDs = [];
          this.resourceTypes.forEach(element => {
            this.jsonFilter.ResourceIDs.push(element.ResourceId);
          });
          this.jsonFilter.allResources = true;

        }
        break;

      }
      case this.constLocation: {
        if (this.jsonFilter.LocationIDs.length === this.locationTypes.length) {
          this.jsonFilter.LocationIDs = [];
          this.jsonFilter.allLocations = false;
        }
        else {
          this.jsonFilter.LocationIDs = [];
          this.locationTypes.forEach(element => {
            this.jsonFilter.LocationIDs.push(element.LocationId);
          });
          this.jsonFilter.allLocations = true;

        }
        break;
      }
      case this.constDepartment: {
        if (this.jsonFilter.DepartmentIDs.length === this.departmentTypes.length) {
          this.jsonFilter.DepartmentIDs = [];
          this.jsonFilter.allDepartments = false;
        }
        else {
          this.jsonFilter.DepartmentIDs = [];
          this.departmentTypes.forEach(element => {
            this.jsonFilter.DepartmentIDs.push(element.DepartmentId);
          });
          this.jsonFilter.allDepartments = true;
        }
        break;
      }
    }


  }

  loadFilterData() {
    this.loadVisitFilterData();
    this.loadLocationFilterData();
    this.loadDepartmentFilterData();
    this.loadResourceFilterData();
  }

  clearFilters() {
    this.jsonFilter.DepartmentIDs = [];
    this.jsonFilter.ResourceIDs = [];
    this.jsonFilter.LocationIDs = [];
    this.jsonFilter.VisitIDs = [];
    this.jsonFilter.allDepartments = this.jsonFilter.allLocations = this.jsonFilter.allResources = this.jsonFilter.allVisits = true;
    this.jsonFilter.SortCriticalFirst = true;
    this.jsonFilter.SortBy = 'Patient';
  }

  @ViewChild('popup') popup: any;
  closePopup() {
    this.popup.hide();
    this.jsonFilter = undefined;
    this.getFilterData();
  }

  FiltersSelection(id: number, filter: string) {
    switch (filter) {
      case this.constVisit: {
        let VisitIndex = this.jsonFilter.VisitIDs.findIndex((a) => a === id);
        if (VisitIndex > -1) {
          this.jsonFilter.VisitIDs.splice(VisitIndex, 1);
        }
        else {
          let VisitIndex = this.visitTypes.findIndex((a) => a.VisitTypeId === id);
          this.jsonFilter.VisitIDs.push(this.visitTypes[VisitIndex].VisitTypeId);
        }
        this.jsonFilter.allVisits = this.jsonFilter.VisitIDs.length === this.visitTypes.length ? true : false;
        break;
      }
      case this.constDepartment: {
        let VisitIndex = this.jsonFilter.DepartmentIDs.findIndex((a) => a === id);
        if (VisitIndex > -1) {
          this.jsonFilter.DepartmentIDs.splice(VisitIndex, 1);
        }
        else {
          let VisitIndex = this.departmentTypes.findIndex((a) => a.DepartmentId === id);
          this.jsonFilter.DepartmentIDs.push(this.departmentTypes[VisitIndex].DepartmentId);
        }
        this.jsonFilter.allDepartments = this.jsonFilter.DepartmentIDs.length === this.departmentTypes.length ? true : false;
        break;
      }
      case this.constLocation: {
        let LocationIndex = this.jsonFilter.LocationIDs.findIndex((a) => a === id);
        if (LocationIndex > -1) {
          this.jsonFilter.LocationIDs.splice(LocationIndex, 1);
        }
        else {
          let Index = this.locationTypes.findIndex((a) => a.LocationId === id);
          this.jsonFilter.LocationIDs.push(this.locationTypes[Index].LocationId);
        }
        this.jsonFilter.allLocations = this.jsonFilter.LocationIDs.length === this.departmentTypes.length ? true : false;
        break;
      }
      case this.constResourcestring: {
        let index = this.jsonFilter.ResourceIDs.findIndex((a) => a === id);
        if (index > -1) {
          this.jsonFilter.ResourceIDs.splice(index, 1);
        }
        else {
          let index = this.resourceTypes.findIndex((a) => a.ResourceId === id);
          this.jsonFilter.ResourceIDs.push(this.resourceTypes[index].ResourceId);
        }
        this.jsonFilter.allResources = this.jsonFilter.ResourceIDs.length === this.resourceTypes.length ? true : false;
        break;
      }
    }
  }

  // testing() {
  //   console.log(this.jsonFilter);
  // }
}





