export class Schedule {
    public date:string
    public occuranceId :number
    public occuranceHour:string
    public status:string
    public statusId:number
    public updatedBy:string
    public updatedDate:string
    public notes:string
    constructor(occurance:any){
        this.occuranceHour = occurance.ts;
        this.status = occurance.status;
        this.notes = occurance.notes;
    }
}