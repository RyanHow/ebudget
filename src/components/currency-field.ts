import {Directive, ElementRef} from '@angular/core';
import {NgControl} from '@angular/forms';
import MaskedInput from 'ionic2-input-mask';
import {Configuration} from '../services/configuration-service';
import {Platform} from 'ionic-angular';

@Directive({
  host: {
    '(input)': 'onInput()'
  },
  selector: 'ion-input[currency-field]'
})
export class CurrencyField {
    
    maskedInput: MaskedInput;

    constructor(private elementRef: ElementRef, ngControl: NgControl, private platform: Platform, private configuration: Configuration) {
        if (!(this.platform.is('ios') || this.platform.is('android'))) {
            this.maskedInput = new MaskedInput(elementRef, ngControl);
            this.maskedInput.textMaskConfig = <any> {mask: this.numberMask.bind(this), placeholderChar: '0'};
        }
    }
    ngAfterViewInit(): void {
        if (this.maskedInput) {
            this.maskedInput.ngAfterViewInit();
        }
        if (this.platform.is('ios') || this.platform.is('android')) {
            this.elementRef.nativeElement.children[0].setAttribute('type', 'number');
            this.elementRef.nativeElement.children[0].setAttribute('step', '0.01');
        }

        this.elementRef.nativeElement.children[0].setAttribute('placeholder', '0.00');

    }
    onInput(): void {
        if (this.maskedInput) this.maskedInput.onInput();
    }




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




}



