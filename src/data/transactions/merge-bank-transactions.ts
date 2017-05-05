import {DbTransaction, TransactionStringEnv} from '../../db/transaction';
import {BankTransaction} from '../records/bank-transaction';
import {Account} from '../records/account';
import {TransactionProcessor} from '../../db/transaction-processor';
import {Logger} from '../../services/logger';
import Big from 'big.js';


export class MergeBankTransactions extends DbTransaction {


    inserts: {date: string; status: string; description: string; amount: BigJsLibrary.BigJS}[];
    upgrades: {bankTransactionId: number, date: string; status: string; description: string; amount: BigJsLibrary.BigJS}[];
    flags: {bankTransactionId: number, flag: string; set: boolean}[];
    accountId: number;
    checksum: string;
    accountBalance: BigJsLibrary.BigJS;
    timestamp: string; 

    getTypeId(): string {
        return 'MergeBankTransactions';
    }

    apply(tp: TransactionProcessor) {

        // TODO: Validation
        
        // Validate checksum, otherwise error... ? (or just skip it ?)
        if (!this.validateChecksum(tp)) {
            Logger.get('MergeBankTransactions').info("Invalid checksum in applying MergeBankTransactions... skipping");
            return;
        }

        let table = tp.table(BankTransaction);

        if (this.inserts) {
            for (let i = 0; i < this.inserts.length; i++) {
                let t = new BankTransaction();
                t.id = this.id * 100000 + i;
                t.amount = this.inserts[i].amount;
                t.date = this.inserts[i].date;
                t.description = this.inserts[i].description;
                t.status = <any> this.inserts[i].status;
                t.accountId = this.accountId;
                table.insert(t);        
                tp.mapTransactionAndRecord(this, t);
            }
        }

        if (this.upgrades) {
            for (let i = 0; i < this.upgrades.length; i++) {
                let t = table.by('id', <any> this.upgrades[i].bankTransactionId);
                t.amount = this.upgrades[i].amount;
                t.date = this.upgrades[i].date;
                t.description = this.upgrades[i].description;
                t.status = <any> this.upgrades[i].status;
                t.accountId = this.accountId;

                // TODO: upgrade date / change log push to record
                table.update(t);
            }
        }

        if (this.flags) {
            for (let i = 0; i < this.flags.length; i++) {
                let t = table.by('id', <any> this.flags[i].bankTransactionId);
                let flagName = this.flags[i].flag;
                t['flag' + flagName.substring(0,1).toUpperCase() + flagName.substring(1)] = this.flags[i].set;

                // TODO: upgrade date / change log push to record
                table.update(t);
            }
        }


        // TODO: Move this to be a processor
        let openingBankBalance = tp.table(Account).by('id', <any> this.accountId).x.openingBankBalance || new Big('0');
        tp.table(Account).by('id', <any> this.accountId).x.calculatedBankBalance = table.chain().find({'accountId': this.accountId}).data().filter(t => !t.flagRemoved).reduce((a, b) => a.plus(b.amount), openingBankBalance);
        tp.table(Account).by('id', <any> this.accountId).x.bankBalance = this.accountBalance;
        tp.table(Account).by('id', <any> this.accountId).x.bankBalanceTimestamp = this.timestamp;

    }

    validateChecksum(tp: TransactionProcessor): boolean {
        if (!this.checksum) return true;
        
        let allData = tp.table(BankTransaction).chain().find({'accountId': <any> this.accountId}).data().filter(t => t.id < this.id * 100000);
        let checksum = allData.filter(t => t.status === 'processed').length + "_" + allData.filter(t => t.status === 'authorised').length + "_" + allData.filter(t => t.status === 'recent').length;
        return this.checksum === checksum;
    }

    generateChecksum(tp: TransactionProcessor) {
        let allData = tp.table(BankTransaction).chain().find({'accountId': <any> this.accountId}).data();
        this.checksum = allData.filter(t => t.status === 'processed').length + "_" + allData.filter(t => t.status === 'authorised').length + "_" + allData.filter(t => t.status === 'recent').length;
    }

    update(tp: TransactionProcessor) {
        tp.unsupported();
    }
    
    undo(tp: TransactionProcessor) {
        tp.unsupported(); // This will need to be undone by re-running from last snapshot rather than rolling back
    }
    
    deserialize(field: string, value: any): any {
        if (field === 'inserts' || field === 'upgrades') {
            value.forEach(line => {
                line.amount = new Big(line.amount);
            });
        }
        if (field === 'accountBalance')
            value = new Big(value);
        return value;
    }

    toHumanisedString(env: TransactionStringEnv): string {
        if (env.action === 'apply') {
            return "New bank transactions synced";
        } else if (env.action === 'update') {
            return '';
        } else {
            return '';
        } 
    }


}

