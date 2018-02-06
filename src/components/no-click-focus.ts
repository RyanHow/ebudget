import {Directive, ElementRef} from '@angular/core';
import {Platform} from 'ionic-angular';

@Directive({
  host: {
    '(mousedown)': 'onMouseDown($event)',
    '(click)': 'onClick()'
  },
  selector: '[no-click-focus]'
})
export class NoClickFocus {
    mouseDownActiveElement: HTMLElement;
    
    constructor(private elementRef: ElementRef, private platform: Platform) {
        if (!(this.platform.is('ios') || this.platform.is('android'))) {

        }
    }
    ngAfterViewInit(): void {
        this.elementRef.nativeElement;

    }

    onMouseDown(ev): boolean {
        this.mouseDownActiveElement = <any> document.activeElement;
        ev.preventDefault();
        return false;
    }

    onClick() {
        if (this.mouseDownActiveElement && this.mouseDownActiveElement.focus && this.mouseDownActiveElement) {
            if (this.mouseDownActiveElement === document.activeElement) {
                let eventListener = () => {
                    let e = this.mouseDownActiveElement;
                    e.focus();
                    setTimeout(() => e.focus());
                    e.removeEventListener('blur', eventListener);
                    this.mouseDownActiveElement = null;
                }
                this.mouseDownActiveElement.addEventListener('blur', eventListener);
            } else {
                this.mouseDownActiveElement.focus();
                this.mouseDownActiveElement = null;
            }
        }
    }


}



