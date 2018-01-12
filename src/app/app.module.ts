import {NgModule, ErrorHandler} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {HttpModule} from '@angular/http';
import {IonicApp, IonicModule} from 'ionic-angular';
import {App} from './app.component';
import {AppReady} from './app-ready';
import {AppExceptionHandler} from './app-exception-handler';
import {HomePage} from '../pages/home/home';
import {BudgetSettingsPage} from '../pages/budget-settings/budget-settings';
import {AccountPage} from '../pages/account/account';
import {BankAccountPage} from '../pages/bank-account/bank-account';
import {BudgetPage} from '../pages/budget/budget';
import {AboutPage} from '../pages/about/about';
import {CategoryPage, CategoryPopover} from '../pages/category/category';
import {SettingsPage} from '../pages/settings/settings';
import {DevPage} from '../pages/dev/dev';
import {NotificationsPage} from '../pages/notifications/notifications';
import {ShareBudgetModal} from '../modals/share-budget/share-budget';
import {AddBudgetModal} from '../modals/add-budget/add-budget';
import {AddEditCategoryModal} from '../modals/add-edit-category/add-edit-category';
import {AddEditCategorySimpleWeeklyModal} from '../modals/add-edit-category-simple-weekly/add-edit-category-simple-weekly';
import {AddEditTransactionModal} from '../modals/add-edit-transaction/add-edit-transaction';
import {AddEditSplitTransactionModal} from '../modals/add-edit-split-transaction/add-edit-split-transaction';
import {AddEditSplitTransactionLineModal} from '../modals/add-edit-split-transaction/add-edit-split-transaction-line';
import {AddEditSplitTransferModal} from '../modals/add-edit-split-transfer/add-edit-split-transfer';
import {AddEditSplitTransferLineModal} from '../modals/add-edit-split-transfer/add-edit-split-transfer-line';
import {AddEditTransferModal} from '../modals/add-edit-transfer/add-edit-transfer';
import {AddEditAccountModal} from '../modals/add-edit-account/add-edit-account';
import {MainMenuContent} from '../components/main-menu-content/main-menu-content';
import {NotificationList} from '../components/notification-list/notification-list';
import {MainMenuIcon} from '../components/main-menu-icon/main-menu-icon';
import {Dbms} from '../db/dbms';
import {PersistenceProviderManager} from '../db/persistence-provider-manager';
import {EditorProvider} from '../services/editor-provider';
import {Configuration} from '../services/configuration-service';
import {BankProviderRegistry} from '../bank/bank-provider-registry';
import {StandardHostInterface} from '../bank/standard-host-interface';
import {TransactionSync} from '../bank/transaction-sync';
import {BankSync} from '../bank/bank-sync';
import {Replication} from '../services/replication-service';
import {UpdatedCheck} from '../services/updated-check';
import {UpdateCheck} from '../services/update-check';
import {CurrencyFormatter} from '../services/currency-formatter';
import {Notifications} from '../services/notifications';
import {TransactionSerializer} from '../db/transaction-serializer';
import {EngineFactory} from '../engine/engine-factory';
import {CurrencyField} from '../components/currency-field';
import {NoFocusDirective} from '../components/no-focus';
import {ErrorLabel} from '../components/error-label';
import {ReplicationErrorDisplay} from '../components/replication-error-display';
import {CurrencyDisplay} from '../components/currency-display';
import {DFormatPipe} from '../components/date-format';
import {CFormatPipe} from '../components/currency-format';
import {CuteProgressBar} from '../components/cute-progress-bar';
import {SplashScreen} from '@ionic-native/splash-screen';
import {StatusBar} from '@ionic-native/status-bar';
import {SQLite} from '@ionic-native/sqlite';
import {Device} from '@ionic-native/device';
import {InAppBrowser} from '@ionic-native/in-app-browser';
import { Clipboard } from '@ionic-native/clipboard';
import { ViewBankTransactionModal } from "../modals/view-bank-transaction/view-bank-transaction";
import { SecureStorage } from "@ionic-native/secure-storage";
import { DemoService } from "../demo/demo-service";
import { DemoSetup } from "../demo/demo-setup";
import { Autofocus } from "../services/autofocus";
import { BankLinkPage } from "../pages/bank-link/bank-link";
import { AddEditBankLinkModal } from "../modals/add-edit-bank-link/add-edit-bank-link";
import { SecurePrompt } from "../services/secure-prompt";
import { InAppBrowserInterfaceFactory } from "../bank/in-app-browser-interface-factory";
import { BankLinkLocal } from "../bank/bank-link-local";
import { BankAutoSync } from "../bank/bank-auto-sync";
import { Status } from "../components/status/status";
import { ReconciliationStatus } from "../services/reconciliation-status";
import { AddEditSplitTransactionModal2, TransactionTypePopover } from "../modals/add-edit-split-transaction/add-edit-split-transaction-2";
import { AddEditSplitTransactionRoot } from "../modals/add-edit-split-transaction/add-edit-split-transaction-root";

@NgModule({
  declarations: [
    App,
    HomePage,
    BudgetSettingsPage,
    AccountPage,
    BudgetPage,
    CategoryPage,
    SettingsPage,
    DevPage,
    AboutPage,
    NotificationsPage,
    BankAccountPage,
    ShareBudgetModal,
    AddBudgetModal,
    AddEditCategoryModal,
    AddEditTransactionModal,
    AddEditSplitTransactionModal,
    AddEditSplitTransactionModal2,
    AddEditSplitTransactionRoot,
    AddEditSplitTransactionLineModal,
    AddEditSplitTransferModal,
    AddEditSplitTransferLineModal,
    AddEditTransferModal,
    AddEditAccountModal,
    AddEditCategorySimpleWeeklyModal,
    ViewBankTransactionModal,
    CurrencyField,
    Status,
    NoFocusDirective,
    ErrorLabel,
    ReplicationErrorDisplay,
    CurrencyDisplay,
    DFormatPipe,
    MainMenuContent,
    CategoryPopover,
    TransactionTypePopover,
    CFormatPipe,
    CuteProgressBar,
    MainMenuIcon,
    NotificationList,
    BankLinkPage,
    AddEditBankLinkModal
  ],
  imports: [
    BrowserModule,
    HttpModule,
    IonicModule.forRoot(App, { swipeBackEnabled: false })
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    App,
    HomePage,
    BankAccountPage,
    BudgetSettingsPage,
    BudgetPage,
    AccountPage,
    CategoryPage,
    SettingsPage,
    DevPage,
    AboutPage,
    NotificationsPage,
    ShareBudgetModal,
    AddBudgetModal,
    AddEditCategoryModal,
    AddEditTransactionModal,
    AddEditSplitTransactionModal,
    AddEditSplitTransactionModal2,
    AddEditSplitTransactionRoot,
    AddEditSplitTransactionLineModal,
    AddEditSplitTransferModal,
    AddEditSplitTransferLineModal,
    AddEditTransferModal,
    AddEditAccountModal,
    AddEditCategorySimpleWeeklyModal,
    ViewBankTransactionModal,
    CategoryPopover,
    TransactionTypePopover,
    BankLinkPage,
    AddEditBankLinkModal
  ],
  providers: [
  {provide: ErrorHandler, useClass: AppExceptionHandler},
  BankAutoSync,
  BankLinkLocal,
  StandardHostInterface,
  BankProviderRegistry,
  InAppBrowserInterfaceFactory,
  SecurePrompt,
  TransactionSync,
  BankSync,
  Device,
  Clipboard,
  SecureStorage,
  SQLite,
  InAppBrowser,
  SplashScreen,
  StatusBar,
  AppReady,
  UpdatedCheck,
  UpdateCheck,
  Notifications,
  CurrencyFormatter,
  EditorProvider,
  Configuration,
  PersistenceProviderManager,
  Dbms,
  TransactionSerializer,
  EngineFactory,
  Replication,
  DemoService,
  DemoSetup,
  Autofocus,
  ReconciliationStatus]
})
export class AppModule {
  constructor(updatedCheck: UpdatedCheck, updateCheck: UpdateCheck, bankAutoSync: BankAutoSync, reconciliationStatus: ReconciliationStatus) {}
}