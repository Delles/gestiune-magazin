## Phase 1: Core Inventory Management

### Implement InventoryItems Database Table:

**Goal:** Create the necessary database table to store inventory items.

**Action:** Define and create the `InventoryItems` table in Supabase based on the requirements in [US-VSIM-001](project-docs/Requirement.md#US-VSIM-001-Add-New-Inventory-Item) (`itemName`, `categoryId` (FK), `unit`, `purchasePrice`, `sellingPrice`, `stockQuantity`, `reorderPoint`, etc.). Remember to enable RLS ([Rule 40](project-docs/project-rule.md#database-rules-supabase)).

**Reference:** [US-VSIM-001 Data Model Impact](project-docs/Requirement.md#US-VSIM-001-Add-New-Inventory-Item).

### Update Supabase Types & Zod Schemas:

**Goal:** Reflect the new table structure in TypeScript and validation schemas.

**Action:** Run `supabase gen types typescript` to update `src/types/supabase.ts`. Create a Zod schema for inventory item validation in `src/lib/validation/inventory-schemas.ts` (create this file) ([Rule 31](project-docs/project-rule.md#form-rules-tanstack-forms--zod), [Rule 34](project-docs/project-rule.md#form-rules-tanstack-forms--zod)).

**Reference:** [US-VSIM-001 Implementation Framework (Backend)](project-docs/Requirement.md#US-VSIM-001-Add-New-Inventory-Item).

### Create Inventory List Page & Navigation:

**Goal:** Provide a dedicated page to view all inventory items.

**Action:**

-   Create a new route: `/app/(authenticated)/inventory/page.tsx` ([Rule 43](project-docs/project-rule.md#code-organization-rules)).
-   Implement a basic table using `@tanstack/react-table` and `src/components/ui/table` to display items ([Rule 35](project-docs/project-rule.md#table-rules-tanstack-table)).
-   Add a link to `/inventory` in the `src/components/layout/header.tsx` (for authenticated users) ([Rule 43](project-docs/project-rule.md#code-organization-rules)).
-   Use `useQuery` (`@tanstack/react-query`) to fetch inventory items (create API route later) ([Rule 23](project-docs/project-rule.md#data-fetching-rules-tanstack-query), [Rule 28](project-docs/project-rule.md#data-fetching-rules-tanstack-query)).

**Reference:** [US-VSIM-001](project-docs/Requirement.md#US-VSIM-001-Add-New-Inventory-Item), [US-VSIM-002](project-docs/Requirement.md#US-VSIM-002-Update-Inventory-Item).

### Implement Add Inventory Item Functionality (US-VSIM-001):

**Goal:** Allow users to add new items to the inventory.

**Action:**

-   Create an API route: `/app/api/inventory/items/route.ts` (POST handler). Implement validation and Supabase insert logic ([Rule 39](project-docs/project-rule.md#database-rules-supabase)).
-   Create an "Add New Item" button on the inventory list page triggering a Dialog/Modal (`src/components/ui/dialog`) ([Rule 15](project-docs/project-rule.md#styling-rules)).
-   Create an `InventoryItemForm` component using `@tanstack/react-form`, Zod adapter, and Shadcn UI components (`Input`, `Select` for category/unit) ([Rule 30](project-docs/project-rule.md#form-rules-tanstack-forms--zod), [Rule 32](project-docs/project-rule.md#form-rules-tanstack-forms--zod)).
-   Implement `useMutation` (`@tanstack/react-query`) in the UI to call the POST API and invalidate the inventory list query on success. Fetch categories for the category dropdown ([Rule 26](project-docs/project-rule.md#data-fetching-rules-tanstack-query)).

**Reference:** [US-VSIM-001 Implementation Framework](project-docs/Requirement.md#US-VSIM-001-Add-New-Inventory-Item).

### Implement Update Inventory Item Functionality (US-VSIM-002):

**Goal:** Allow users to edit existing item details (excluding stock quantity here).

**Action:**

-   Create API routes: `/app/api/inventory/items/{itemId}/route.ts` (GET handler to fetch item details, PUT handler to update). Implement validation and Supabase update logic ([Rule 39](project-docs/project-rule.md#database-rules-supabase)).
-   Add an "Edit" action (e.g., in a dropdown menu per table row) on the inventory list page.
-   Reuse or adapt the `InventoryItemForm` for editing, pre-filling data fetched via `useQuery` ([Rule 19](project-docs/project-rule.md#react-component-rules)).
-   Implement `useMutation` to call the PUT API and invalidate relevant queries on success ([Rule 26](project-docs/project-rule.md#data-fetching-rules-tanstack-query)).

**Reference:** [US-VSIM-002 Implementation Framework](project-docs/Requirement.md#US-VSIM-002-Update-Inventory-Item).

### Implement Reorder Points (US-VSIM-006):

**Goal:** Add reorder point field and low stock indication.

**Action:**

-   Ensure `reorderPoint` column exists in `InventoryItems` table.
-   Add `reorderPoint` field to the `InventoryItemForm` and Zod schema ([Rule 31](project-docs/project-rule.md#form-rules-tanstack-forms--zod)).
-   Update API routes (POST/PUT) to handle `reorderPoint` ([Rule 39](project-docs/project-rule.md#database-rules-supabase)).
-   Modify the Inventory List UI (`/app/(authenticated)/inventory/page.tsx`) to visually indicate items where `stockQuantity <= reorderPoint` (e.g., different row color, icon) ([Rule 15](project-docs/project-rule.md#styling-rules)).

**Reference:** [US-VSIM-006 Implementation Framework](project-docs/Requirement.md#US-VSIM-006-Implement-Reorder-Points).
