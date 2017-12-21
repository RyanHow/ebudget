import { BankSyncMonitor } from "./bank-sync";
import { Notifications } from "../services/notifications";

export class BankSyncUtils {

    static createMonitorWithNotifications(notifications: Notifications): BankSyncMonitor {
        return BankSyncUtils.notificationsOnMonitor(notifications, new BankSyncMonitor());
    }

    static notificationsOnMonitor(notifications: Notifications, monitor: BankSyncMonitor): BankSyncMonitor {
        monitor.on('error-state-change').subscribe(() => {
            if (!monitor.running) notifications.show({message: 'Bank Sync ' + monitor.bankLink.name + ' Failed with Error ' + monitor.errorMessage, category: 'bank-sync.' + monitor.bankLink.uuid});
        });
        monitor.on('complete-state-change').subscribe(() => {
            notifications.show({message: 'Bank Sync ' + monitor.bankLink.name + ' Complete' + (monitor.errorMessage ? ' With Errors ' + monitor.errorMessage : ''), category: 'bank-sync.' + monitor.bankLink.uuid});
        });
        monitor.on('cancelled-state-change').subscribe(() => {
            notifications.show({message: 'Bank Sync ' + monitor.bankLink.name + ' Cancelled', category: 'bank-sync.' + monitor.bankLink.uuid});        
        });
        return monitor;

    }
}