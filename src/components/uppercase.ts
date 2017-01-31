/* tslint:disable */

import {Directive, ElementRef, Input , Output, Optional,HostBinding, EventEmitter} from '@angular/core';
import {NgModel, NgControl} from '@angular/forms';

declare function jQuery(any?) : any;

@Directive({
  selector: '[ngModel][uppercase]',
  providers: [NgModel],
  host: {
  '(ngModelChange)': 'onNgModelChange($event)'
    }
})
export class UppercaseDirective {
    modelPreviousValue;

    constructor(private model : NgModel) {
    }
    
    ngOnInit() {
        if (this.model.value) {
            this.model.valueAccessor.writeValue((this.model.value).toUpperCase());
            this.model.viewToModelUpdate(this.model.value);
        }
    }
    
    onNgModelChange(nv : any) {
        
        if (this.model.value != nv.toUpperCase() && this.model.value != this.modelPreviousValue) {
            this.modelPreviousValue = this.model.value;
            this.model.valueAccessor.writeValue(nv.toUpperCase());
            this.model.viewToModelUpdate(nv.toUpperCase());
        }
    }

}