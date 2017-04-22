import {Injectable} from '@angular/core';
import {ProviderInterface} from './provider-interface';

@Injectable()
export class BankProviderManager {

    private providers = new Map<string, new() => ProviderInterface>();

    registerProvider(Provider: new() => ProviderInterface) {
        let providerName = new Provider().getName();
        if (this.providers.has(providerName)) {
            throw new Error("Bank provider '" + providerName + "' is already registered");
        }
        this.providers.set(providerName, Provider);
    }

    newProvider(providerName: string): ProviderInterface {
        let Provider = this.providers.get(providerName);
        let provider = new Provider();

        // TODO: Track active providers ? OR, provider some kind of wrapper object around them to manager them (which then references the bank manager)?

        return provider;
    }

}