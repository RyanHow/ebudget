import {NavController, ViewController, NavParams, AlertController, Alert} from 'ionic-angular';
import {Dbms} from '../../db/dbms';
import {Configuration} from '../../services/configuration-service';
import {Component} from '@angular/core';
import { Big } from 'big.js';
import {AddEditSplitTransferModal} from './add-edit-split-transfer';
import {Engine} from '../../engine/engine';

@Component({
  templateUrl: 'add-edit-split-transfer-line.html'
})
export class AddEditSplitTransferLineModal {

  parent: AddEditSplitTransferModal;
  line: any;
  lineIndex: number;
  engine: Engine;
  
  constructor(private configuration: Configuration, public viewCtrl: ViewController, private navParams: NavParams, private dbms: Dbms, private nav: NavController, private alertController: AlertController) {

    this.parent = navParams.data.parent;
    this.engine = this.parent.engine;
    this.lineIndex = navParams.data.lineIndex;
    this.line = navParams.data.parent.data.lines[this.lineIndex];

  }

  ionViewDidEnter() {
    if (this.line.categoryId == null) {
      this.showCategorySelect().onDidDismiss(() => {
        if (this.line.categoryId == null) this.viewCtrl.dismiss();
      });
    }

    this.viewCtrl.onDidDismiss(() => {
      if (this.line.categoryId == null) {
        this.parent.data.lines.splice(this.parent.data.lines.indexOf(this.line), 1);
      }
    });
  }

  showCategorySelect(): Alert {
    let alert = this.alertController.create();
    this.engine.getCategories('alphabetical').forEach(category => {
      if (!this.parent.data.lines.some(line => line !== this.line && line.categoryId === category.id))
        alert.addInput({type: 'radio', label: category.name, value: category.id.toString(), checked: category.id === this.line.categoryId});
    });

    alert.addButton('Cancel');
    alert.addButton({
      text: 'Ok',
      handler: data => {
        this.line.categoryId = Number(data);
      }
    });

    alert.present();
    return alert;
  }
    
  submit(event: Event) {
    event.preventDefault();
    this.viewCtrl.dismiss();
  }
} 