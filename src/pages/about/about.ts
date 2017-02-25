import {NavController} from 'ionic-angular';
import {Component} from '@angular/core';
import {Configuration} from '../../services/configuration-service'
import {BuildInfo} from '../../app/build-info'

@Component({
  templateUrl: 'about.html'
})
export class AboutPage {
  projectMenuEnabled: boolean;
  buildInfo = BuildInfo;
  
  constructor(private nav: NavController, private configuration: Configuration) {
    this.nav = nav;
    this.projectMenuEnabled = true;
  }
  
  
    
}
