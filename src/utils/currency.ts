export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  const currencySymbols: { [key: string]: string } = {
    USD: '$',
    ETB: 'ETB '
  };

  const symbol = currencySymbols[currency] || '$';
  
  if (currency === 'ETB') {
    return `${symbol}${amount.toLocaleString()}`;
  }
  
  return `${symbol}${amount.toLocaleString()}`;
};

export const getCurrencySymbol = (currency: string = 'USD'): string => {
  const currencySymbols: { [key: string]: string } = {
    USD: '$',
    ETB: 'ETB'
  };
  
  return currencySymbols[currency] || '$';
};