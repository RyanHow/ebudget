import { NgModule, ErrorHandler } from '@angular/core';
import { CurrencyField } from "../components/currency-field";
import { CurrencyDisplay } from "../components/currency-display";
import { CFormatPipe } from "../components/currency-format";
import { DFormatPipe } from "../components/date-format";
import { NoClickFocus } from "../components/no-click-focus";

@NgModule({
  declarations: [
    CurrencyField,
    CurrencyDisplay,
    CFormatPipe,
    DFormatPipe,
    NoClickFocus
  ],
  imports: [
  ],
  providers: [
  ],
  exports: [
    CurrencyField,
    CurrencyDisplay,
    CFormatPipe,
    DFormatPipe,
    NoClickFocus
  ]
})
export class SharedModule {
}