import {PipeTransform,Pipe} from '@angular/core';
 @Pipe({

name: 'shorten'
 })
export class LengthPipe implements PipeTransform {
    transform(val: any) {
       
            return val.substr(0,10);
        
    }
}
