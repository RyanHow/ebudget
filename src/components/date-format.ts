import {Pipe} from '@angular/core';
import * as moment from 'moment';


@Pipe({
    name: 'dFormat'
})
export class DFormatPipe {

    transform(val, args) {
        var m = moment(val, 'YYYYMMDD');
        if (m.year() === new Date().getFullYear()) {
            return m.format('DD MMM');
        } else {
            return m.format('DD MMM YYYY');
        }
    }

}