import {Injectable} from '@angular/core';
import {ProviderInterface, ProviderSchema} from './provider-interface';

@Injectable()
export class BankProviderRegistry {

    private providers = new Map<string, {Provider: new() => ProviderInterface, schema: ProviderSchema}>();

    registerProvider(Provider: new() => ProviderInterface) {
        let schema  = new Provider().getSchema();
        let providerName = schema.name;
        if (this.providers.has(providerName)) {
            throw new Error("Bank provider '" + providerName + "' is already registered");
        }
        this.providers.set(providerName, {Provider: Provider, schema: schema});
    }

    newProvider(providerName: string): ProviderInterface {
        let providerInfo = this.providers.get(providerName);
        let provider = new providerInfo.Provider();

        return provider;
    }

    getProviderNames(): string[] {
        return Array.from(this.providers.keys());
    }

}