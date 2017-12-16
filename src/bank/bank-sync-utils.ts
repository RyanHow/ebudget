import { BankSyncMonitor } from "./bank-sync";
import { Notifications } from "../services/notifications";

export class BankSyncUtils {

    static createMonitorWithNotifications(notifications: Notifications): BankSyncMonitor {
        return BankSyncUtils.notificationsOnMonitor(notifications, new BankSyncMonitor());
    }

    static notificationsOnMonitor(notifications: Notifications, monitor: BankSyncMonitor): BankSyncMonitor {
        monitor.on('error-state-change').subscribe(() => {
            if (!monitor.running) notifications.notify('Bank Sync ' + monitor.bankLink.name + ' Failed with Error ' + monitor.errorMessage);
        });
        monitor.on('complete-state-change').subscribe(() => {
            notifications.notify('Bank Sync ' + monitor.bankLink.name + ' Complete' + (monitor.errorMessage ? ' With Errors ' + monitor.errorMessage : ''));
        });
        monitor.on('cancelled-state-change').subscribe(() => {
            notifications.notify('Bank Sync ' + monitor.bankLink.name + ' Cancelled');        
        });
        return monitor;

    }
}