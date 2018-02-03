import { Component, ViewChild } from "@angular/core";
import { Nav, NavParams, ViewController, IonicPage } from "ionic-angular";
import { CreateSplitTransaction } from "../../data/transactions/create-split-transaction";
import { Category } from "../../data/records/category";
import { Engine } from "../../engine/engine";
import { Utils } from "../../services/utils";
import { Transaction } from "../../data/records/transaction";
import { EngineFactory } from "../../engine/engine-factory";
import { Big } from "big.js";
import { BankTransaction } from "../../data/records/bank-transaction";
import { ReconcileBankTransaction } from "../../data/transactions/reconcile-bank-transaction";

export class TransactionWizardDataModel {

    editing: boolean;

    // Opening in this mode, or inferred from the data on editing
    // Expense : Money Total > 0, Money In : Money Total < 0, Transfer : Money Total = 0
    transactionType: 'Expense' | 'Money In' | 'Transfer';

    // The opening / default category (or multiple if split ??)
    category: Category; 

    engine: Engine;
    transaction: CreateSplitTransaction;

    // Actual data
    date: string;
    description: string;

    negative: boolean;

    lines: Array<{
        categoryId: number;
        amount: string;
        negative: boolean;
    }>;

    accountLines: Array<{
        accountId: number;
        amount: string;
        negative: boolean;
    }>;

    // TODO: Reconciliations - The records AND the transactions AND the changes, eg. adding, editing, removing - At the moment they are all "Adding"    

    reconciliation: Array<{
        bankTransaction: BankTransaction;
        accountId: number; // This assumes we can only have 1 account transaction per account... that would be correct wouldn't it ?!?
        amount: Big;
        transaction: ReconcileBankTransaction;
    }>;


    get total(): Big {
        if (!this.lines) return new Big(0);
        return this.lines.reduce((tot, line) => tot.plus(line.amount ? line.amount : 0), new Big(0));
    }


}