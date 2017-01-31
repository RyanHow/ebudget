import {Logger} from '../services/logger';
import { ErrorHandler } from '@angular/core';

export class AppExceptionHandler extends ErrorHandler {
    call(exception: any, stackTrace?: any, reason?: string): void {
        Logger.get('exception').error(exception);
    }
}
