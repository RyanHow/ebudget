import {Injectable} from '@angular/core';
import {HostInterface} from './host-interface';
import { Configuration } from "../services/configuration-service";

@Injectable()
export class StandardHostInterface implements HostInterface {

    constructor(private configuration: Configuration) {

    }

    prompt(){}
    notify(){}

}