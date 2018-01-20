import { Component, ViewChild } from "@angular/core";
import { Nav, NavParams, ViewController, IonicPage } from "ionic-angular";
import { CreateSplitTransaction } from "../../data/transactions/create-split-transaction";
import { Category } from "../../data/records/category";
import { Engine } from "../../engine/engine";
import { Utils } from "../../services/utils";
import { Transaction } from "../../data/records/transaction";
import { EngineFactory } from "../../engine/engine-factory";

export class TransactionWizardDataModel {

    editing: boolean;

    expense: boolean;
    date: string;
    description: string;
    accountId: number;
    status: 'realised' | 'anticipated';

    transactionType: string;
    category: Category;
    engine: Engine;
    transaction: CreateSplitTransaction;

    total: string;// TODO: Calculate

    lines: Array<{
        categoryId: number;
        accountId?: number;
        amount: string;
        status?: 'realised' | 'anticipated'; // TODO: Override for each line..
        date?: string; // TODO: Override for each line... Can be different realised dates
    }>



}