import * as moment from 'moment';

export class Utils {
    
    static nowIonic(): string {
        return moment().format('YYYY-MM-DD');
    }

    static nowYYYYMMDD(): string {
        return moment().format('YYYYMMDD');
    }

    static toYYYYMMDDFromIonic(uiValue: any): string {
        return moment(uiValue.split('T')[0]).format('YYYYMMDD');
    }

    static toIonicFromYYYYMMDD(modelValue: string): any {
        return moment(modelValue, 'YYYYMMDD').format('YYYY-MM-DD');
    }
}