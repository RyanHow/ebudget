import {Component, Input} from '@angular/core';

@Component({
  selector: 'cute-progress-bar',
  template: '<div class="cute-progress-indicator" [style.left]="cssWidth()"></div>'
})

export class CuteProgressBar {

  @Input("value") value: number;
  @Input("of") of: number;

  cssWidth() : String {

    // TODO: Need a way to immediately update this, perhaps instead of binding, have a method which will update the DOM directly...
    // TODO: Or need a way to trigger angular to run immediately, and not in a setTimeout()...

    if (this.of > 0) return (this.value / this.of * 100) + "%";
    return "0"; // TODO: Trigger an indeterminate animation
  }
}