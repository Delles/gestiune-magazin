// src/hooks/use-debounce.tsx
import { useState, useEffect, useRef } from "react"; // Import useRef

export function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    const isMountedRef = useRef(true); // Add isMountedRef

    // Set isMountedRef to false on unmount
    useEffect(() => {
        isMountedRef.current = true; // Set to true on mount/update
        return () => {
            isMountedRef.current = false; // Set to false on cleanup (unmount)
        };
    }, []); // Empty dependency array ensures this runs only on mount and unmount

    useEffect(() => {
        const handler = setTimeout(() => {
            // --- Add the guard here ---
            if (isMountedRef.current) {
                setDebouncedValue(value);
            }
            // --- End of guard ---
        }, delay);

        // Cancel the timeout if value changes (also on delay change or unmount)
        // This cleanup runs *before* the next effect or on unmount
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]); // Dependencies remain the same

    return debouncedValue;
}
