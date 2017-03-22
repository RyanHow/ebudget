import {NavController} from 'ionic-angular';
import {Component} from '@angular/core';
import {Configuration} from '../../services/configuration-service'
import {UpdateCheck} from '../../services/update-check'
import {BuildInfo} from '../../app/build-info'

@Component({
  templateUrl: 'about.html'
})
export class AboutPage {
  projectMenuEnabled: boolean;
  buildInfo = BuildInfo;
  updateCheckDisabled: boolean;
  
  constructor(private nav: NavController, private configuration: Configuration, public updateCheck: UpdateCheck) {
    this.nav = nav;
    this.projectMenuEnabled = true;
  }
  
  serviceWorkerUpdateCheck() {
    this.updateCheckDisabled = true;
    this.updateCheck.triggerServiceWorkerUpdateCheck();
    setTimeout(() => {this.updateCheckDisabled = false}, 5000);
  }

  isWkWebView(): boolean {
    if (navigator.platform.substr(0,2) === 'iP'){
      //iOS (iPhone, iPod or iPad)
      var lte9 = /constructor/i.test((<any>window).HTMLElement);
      var nav: any = window.navigator, ua = nav.userAgent, idb = !!window.indexedDB;
      if (ua.indexOf('Safari') !== -1 && ua.indexOf('Version') !== -1 && !nav.standalone){      
        //Safari (WKWebView/Nitro since 6+)
      } else if ((!idb && lte9) || !window.statusbar.visible) {
        //UIWebView
      } else if (((<any>window).webkit && (<any>window).webkit.messageHandlers) || !lte9 || idb){
        return true;
      }
    }

    return false;
  }
  
    
}
