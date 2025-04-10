// Input data required for metric calculations
export interface MetricInputs {
    stock_quantity: number;
    selling_price: number | null;
    average_purchase_price: number | null;
    last_purchase_price: number | null;
    secondLastPurchasePrice: number | null; // Used for trend calculation
}

// Output structure for calculated metrics
export interface CalculatedMetrics {
    estimatedStockValue: number;
    profitPerUnit: number;
    profitMargin: number; // Percentage
    markup: number; // Percentage or Infinity
    lastVsAvgDiffPercent: number | null; // Percentage difference between last and average purchase price
    lastVsSecondLastDiffValue: number | null; // Absolute difference between last and second-to-last purchase price
}

/**
 * Calculates various inventory metrics based on input data.
 * @param inputs - The necessary data points for calculation.
 * @returns An object containing calculated metrics.
 */
export function calculateInventoryMetrics(
    inputs: MetricInputs
): CalculatedMetrics {
    const {
        stock_quantity,
        selling_price,
        average_purchase_price,
        last_purchase_price,
        secondLastPurchasePrice,
    } = inputs;

    // Use 0 as default for null prices in calculations to avoid NaN,
    // but retain null for direct comparisons or specific logic checks.
    const sellPrice = selling_price ?? 0;
    const avgCost = average_purchase_price ?? 0;
    const lastCost = last_purchase_price ?? 0;

    const estimatedStockValue = stock_quantity * avgCost;

    // Profit = Selling Price - Average Cost
    const profitPerUnit = sellPrice - avgCost;

    // Profit Margin = (Profit / Selling Price) * 100
    // Returns 0 if selling price is 0 or null to avoid division by zero.
    const profitMargin = sellPrice > 0 ? (profitPerUnit / sellPrice) * 100 : 0;

    // Markup = (Profit / Average Cost) * 100
    // Returns Infinity if average cost is 0 but selling price is positive.
    // Returns 0 if both average cost and selling price are 0.
    const markup =
        avgCost > 0
            ? (profitPerUnit / avgCost) * 100
            : sellPrice > 0
            ? Infinity
            : 0;

    // Trend: Last Purchase Price vs Average Purchase Price (%)
    let lastVsAvgDiffPercent: number | null = null;
    if (avgCost !== 0 && last_purchase_price !== null) {
        // Ensure avgCost is non-zero before division
        lastVsAvgDiffPercent = ((lastCost - avgCost) / avgCost) * 100;
    }

    // Trend: Last Purchase Price vs Second-to-Last Purchase Price (Value)
    let lastVsSecondLastDiffValue: number | null = null;
    if (last_purchase_price !== null && secondLastPurchasePrice !== null) {
        lastVsSecondLastDiffValue =
            last_purchase_price - secondLastPurchasePrice;
    }

    return {
        estimatedStockValue,
        profitPerUnit,
        profitMargin,
        markup,
        lastVsAvgDiffPercent,
        lastVsSecondLastDiffValue,
    };
}

// You can add other inventory-related utility functions here if needed.
