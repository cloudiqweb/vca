export class VisitType {
    constructor(
        public VisitTypeId: number,
        public VisitType: string)
        //public Description: string)
        {}
       // public checked: boolean){} }
    }


export interface DepartmentType {
    DepartmentId: number;
    DepartmentName: string;
}



export interface ResourceType {
    ResourceId: number;
    DisplayName: string;
    //ADusername: string;
    //Rank: number;
    //ResourceTypeId: number;
    Departments: number[];
}

  export interface Cage {
        CageId: number;
        CageName: string;
        CageTypeId: number;
        Description: string;
        StatusId: number;
        CreatedDate: Date;
        CreatedBy: string;
        LastModifiedDate: Date;
        LastModifiedBy: string;
        HospitalId: number;
    }

    export interface LocationType {
        //Cages: Cage[];
        LocationId: number;
        LocationName: string;
        //CreatedBy: string;
        //CreatedDate: Date;
        //Description: string;
        HospitalId: number;
        //ImageSource?: any;
        IsActive: boolean;
        //LastModifiedBy: string;
        //LastModifiedDate?: Date;
        //MaxBookingLimit?: number;
        //MaxOverbookingLimit?: number;
        //NumberOfCages: number;
        //Rank?: number;
        //Restrictions?: any;
        //Schedulable: boolean;
        //StatusId?: any;
    }
