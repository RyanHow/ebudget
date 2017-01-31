import {Pipe} from '@angular/core';
import {PriceFormat} from './price-Format';

@Pipe({
    name: 'cFormat'
})
export class CFormatPipe  {

    transform(val, args) {
        let pf = new PriceFormat(null, null);
        let formattedVal = pf.formatIt(val);
        
        if (parseFloat(val) < 0) {
            formattedVal = '(' + formattedVal + ')';
        }
        
        return '$' + formattedVal;
        
    }


}