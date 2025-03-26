**Guiding Principles:**

1.  **Foundation First:** Build core data models and CRUD operations before dependent features.
2.  **Iterative Development:** Implement features in logical phases, allowing for testing and refinement.
3.  **Leverage Tech Stack:** Utilize the strengths of Next.js (Server Components/Actions), Supabase (DB, Auth, RLS), TanStack (Data Fetching, Forms, Tables), and Shadcn (UI) effectively.
4.  **Component Reusability:** Identify and build reusable UI components (forms, tables, modals) and logic (validation, data fetching hooks).
5.  **Data Integrity:** Focus on database relationships, validation (Zod), and transaction management (where applicable, though Supabase's individual operations are atomic).

**Existing Setup:**

-   Next.js 15 Project Initialized.
-   Supabase Auth configured (Login, Sign Up).
-   Basic `Users` table managed by Supabase Auth.
-   Placeholder Dashboard page exists.

# Implementation Phases:

## Phase 1: Core Setup & Foundational Settings

-   **Goal:** Establish core database schemas, application layout, essential settings, and basic inventory categories.
-   **User Stories:**
    -   US-VSIM-028: Manage Store Information
    -   US-VSIM-029: Set Currency Settings
    -   US-VSIM-003: Manage Inventory Categories
-   **Key Tasks:**
    1.  **Database Schema (Supabase):**
        -   Define `StoreSettings` table (single row for store name, address, phone, email, logo URL).
        -   Define `CurrencySettings` table (single row for currency code).
        -   Define `Categories` table (categoryId, categoryName, timestamps).
        -   Setup basic Row Level Security (RLS) policies (e.g., authenticated users can read, specific roles can write).
    2.  **UI Layout (Next.js/Shadcn):**
        -   Implement main application layout using Next.js App Router (`layout.tsx`).
        -   Create shared navigation component (Sidebar/Header) linking to future sections (Dashboard, Inventory, Sales, etc.).
    3.  **Settings UI:**
        -   Create pages/routes under `/settings` for Store Info, Currency, and Categories.
        -   Build forms using `TanStack Form` + `Shadcn` components + `Zod` validation for updating settings and managing categories (CRUD).
    4.  **Data Access:**
        -   Set up Supabase client instance.
        -   Use `TanStack Query` for fetching settings/categories.
        -   Use `TanStack Query` mutations (calling Supabase client functions or Next.js Server Actions) for saving settings/category CRUD.
    5.  **Shared:**
        -   Establish shared `lib/` folders for Supabase client, types, validation schemas (Zod), utility functions (e.g., currency/date formatting placeholders).

## Phase 2: Inventory Core & Stock Management

-   **Goal:** Implement core inventory item management and basic stock adjustments.
-   **User Stories:**
    -   US-VSIM-001: Add New Inventory Item
    -   US-VSIM-002: Update Existing Inventory Item
    -   US-VSIM-006: Set Reorder Points (Implement `reorderPoint` field)
    -   US-VSIM-004: Record Receiving Stock
    -   US-VSIM-005: Record Stock Adjustments
-   **Key Tasks:**
    1.  **Database Schema (Supabase):**
        -   Define `InventoryItems` table (itemId, itemName, categoryId FK, unit, purchasePrice, sellingPrice, stockQuantity, reorderPoint, timestamps). Add unique constraint/index on `itemName` if needed.
        -   Define `StockTransactions` table (transactionId, itemId FK, transactionType, quantityChange, transactionDate, reason, userId FK, timestamp).
        -   Refine RLS policies for these tables.
    2.  **Inventory UI:**
        -   Create Inventory section/page (`/inventory`).
        -   Build Inventory List using `TanStack Table` displaying items.
        -   Implement "Add New Item" and "Edit Item" modals/forms (`TanStack Form`, `Shadcn`, `Zod`). Include Category dropdown (fetched via TanStack Query).
        -   Implement "Receive Stock" and "Adjust Stock" modals/forms triggered from the inventory list or item detail view.
    3.  **Logic:**
        -   Implement `TanStack Query` mutations/Server Actions for:
            -   Inventory item CRUD.
            -   Creating `StockTransactions` records.
            -   Updating `InventoryItems.stockQuantity` atomically (can be done via Supabase functions/RPC or careful client-side logic if concurrency isn't extreme).
    4.  **Shared:**
        -   Create reusable form components for common inputs (validated numbers, text, dropdowns).

## Phase 3: Core Sales Cycle

-   **Goal:** Implement the basic sales process, including recording sales and viewing history.
-   **User Stories:**
    -   US-VSIM-012: Manage Payment Methods
    -   US-VSIM-008: Record a Sales Transaction (Basic - item selection, quantity, payment, stock update)
    -   US-VSIM-009: View Sales History (Basic list)
-   **Key Tasks:**
    1.  **Database Schema (Supabase):**
        -   Define `PaymentMethods` table (methodId, methodName, description).
        -   Define `SalesTransactions` table (saleId, saleDate, totalAmount, paymentMethod FK, customerId FK nullable, userId FK, timestamp).
        -   Define `SaleItems` table (saleItemId, saleId FK, itemId FK, quantity, sellingPrice, timestamp).
    2.  **Settings UI:**
        -   Implement CRUD UI for Payment Methods under `/settings/payment-methods`.
    3.  **Sales UI:**
        -   Create Sales section/page (`/sales`).
        -   Build "New Sale" form:
            -   Item selection (searchable dropdown fetching from `InventoryItems`).
            -   Dynamic calculation of totals.
            -   Payment Method selection (dropdown).
            -   Use `TanStack Form` for state management.
        -   Build "Sales History" page using `TanStack Table`.
    4.  **Logic:**
        -   Implement Sale recording logic (mutation/Server Action):
            -   Validate stock availability before confirming sale.
            -   Create `SalesTransactions` and `SaleItems` records.
            -   Create corresponding `StockTransactions` record (type 'Sale').
            -   Update `InventoryItems.stockQuantity`. Wrap these in a Supabase Edge Function (transaction) if strict atomicity across tables is required.
    5.  **Integration:**
        -   Fetch `InventoryItems` (name, price, stock) for the sales form.
        -   Fetch `PaymentMethods` for the sales form.

## Phase 4: Enhancing Sales & Supplier Basics

-   **Goal:** Add returns, discounts, invoicing, and introduce supplier management.
-   **User Stories:**
    -   US-VSIM-013: Apply Discounts to Sales
    -   US-VSIM-010: Process Returns/Refunds
    -   US-VSIM-011: Generate Invoices/Receipts (Basic HTML/PDF view)
    -   US-VSIM-021: Manage Supplier Information
-   **Key Tasks:**
    1.  **Database Schema (Supabase):**
        -   Extend `SalesTransactions` and `SaleItems` to include discount fields.
        -   Define `Returns` table (returnId, saleId FK, returnDate, totalRefundAmount, userId FK).
        -   Define `ReturnItems` table (returnItemId, returnId FK, itemId FK, quantityReturned).
        -   Define `Suppliers` table (supplierId, name, contactPerson, phone, email, address).
    2.  **Sales UI:**
        -   Enhance "New Sale" form to include discount inputs (item/sale level).
        -   Implement "Process Return" flow accessible from "Sales History".
        -   Implement basic "Invoice/Receipt" view component (fetch sale data, display with Store Info). Consider `react-pdf` or server-side generation for PDF.
    3.  **Supplier UI:**
        -   Create Suppliers section/page (`/suppliers`).
        -   Implement Supplier CRUD UI (`TanStack Form`/`Table`).
    4.  **Logic:**
        -   Update Sale recording logic to handle discounts.
        -   Implement Return processing logic (create `Returns`/`ReturnItems`, update stock, create `StockTransactions` type 'Return').
        -   Implement Supplier CRUD logic.

## Phase 5: Purchase Orders & Financial Groundwork

-   **Goal:** Implement purchase orders, supplier invoices, and basic expense/tax tracking.
-   **User Stories:**
    -   US-VSIM-022: Record Purchase Orders
    -   US-VSIM-023: Track Supplier Invoices
    -   US-VSIM-016: Record Operational Expenses
    -   US-VSIM-020: Calculate Basic Taxes (Setup & Sales Application)
-   **Key Tasks:**
    1.  **Database Schema (Supabase):**
        -   Define `PurchaseOrders` table (purchaseOrderId, supplierId FK, orderDate, expectedDeliveryDate, status).
        -   Define `PurchaseOrderItems` table (orderItemId, purchaseOrderId FK, itemId FK, quantity).
        -   Define `SupplierInvoices` table (invoiceId, supplierId FK, invoiceNumber, invoiceDate, totalAmount, purchaseOrderId FK nullable, status).
        -   Define `Expenses` table (expenseId, expenseDate, amount, category, description, userId FK).
        -   Define `TaxSettings` table (single row, taxRate).
        -   Extend `SalesTransactions` to store `taxAmount`.
    2.  **UI:**
        -   Implement PO creation form (link to Suppliers, Items).
        -   Implement Supplier Invoice recording form (link to Supplier, optional PO).
        -   Implement Expense recording form.
        -   Implement Tax Settings UI under `/settings`.
    3.  **Logic:**
        -   Implement PO/Invoice/Expense recording logic (mutations/Server Actions).
        -   Modify Sales recording logic to calculate and store tax based on `TaxSettings`.
        -   Update Invoice/Receipt generation to show tax breakdown.

## Phase 6: Financial Reporting & Dashboard

-   **Goal:** Calculate core financial metrics, generate reports, and build the dashboard overview.
-   **User Stories:**
    -   US-VSIM-015: Track Income from Sales (Backend aggregation logic)
    -   US-VSIM-017: Calculate Profit and Loss
    -   US-VSIM-018: Generate Financial Reports (Sales, Expense, P&L, Inventory Value)
    -   US-VSIM-026: View Dashboard with Key Metrics
    -   US-VSIM-007: Generate Inventory Reports (Add full list, value by category)
    -   US-VSIM-024: View Purchase History per Supplier
-   **Key Tasks:**
    1.  **Backend Logic (Server Actions / Supabase Functions):**
        -   Implement functions to aggregate income (from `SalesTransactions`).
        -   Implement functions to aggregate expenses (from `Expenses`).
        -   Implement P&L calculation (Income - Expenses).
        -   Implement Inventory Value calculation (sum `stockQuantity * purchasePrice` from `InventoryItems`).
        -   Implement logic to find low stock items (`stockQuantity <= reorderPoint`).
        -   Implement logic to fetch upcoming supplier payments (query `SupplierInvoices` based on date/status - define "upcoming").
    2.  **Reporting UI:**
        -   Create Reports section (`/reports`).
        -   Build UI for Inventory and Financial reports, using `TanStack Table`. Include date range filters. Add basic export to CSV functionality.
    3.  **Supplier UI:**
        -   Enhance Supplier Detail view to show POs and Invoices lists.
    4.  **Dashboard UI:**
        -   Replace placeholder dashboard.
        -   Build dashboard widgets (Sales Today, Low Stock, P&L This Month, Upcoming Payments).
        -   Fetch data for widgets using `TanStack Query` (calling Server Actions/API routes).
        -   Implement navigation from widgets to relevant detail pages (e.g., Low Stock widget -> filtered Inventory page).

## Phase 7: User & System Customization

-   **Goal:** Allow users to manage their profile and customize system behaviour.
-   **User Stories:**
    -   US-VSIM-031: Manage User Profile (Password Change)
    -   US-VSIM-030: Customize Report Options (Date Format, Default Range)
    -   US-VSIM-027: Customize Dashboard Widgets
-   **Key Tasks:**
    1.  **Database Schema (Supabase):**
        -   Define `ReportSettings` table (userId FK, dateFormat, defaultDateRange).
        -   Define `DashboardPreferences` table (userId FK, widgetConfig JSON).
        -   Note: `Users` table already exists from Auth.
    2.  **UI:**
        -   Implement User Profile page under `/settings` with password change form.
        -   Implement Report Settings page under `/settings`.
        -   Implement Dashboard "Customize" mode (widget selection panel, drag-and-drop for layout). Consider libraries like `react-beautiful-dnd` or `dnd-kit`.
    3.  **Logic:**
        -   Implement password change logic using Supabase Auth client methods. Enforce complexity rules (client/server-side).
        -   Implement saving/retrieving user-specific Report Settings and Dashboard Preferences (link to `userId`).
        -   Update Report generation to use user's date format.
        -   Update Dashboard rendering to use user's widget layout.

## Phase 8: Optional Features & Refinement

-   **Goal:** Implement optional features like customer tracking and refine overall application.
-   **User Stories:**
    -   US-VSIM-014: Track Customer Information (Optional)
    -   US-VSIM-019: Manage Supplier Payments (Implement fully, update balances/statuses)
-   **Key Tasks:**
    1.  **Database Schema (Supabase):**
        -   Define `Customers` table (customerId, name, phone, email).
        -   Define `SupplierPayments` table (paymentId, supplierId FK, paymentDate, amountPaid, paymentMethod, reference). Add linking table if payment can span multiple invoices.
        -   Extend `SalesTransactions` to add nullable `customerId` FK.
    2.  **UI & Logic (Customers - If implemented):**
        -   Implement Customer CRUD UI.
        -   Enhance "New Sale" form to optionally link a customer.
        -   Implement Customer detail view with purchase history.
    3.  **UI & Logic (Supplier Payments):**
        -   Implement UI for recording supplier payments, linking to invoices.
        -   Implement logic to update supplier outstanding balance and invoice payment statuses.
    4.  **Refinement:**
        -   **Performance Tuning:** Optimize Supabase queries, add indexes, review TanStack Query caching.
        -   **Error Handling:** Enhance global and specific error handling.
        -   **UI Polish:** Refine styling, transitions, and responsiveness.
        -   **Testing:** Add more comprehensive unit, integration, and end-to-end tests.
        -   **Documentation:** Update user and developer documentation.

**Cross-Cutting Concerns (Throughout All Phases):**

-   **Authentication/Authorization:** Ensure all relevant pages and API endpoints/Server Actions are protected and check user roles/permissions where necessary (using Supabase Auth session and RLS).
-   **Validation:** Use Zod consistently for client-side (`TanStack Form`) and server-side (Server Actions/API routes) validation.
-   **State Management:** Primarily use `TanStack Query` for server state and React state/context or Zustand/Jotai for minimal UI state if needed.
-   **Error Handling:** Implement consistent error handling (e.g., showing toast notifications via Shadcn `sonner`, specific error messages in forms).
-   **TypeScript:** Maintain strong typing throughout.
-   **UI Consistency:** Reuse Shadcn components and maintain a consistent design language.
-   **Security:** Rely on Supabase RLS heavily. Sanitize inputs where necessary (though Supabase client often handles this). Implement secure password handling.
