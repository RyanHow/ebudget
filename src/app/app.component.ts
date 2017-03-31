import {Platform, Nav} from 'ionic-angular';
import {ViewChild, Component} from '@angular/core';
import {StatusBar, Splashscreen} from 'ionic-native';
import {HomePage} from '../pages/home/home';
import {BudgetPage} from '../pages/budget/budget';
import {Dbms} from '../db/dbms';
import {PersistenceProviderManager} from '../db/persistence-provider-manager';
import {EditorProvider, ModalProvider} from '../services/editor-provider';
import {Configuration} from '../services/configuration-service';
import {Replication} from '../services/replication-service';
import {TransactionSerializer} from '../db/transaction-serializer';
import {Logger} from '../services/logger';
import {AppReady} from './app-ready';

import {InitBudgetTransaction} from '../data/transactions/init-budget-transaction';
import {InitCategoryTransaction} from '../data/transactions/init-category-transaction';
import {InitSimpleTransaction} from '../data/transactions/init-simple-transaction';
import {InitCategoryTransferTransaction} from '../data/transactions/init-category-transfer-transaction';
import {InitCategorySimpleWeeklyTransaction} from '../data/transactions/init-category-simple-weekly-transaction';
import {AddEditTransferModal} from '../modals/add-edit-transfer/add-edit-transfer';
import {AddEditTransactionModal} from '../modals/add-edit-transaction/add-edit-transaction';

@Component({
  templateUrl: 'app.html'
})
export class App {

  private logger: Logger = Logger.get('App');
  rootPage: any; // = HomePage;
  ready: boolean;
  @ViewChild(Nav) nav: Nav;

  constructor(platform: Platform, private configuration: Configuration, dbms: Dbms, persistenceProviderManager: PersistenceProviderManager, replication: Replication, private transactionSerializer: TransactionSerializer, private editorProvider: EditorProvider, private appReady: AppReady) {
    this.logger.info('Constructing App');
    
    platform.ready().then(() => {
      this.logger.info('Platform Ready');      
      this.logger.info('Initialising Persistence Provider');
      persistenceProviderManager.provide().init().then(() => {
        this.logger.info('Initialising Persistence Provider');
        this.logger.info('Loading Configuration');
        
        return configuration.configure();
      }).then(() => {
        this.registerTransactions();
        this.registerEditorProviders();
        this.logger.info('Loading Configuration Done');
        this.logger.info('Initialising Dbms');
        return dbms.init();
      }).then(() => {
        this.logger.info('Initialising Dbms Done');
        this.logger.info('Initialising Replication');
        replication.init();
        this.logger.info('Initialising Replication Done');

        StatusBar.styleDefault();
        Splashscreen.hide(); // TODO: Move this earlier if want to have a splash screen while the db init runs... can nav.setRoot to a "loading..." page, then set the real page below... Can maybe even have progress updates with the "then()" statements?

        this.ready = true;
        if (configuration.lastOpenedBudget()) {
          let lastOpenedBudgetId = configuration.lastOpenedBudget();
          try {
            let budget = dbms.getDb(lastOpenedBudgetId);
            if (!budget) {
              this.logger.info('Budget ' + lastOpenedBudgetId + ' not found for auto opening');
              this.nav.setRoot(HomePage);
            } else {
              this.nav.setRoot(BudgetPage, {'budget': budget});
            }
          } catch (e) {
            configuration.lastOpenedBudget(null);
            this.logger.error('Unable to auto open budget ' + lastOpenedBudgetId, e);
            this.nav.setRoot(HomePage);
          }
        } else {
            this.nav.setRoot(HomePage);
        }

        appReady.readyResolve();

        }).catch(err => {
          this.logger.error('Error in initialisation', err);
        });


      });
    
    
  }
  
  registerEditorProviders() {
    this.editorProvider.registerModalProvider(new TransactionModalProvider(new InitCategoryTransferTransaction().getTypeId(), AddEditTransferModal));
    this.editorProvider.registerModalProvider(new TransactionModalProvider(new InitSimpleTransaction().getTypeId(), AddEditTransactionModal));
  }

  registerTransactions() {
    this.transactionSerializer.registerType(InitCategoryTransaction);
    this.transactionSerializer.registerType(InitCategoryTransferTransaction);
    this.transactionSerializer.registerType(InitSimpleTransaction);
    this.transactionSerializer.registerType(InitBudgetTransaction);
    this.transactionSerializer.registerType(InitCategorySimpleWeeklyTransaction);
  }

}

class TransactionModalProvider extends ModalProvider {
    
    constructor(private transactionType: string, private modalClass: any) {
        super();
    }
        
    provide(params: any): any {
        if (params.typeId === this.transactionType) return this.modalClass;
    }
}