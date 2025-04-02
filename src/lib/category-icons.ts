import {
    Box, // Default/General
    HardDrive, // Electronics
    Shirt, // Clothing
    UtensilsCrossed, // Food/Kitchen
    LucideIcon, // Type for the component
    Package, // Fallback
} from "lucide-react";

// Simple mapping (expand as needed)
const categoryIconMap: Record<string, LucideIcon> = {
    electronics: HardDrive,
    clothing: Shirt,
    kitchen: UtensilsCrossed,
    general: Box,
};

export const getCategoryIcon = (
    categoryName: string | null | undefined
): LucideIcon => {
    if (!categoryName) {
        return Package; // Default icon if no category
    }
    const lowerCaseCategory = categoryName.toLowerCase();
    return categoryIconMap[lowerCaseCategory] || Package; // Return mapped icon or default
};
