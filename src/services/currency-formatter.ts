import {Injectable} from '@angular/core';
import {CFormatPipe} from '../components/currency-format';

@Injectable()
export class CurrencyFormatter {

    format(value: any): string {
        // TODO: Use a currency format lib
        // TODO: replace cformat and others to use this service
        // TODO: This service can get the locale from config?, or also take into account the currency type
        return "$" + new CFormatPipe().price_format(value, false);
    }
}