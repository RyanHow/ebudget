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

    static randomChars(length: number) {
        let text = "";
        let possible = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

        for( let i=0; i < length; i++ )
            text += possible.charAt(Math.floor(Math.random() * possible.length));

        return text;        
    }

    static getQueryStringValue(key: string, url?: string) {
        if (!url) url = window.location.href;
        key = key.replace(/[\[\]]/g, "\\$&");
        var regex = new RegExp("[?&]" + key + "(=([^&#]*)|&|#|$)"),
            results = regex.exec(url);
        if (!results) return null;
        if (!results[2]) return '';
        return decodeURIComponent(results[2].replace(/\+/g, " "));
    }


}

