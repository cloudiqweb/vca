export class PatientDetails {
  constructor(
    public name:string,
    public clientFN:string,
    public clientLN:string,
    public breed:string,
    public sex:string,
    public displayAge:string,
    public weight:string,
    public weightDate:string,
    public location:string,
    public cage:string,
    public primaryPhysician:string,
    public alertNotes:string,
    public concerns:string[],
    public photoURL:string) { }
}