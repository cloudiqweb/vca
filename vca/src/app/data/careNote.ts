export class CareNote {
    CareNotesId: number;
    Notes: string;
    VisitId: number;
    HospitalId: number;
    CreatedDate: Date;
    CreatedBy: string;
    LastModifiedDate: Date;
    LastModifiedBy: string;
    Rowversion: string;

    constructor(visitId:string,hospitalId:string,createdBy:string){
        this.Notes = "";
        this.CareNotesId = 0;
        this.VisitId = +visitId;
        this.HospitalId = +hospitalId;
        this.CreatedBy = createdBy;
        this.Rowversion = "";

    }
}


