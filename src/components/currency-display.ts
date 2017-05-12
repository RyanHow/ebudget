import {Component, Input} from '@angular/core';
import {PriceFormat} from './price-format';
@Component({
  selector: 'currency-display',
  template: '<span [class.positive-currency]="positive && highlightPositive" [class.negative-currency]="!positive && highlightNegative">{{formattedCurrencyCached}}</span>'
})

export class CurrencyDisplay {
  
  @Input()
  value: any;
  
  checkValue: any;
  formattedCurrencyCached: string;
  positive: boolean;
  
  @Input()
  highlightPositive: boolean;
  
  @Input()
  highlightNegative: boolean;
  
  @Input()
  invertedCurrency: boolean;

  @Input()
  showPositive: boolean;

  @Input()
  showNegative: boolean;

  
  ngOnInit() {
    // this.formatCurrency();
    
  }
  
  ngOnChanges() {
    this.formatCurrency();
  }
  
  formatCurrency() {

    // If they are defined, then they are true, otherwise they will be falsy
    if (typeof this.highlightPositive !== 'undefined') this.highlightPositive = true;
    if (typeof this.highlightNegative !== 'undefined') this.highlightNegative = true;
    if (typeof this.invertedCurrency !== 'undefined') this.invertedCurrency = true;
    if (typeof this.showPositive !== 'undefined') this.showPositive = true;
    if (typeof this.showNegative !== 'undefined') this.showNegative = true;

        
    if (this.checkValue === this.value) return this.formattedCurrencyCached;
    this.checkValue = this.value;
    
    let pf = new PriceFormat(<any>{}, <any>{});
    let formattedVal = pf.formatIt(pf.fix_it(this.value));
    formattedVal = formattedVal.replace('-', '');
    
    this.positive = true;
    if (parseFloat(this.value) < 0) {
        this.positive = false;
        if (this.highlightNegative) formattedVal = '(' + formattedVal + ')';
    }

    if (this.invertedCurrency) this.positive = !this.positive;

    if (this.positive && this.showPositive && formattedVal !== '0.00') {
        formattedVal = '+' + formattedVal;
    } else if (!this.positive && this.showNegative && formattedVal !== '0.00') {
        formattedVal = '-' + formattedVal;
    }


    this.formattedCurrencyCached = formattedVal;

    return this.formattedCurrencyCached;

  }
  

}