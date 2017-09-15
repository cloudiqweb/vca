import { Pipe, PipeTransform } from '@angular/core';
import { DatePipe } from '@angular/common';

@Pipe({ name: 'careNotesDateFmt' })
export class CareNotesDateFormatPipe implements PipeTransform {
  transform(value: string): string {
    let datePipe = new DatePipe("en-US");
    value = datePipe.transform(value, 'dd-MMM-yyyy | HH:mm');
    return value;
  }
}

@Pipe({ name: 'timelineDateFmt' })
export class TimelineDateFormatPipe implements PipeTransform {
  transform(value: string): string {
    let datePipe = new DatePipe("en-US");
    value = datePipe.transform(value, 'dd-MMM-yyyy');
    return value;
  }
}

@Pipe({ name: 'timelineTimeFmt' })
export class TimelineTimeFormatPipe implements PipeTransform {
  transform(value: string): string {
    let formattedDate = "";
    if (value) {
      let dateArr = value.split("T");
      if (dateArr.length === 2) {
        let timeArr = dateArr[1].split(":");
        if (timeArr.length > 1) {
          formattedDate = timeArr[0] + ":" + timeArr[1];
        }
      }
    }
    return formattedDate;
  }
}

@Pipe({ name: 'timelineFormatDate' })
export class TimelineFormatDate implements PipeTransform {
  transform(value: string): string {
    let formattedDate = "";
    if (value) {
      let dateArr = value.split("T");
      if (dateArr.length > 0) {
        let datePipe = new DatePipe("en-US");
        formattedDate = datePipe.transform(new Date(dateArr[0].replace('-', '/')), 'dd-MMM-yyyy');
      }
    }
    return formattedDate;
  }
}

@Pipe({ name: 'TimeFormatWhiteboard' })
export class TimeFormatWhiteboard implements PipeTransform {
  transform(value: string): string {
let inputDate = value.toString().split(' ');
let dateString=  inputDate[0] + " "
                + inputDate[2] + "-" + inputDate[1] + "-" + inputDate[3];
return dateString;

  }
}


