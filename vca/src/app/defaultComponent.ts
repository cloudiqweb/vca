import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { GlobalsService } from './globals.service';

@Component({
  selector: 'my-app',
  template: `
    <div class="row">
    </div>
  `
})

export class DefaultComponent {  
  constructor(private router : Router, private globalService:GlobalsService) {
    if(this.globalService.getStartPage() && this.globalService.getStartPage().toLowerCase() === "whiteboard"){
      this.router.navigate(['/whiteboard']);
    }else{
      this.router.navigate(['/scheduler']);
    }
  }
}
