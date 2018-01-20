import { NgModule, ErrorHandler } from '@angular/core';
import { CurrencyField } from "../components/currency-field";
import { CurrencyDisplay } from "../components/currency-display";

@NgModule({
  declarations: [
    CurrencyField,
    CurrencyDisplay
  ],
  imports: [
  ],
  providers: [
  ],
  exports: [
    CurrencyField,
    CurrencyDisplay
  ]
})
export class SharedModule {
}