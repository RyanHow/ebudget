import { Component } from "@angular/core";
import { AddEditSplitTransactionModal } from "./add-edit-split-transaction";
import { Nav, NavParams, ViewController } from "ionic-angular";

@Component({
    templateUrl: 'add-edit-split-transaction-root.html'
})
export class AddEditSplitTransactionRoot {
    modalPage: any;
    modalPageParams: any;

    constructor(private navParams: NavParams, private viewCtrl: ViewController) {
        
    }

    ngOnInit() {
        this.modalPageParams = this.navParams.data;
        this.modalPage = AddEditSplitTransactionModal;
    }

    dismiss() {
        this.viewCtrl.dismiss();
      }
    
}