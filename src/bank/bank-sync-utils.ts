import { BankSyncMonitor } from "./bank-sync-monitor";
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

    static timeoutWatchdogNotification(notifications: Notifications, monitor: BankSyncMonitor, timeoutSeconds: number) {
        
        if (!monitor.running) {
            // TODO: With observables we should be able to replay this on subscribe...
            monitor.on('running-state-change').subscribe(() => {
                if (monitor.running) {
                    BankSyncUtils.iterateTimeoutWatchdogNotification(notifications, monitor, timeoutSeconds);
                }
            });
        } else {

        }

        return monitor;
    }

    // Note: We are polling here rather than setting a long timeout so we can manage memory tighter (and not end up with long timeouts and dangling references to live bank syncs)
    private static iterateTimeoutWatchdogNotification(notifications: Notifications, monitor: BankSyncMonitor, timeoutSeconds: number) {
        if (!monitor.running) {
            notifications.remove({category: 'bank-sync.' + monitor.bankLink.uuid + '.timeout-watchdog'});
            return;
        }
        if (Date.now() - monitor.startTime > timeoutSeconds * 1000) {
            // TODO: This remove/show should be a single operation in the notifications options
            notifications.remove({category: 'bank-sync.' + monitor.bankLink.uuid + '.timeout-watchdog'});
            notifications.show({message: 'Bank Sync ' + monitor.bankLink.name + ' is taking too long to complete', category: 'bank-sync.' + monitor.bankLink.uuid + '.timeout-watchdog', important: true});
            setTimeout(() => BankSyncUtils.iterateTimeoutWatchdogNotification(notifications, monitor, timeoutSeconds * 2), 5000);            
        } else {
            setTimeout(() => BankSyncUtils.iterateTimeoutWatchdogNotification(notifications, monitor, timeoutSeconds), 5000);
        }

    }

}