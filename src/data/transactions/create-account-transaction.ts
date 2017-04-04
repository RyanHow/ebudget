import {DbTransaction, TransactionStringEnv} from '../../db/transaction';
import {TransactionProcessor} from '../../db/transaction-processor';
import {Account} from '../records/account';


export class CreateAccountTransaction extends DbTransaction {

    name: string;
    accountType: 'Bank' | 'Cash';
    openingBalance: BigJsLibrary.BigJS;


    getTypeId(): string {
        return 'CreateAccountTransaction';
    }

    apply(tp: TransactionProcessor) {
        
        // TODO: Validation
        
        let table = tp.table(Account);
        let a = new Account();
        a.id = this.id;
        a.name = this.name;
        a.openingBalance = this.openingBalance;

        table.insert(a);
        tp.mapTransactionAndRecord(this, a);
    }

    update(tp: TransactionProcessor) {

        // TODO: Validation

        let table = tp.table(Account);
        let a = table.by('id', <any> this.id);
        a.name = this.name;
        a.openingBalance = this.openingBalance;
        table.update(a);
    }
    
    undo(tp: TransactionProcessor) {
        let table = tp.table(Account);
        let a = table.by('id', <any> this.id);
        table.remove(a);
    }
    
    deserialize(field: string, value: any): any {
        return value;
    }

    toHumanisedString(env: TransactionStringEnv): string {
        if (env.action === 'apply') {
            return "created account " + this.name;
        } else if (env.action === 'update') {
            return "renamed account {{old name}} to " + this.name;
        } else {
            return "removed account " + this.name;
        } 
    }

}

