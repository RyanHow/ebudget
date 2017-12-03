import { Injectable } from "@angular/core";
import { Configuration, SecureAccessor } from "./configuration-service";
import { AlertController } from "ionic-angular";

@Injectable()
export class SecurePrompt {

    constructor(private configuration: Configuration, private alertController: AlertController) {

    }
    
    show(secureAccessor: SecureAccessor, field: string): Promise<void | boolean> {

        if (!this.configuration.secureAvailable()) {
            return this.alertController.create({
                title: 'Secure Stoarge',
                message: "Secure storage is unavailable: TODO: Why",
                buttons: ['OK']
            }).present();
        }

        return new Promise<boolean>((resolve, reject) => {

            let prompt = this.alertController.create({
                title: 'Secure Stoarge',
                message: 'Enter secure data for "' + field + '"',
                inputs: [
                    {
                        name: 'data',
                        placeholder: 'Secure Data',
                        type: 'password'
                    },
                ],
                buttons: [
                    {
                        text: 'Cancel',
                        role: 'cancel',
                        handler: data => {
                            resolve(false);
                        }
                    },
                    {
                        // TODO: Only if data already present
                        text: 'Delete',
                        cssClass: 'danger',
                        handler: data => {
                            secureAccessor.removeSecure(field).then(() => {
                                resolve(false);
                            }).catch(error => {
                                // TODO: Prompt / log error ?
                                resolve(false);
                            });
                        }
                    },
                    {
                        text: 'Save',
                        handler: data => {
                            secureAccessor.setSecure(field, data.data).then(() => {
                                resolve(true);
                            }).catch(error => {
                                // TODO: Prompt / log error ?
                                resolve(false);
                            });
                        }
                    }
                ]
            });

            prompt.present();

        });


    }

}