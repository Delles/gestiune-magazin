// src/lib/constants/currencies.ts
export interface Currency {
    code: string;
    name: string;
    symbol: string;
}

export const SUPPORTED_CURRENCIES: Currency[] = [
    { code: "USD", name: "US Dollar", symbol: "$" },
    { code: "EUR", name: "Euro", symbol: "€" },
    { code: "GBP", name: "British Pound", symbol: "£" },
    { code: "RON", name: "Romanian Leu", symbol: "RON" },
    // Add more as needed
];
