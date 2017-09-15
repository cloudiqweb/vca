import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject';

@Injectable()
export class TimerService {

    static instance: TimerService;
    static timerInitiate = new Subject<boolean>();
    static isCreating: Boolean = false;

    static timerInterval: number = 60000;
    static timerID: any;
    static timerStarted: boolean = false;

    timerInitiate$ = TimerService.timerInitiate.asObservable();
    //message:String;

    constructor() {
        if (!TimerService.isCreating) {
            throw new Error("You can't call new in TimerService instances!");
        }
    }

    static getInstance() {
        if (TimerService.instance === undefined) {
            TimerService.isCreating = true;
            TimerService.instance = new TimerService();
            TimerService.isCreating = false;
            //TimerService.startTimer();
        }

        return TimerService.instance;
    }

    setTimeInterval(interval:number) {
        TimerService.stopTimer();
        TimerService.timerInterval = interval;
        TimerService.startTimer();
    }

    // setMessage(message: String) {
    //     this.message = message;
    //     console.log(this.message);
    // }

    // getMessage() {
    //     console.log(this.message);
    //     return this.message;
    // }

    static startTimer() {
        try {
            if (!TimerService.timerStarted) {
                //TimerService.stopTimer();
                TimerService.timerID = setInterval(() => {
                    //console.log("TimerService-startTimer:" + new Date());
                    TimerService.timerInitiate.next(true);
                },
                    TimerService.timerInterval);
                //console.log(TimerService.timerID);
            }
            TimerService.timerStarted = true;;
        }
        catch (e) {
            console.error(e);
        }
    }

    static stopTimer() {
        try {
            if (TimerService.timerID) {
                //console.log(TimerService.timerID);
                if (TimerService.timerStarted) {
                    TimerService.timerInitiate.next(false);
                    clearInterval(TimerService.timerID);
                    //console.log("TimerService-stopTimer:" + new Date());
                }
            }
            TimerService.timerStarted = false;
        }
        catch (e) {
            console.error(e);
        }
    }
}