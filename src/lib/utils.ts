import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format as formatFns } from "date-fns"; // Rename to avoid conflict with potential future format function
import { ro } from "date-fns/locale/ro"; // Import Romanian locale

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Formats a numeric value as currency in Romanian Leu (RON).
 *
 * @param value The number to format. Can be null or undefined.
 * @returns The formatted currency string (e.g., "1.234,56 lei") or "N/A" if the value is null or undefined.
 */
export const formatCurrency = (value: number | null | undefined): string => {
    if (value === null || value === undefined) {
        return "N/A";
    }
    // Always use 'ro-RO' locale and 'RON' currency according to requirements.
    return new Intl.NumberFormat("ro-RO", {
        style: "currency",
        currency: "RON",
        // Optional: Adjust maximumFractionDigits if needed, default is usually 2
        // maximumFractionDigits: 2,
    }).format(value);
};

/**
 * Default date format string using locale-specific short date format (e.g., "dd.MM.yyyy" in ro-RO).
 */
export const DEFAULT_DATE_FORMAT = "P";

/**
 * Default date and time format string using locale-specific short date and time format (e.g., "dd.MM.yyyy, HH:mm" in ro-RO).
 */
export const DEFAULT_DATETIME_FORMAT = "Pp";

/**
 * Formats a date object or string into a specified format using Romanian locale.
 *
 * @param date The date to format (Date object, timestamp number, or parseable string).
 * @param formatString The date-fns format string (defaults to locale-specific short date: 'P'). See https://date-fns.org/v3.6.0/docs/format
 * @returns The formatted date string or an empty string if the date is invalid or null/undefined.
 */
export const formatDate = (
    date: Date | number | string | null | undefined,
    formatString: string = DEFAULT_DATE_FORMAT
): string => {
    if (!date) {
        return ""; // Return empty string for null/undefined dates
    }
    try {
        // date-fns format handles Date objects, numbers (timestamps), or parseable strings
        return formatFns(date, formatString, { locale: ro });
    } catch (error) {
        console.error("Error formatting date:", date, error);
        // Attempt a basic fallback if the input was a valid Date object that formatFns failed on
        if (date instanceof Date && !isNaN(date.getTime())) {
            try {
                return date.toLocaleDateString("ro-RO"); // Basic fallback using Intl
            } catch (fallbackError) {
                console.error(
                    "Fallback date formatting failed:",
                    fallbackError
                );
                return "Invalid Date";
            }
        }
        return "Invalid Date";
    }
};

/**
 * Formats a number using Romanian locale and specified options.
 *
 * @param value The number to format. Can be null or undefined.
 * @param options Intl.NumberFormat options (e.g., { minimumFractionDigits: 2, maximumFractionDigits: 2 }).
 * @returns The formatted number string or "N/A" if the value is null or undefined.
 */
export const formatNumber = (
    value: number | null | undefined,
    options?: Intl.NumberFormatOptions
): string => {
    if (value === null || value === undefined) {
        return "N/A"; // Consistent with formatCurrency
    }
    try {
        return new Intl.NumberFormat("ro-RO", options).format(value);
    } catch (error) {
        console.error("Error formatting number:", value, error);
        return String(value); // Basic fallback to string conversion
    }
};
