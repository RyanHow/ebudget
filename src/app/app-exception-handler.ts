import {Logger} from '../services/logger';
import {ErrorHandler} from '@angular/core';

export class AppExceptionHandler implements ErrorHandler {

    handleError(error: any) : void {
        // TODO: Handle the error in the logger better
        if (error._nativeError) {
            Logger.get('error').info(error);
            Logger.get('error').error(error._nativeError);
        } else {
            Logger.get('error').error(error);
        }
        
    }
}
