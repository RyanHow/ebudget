import {DbTransaction, TransactionStringEnv} from '../../db/transaction';
import {TransactionProcessor} from '../../db/transaction-processor';
import {Account} from '../records/account';
import {AccountBalanceProcessor} from '../processors/account-balance';
import Big from 'big.js';
import { BankLink } from "../records/bank-link";


export class CreateBankLink extends DbTransaction {

    name: string;
    uuid: string;
    provider: string;
    configuration: any;

    getTypeId(): string {
        return 'CreateBankLink';
    }

    apply(tp: TransactionProcessor) {
        
        // TODO: Validation
        if (this.uuid == null) throw new Error("UUID Required");
        
        let table = tp.table(BankLink);
        let bl = new BankLink();
        bl.id = this.id;
        bl.uuid = this.uuid;
        bl.name = this.name;
        bl.provider = this.provider;
        bl.configuration = this.configuration;

        table.insert(bl);
        tp.mapTransactionAndRecord(this, bl);
    }

    update(tp: TransactionProcessor) {

        // TODO: Validation

        let table = tp.table(BankLink);
        let bl = table.by('id', <any> this.id);
        bl.name = this.name;
        bl.provider = this.provider;
        bl.configuration = this.configuration;
        
        table.update(bl);
    }
    
    undo(tp: TransactionProcessor) {
        let table = tp.table(BankLink);
        let bl = table.by('id', <any> this.id);
        table.remove(bl);
        // No need to unmap as the transaction mapping in the record
    }
    
    deserialize(field: string, value: any): any {
        return value;
    }

    toHumanisedString(env: TransactionStringEnv): string {
        if (env.action === 'apply') {
            return "created bank link " + this.provider;
        } else if (env.action === 'update') {
            return "renamed bank link {{old name}} to " + this.provider;
        } else {
            return "removed bank link " + this.provider;
        } 
    }

}

