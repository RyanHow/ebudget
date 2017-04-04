import {Logger} from '../services/logger';
import {ErrorHandler} from '@angular/core';

export class AppExceptionHandler implements ErrorHandler {

    handleError(error: any) : void {
        // TODO: Handle the error in the logger better
        if (error.originalError) {
            Logger.get('error').info(error);
            Logger.get('error').error(error.originalError);
        } else {
            Logger.get('error').error(error);
        }
        
    }
}
