import {DbTransaction, TransactionStringEnv} from '../../db/transaction';
import {TransactionProcessor} from '../../db/transaction-processor';
import {Account} from '../records/account';
import {AccountBalanceProcessor} from '../processors/account-balance';
import Big from 'big.js';


export class SetAccountBankLink extends DbTransaction {

    id: number;
    accountId: number;
    bankLinkId: number;
    configuration: any;

    getTypeId(): string {
        return 'SetAccountBankLinkTransaction';
    }

    apply(tp: TransactionProcessor) {
        
        // TODO: Validation - bank link Id is valid
        
        let table = tp.table(Account);
        let a = table.by('id', <any> this.accountId);
        a.bankLinkId = this.bankLinkId;
        a.bankLinkConfiguration = this.configuration;

        tp.mapTransactionAndRecord(this, a);
        table.update(a);
    }

    update(tp: TransactionProcessor) {

        // TODO: Validation cannot change account id
        this.apply(tp);
    }
    
    undo(tp: TransactionProcessor) {
        let table = tp.table(Account);
        let a = table.by('id', <any> this.accountId);
        delete a.bankLinkId;
        delete a.bankLinkConfiguration;

        tp.unmapTransactionAndRecord(this, a);
        
    }
    
    deserialize(field: string, value: any): any {
        return value;
    }

    toHumanisedString(env: TransactionStringEnv): string {
        if (env.action === 'apply') {
            return "created account bank link";
        } else if (env.action === 'update') {
            return "updated account bank link";
        } else {
            return "removed account bank link";
        } 
    }

}

