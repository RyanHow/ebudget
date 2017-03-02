import {Directive, ElementRef} from '@angular/core';
import {NgControl} from '@angular/forms';
//import MaskedInput from 'ionic2-input-mask';
import {Configuration} from '../services/configuration-service';
import {Platform} from 'ionic-angular';

@Directive({
  host: {
    '(input)': 'onInput()'
  },
  selector: 'ion-input[currency-field]'
})
export class CurrencyField {
    
    //maskedInput: MaskedInput;
    htmlInputElement: HTMLInputElement;

    constructor(private elementRef: ElementRef, private ngControl: NgControl, private platform: Platform, private configuration: Configuration) {
        if (!(this.platform.is('ios') || this.platform.is('android'))) {
//            this.maskedInput = new MaskedInput(elementRef, ngControl);
//            this.maskedInput.textMaskConfig = <any> {mask: this.numberMask.bind(this), placeholderChar: '0'};
        }
    }
    ngAfterViewInit(): void {
        this.htmlInputElement = this.elementRef.nativeElement.children[0];

        //if (this.maskedInput) {
            //this.maskedInput.ngAfterViewInit();
        //}
        if (this.platform.is('ios') || this.platform.is('android')) {
            this.htmlInputElement.setAttribute('type', 'number');
            this.htmlInputElement.setAttribute('step', '0.01');
        }

/*        this.htmlInputElement.addEventListener('input', (ev) => {
            let val = this.htmlInputElement.value;
            let parts = val.split('.');
            if (parts.length > 1) {
                let cents = parts[1];
                if (cents.length > 2) cents = cents.substring(0,2);
                val = parts[0] + '.' + cents;
            }
            val = val.replace(/[^0-9.]/g, '');
            if (val !== this.htmlInputElement.value) this.htmlInputElement.value = val;
        });
*/

        this.htmlInputElement.setAttribute('placeholder', '0.00');

    }
    onInput(): void {
        let val = this.htmlInputElement.value;

        val = val.replace(/[^0123456789.]/g, '');

        let parts = val.split('.');
        if (parts.length > 1) {
            let cents = parts[1];
            if (cents.length > 2) cents = cents.substring(0,2);
            val = parts[0] + '.' + cents;
        }
        if (val !== this.htmlInputElement.value) this.htmlInputElement.value = val;

        this.ngControl.viewToModelUpdate(this.htmlInputElement.value)
    }



/*
    dollarSign = '$';
    emptyString = '';
    comma = ',';
    period = '.';
    nonDigitsRegExp = /\D+/g;
    digitRegExp = /\d/;


    numberMask(rawValue) {
        let prefix = this.emptyString;
        let suffix = this.emptyString;
        let includeThousandsSeparator = true;
        let thousandsSeparatorSymbol = this.comma;
        let allowDecimal = true;
        let decimalSymbol = this.period;
        let decimalLimit = 2;
        let requireDecimal = true;
        const rawValueLength = rawValue.length;

        if (rawValue === this.emptyString || (rawValue[0] === prefix[0] && rawValueLength === 1)) {
            return prefix.split(this.emptyString).concat([<any>this.digitRegExp]).concat(suffix.split(this.emptyString));
        }

        const indexOfLastDecimal = rawValue.lastIndexOf(decimalSymbol);
        const hasDecimal = indexOfLastDecimal !== -1;

        let integer;
        let fraction;
        let mask;

        if (hasDecimal && (allowDecimal || requireDecimal)) {
        integer = rawValue.slice(0, indexOfLastDecimal);

        fraction = rawValue.slice(indexOfLastDecimal + 1, rawValueLength);
        fraction = this.convertToMask(fraction.replace(this.nonDigitsRegExp, this.emptyString));
        } else {
        integer = rawValue;
        }

        integer = integer.replace(this.nonDigitsRegExp, this.emptyString);

        integer = (includeThousandsSeparator) ? this.addThousandsSeparator(integer, thousandsSeparatorSymbol) : integer;

        mask = this.convertToMask(integer);

        if ((hasDecimal && allowDecimal) || requireDecimal === true) {
        if (rawValue[indexOfLastDecimal - 1] !== decimalSymbol) {
            mask.push('[]');
        }

        mask.push(decimalSymbol, '[]');

        if (fraction) {
            if (typeof decimalLimit === 'number') {
            fraction = fraction.slice(0, decimalLimit);
            }

            mask = mask.concat(fraction);
        } else if (requireDecimal === true) {
            for (let i = 0; i < decimalLimit; i++) {
            mask.push(this.digitRegExp);
            }
        }
        }

        if (prefix.length > 0) {
        mask = prefix.split(this.emptyString).concat(mask);
        }

        if (suffix.length > 0) {
        mask = mask.concat(suffix.split(this.emptyString));
        }

        return mask;
    }

    convertToMask(strNumber) {
    return strNumber
        .split(this.emptyString)
        .map((char) => this.digitRegExp.test(char) ? this.digitRegExp : char);
    }

    // http://stackoverflow.com/a/10899795/604296
    addThousandsSeparator(n, thousandsSeparatorSymbol) {
    return n.replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSeparatorSymbol);
    }

*/


}



