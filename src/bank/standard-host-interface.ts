import {Injectable} from '@angular/core';
import {HostInterface} from './host-interface';

@Injectable()
export class StandardHostInterface implements HostInterface {
    requestInteraction(){}
    prompt(){}
    notify(){}
    provideBrowser(){}

}