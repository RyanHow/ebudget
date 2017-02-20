import {Component, Input} from '@angular/core';

@Component({
  selector: 'cute-progress-bar',
  template: '<div class="cute-progress-indicator" [style.width]="cssWidth()"></div>'
})

export class CuteProgressBar {

  @Input("value") value: number;
  @Input("of") of: number;

  cssWidth() : String {
    if (this.of > 0) return (this.value / this.of * 100) + "%";
    return "0"; // TODO: Trigger an indeterminate animation
  }
}