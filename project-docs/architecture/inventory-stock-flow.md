# Inventory Stock Management Flow

This document explains how the three key user stories for inventory management are implemented and integrated in the system:

-   US-VSIM-002: Update Existing Inventory Item
-   US-VSIM-004: Record Receiving Stock
-   US-VSIM-005: Record Stock Adjustments (Damages/Losses)

## Data Model

The implementation relies on two main tables:

1. **InventoryItems**: Stores the inventory item details including current stock quantity
2. **StockTransactions**: Records all stock movements (increases and decreases) with detailed attribution

```
┌─────────────────────┐       ┌─────────────────────────┐
│   InventoryItems    │       │    StockTransactions    │
├─────────────────────┤       ├─────────────────────────┤
│ id                  │◄──┐   │ id                      │
│ item_name           │   │   │ item_id                 │─┐
│ category_id         │   │   │ transaction_type        │ │
│ unit                │   │   │ quantity_change         │ │
│ purchase_price      │   │   │ reason                  │ │
│ selling_price       │   │   │ created_at              │ │
│ stock_quantity      │   │   │ user_id                 │ │
│ reorder_point       │   │   │ notes                   │ │
│ created_at          │   │   └─────────────────────────┘ │
│ updated_at          │   │                               │
│ user_id             │   │                               │
└─────────────────────┘   └───────────────────────────────┘
```

## Component Integration

The implementation follows a component-based architecture:

```
┌───────────────────┐      ┌───────────────────┐      ┌───────────────────┐
│  InventoryList    │─────▶│ InventoryItemForm │      │StockAdjustmentForm│
│  (Display items)  │      │ (Edit item details)│      │(Adjust quantities)│
└───────────────────┘      └───────────────────┘      └───────────────────┘
         │                           │                          │
         │                           │                          │
         ▼                           ▼                          ▼
┌───────────────────────────────────────────────────────────────────────┐
│                          API Layer (Next.js)                           │
├───────────────────────────────────────────────────────────────────────┤
│ /api/inventory/items     GET, POST       - Item listing and creation   │
│ /api/inventory/items/:id GET, PUT        - Item updates                │
│ /api/inventory/items/:id/stock POST      - Stock adjustments          │
└───────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌───────────────────────────────────────────────────────────────────────┐
│                          Supabase Database                             │
├───────────────────────────────────────────────────────────────────────┤
│                     InventoryItems, StockTransactions                  │
└───────────────────────────────────────────────────────────────────────┘
```

## US-VSIM-002: Update Existing Inventory Item

This user story allows updating inventory item details (name, category, unit, prices) but not directly changing the stock quantity.

**Implementation:**

-   `InventoryItemForm` component handles both creation and updates
-   The form uses TanStack Forms with Zod validation
-   Updates are sent to `/api/inventory/items/:id` API endpoint (PUT)
-   The endpoint validates and updates the inventory item in the database

**Flow:**

```
User selects item to edit → Opens form with pre-populated data →
Updates details → Submits form → API validates changes →
Database updated → UI refreshed
```

## US-VSIM-004: Record Receiving Stock & US-VSIM-005: Record Stock Adjustments

These user stories are implemented using the same components and API endpoint, with different adjustment types:

**Implementation:**

-   `StockAdjustmentForm` component handles both increases and decreases
-   Uses TanStack Forms with Zod validation
-   Sends adjustments to `/api/inventory/items/:id/stock` endpoint (POST)
-   The API validates, updates stock quantity, and logs the transaction

**Flow for Receiving Stock (US-VSIM-004):**

```
User selects "Adjust Stock" → Selects "Increase Stock" →
Enters quantity → Selects date → Provides reason (optional) →
Submits form → API processes → Inventory updated & transaction logged → UI refreshed
```

**Flow for Stock Adjustments (US-VSIM-005):**

```
User selects "Adjust Stock" → Selects "Decrease Stock" →
Selects adjustment reason (Damaged, Loss, etc.) → Enters quantity →
Selects date → Provides details → Submits form →
API validates (prevents over-adjusting) → Inventory updated & transaction logged → UI refreshed
```

## Validation Rules

1. Stock quantities cannot be negative
2. Cannot decrease more than available stock
3. All form inputs are validated using Zod schemas
4. Quantities must be positive numbers
5. Transaction types are predefined (using enums)

## Transaction Types

For audit and reporting purposes, the system uses these transaction types:

-   **Increases:**

    -   "Receive Stock" - Standard stock receipt

-   **Decreases:**
    -   "Stock Adjustment - Damaged" - Items damaged in store
    -   "Stock Adjustment - Loss" - Items lost or missing
    -   "Stock Adjustment - Write-off" - Items written off (expired, etc.)
    -   "Stock Adjustment - Other" - Other decrease reasons

## Future Enhancements

1. Implement database transaction procedures for atomicity
2. Add staff accountability features
3. Integrate with supplier management for receive operations
4. Create detailed transaction history views and reports
