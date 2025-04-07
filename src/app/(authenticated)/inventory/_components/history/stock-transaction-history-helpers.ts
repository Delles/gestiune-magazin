export const getTransactionTypeFriendlyName = (type: string): string => {
    let displayName = type.charAt(0).toUpperCase() + type.slice(1);
    displayName = displayName.replace(/-/g, " "); // Replace hyphens
    return displayName;
};

export const ALL_TRANSACTION_TYPES = [
    "initial-stock",
    "purchase",
    "sale",
    "write-off",
    "correction-add",
    "correction-remove",
];
