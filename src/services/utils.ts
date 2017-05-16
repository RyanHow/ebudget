import moment from 'moment';

export class Utils {
    
    public static readonly STANDARD_DATE_FORMAT = 'YYYYMMDD';

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

    static javaScriptEscape(value: string): string {
        return value.replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/"/g,'\\"').replace(/\r/g,'').replace(/\n/g,'');
    }
}

