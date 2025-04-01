/**
 * Formats a number as RON currency
 */
export function formatCurrency(value: number | null | undefined): string {
    if (value === null || value === undefined) return "N/A";
    return new Intl.NumberFormat("ro-RO", {
        style: "currency",
        currency: "RON",
    }).format(value);
}
