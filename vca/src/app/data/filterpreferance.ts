export class FilterPreferance
 {
     public SortCriticalFirst:boolean;
     public SortBy: string;
     public ResourceIDs:number[];
     public VisitIDs: number[];
     public DepartmentIDs:number[];
     public LocationIDs:number[];
     public allVisits:boolean;
     public allResources:boolean;
     public allDepartments:boolean;
     public allLocations:boolean;

      constructor( ){
          this.SortCriticalFirst=true;
          this.SortBy='Patient';
          this.ResourceIDs=[];
          this.VisitIDs=[];
          this.DepartmentIDs=[];
          this.LocationIDs=[];
          this.allVisits=true;
          this.allResources=true;
          this.allDepartments=true;
          this.allLocations=true;
      }


    }

