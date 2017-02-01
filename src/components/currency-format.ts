import {Pipe} from '@angular/core';
//import {PriceFormat} from './price-Format';

@Pipe({
    name: 'cFormat'
})
export class CFormatPipe  {

    transform(val, args) {
        let formattedVal = val; this.price_format(val, false);
        
        if (parseFloat(val) < 0) {
            formattedVal = '(' + formattedVal + ')';
        }
        
        return '$' + formattedVal;
        
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

    fill_with_zeroes(str) {
        while (str.length < (this.centsLimit + 1)) str = '0' + str;
        return str;
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