import { Pipe, PipeTransform } from '@angular/core';
import { TaskOccurrenceTimeline } from '../data/timeline';
import { TimelineService } from '../timeline/timeline.service';

@Pipe({ name: 'detailsFmt' })
export class TimelineDetailsFormatPipe implements PipeTransform {

  statusCompleted: string = "Completed";
  statusSkipped: string = "Skipped";

  constructor(private dataSvc: TimelineService) {
    this.dataSvc = dataSvc;
  }

  public transform(value: TaskOccurrenceTimeline): string {
    let fmtText: string = value.Status !== "Care Notes" ? "<strong>" + value.TaskName + "</strong>" : value.TaskName;
    if (value.QtyMustMatch && value.VisitInvoiceItemDetails !== null && value.VisitInvoiceItemDetails !== 0) {
      fmtText += " (" + value.VisitInvoiceItemDetails[0].Qty + value.VisitInvoiceItemDetails[0].Unit + ")";
    }
    fmtText += value.Status === "Skipped" ? " (SKIPPED)" : "";
    // if (value.TaskDefinitionInstruction) {
    //   fmtText += " " + value.TaskDefinitionInstruction;
    // }
    // else if (value.TaskSeriesInstruction) {
    //   fmtText += " " + value.TaskSeriesInstruction;
    // }
    if (value.Category === "Medication") {
      fmtText += "(" + value.DoseQuantity + " " + value.Unit + " )";
    }


    if (value.TaskSeriesInstruction) {
      fmtText += " - " + value.TaskSeriesInstruction;
    }

    if (value.Status && value.Status !== "Care Notes") {
      if (value.Status !== "Skipped") {
        // Commented as per Usecase 90635 in 1.2 Version
        //fmtText += (value.Status === this.statusCompleted) ? ". " : (" " + (value.Status.toLocaleLowerCase() + ". "));
        let findings: string = "";
        if (value.PatientTaskFindings) {

          for (let finding of value.PatientTaskFindings) {
            let tempFinding: string = "";
            if (findings.length > 0) {
              findings += "";
            }

            if (finding.ObservationName) {
              let tempLength = 0;
              tempFinding += finding.ObservationName + ": ";
              tempLength = tempFinding.length;
              if (finding.IsNormal) {
                tempFinding += (finding.EnteredValue) ? ((finding.EnteredValue) + " ") : "";
              } else {
                tempFinding += (finding.EnteredValue) ? (("<span class='textBold'>" + finding.EnteredValue + "</span>") + " ") : "";
              }
              if (tempFinding.length > tempLength) {
                tempFinding += (finding.EnteredUnitName) ? (finding.EnteredUnitName + " ") : "";
              }

              if (tempFinding.length > tempLength) {
                tempFinding += (finding.Comment) ? ("- " + finding.Comment) : "";
              }
              else {
                tempFinding += (finding.Comment) ? (finding.Comment) : "";
              }

              if (tempFinding.length > tempLength) {
                findings += "<div class='fourIndent'>" + tempFinding + "</div>";
              }

            }

          }

          if (findings.length > 0) {
            fmtText += findings;
          }

        }
      }
    }



    if (value.Comment) {
      fmtText += "<div class='fourIndent'>" + value.Comment + "</div>";
    }

    return fmtText;

  }

}
