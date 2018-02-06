import {Directive, ElementRef} from '@angular/core';
import {Platform} from 'ionic-angular';

@Directive({
  host: {
    '(mousedown)': 'onMouseDown()',
    '(click)': 'onClick()'
  },
  selector: '[no-click-focus]'
})
export class NoClickFocus {
    mouseDownActiveElement: any;
    
    constructor(private elementRef: ElementRef, private platform: Platform) {
        if (!(this.platform.is('ios') || this.platform.is('android'))) {

        }
    }
    ngAfterViewInit(): void {
        this.elementRef.nativeElement;

    }

    onMouseDown(): boolean {
        this.mouseDownActiveElement = <any> document.activeElement;
        return false;
    }

    onClick() {
        if (this.mouseDownActiveElement && this.mouseDownActiveElement.focus && document.activeElement !== this.mouseDownActiveElement) {
            this.mouseDownActiveElement.focus();
            this.mouseDownActiveElement = null;
        }
    }


}



