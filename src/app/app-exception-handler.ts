import {Logger} from '../services/logger';
import { ErrorHandler } from '@angular/core';

export class AppExceptionHandler extends ErrorHandler {

    handleError(error: any) {
        Logger.get('error').error(error);
    }
}
