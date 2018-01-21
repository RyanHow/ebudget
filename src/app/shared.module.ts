import { NgModule, ErrorHandler } from '@angular/core';
import { CurrencyField } from "../components/currency-field";
import { CurrencyDisplay } from "../components/currency-display";
import { CFormatPipe } from "../components/currency-format";

@NgModule({
  declarations: [
    CurrencyField,
    CurrencyDisplay,
    CFormatPipe
  ],
  imports: [
  ],
  providers: [
  ],
  exports: [
    CurrencyField,
    CurrencyDisplay,
    CFormatPipe
  ]
})
export class SharedModule {
}