
import React, { createContext, useContext, useState } from 'react';

export type Currency = 'ETB' | 'USD';

interface CurrencyConfig {
  code: Currency;
  symbol: string;
  name: string;
  rate: number; // Exchange rate to USD
}

const CURRENCIES: Record<Currency, CurrencyConfig> = {
  ETB: { code: 'ETB', symbol: 'ETB', name: 'Ethiopian Birr', rate: 56.8 },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', rate: 1.0 },
};

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  formatCurrency: (amount: number, currency?: Currency) => string;
  convertCurrency: (amount: number, from: Currency, to: Currency) => number;
  getCurrencyConfig: (currency: Currency) => CurrencyConfig;
  availableCurrencies: CurrencyConfig[];
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>(() => {
    const saved = localStorage.getItem('currency');
    return (saved as Currency) || 'USD';
  });

  const setCurrency = (newCurrency: Currency) => {
    setCurrencyState(newCurrency);
    localStorage.setItem('currency', newCurrency);
  };

  const formatCurrency = (amount: number, targetCurrency?: Currency) => {
    const currencyToUse = targetCurrency || currency;
    const config = CURRENCIES[currencyToUse];
    
    // If targetCurrency is provided, assume the amount is already in that currency
    // Otherwise, convert from USD to the current currency
    const displayAmount = targetCurrency ? amount : convertCurrency(amount, 'USD', currencyToUse);
    
    if (currencyToUse === 'USD') {
      return `${config.symbol}${displayAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else {
      return `${displayAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${config.symbol}`;
    }
  };

  const convertCurrency = (amount: number, from: Currency, to: Currency) => {
    if (from === to) return amount;
    
    const fromRate = CURRENCIES[from].rate;
    const toRate = CURRENCIES[to].rate;
    
    // Convert to USD first, then to target currency
    const usdAmount = amount / fromRate;
    return usdAmount * toRate;
  };

  const getCurrencyConfig = (currency: Currency) => CURRENCIES[currency];

  const availableCurrencies = Object.values(CURRENCIES);

  return (
    <CurrencyContext.Provider value={{
      currency,
      setCurrency,
      formatCurrency,
      convertCurrency,
      getCurrencyConfig,
      availableCurrencies
    }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
