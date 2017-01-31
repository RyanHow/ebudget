import {Directive} from '@angular/core';

@Directive({
  selector: '[nofocus]',
  host: {
  '(mousedown)': 'onMouseDown($event)'
    }
})
export class NoFocusDirective {
        
    onMouseDown(event: any) {
        event.preventDefault();
        return false;
    }

}