import {Directive, ElementRef} from '@angular/core';
import {NgModel} from '@angular/forms';

@Directive({
  selector: '[ngModel][priceFormat]',
  providers: [NgModel],
  host: {
  '(ngModelChange)': 'onNgModelChange($event)',
  '(input)': 'onInput($event)'
    }
})
export class PriceFormat {

    /* tslint:disable */

    modelPreviousValue;
    element;
    input;
    displayInput;

    constructor(private model : NgModel, eleRef : ElementRef) {
        this.element = eleRef.nativeElement;
    }
    
    ngOnInit() {
        if ("input" == this.element.tagName.toLowerCase()) this.input = this.element;
        else if ("ion-input" == this.element.tagName.toLowerCase()) {
            this.input = this.element.firstChild;
            //this.displayInput = this.input.cloneNode();
            //this.element.insertBefore(this.displayInput, this.input);
        }
        
        if (this.model.valueAccessor) {
            this.model.valueAccessor.writeValue(this.fix_it(this.model.value));
            this.model.viewToModelUpdate(this.fix_it(this.model.value));
        } else {
            throw new Error("price-format requires NgModel to function correctly");
            //(<Control>this.ctrl.control).updateValue(this.fix_it(this.model.value));
        }


    }
    
    onInput() {
        this.input.value = this.formatIt(this.input.value);
    }
    
    onNgModelChange(nv : any) {
        nv = this.formatIt(nv);
        if (this.model.value !== nv.toUpperCase() && this.model.value !== this.modelPreviousValue) {
            this.modelPreviousValue = this.model.value;
            this.model.valueAccessor.writeValue(nv);
            this.model.viewToModelUpdate(nv);
            //if (this.displayInput) this.displayInput.value = nv;
        }
    }

    formatIt(value: string): string {
        return this.price_format(value, false);
    }


	is_number = /[0-9]/;
    centsLimit = 2;
    clearOnEmpty = false;
    centsSeparator = ".";
    thousandsSeparator = ",";
    allowNegative = true;
    insertPlusSign = false;
    prefix = "";
    suffix = "";

    to_numbers(str) {
        var formatted = '';
        for (var i = 0; i < (str.length); i++) {
            let char_ = str.charAt(i);
            if (formatted.length == 0 && char_ == 0) char_ = false;

            if (char_ && char_.match(this.is_number)) {
                //if (limit) {
                //    if (formatted.length < limit) formatted = formatted + char_;
                //}
                //else {
                formatted = formatted + char_;
                //}
            }
        }

        return formatted;
    }

    // format to fill with zeros to complete cents chars
    fill_with_zeroes(str) {
        while (str.length < (this.centsLimit + 1)) str = '0' + str;
        return str;
    }
    
    fix_it(str1) : string {
        let str = str1 ? str1 + "" : "0";
        let parts = str.split(".");
        if (parts.length == 1) {
            str = str + this.centsSeparator + Array(this.centsLimit + 1).join("0");
        } else if (parts.length == 2) {
            let cents = parts[1];
            if (parts[1].length > this.centsLimit) cents = parts[1].substring(0,this.centsLimit + 1);
            else if (parts[1].length < this.centsLimit) cents = parts[1] + Array(this.centsLimit - parts[1].length + 1).join("0");
            str = parts[0] + this.centsSeparator + cents;
        }
        return this.price_format(str, false);
    }

    price_format(str, ignore) {
        str = str + "";
        if (!ignore && (str === '' || str == this.price_format('0', true)) && this.clearOnEmpty)
            return '';

        // formatting settings
        var formatted = this.fill_with_zeroes(this.to_numbers(str));
        var thousandsFormatted = '';
        var thousandsCount = 0;

        let centsSeparator = this.centsSeparator;
        // Checking CentsLimit
        if (this.centsLimit == 0) {
            centsSeparator = "";
            centsVal = "";
        }

        // split integer from cents
        var centsVal = formatted.substr(formatted.length - this.centsLimit, this.centsLimit);
        var integerVal = formatted.substr(0, formatted.length - this.centsLimit);

        // apply cents pontuation
        formatted = (this.centsLimit == 0) ? integerVal : integerVal + centsSeparator + centsVal;

        // apply thousands pontuation
        if (this.thousandsSeparator) {
            for (var j = integerVal.length; j > 0; j--) {
                let char_ = integerVal.substr(j - 1, 1);
                thousandsCount++;
                if (thousandsCount % 3 == 0) char_ = this.thousandsSeparator + char_;
                thousandsFormatted = char_ + thousandsFormatted;
            }

            //
            if (thousandsFormatted.substr(0, 1) == this.thousandsSeparator) thousandsFormatted = thousandsFormatted.substring(1, thousandsFormatted.length);
            formatted = (this.centsLimit == 0) ? thousandsFormatted : thousandsFormatted + centsSeparator + centsVal;
        }

        // if the string contains a dash, it is negative - add it to the begining (except for zero)
        if (this.allowNegative && (integerVal != 0 || centsVal != 0)) {
            if (str.indexOf('-') != -1 && str.indexOf('+') < str.indexOf('-')) {
                formatted = '-' + formatted;
            }
            else {
                if (!this.insertPlusSign)
                    formatted = '' + formatted;
                else
                    formatted = '+' + formatted;
            }
        }

        // apply the prefix
        if (this.prefix) formatted = this.prefix + formatted;

        // apply the suffix
        if (this.suffix) formatted = formatted + this.suffix;

        return formatted;
    }

}