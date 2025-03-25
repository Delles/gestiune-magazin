#Inventory Management

## **US-VSIM-001: Add New Inventory Item**

-   **Title:** Add New Inventory Item
-   **As a:** Store Owner
-   **I want to:** add a new item to the inventory
-   **So that:** I can track the stock levels and sales of all available products.
-   **Description:** The system should allow inputting details for a new product, including name, category, unit of measurement, purchase price, selling price, and initial stock quantity.
-   **Acceptance Criteria:**
    -   Given I am logged in as a Store Owner,
    -   When I navigate to the "Inventory" section and click "Add New Item,"
    -   Then I should see a form with fields for "Item Name," "Category," "Unit," "Purchase Price," "Selling Price," and "Initial Stock."
    -   And when I fill in these details and click "Save,"
    -   Then the new item should be added to the inventory list with the provided information.

### **Implementation Framework:**

-   **UI Elements:**
    -   **Inventory List Page:** “Add New Item” button.
    -   **New Item Form Modal/Page:**
        -   Input field: "Item Name" (text input, mandatory).
        -   Dropdown/Autocomplete: "Category" (optional, dropdown or autocomplete from existing categories).
        -   Dropdown: "Unit of Measurement" (dropdown, mandatory, e.g., "Pieces," "Bags," "Meters").
        -   Number Input: "Purchase Price" (number input, mandatory, validation for positive number).
        -   Number Input: "Selling Price" (number input, mandatory, validation for positive number).
        -   Number Input: "Initial Stock Quantity" (number input, mandatory, integer, validation for non-negative integer).
    -   **Save Button:** To submit the form.
    -   **Cancel Button:** To discard changes.
    -   **Form Validation Indicators:** Inline error messages for invalid inputs.
-   **Backend Architecture & Logic:**
    -   **API Endpoint:** POST /api/inventory/items to create a new inventory record.
        -   Request Body (JSON): { "itemName": string, "categoryId": number, "unit": string, "purchasePrice": number, "sellingPrice": number, "initialStock": number }
    -   **Business Logic:**
        -   Validate user input: ensure mandatory fields are filled, data types are correct, prices and stock are non-negative numbers, and check for duplicate item names.
        -   Use Category Service to confirm categoryId exists in the Categories table (if category is provided).
        -   Database operation: Insert a new record into the InventoryItems table.
    -   **Shared Components:**
        -   **Authentication & Authorization Service:** Validates that the logged-in user is a Store Owner.
        -   **Data Validation Service:** Reusable across inventory and sales endpoints for consistent data validation.
        -   **Audit Logging Service:** To record item creation events for audit trails.
    -   **Error Handling:**
        -   Return 400 Bad Request for invalid data (with specific error messages for missing or invalid fields).
        -   Return 404 Not Found if the provided categoryId does not exist.
        -   Use standardized error responses for consistent error handling across the application.
    -   **Logic Flow:**
        1. Receive POST request to /api/inventory/items with item details.
        2. Authenticate and authorize the user.
        3. Validate input data using Data Validation Service.
        4. If categoryId is provided, use Category Service to validate its existence.
        5. If validation passes, insert new item into InventoryItems table using Inventory Service.
        6. Log the creation event using Audit Logging Service.
        7. Return a success response (e.g., 201 Created) with the new item’s ID (e.g., { "itemId": 1 }).
-   **Data Model Impact:**
    -   **Inventory Table (InventoryItems):**
        -   New row insertion with columns: itemId (PK, auto-generated), itemName (string, unique index recommended), categoryId (FK to Categories, nullable), unit (string), purchasePrice (decimal), sellingPrice (decimal), stockQuantity (integer), reorderPoint (integer/decimal, nullable), createdAt (timestamp), updatedAt (timestamp).
    -   **Category Table (Categories):** Ensure linkage via foreign key categoryId.
-   **User Feedback & Notifications:**
    -   **Success Message:** Display a success message (e.g., "Item '{Item Name}' added successfully") upon successful item creation.
    -   **Error Notifications:** Display field-specific inline error messages for invalid inputs (e.g., "Invalid price format", "Item Name is required", "Category not found").
    -   **Loading Spinner:** Show a loading spinner while saving the item to indicate processing.
    -   **Inventory List Update:** Update the inventory list view to include the newly added item in real-time.
-   **Dependencies & Considerations:**
    -   **Integration Points & Backend Dependencies:**
        -   **User Authentication Module:** Must be active to verify user permissions.
        -   **Category Management Service:** Ensures valid category data and is used for category validation.
        -   **Shared Data Validation Service:** For consistent input checks across modules.
        -   **Inventory Service:** Manages CRUD operations for inventory items.
    -   **Other Considerations:**
        -   **Security:** Implement input sanitization to prevent injection vulnerabilities.
        -   **Performance:** Index the InventoryItems table on key columns like itemName, categoryId for rapid lookups.
        -   **Scalability:** Consider transaction management if multiple item entries are expected simultaneously to ensure data consistency.
        -   **Uniqueness:** Decide whether to enforce unique item names or handle duplicates gracefully (e.g., allow duplicates with a warning or enforce uniqueness by checking against existing items).

## **US-VSIM-002: Update Existing Inventory Item**

-   **Title:** Update Existing Inventory Item
-   **As a:** Store Owner
-   **I want to:** update the details of an existing item in the inventory
-   **So that:** I can keep the product information accurate, such as price changes or unit adjustments.
-   **Description:** The system should allow editing details of an existing inventory item, such as name, category, unit of measurement, purchase price, and selling price.
-   **Acceptance Criteria:**
    -   Given I am logged in as a Store Owner,
    -   When I navigate to the "Inventory" section and select an item to edit,
    -   Then I should see a form populated with the current details of the selected item.
    -   And when I modify the details and click "Save,"
    -   Then the item's information in the inventory list should be updated with the new details.

### **Implementation Framework:**

-   **UI Elements:**
    -   **Inventory List Page:** Display list of items with an “Edit” button/icon for each item.
    -   **Edit Item Form Modal/Page:**
        -   Pre-populated fields for: "Item Name," "Category," "Unit," "Purchase Price," "Selling Price," "Reorder Point."
    -   **Save Changes Button:** To update the item with modified details.
    -   **Cancel Button:** To revert changes and close the edit form.
-   **Backend Architecture & Logic:**
    -   **API Endpoint:** PUT /api/inventory/items/{itemId} to update item details, where {itemId} is the ID of the item to be updated.
        -   Request Body (JSON): { "itemName": string, "categoryId": number, "unit": string, "purchasePrice": number, "sellingPrice": number, "reorderPoint": number }
    -   **Business Logic:**
        -   Retrieve the current item data from the InventoryItems table using the provided itemId.
        -   Merge the changes from the request body with the existing item data.
        -   Perform data validations on the updated data (similar to US-VSIM-001).
        -   Database operation: Update the record in the InventoryItems table for the specified itemId with the modified details.
    -   **Shared Components:**
        -   **Authentication & Authorization Service:** Validates user credentials and permissions to update inventory items.
        -   **Data Validation & Sanitization Module:** Reused from US-VSIM-001 to ensure data consistency and prevent injection attacks.
        -   **Audit Logging Service:** Logs updates to inventory items for traceability and audit purposes.
        -   **Inventory Service:** Manages CRUD operations for inventory items, including updates.
    -   **Error Handling:**
        -   Return 404 Not Found if the item with the given itemId is not found in the InventoryItems table.
        -   Return 400 Bad Request for invalid data or validation errors.
        -   Use standardized error responses for consistent error handling.
    -   **Logic Flow:**
        1. Receive PUT request to /api/inventory/items/{itemId} with updated item details.
        2. Authenticate and authorize the user.
        3. Validate input data using Data Validation & Sanitization Module.
        4. Check if the item with itemId exists using Inventory Service. Return 404 if not found.
        5. If validation passes and item exists, update the item details in the InventoryItems table using Inventory Service.
        6. Log the update event using Audit Logging Service.
        7. Return a success response (e.g., 200 OK) upon successful update.
-   **Data Model Impact:**
    -   **Inventory Table (InventoryItems):**
        -   Updates to existing fields (e.g., itemName, categoryId, unit, purchasePrice, sellingPrice, reorderPoint).
        -   Consider maintaining history of changes through versioning or audit tables (optional, for enhanced data integrity and traceability).
-   **User Feedback & Notifications:**
    -   **Success Message:** Display a success message (e.g., "Item '{Item Name}' updated successfully") upon successful update.
    -   **Error Messages:** Display inline error notifications if the update fails due to validation errors or other issues (e.g., "Item not found", "Invalid price format").
    -   **Confirmation Prompt:** Optionally display a confirmation prompt before finalizing changes to prevent accidental updates.
    -   **Inventory List Update:** Update the inventory list view to reflect the changes in the edited item in real-time.
-   **Dependencies & Considerations:**
    -   **Integration Points & Backend Dependencies:**
        -   **Category Management Service:** Ensures that any category changes are correctly reflected if the category is updated.
        -   **Audit Log Integration:** Integrate with Audit Logging Service to capture changes for historical records and compliance.
        -   **Inventory Service:** Manages item retrieval and update operations.
    -   **Other Considerations:**
        -   **Concurrency:** Handle concurrent updates to the same item using optimistic locking or similar mechanisms to prevent data conflicts.
        -   **Security:** Validate that the user has the necessary permissions to update the inventory item.
        -   **Data Consistency:** Ensure that updates propagate to any dependent reports, dashboards, or caches to maintain data consistency across the application.
        -   **Audit Trail:** Consider implementing an audit trail to track who updated which item and when for compliance and historical analysis.

---

## **US-VSIM-003: Manage Inventory Categories**

-   **Title:** Manage Inventory Categories
-   **As a:** Store Owner
-   **I want to:** create, edit, and delete inventory categories
-   **So that:** I can organize my inventory effectively and generate reports based on product types.
-   **Description:** The system should allow creating new product categories, modifying existing category names, and removing unneeded categories.
-   **Acceptance Criteria:**
    -   Given I am logged in as a Store Owner,
    -   When I navigate to the "Inventory Categories" section,
    -   Then I should see a list of existing categories.
    -   And I should have options to "Add New Category," "Edit" an existing category, and "Delete" a category.
    -   And when I add, edit, or delete a category, the changes should be reflected in the category list and when adding/editing inventory items.

### **Implementation Framework:**

-   **UI Elements:**
    -   **Categories List Page:** Display a list of current inventory categories in a table or list format.
    -   **Buttons:**
        -   “Add New Category”: Button to trigger the creation of a new category.
        -   “Edit” (per category): Button or icon to allow editing of an existing category.
        -   “Delete” (per category): Button or icon to allow deletion of a category.
    -   **Category Form Modal/Page:**
        -   Input field: "Category Name" (text input, mandatory, with validation for uniqueness).
    -   **Confirmation Dialogs:** Display confirmation dialogs before performing deletion actions to prevent accidental data loss.
-   **Backend Architecture & Logic:**
    -   **API Endpoints:**
        -   GET /api/inventory/categories – Retrieve a list of all inventory categories.
        -   POST /api/inventory/categories – Create a new category.
            -   Request Body (JSON): { "categoryName": string }
        -   PUT /api/inventory/categories/{categoryId} – Edit an existing category, where {categoryId} is the ID of the category to be updated.
            -   Request Body (JSON): { "categoryName": string }
        -   DELETE /api/inventory/categories/{categoryId} – Delete a category, where {categoryId} is the ID of the category to be deleted.
    -   **Business Logic:**
        -   Validate uniqueness of category names before creating or updating (within the system).
        -   Check for dependencies before deleting a category (e.g., ensure no items are currently assigned to the category).
        -   Database Operations: Perform CRUD (Create, Read, Update, Delete) operations on the Categories table.
    -   **Shared Components:**
        -   **Authentication Service:** Validates user roles and permissions to manage inventory categories.
        -   **Validation Module:** Reused from US-VSIM-001 and US-VSIM-002 for consistent data validation, specifically for category name rules (e.g., non-empty, maximum length, allowed characters).
        -   **Error Handling Module:** Reused to provide consistent error responses across category management operations.
    -   **Error Handling:**
        -   Return 409 Conflict if deletion is attempted on a category that is currently in use by inventory items.
        -   Return 404 Not Found if a category with the given categoryId is not found during update or delete operations.
        -   Return 400 Bad Request for validation errors (e.g., category name is missing or not unique).
        -   Use standardized error responses for consistent error reporting.
    -   **Logic Flow (Add New Category):**
        1. Receive POST request to /api/inventory/categories with category name.
        2. Authenticate and authorize the user.
        3. Validate category name for uniqueness and other rules using Validation Module.
        4. If validation passes, insert a new category record into the Categories table.
        5. Return a success response (e.g., 201 Created) with the new category ID.
    -   **Logic Flow (Edit Category):**
        1. Receive PUT request to /api/inventory/categories/{categoryId} with updated category name.
        2. Authenticate and authorize the user.
        3. Validate category name for uniqueness and other rules using Validation Module.
        4. If validation passes, update the category record in the Categories table.
        5. Return a success response (e.g., 200 OK).
    -   **Logic Flow (Delete Category):**
        1. Receive DELETE request to /api/inventory/categories/{categoryId}.
        2. Authenticate and authorize the user.
        3. Check if any inventory items are associated with the category using Inventory Service.
        4. If items are associated, return a 409 Conflict error indicating category cannot be deleted.
        5. If no items are associated, delete the category record from the Categories table.
        6. Return a success response (e.g., 200 OK).
-   **Data Model Impact:**
    -   **Categories Table (Categories):**
        -   Add new records upon category creation, update existing records upon editing, and potentially mark records as inactive (soft delete) or physically remove records upon deletion.
        -   Columns: categoryId (PK, auto-generated), categoryName (string, unique index enforced), createdAt (timestamp), updatedAt (timestamp), isDeleted (boolean, optional for soft delete).
    -   **Inventory Table (InventoryItems):** Ensure foreign key relationships (categoryId) are maintained and updated appropriately if category IDs change (though category ID changes are not typical).
-   **User Feedback & Notifications:**
    -   **Success Notifications:** Display success messages upon creating, updating, or deleting categories (e.g., "Category '{Category Name}' created successfully", "Category updated successfully", "Category '{Category Name}' deleted successfully").
    -   **Error Alerts:**
        -   Inform the user if a category is currently in use and cannot be deleted (e.g., "Cannot delete category '{Category Name}'. Items are still assigned to this category.").
        -   Display error alerts for validation failures (e.g., "Category name is required", "Category name already exists").
    -   **Confirmation Messages:** Display confirmation prompts before performing deletion actions to ensure user intent and prevent accidental deletion.
    -   **Category List Update:** Update the categories list view in real-time after each operation (add, edit, delete) to reflect the changes immediately.
-   **Dependencies & Considerations:**
    -   **Integration Points & Backend Dependencies:**
        -   **Inventory Management Service:** Categories must be readily available and synchronized with inventory item forms for item categorization (US-VSIM-001, US-VSIM-002).
        -   **Reporting Service:** Category data is essential for generating grouped inventory reports and potentially sales reports by category (US-VSIM-007, US-VSIM-018).
        -   **Inventory Service:** Used to check for item dependencies before deleting a category.
    -   **Other Considerations:**
        -   **Security:** Enforce proper access control and permissions to manage inventory categories, ensuring only authorized users (e.g., store owners) can create, edit, or delete categories.
        -   **Data Integrity:** Implement cascade or restrict delete actions to maintain referential integrity between Categories and InventoryItems tables. Consider soft deletion (adding an isDeleted flag) instead of physical deletion to preserve data for historical reporting and avoid orphan records.
        -   **Performance:** Cache frequently accessed category data to improve performance, especially in dropdown lists and reporting queries. Index categoryName for uniqueness checks and efficient lookups.

## **US-VSIM-004: Record Receiving Stock**

-   **Title:** Record Receiving Stock
-   **As a:** Store Owner
-   **I want to:** record when new stock is received
-   **So that:** I can accurately update inventory levels and track stock replenishment.
-   **Description:** The system should allow selecting an existing inventory item and inputting the quantity of stock received, automatically updating the item's stock level.
-   **Acceptance Criteria:**
    -   Given I am logged in as a Store Owner,
    -   When I navigate to the "Inventory" section, select an item, and choose "Receive Stock,"
    -   Then I should see a form to enter the quantity of stock received.
    -   And when I enter the quantity and click "Save,"
    -   Then the stock level for that item should increase by the entered quantity, and the system should record the date and time of stock receipt.

### **Implementation Framework:**

-   **UI Elements:**
    -   **Inventory Item Detail Page:** “Receive Stock” button prominently displayed on the item detail page or within the inventory list actions.
    -   **Stock Receiving Form (Modal/Page):**
        -   Display-only field: "Item Name" (pre-filled with the selected item's name).
        -   Number Input: "Quantity to Receive" (number input, mandatory, integer, validation for positive integer).
        -   Optional field: "Reason for Receipt" (text area or dropdown with predefined reasons like "Supplier Delivery", "Stock Replenishment", optional).
        -   Display: "Current Stock" (display-only, showing the current stock level before adjustment).
        -   Date Picker: "Receipt Date" (defaults to the current date and time, editable).
    -   **Save Button:** To record the stock receipt and update inventory levels.
    -   **Cancel Button:** To discard the stock receipt operation and close the form.
-   **Backend Architecture & Logic:**
    -   **API Endpoint:** POST /api/inventory/items/{itemId}/receive-stock to update stock levels upon receiving new stock.
        -   Request Body (JSON): { "quantity": number, "receiptDate": datetime, "reason": string (optional) }
    -   **Business Logic:**
        -   Validate that the received quantity is a positive integer.
        -   Validate that the itemId corresponds to an existing inventory item.
        -   Update the stockQuantity in the InventoryItems table for the given itemId by *adding* the received quantity.
        -   Record a transaction entry in a StockTransactions table to log the stock receipt event, including item ID, quantity received, adjustment type ("Receive Stock"), timestamp, and reason (if provided).
    -   **Shared Components:**
        -   **Inventory Management Service:** Centralized service responsible for updating stock levels and retrieving item information. Reused from US-VSIM-001 and US-VSIM-002.
        -   **Transaction Logging Service:** Dedicated service to record all stock-related transactions (receipts, adjustments, sales) for audit trails and reporting.
        -   **Authentication & Authorization Module:** Ensures that only authorized users (e.g., store owners, inventory managers) can record stock receipts.
        -   **Validation Module:** Validates input data, ensuring quantity is a positive integer and other fields are in the correct format.
    -   **Error Handling:**
        -   Return 404 Not Found if the item with the given itemId does not exist.
        -   Return 400 Bad Request for invalid input data, such as a non-positive quantity.
        -   Use standardized error responses for consistent error handling.
    -   **Logic Flow:**
        1. Receive POST request to /api/inventory/items/{itemId}/receive-stock with stock receipt details.
        2. Authenticate and authorize the user.
        3. Validate input data (quantity, item ID) using Validation Module.
        4. Check if the item with itemId exists using Inventory Management Service. Return 404 if not found.
        5. If validation passes and item exists, update the stockQuantity in the InventoryItems table by adding the received quantity using Inventory Management Service.
        6. Create a new record in the StockTransactions table via Transaction Logging Service to log the stock receipt event, including details like item ID, quantity, receipt date, and reason.
        7. Return a success response (e.g., 200 OK) upon successful stock receipt update.
-   **Data Model Impact:**
    -   **Inventory Table (InventoryItems):**
        -   Update the stockQuantity field for the specified itemId by incrementing it with the received quantity.
    -   **Stock Transactions Table (StockTransactions):**
        -   Create a new record in the StockTransactions table to log the stock receipt event.
        -   Columns: transactionId (PK, auto-generated), itemId (FK referencing InventoryItems), transactionType (string, e.g., "Receive Stock"), quantityChange (integer, positive for stock receipt), receiptDate (datetime), reason (string, optional), transactionTimestamp (timestamp).
-   **User Feedback & Notifications:**
    -   **Success Message:** Display a success message (e.g., "Stock received for '{Item Name}' updated successfully") upon successful stock receipt.
    -   **Error Alerts:** Display error messages for validation failures or if the item is not found (e.g., "Invalid quantity entered", "Item not found").
    -   **Real-Time Update:** Refresh the displayed stock quantity on the Inventory Item Detail Page or Inventory List View to reflect the updated stock level immediately after the stock receipt is recorded.
    -   **Confirmation:** Optionally provide a confirmation dialog before saving the stock receipt to ensure user intent.
-   **Dependencies & Considerations:**
    -   **Integration Points & Backend Dependencies:**
        -   **Inventory Management Service:** Essential for retrieving item details and updating stock quantities.
        -   **Transaction Logging Service:** Crucial for maintaining an audit trail of all stock movements, including receipts, adjustments, and sales.
        -   **Inventory Audit Module:** (Future consideration) For recording and verifying stock changes, potentially integrating with stocktaking or physical inventory counts.
        -   **Reporting Service:** Utilizes stock transaction data for generating inventory reports and stock movement history reports (US-VSIM-007, US-VSIM-018).
    -   **Other Considerations:**
        -   **Concurrency:** Implement database transactions to prevent race conditions and ensure atomicity when updating stock levels and logging transactions, especially in high-volume scenarios.
        -   **Security:** Implement proper access controls to ensure that only authorized personnel can record stock receipts.
        -   **Performance:** Optimize database update and insert operations, especially for frequent stock receipts. Consider batch processing for large stock updates if needed.
        -   **Supplier Information:** Consider enhancing this user story in the future to include supplier information when recording stock receipts (linking to US-VSIM-021 and US-VSIM-022) for better supplier tracking and purchase order reconciliation.

## **US-VSIM-005: Record Stock Adjustments (Damages/Losses)**

-   **Title:** Record Stock Adjustments (Damages/Losses)
-   **As a:** Store Owner
-   **I want to:** record stock adjustments due to damages or losses
-   **So that:** I can maintain accurate inventory records and account for discrepancies.
-   **Description:** The system should allow selecting an inventory item and inputting the quantity of stock to adjust (decrease) due to damage or loss, along with a reason for adjustment.
-   **Acceptance Criteria:**
    -   Given I am logged in as a Store Owner,
    -   When I navigate to the "Inventory" section, select an item, and choose "Adjust Stock,"
    -   Then I should see a form to enter the quantity to decrease and a reason for the adjustment.
    -   And when I enter the details and click "Save,"
    -   Then the stock level for that item should decrease by the entered quantity, and the system should record the date, time, and reason for the stock adjustment.

### **Implementation Framework:**

-   **UI Elements:**
    -   **Inventory Item Detail Page:** “Adjust Stock” button available on the item detail page or within inventory list actions.
    -   **Stock Adjustment Form (Modal/Page):**
        -   Display-only field: "Item Name" (pre-filled).
        -   Dropdown: "Adjustment Type" (dropdown selection with options like "Damaged", "Lost", "Write-off", "Other").
        -   Number Input: "Quantity to Adjust (Decrease)" (number input, mandatory, integer, validation for positive integer).
        -   Text Area: "Reason for Adjustment" (mandatory text area to specify the reason for the stock adjustment).
        -   Display: "Current Stock" (display-only, showing current stock level before adjustment).
    -   **Save Adjustment Button:** To record the stock adjustment.
    -   **Cancel Button:** To discard the adjustment operation.
    -   **Confirmation Dialog:** (Optional) To verify the intended stock adjustment, especially for significant quantity decreases.
-   **Backend Architecture & Logic:**
    -   **API Endpoint:** POST /api/inventory/items/{itemId}/adjust-stock to apply stock adjustments (decreases due to damages or losses).
        -   Request Body (JSON): { "adjustmentType": string, "quantity": number, "reason": string }
    -   **Business Logic:**
        -   Validate the adjustment quantity: ensure it is a positive integer and does not result in a negative stock level below any allowable limits (if applicable business rules exist).
        -   Validate the adjustment reason: ensure a reason is provided.
        -   Decrease the stockQuantity in the InventoryItems table for the given itemId by *subtracting* the adjusted quantity.
        -   Log the stock adjustment event in the StockTransactions table, including item ID, quantity adjusted, adjustment type, timestamp, and reason.
    -   **Shared Components:**
        -   **Inventory Management Service:** Reused from US-VSIM-004 for updating stock levels, ensuring consistency in stock management operations.
        -   **Audit Logging Service:** Reused from US-VSIM-004 to maintain a consistent audit trail of stock adjustments, receipts, and sales.
        -   **Validation Module:** Reused for input validation, ensuring quantity is a positive integer and reason is provided.
        -   **Authorization Module:** Ensures that only authorized users are permitted to perform stock adjustments, crucial for inventory control and accountability.
    -   **Error Handling:**
        -   Return 404 Not Found if the item with the given itemId is not found.
        -   Return 400 Bad Request for invalid input data, such as a non-positive quantity, missing reason, or if the adjustment would result in an invalid stock level (e.g., negative stock if not allowed).
        -   Use standardized error responses for consistent error reporting and handling.
    -   **Logic Flow:**
        1. Receive POST request to /api/inventory/items/{itemId}/adjust-stock with adjustment details.
        2. Authenticate and authorize the user.
        3. Validate input data (adjustment type, quantity, reason) using Validation Module.
        4. Check if the item with itemId exists using Inventory Management Service. Return 404 if not found.
        5. Validate if the stock adjustment is permissible (e.g., does not result in negative stock if not allowed). Return 400 if invalid.
        6. If validation passes and item exists, update the stockQuantity in the InventoryItems table by subtracting the adjusted quantity using Inventory Management Service.
        7. Create a new record in the StockTransactions table via Audit Logging Service to log the stock adjustment, including details like item ID, quantity, adjustment type, reason, and timestamp.
        8. Return a success response (e.g., 200 OK) upon successful stock adjustment.
-   **Data Model Impact:**
    -   **Inventory Table (InventoryItems):**
        -   Decrement the stockQuantity field for the specified itemId by the adjusted quantity.
    -   **Stock Adjustments/Transactions Table (StockTransactions):**
        -   Record details of the stock adjustment. Reuses the StockTransactions table from US-VSIM-004.
        -   Columns: transactionId (PK, auto-generated), itemId (FK referencing InventoryItems), transactionType (string, e.g., "Stock Adjustment - Damaged"), quantityChange (integer, negative for stock decrease), adjustmentReason (string, mandatory), adjustmentTimestamp (timestamp).
-   **User Feedback & Notifications:**
    -   **Success Message:** Display a success message (e.g., "Stock adjusted for '{Item Name}' recorded successfully") upon successful stock adjustment.
    -   **Error Notifications:** Inform the user if the stock adjustment fails due to validation errors or other issues (e.g., "Insufficient stock to adjust", "Invalid quantity", "Reason for adjustment is required").
    -   **Visual Indicator:** Update the displayed stock level on the Inventory Item Detail Page and Inventory List View to reflect the adjusted stock quantity in real-time.
    -   **Confirmation Dialog:** Optionally display a confirmation dialog before saving the stock adjustment, especially for significant stock decreases, to prevent accidental adjustments.
-   **Dependencies & Considerations:**
    -   **Integration Points & Backend Dependencies:**
        -   **Inventory Service:** Shares logic with stock receipt (US-VSIM-004) and other stock management operations, ensuring consistent stock level updates.
        -   **Financial Reporting Module:** Stock adjustments due to damages or losses may affect the calculated cost of goods sold (COGS) and inventory valuation in financial reports (US-VSIM-017, US-VSIM-018). Integration with financial reporting modules is needed to account for these adjustments in financial calculations.
        -   **Audit Logging Service:** Essential for maintaining a complete audit trail of all stock adjustments, crucial for accountability and compliance.
    -   **Other Considerations:**
        -   **Security:** Implement strict access controls for stock adjustment functions, as these directly impact inventory accuracy and potentially financial records. Limit this functionality to authorized personnel only.
        -   **Data Integrity:** Ensure proper logging of all stock adjustments, including reasons and timestamps, for audit purposes and potential rollback capabilities if adjustments are made in error. Implement database transactions to ensure atomicity of stock quantity updates and transaction logging.
        -   **Auditing:** Maintain historical records of stock adjustments for audit purposes and to track patterns of damages or losses, which can inform process improvements or identify potential issues in handling or storage.
        -   **Stock Level Limits:** Define business rules regarding negative stock levels. Decide whether to prevent stock adjustments that would result in negative stock or allow negative stock under certain conditions (e.g., for tracking purposes), and implement appropriate validation and handling logic.

## **US-VSIM-006: Set Reorder Points for Inventory Items**

-   **Title:** Set Reorder Points for Inventory Items
-   **As a:** Store Owner
-   **I want to:** set a reorder point for each inventory item
-   **So that:** I can be alerted when stock levels are low and need replenishment.
-   **Description:** The system should allow specifying a minimum stock level for each item, flagging the item as needing reorder when stock falls below this point.
-   **Acceptance Criteria:**
    -   Given I am logged in as a Store Owner,
    -   When I am adding or editing an inventory item,
    -   Then I should see a field to enter the "Reorder Point" for that item.
    -   And when the current stock level of an item falls below its set reorder point,
    -   Then the system should display an alert on the dashboard or in the inventory list.

### **Implementation Framework:**

-   **UI Elements:**
    -   **Inventory Add/Edit Form (US-VSIM-001 & US-VSIM-002):**
        -   Add a Number Input field labeled “Reorder Point” in both the "Add New Item" and "Update Existing Item" forms. This field should accept non-negative integer or decimal values, depending on the item's unit and reorder strategy.
        -   Provide clear input hints or tooltips explaining the purpose of the reorder point (e.g., "Enter the minimum stock level at which you want to be alerted to reorder this item").
    -   **Inventory List View (US-VSIM-001):**
        -   Visually highlight inventory items in the list view where the "Current Stock" level is less than or equal to the "Reorder Point." This highlighting could be achieved using color-coding (e.g., red background or text), icons (e.g., a warning icon), or other visual cues to draw attention to low stock items.
    -   **Dashboard Widget (US-VSIM-026):**
        -   Include a “Low Stock Items” widget on the dashboard that displays the count of items currently below their reorder points.
        -   Make this widget clickable to navigate to a detailed list of low stock items (filtered inventory list view).
    -   **Save/Update Button:** Ensure that the "Save" and "Update" buttons in the item forms correctly save the entered "Reorder Point" value.
-   **Backend Architecture & Logic:**
    -   **API Endpoints:**
        -   Re-use the API endpoints for adding new items (POST /api/inventory/items - US-VSIM-001) and updating existing items (PUT /api/inventory/items/{itemId} - US-VSIM-002) to include handling of the reorderPoint field in the request body.
    -   **Business Logic:**
        -   **Validation:** Validate that the "Reorder Point" value entered by the user is a non-negative number.
        -   **Storage:** When saving or updating inventory items, store the "Reorder Point" value in the reorderPoint field of the InventoryItems table.
        -   **Low Stock Detection Logic:** Implement logic to check the current stock level of each item against its reorder point. This check can be performed:
            -   **Real-time:** Whenever stock levels are updated (after stock receipts, sales, adjustments), immediately check if the stock level has fallen below the reorder point.
            -   **Periodic:** Implement a background job or scheduled task (e.g., running daily or hourly) to periodically scan all inventory items and identify those below their reorder points.
        -   **Alert/Notification Trigger:** When an item's stock level is detected to be below its reorder point, trigger an alert or notification. For this user story, the primary notification is visual highlighting in the inventory list and a dashboard widget. Future enhancements could include email or in-app notifications.
    -   **Shared Components:**
        -   **Inventory Management Module:** Central module for managing all inventory item data, including reorder points, and for retrieving item stock levels.
        -   **Alert/Notification Service:** (Potentially for future enhancements) A service that can be used to generate and manage various types of alerts and notifications, including low stock alerts. For this user story, the "alert" is primarily visual highlighting, but this service could be expanded for more proactive notifications in the future.
        -   **Validation Service:** Reused from previous user stories to validate the reorder point input as a non-negative number.
    -   **Error Handling:**
        -   Return validation errors to the UI if the reorder point input is invalid (e.g., negative value, incorrect format).
-   **Data Model Impact:**
    -   **Inventory Table (InventoryItems):**
        -   Add a new field: reorderPoint (integer or decimal, depending on business needs and item units, nullable). This field will store the reorder point value for each inventory item.
-   **User Feedback & Notifications:**
    -   **Success Message:** Display a success message (e.g., "Reorder point set successfully") when the reorder point for an item is saved or updated.
    -   **Visual Highlighting in Inventory List:** Items in the inventory list with "Current Stock" ≤ "Reorder Point" should be visually highlighted (e.g., row color change, icon).
    -   **Dashboard Alert (Widget):** The “Low Stock Items” dashboard widget should display the count of items that are currently below their reorder points.
    -   **Navigation from Dashboard Widget:** Clicking on the “Low Stock Items” widget on the dashboard should navigate the user to a filtered Inventory List View, pre-filtered to show only items that are below their reorder points, allowing for quick access to items needing attention.
-   **Dependencies & Considerations:**
    -   **Integration Points & Backend Dependencies:**
        -   **Inventory List View (US-VSIM-001) and Dashboard (US-VSIM-026):** These UI components are essential for displaying the reorder point information and low stock alerts to the user.
        -   **Inventory Monitoring Service:** (Internal component) A background process or logic within the Inventory Management Module that continuously or periodically monitors stock levels against reorder points and triggers alerts.
        -   **Reporting Modules (US-VSIM-007, US-VSIM-018):** Integrate reorder point status and low stock item lists into inventory reports to provide insights into stock levels and restocking needs.
    -   **Other Considerations:**
        -   **Scalability:** Ensure that the logic for checking reorder points and generating alerts is efficient, especially as the number of inventory items grows. Optimize database queries and consider caching mechanisms for performance.
        -   **Security:** Implement proper validation and sanitization of user inputs for the reorder point field to prevent any security vulnerabilities.
        -   **Data Consistency:** Ensure that reorder point changes are consistently applied and reflected in real-time monitoring and alerts.
        -   **Alerting Mechanism Enhancements:** For future iterations, consider enhancing the alerting mechanism beyond visual highlighting to include more proactive notifications, such as email alerts, in-app notifications, or SMS alerts, to ensure timely restocking actions are taken. Allow users to configure notification preferences.

## **US-VSIM-007: Generate Inventory Reports**

-   **Title:** Generate Inventory Reports
-   **As a:** Store Owner
-   **I want to:** generate reports on my inventory
-   **So that:** I can get an overview of current stock levels, identify fast/slow-moving items, and plan restocking.
-   **Description:** The system should allow generating reports such as a full inventory list, a list of items below reorder point, and potentially a report on stock levels by category.
-   **Acceptance Criteria:**
    -   Given I am logged in as a Store Owner,
    -   When I navigate to the "Reports" section and select "Inventory Reports,"
    -   Then I should see options to generate different inventory report types (e.g., "Full Inventory," "Low Stock Items," "Inventory by Category").
    -   And when I select a report type and generate it,
    -   Then the system should display a table or list with the relevant inventory information, and ideally offer export options (CSV, PDF).

### **Implementation Framework:**

-   **UI Elements:**
    -   **Reports Section Navigation:** Add a clear navigation link or button to a "Reports" section in the main application menu.
    -   **Inventory Reports Sub-section:** Within the "Reports" section, create a sub-section or dedicated page for "Inventory Reports."
    -   **Report Type Selection:** Provide options to select different types of inventory reports, such as:
        -   "Current Stock Levels": Button or link to generate a report showing the current stock levels of all items.
        -   "Stock Movement History": Button or link to generate a report detailing the history of stock movements (receipts, adjustments, sales) within a specified date range.
        -   "Low Stock Items": Button or link to generate a report listing items that are currently below their reorder points.
    -   **Report Display Area:** Designate an area on the page to display the generated report in a structured format, typically using tables or lists.
    -   **Filter Options:** Provide filter options to customize reports, including:
        -   Date Range Filter: For "Stock Movement History" reports, allow users to select a start and end date to specify the period for which to generate the report. Use date pickers for easy date selection.
        -   Category Filter (Optional): Allow users to filter reports by inventory category (US-VSIM-003) to focus on specific product types. Use a dropdown or multi-select dropdown for category selection.
    -   **Export Options:** Include buttons or links to export the generated reports in common formats:
        -   "Export to CSV": Button to export the report data to a CSV (Comma Separated Values) file, suitable for spreadsheet analysis.
        -   "Export to PDF": Button to export the report in PDF (Portable Document Format), suitable for printing and sharing.
-   **Backend Architecture & Logic:**
    -   **API Endpoints:**
        -   GET /api/reports/inventory/current-stock – Generate and retrieve the "Current Stock Levels" report.
        -   GET /api/reports/inventory/stock-movement-history – Generate and retrieve the "Stock Movement History" report, accepting query parameters for startDate and endDate to filter by date range, and optionally categoryId for category filtering.
        -   GET /api/reports/inventory/low-stock-items – Generate and retrieve the "Low Stock Items" report.
    -   **Backend Service:** Extend the shared ReportGenerationService (initially considered in US-VSIM-007's analysis, can be created now if not existing) to handle the generation of inventory reports. This service will have methods like:
        -   generateCurrentStockReport()
        -   generateStockMovementHistoryReport(startDate, endDate, categoryId)
        -   generateLowStockItemsReport()
    -   **Business Logic:**
        -   **Report Data Aggregation:** For each report type, implement the necessary logic to aggregate data from the InventoryItems, Categories, and StockTransactions tables (and potentially SalesTransactions for stock movement related to sales).
        -   **Data Filtering and Sorting:** Apply filters (e.g., date range, category) and sorting criteria as per user selections in the UI.
        -   **Report Formatting:** Format the aggregated data into a structured format suitable for display in the UI (e.g., tabular data, JSON) and for export to CSV and PDF.
        -   **Export Functionality:** Integrate with libraries or services to generate reports in CSV and PDF formats. This might involve using a dedicated reporting library or a document generation service.
    -   **Shared Components:**
        -   **Reporting Service (ReportGenerationService):** Centralized service to handle the generation of various reports across the application (inventory reports, financial reports, etc.). This service will encapsulate report generation logic, data fetching, formatting, and export functionalities.
        -   **Data Aggregation Module:** A reusable module that provides common data aggregation functions used across different report types, such as summing quantities, calculating values, filtering data by date ranges or categories, etc.
        -   **Export Utility Service:** A service responsible for handling the export of report data to different file formats (CSV, PDF). This service can be reused across all report generation features to ensure consistent export functionality.
        -   **Authentication & Authorization Module:** Ensures that only authorized users can access and generate inventory reports.
    -   **Error Handling:**
        -   Provide clear and user-friendly error messages if report generation fails (e.g., due to data retrieval issues, invalid report parameters, no data found for selected criteria).
        -   Return appropriate HTTP error status codes (e.g., 500 Internal Server Error, 400 Bad Request) for API endpoints in case of errors.
-   **Data Model Impact:**
    -   **Inventory Table (InventoryItems):** Source of data for current stock levels, item details, categories, and reorder points.
    -   **Categories Table (Categories):** Used for filtering reports by category and including category names in reports.
    -   **Stock Transactions Table (StockTransactions):** Essential for generating "Stock Movement History" reports, providing details on stock receipts, adjustments, and potentially sales-related stock changes.
    -   **Sales Transactions Table (SalesTransactions & SaleItems):** May be needed to incorporate sales-related stock movements into "Stock Movement History" reports, showing when and how stock levels changed due to sales.
    -   **Optional Report Cache:** Consider implementing a report cache to store frequently generated reports or pre-calculated report data to improve performance and reduce database load, especially for reports that are accessed often or take a long time to generate.
-   **User Feedback & Notifications:**
    -   **Report Display:** Display the generated inventory report in a clear and structured table or list format within the UI. Ensure the report is easy to read and understand.
    -   **Export Options:** Provide clear and easily accessible buttons or links for exporting the report to CSV and PDF formats.
    -   **Success Notification:** Display a success message (e.g., "Report generated successfully") upon successful report generation.
    -   **Loading Indicator:** Show a loading indicator or progress bar while the report data is being processed and generated, especially for reports that involve complex queries or large datasets.
    -   **Error Message:** Display user-friendly error messages if report generation fails, informing the user about the issue (e.g., "No data available for selected criteria", "Error generating report. Please try again later.").
-   **Dependencies & Considerations:**
    -   **Integration Points & Backend Dependencies:**
        -   **Reporting Engine (ReportGenerationService):** Central dependency for handling all report generation tasks. Ensure it is well-designed and extensible to support future report types.
        -   **Data Aggregation Module:** Essential for efficiently aggregating and processing data from various tables for report generation.
        -   **Export Service (ExportUtilityService):** Provides reusable functionality for exporting reports to different formats.
        -   **Database Optimization:** Ensure that database queries used for report generation are optimized for performance, especially for reports that involve joining multiple tables and filtering large datasets. Use database indexing and query optimization techniques.
    -   **Other Considerations:**
        -   **Performance:** Optimize report generation performance to ensure reports are generated quickly, even for large datasets. Consider using asynchronous processing for long-running reports and caching mechanisms for frequently accessed reports.
        -   **Security:** Implement proper authorization and access controls to ensure that only authorized users can generate and access inventory reports, especially those containing sensitive stock level or value information.
        -   **Scalability:** Design the reporting system to handle increasing data volumes and user load as the store grows. Consider using pagination for displaying large reports in the UI and efficient data processing techniques in the backend.
        -   **Customization:** In future iterations, consider adding more customization options to inventory reports, such as allowing users to select specific columns to include in reports, customize report layouts, or add calculated fields.

---

# Sales Management

## **US-VSIM-008: Record a Sales Transaction**

-   **Title:** Record a Sales Transaction
-   **As a:** Store Owner
-   **I want to:** record a new sales transaction
-   **So that:** I can track sales, generate invoices for customers, and manage income.
-   **Description:** The system should allow selecting items being sold, specifying quantities, applying discounts, and recording the customer payment method.
-   **Acceptance Criteria:**
    -   Given I am logged in as a Store Owner,
    -   When I navigate to the "Sales" section and click "New Sale,"
    -   Then I should see an interface to select items from inventory, enter quantities, and view the total amount.
    -   And I should have options to apply discounts and select the payment method (cash, card, etc.).
    -   And when I finalize the sale, the system should update stock levels of sold items and record transaction details.

### **Implementation Framework:**

-   **UI Elements:**
    -   **Sales Section:** Prominent navigation link or button to access the "Sales" section.
    -   **New Sale Button:** Clearly visible button (e.g., "New Sale", "Record Sale") to initiate a new sales transaction.
    -   **Sales Transaction Form/Page:**
        -   **Item Selection:**
            -   Searchable item selection: Implement a searchable dropdown or autocomplete input field to allow users to easily search and select items from the inventory (US-VSIM-001).
            -   Display item details: As items are selected, display relevant details such as item name, current stock level, selling price, and unit of measurement.
        -   **Quantity Input:**
            -   Input field for quantity: For each selected item, provide a number input field to specify the quantity being sold. Validate that the quantity is a positive integer and not exceeding the available stock.
        -   **Dynamic Total Calculation:**
            -   Real-time subtotal and total: Dynamically calculate and display the subtotal for each item (quantity \* selling price) and the overall total for the sale as items are added and quantities are adjusted.
        -   **Discount Application (Optional, US-VSIM-013):**
            -   Discount options: Provide options to apply discounts, either at the item level or for the entire sale. This could include percentage discounts, fixed amount discounts, or promotional codes.
            -   Discount input fields: If discounts are enabled, include input fields to enter discount values. Dynamically recalculate totals when discounts are applied.
        -   **Payment Method Selection:**
            -   Payment method dropdown: Provide a dropdown list to select the payment method used by the customer (e.g., Cash, Credit Card, Debit Card, Mobile Payment). Populate this list from the managed payment methods (US-VSIM-012).
        -   **Customer Information (Optional, US-VSIM-014):**
            -   Customer association: Optionally allow associating the sale with an existing customer. This could be implemented as a searchable dropdown to select from existing customer profiles.
        -   **Finalize Sale Button:**
            -   Prominent button (e.g., "Finalize Sale", "Complete Transaction", "Record Payment") to confirm and submit the sale transaction.
        -   **Invoice Preview (Optional):**
            -   Option to preview invoice: Before finalizing the sale, provide an option to preview the invoice/receipt to review the transaction details.
-   **Backend Architecture & Logic:**
    -   **API Endpoint:** POST /api/sales/transactions to create a new sales transaction. - Request Body (JSON):
        `{
  "saleDate": datetime, // Date and time of the sale transaction
  "items": [ // Array of items sold in this transaction
    { "itemId": number, "quantity": number, "discount": number (optional) }
  ],
  "paymentMethod": string, // Payment method selected by customer
  "customerId": number (optional), // ID of the customer, if associated
  "saleDiscount": number (optional) // Discount applied to the entire sale
}`
    -   **Business Logic:**
        -   **Validation:**
            -   Validate item selections: Ensure that all selected itemId values are valid and correspond to existing inventory items.
            -   Validate quantities: Ensure that quantities are positive integers and do not exceed the available stock for each item. Implement real-time stock validation to prevent overselling.
            -   Validate discount rules: If discounts are applied, validate discount values and ensure they adhere to defined rules (e.g., percentage within 0-100%, fixed amount not exceeding total).
            -   Validate payment method: Ensure the selected paymentMethod is valid and from the list of managed payment methods (US-VSIM-012).
        -   **Calculation:**
            -   Calculate subtotals: For each item, calculate the subtotal (quantity \* selling price) and apply item-level discounts if applicable.
            -   Calculate total amount: Sum up the subtotals for all items, apply sale-level discounts (if any), and calculate the final total sale amount, including taxes (if applicable, US-VSIM-020).
        -   **Inventory Update:**
            -   Update stock levels: Upon successful sale recording, decrease the stockQuantity in the InventoryItems table for each sold item by the respective quantities. Implement real-time inventory updates to reflect changes immediately.
        -   **Record Transaction:**
            -   Database operations:
                -   Insert a new record into the SalesTransactions table to record the overall sale transaction details (sale date, total amount, payment method, customer ID, sale-level discount).
                -   For each item sold, insert a record into the SaleItems table to record item-specific details (item ID, quantity, selling price at the time of sale, item-level discount, linking it to the SalesTransactions record).
    -   **Shared Components:**
        -   **Inventory Management Service:** Crucial for retrieving item details (selling price, current stock) and updating stock levels upon sale.
        -   **Payment Processing Module:** (If integrating with payment gateways) For validating and processing payments, especially for card or mobile payments. For this user story, primarily used for validating selected payment methods.
        -   **Calculation Service:** Reused from US-VSIM-017 and US-VSIM-020 for performing calculations related to discounts, taxes (if applicable), subtotals, and totals. This ensures consistency in calculations across the application.
        -   **Authentication & Authorization Service:** Ensures that only authorized users (e.g., store staff, store owners) can record sales transactions.
        -   **Transaction Management:** Implement database transactions to ensure atomicity of the entire sale recording process. All operations (inventory update, sales record creation, payment recording) should be treated as a single transaction. If any operation fails, the entire transaction should be rolled back to maintain data consistency.
    -   **Error Handling:**
        -   Return 400 Bad Request for validation failures, such as:
            -   "Insufficient stock for item '{Item Name}'" if trying to sell more than available stock.
            -   "Invalid quantity entered for item '{Item Name}'" if quantity is not a positive integer or is invalid.
            -   "Invalid payment method selected" if the selected payment method is not valid.
            -   "Discount value is invalid" if discount rules are violated.
        -   Return 500 Internal Server Error for any unexpected server-side errors during sale processing.
        -   Use standardized error responses for consistent error reporting.
    -   **Logic Flow:**
        1. Receive POST request to /api/sales/transactions with sale details.
        2. Authenticate and authorize the user.
        3. Validate input data: item selections, quantities, discounts, payment method, stock availability using Validation Module and Inventory Management Service.
        4. If validation fails, return 400 Bad Request with appropriate error messages.
        5. If validation passes, perform the following operations within a database transaction:
            - Calculate subtotals, discounts, and total sale amount using Calculation Service.
            - For each item sold, update stockQuantity in InventoryItems table using Inventory Management Service (decrease stock).
            - Record the sale transaction in the SalesTransactions table and sale items in the SaleItems table using Sales Service.
            - (If payment processing is integrated) Process payment using Payment Processing Module.
        6. If all operations within the transaction are successful, commit the transaction and return a success response (e.g., 201 Created) with sale transaction details or invoice/receipt information.
        7. If any operation fails within the transaction, roll back the entire transaction and return an appropriate error response (e.g., 500 Internal Server Error).
-   **Data Model Impact:**
    -   **Sales Transactions Table (SalesTransactions):**
        -   Create a new record for each sale transaction.
        -   Columns: saleId (PK, auto-generated), saleDate (datetime), totalAmount (decimal), paymentMethod (string), customerId (FK referencing Customers, nullable), saleDiscount (decimal, optional), transactionTimestamp (timestamp).
    -   **Sale Items Table (SaleItems):**
        -   Create one or more records for each sale transaction, detailing the items sold.
        -   Columns: saleItemId (PK, auto-generated), saleId (FK referencing SalesTransactions), itemId (FK referencing InventoryItems), quantity (integer), sellingPrice (decimal, price at the time of sale), itemDiscount (decimal, optional).
    -   **Inventory Table (InventoryItems):**
        -   Update the stockQuantity field for each sold item, decreasing it by the sold quantity.
-   **User Feedback & Notifications:**
    -   **Success Message:** Display a success message (e.g., "Sale recorded successfully", "Transaction completed") upon successful recording of the sale.
    -   **Error Notifications:** Display clear and informative error messages if a sale cannot be completed due to validation failures, insufficient stock, payment processing errors, or other issues (e.g., "Insufficient stock for '{Item Name}'", "Invalid quantity", "Payment processing failed. Please try again.").
    -   **Real-Time Updates:**
        -   Reflect updated inventory counts in the UI immediately after a sale is recorded. Update the stock level display on the item selection dropdown or in the inventory list view.
        -   Dynamically update the total sale amount in real-time as items are added, quantities are adjusted, and discounts are applied.
    -   **Invoice/Receipt Generation:** After a successful sale, provide options to generate and print or email an invoice/receipt for the transaction (US-VSIM-011).
-   **Dependencies & Considerations:**
    -   **Integration Points & Backend Dependencies:**
        -   **Inventory Management Service:** Critical dependency for real-time stock level checks and updates.
        -   **Payment Gateway/Method Integration:** (If payment processing is to be integrated) Integrate with chosen payment gateways or payment method APIs to validate and record payment transactions securely.
        -   **Calculation Service:** Integral for accurate tax and discount computations and total amount calculations.
        -   **Sales Service:** Manages the recording of sales transactions and related data operations.
        -   **Customer Service (Optional):** If customer tracking (US-VSIM-014) is implemented, integrate with Customer Service to associate sales with customer profiles.
    -   **Other Considerations:**
        -   **Transaction Management:** Implement robust database transaction management to ensure data atomicity and consistency across all operations involved in recording a sale.
        -   **Security:** Handle payment data securely, especially if integrating with payment gateways. Ensure compliance with PCI DSS or other relevant security standards for payment processing. Secure access to sale recording functionality to prevent unauthorized transactions.
        -   **Performance:** Optimize inventory lookup and update operations to ensure fast and responsive sale recording, even during peak hours or with a large number of concurrent users. Consider database indexing and caching strategies.
        -   **Offline Capabilities:** (Future Enhancement) Consider requirements for offline sale recording if the store needs to operate without a constant internet connection. Implement mechanisms to synchronize offline sales data when connectivity is restored.

## **US-VSIM-009: View Sales History**

-   **Title:** View Sales History
-   **As a:** Store Owner
-   **I want to:** view a history of all recorded sales
-   **So that:** I can monitor sales trends and performance.
-   **Description:** The system should display a list of all past sales, including sale date, items sold, quantities, and total amount for each sale.
-   **Acceptance Criteria:**
    -   Given I am logged in as a Store Owner,
    -   When I navigate to the "Sales History" section,
    -   Then I should see a list of all recorded sales.
    -   And for each sale, the list should show "Date of Sale," "Items Sold" (with quantities), and "Total Amount."
    -   And the list should be sortable by "Date of Sale" (newest first by default) and filterable by date range, payment method or item.

### **Implementation Framework:**

-   **UI Elements:**
    -   **Sales Section:** Navigation to the "Sales" section should be clear and accessible.
    -   **Sales History Sub-section/Page:** Create a dedicated sub-section or page labeled "Sales History" within the "Sales" section.
    -   **Sales History List/Table:**
        -   Display a comprehensive list or table of all recorded sales transactions.
        -   Columns in the table should include:
            -   "Sale ID" (Transaction ID for easy reference).
            -   "Date of Sale" (Date and time of the sale transaction, sortable).
            -   "Items Sold" (Concise summary of items sold in the transaction, potentially with a "View Details" option to expand and show all items).
            -   "Quantities" (Total quantities of items sold - could be aggregated or shown per item if concise).
            -   "Total Amount" (Total value of the sale transaction, sortable).
            -   "Payment Method" (Payment method used for the transaction, filterable).
            -   "Customer (Optional)" (Customer name if the sale was associated with a customer, filterable).
            -   "Actions" (Optional column for actions like "View Details", "Process Return", "Generate Invoice").
    -   **Sorting Controls:**
        -   Enable sorting of the sales history list by relevant columns, such as "Date of Sale" (default sorting: newest first), "Total Amount," "Sale ID," etc. Allow users to easily toggle sorting order (ascending/descending).
    -   **Filtering Options:**
        -   Date Range Filter: Implement a date range filter to allow users to view sales within a specific period (e.g., "Today," "Yesterday," "Last 7 Days," "This Month," "Last Month," "Custom Range"). Use date pickers for custom date range selection.
        -   Payment Method Filter: Provide a filter to view sales based on the payment method used (e.g., "Cash," "Card," "All Payment Methods"). Populate filter options from managed payment methods (US-VSIM-012).
        -   Item Filter (Optional): Consider adding a filter to search or filter sales by specific items sold.
        -   Customer Filter (Optional): If customer tracking (US-VSIM-014) is implemented, allow filtering sales by customer name or customer ID.
    -   **Pagination Controls:**
        -   Implement pagination for the sales history list to handle large volumes of sales records efficiently. Display sales in manageable pages with "Previous," "Next," and page number navigation.
    -   **Search Bar (Optional):**
        -   Consider adding a search bar to allow users to search for specific sales transactions by Sale ID, customer name, or item name.
-   **Backend Architecture & Logic:**
    -   **API Endpoint:** GET /api/sales/history to fetch sales history records.
        -   Query Parameters:
            -   startDate: Date (optional, for date range filtering).
            -   endDate: Date (optional, for date range filtering).
            -   paymentMethod: String (optional, to filter by payment method).
            -   customerId: Number (optional, to filter by customer).
            -   page: Integer (optional, for pagination).
            -   pageSize: Integer (optional, for pagination, e.g., number of sales per page).
            -   sortBy: String (optional, column to sort by).
            -   sortOrder: String (optional, "asc" or "desc").
    -   **Business Logic:**
        -   **Data Retrieval:**
            -   Query the SalesTransactions table to retrieve sales records, joining with SaleItems and InventoryItems tables to fetch item details and potentially Customers table for customer information (if customer tracking is enabled).
            -   Apply filters based on provided query parameters (date range, payment method, customer).
            -   Implement pagination logic to retrieve sales records in chunks (pages) based on page and pageSize parameters.
            -   Implement sorting logic based on sortBy and sortOrder parameters. Default sorting should be by "Date of Sale" in descending order (newest first).
        -   **Data Aggregation:**
            -   Aggregate sale details for display in the sales history list, such as summarizing items sold, calculating total quantities, and formatting total amounts.
    -   **Shared Components:**
        -   **Sales Service:** Central service responsible for retrieving and managing sales transaction data. Reused from US-VSIM-008.
        -   **Pagination & Filtering Service:** Reusable service to handle pagination and filtering of data lists across various modules (sales history, inventory list, etc.). This service can encapsulate common pagination and filtering logic.
        -   **Authentication & Authorization Module:** Ensures that only authorized users (e.g., store staff, store owners) can access and view sales history data.
        -   **Reporting Module:** (Potentially) Shared logic with financial reporting features for retrieving and aggregating historical sales data.
    -   **Error Handling:**
        -   Return 200 OK with an empty list if no sales records are found matching the filter criteria or date range.
        -   Return 400 Bad Request for invalid query parameters (e.g., invalid date format, invalid payment method).
        -   Return 500 Internal Server Error for any unexpected server-side errors during data retrieval.
        -   Use standardized error responses for consistent error reporting.
    -   **Logic Flow:**
        1. Receive GET request to /api/sales/history with optional filter, pagination, and sorting parameters.
        2. Authenticate and authorize the user.
        3. Validate query parameters (date format, payment method, page number, etc.). Return 400 Bad Request for invalid parameters.
        4. Retrieve sales history data from the database using Sales Service, applying filters, pagination, and sorting as specified in the query parameters.
        5. Aggregate and format the retrieved data for display in the sales history list.
        6. Return a success response (e.g., 200 OK) with the list of sales history records (in JSON format), including pagination metadata (e.g., total records, current page, total pages).
        7. If no sales records are found, return 200 OK with an empty list and appropriate metadata.
-   **Data Model Impact:**
    -   **Sales Transactions Table (SalesTransactions):** Primary table to query for sales history data.
    -   **Sale Items Table (SaleItems):** Joined with SalesTransactions to retrieve details of items sold in each transaction.
    -   **Inventory Items Table (InventoryItems):** Joined with SaleItems to retrieve item names and other item details for display in the sales history.
    -   **Customers Table (Customers):** (Optional) Joined with SalesTransactions if customer tracking (US-VSIM-014) is enabled, to retrieve customer names for associated sales.
    -   **Optional Audit Tables:** Consider utilizing audit tables or history tables (if implemented) for deeper historical insights into sales transactions, although not directly required for this user story's basic functionality.
-   **User Feedback & Notifications:**
    -   **Sales History Display:** Display a clear and well-structured list or table of sales history records in the UI, with all the columns as defined in the UI Elements section.
    -   **Sorting and Filtering:** Ensure that sorting controls and filter options are functional and allow users to easily sort and filter the sales history list as needed.
    -   **Pagination:** Implement pagination controls to allow users to navigate through large volumes of sales records page by page. Display pagination information (e.g., current page number, total pages).
    -   **Loading Indicator:** Show a loading indicator while the sales history data is being fetched from the backend, especially when dealing with large datasets or slow network connections.
    -   **Empty State Message:** Display a user-friendly message (e.g., "No sales found for the selected criteria" or "No sales history available") if no sales records are found based on the applied filters or date range.
    -   **Error Notification:** Display user-friendly error notifications if there are issues retrieving sales history data from the backend (e.g., "Failed to load sales history. Please try again later.").
-   **Dependencies & Considerations:**
    -   **Integration Points & Backend Dependencies:**
        -   **Sales Service:** Essential dependency for retrieving sales transaction data from the database.
        -   **Authentication Module:** Ensures secure access to sales history data, restricting access to authorized users only.
        -   **Data Aggregation Service:** (Internal component) Used for efficiently aggregating sales data from multiple tables and preparing it for display.
        -   **Pagination & Filtering Service:** (Shared Component) Provides reusable pagination and filtering capabilities for handling large datasets in the sales history view and potentially other list views in the application.
    -   **Other Considerations:**
        -   **Performance:** Optimize database queries for retrieving sales history data, especially when applying filters, sorting, and pagination, to ensure fast response times and a smooth user experience. Use database indexing on relevant columns (e.g., saleDate, paymentMethod, customerId) to improve query performance.
        -   **Scalability:** Design the sales history view and backend data retrieval logic to handle potentially large datasets of sales transactions as the store grows over time. Efficient pagination and data streaming techniques may be necessary for very large datasets.
        -   **Security:** Ensure that access to sales history data is properly secured and restricted to authorized users only. Implement appropriate authentication and authorization mechanisms to protect sensitive sales information.

## **US-VSIM-010: Process Returns/Refunds**

-   **Title:** Process Returns/Refunds
-   **As a:** Store Owner
-   **I want to:** process returns and issue refunds for sales
-   **So that:** I can manage customer returns efficiently and accurately adjust inventory and financial records.
-   **Description:** The system should allow locating a previous sales transaction, identifying returned items, and processing a refund, also updating inventory levels for returned items.
-   **Acceptance Criteria:**
    -   Given I am logged in as a Store Owner,
    -   When I navigate to the "Sales History" section and select a sale to process a return,
    -   Then I should see details of the original sale.
    -   And I should have an option to select items for return and specify quantity.
    -   And when I process the return, the system should update stock levels of returned items and record the refund amount, linking the return to the original sale.

### **Implementation Framework:**

-   **UI Elements:**
    -   **Sales History Detail Page:**
        -   Access from Sales History (US-VSIM-009): When viewing details of a specific sale transaction in the Sales History, provide a "Process Return" button or action link prominently displayed on the sale details page.
    -   **Return Processing Form/Page:**
        -   **Display Original Sale Details:** Clearly display the details of the original sale transaction, including Sale ID, Date of Sale, Customer (if applicable), Payment Method, and a list of items sold in the original sale (with quantities and prices). This provides context for the return process.
        -   **Select Items for Return:** Provide a mechanism for the user to select which items from the original sale are being returned. This could be implemented using:
            -   Checkboxes: A checkbox next to each item in the list, allowing users to select multiple items for return.
            -   Quantity Input Fields: For each item, provide an input field to specify the quantity of that specific item being returned. This allows for partial returns of items. Validate that the returned quantity does not exceed the originally sold quantity for each item.
        -   **Refund Amount Display:**
            -   Dynamically calculate and display the refund amount in real-time as items are selected for return and quantities are specified. The refund amount should be based on the selling price of the returned items and any applicable discounts from the original sale.
        -   **Reason for Return (Optional but Recommended):**
            -   Text area or dropdown: Include an optional field to capture the reason for the return (e.g., "Damaged," "Customer dissatisfaction," "Wrong item ordered"). This information can be valuable for tracking return reasons and identifying potential product or process issues.
        -   **Refund Method (Optional):**
            -   Dropdown: Optionally, provide a dropdown to select the refund method (e.g., "Cash Refund," "Credit to Card," "Store Credit"). This can help in tracking how refunds were processed.
        -   **Submit Return Button:**
            -   Prominent button (e.g., "Process Return", "Issue Refund", "Confirm Return") to initiate the return and refund process.
        -   **Cancel Button:**
            -   Button to cancel the return processing and go back to the sale details page.
-   **Backend Architecture & Logic:**
    -   **API Endpoint:** POST /api/sales/transactions/{saleId}/returns to process a return for a specific sale transaction, where {saleId} is the ID of the original sale transaction. - Request Body (JSON):
        `{
  "returnDate": datetime, // Date and time of the return processing
  "items": [ // Array of items being returned
    { "itemId": number, "quantity": number, "reason": string (optional) }
  ],
  "refundMethod": string (optional), // Method of refund (e.g., "Cash", "Card")
  "reasonForReturn": string (optional) // Overall reason for the return transaction
}`
    -   **Business Logic:**
        -   **Validation:**
            -   Validate sale ID: Ensure that the saleId in the API request is valid and corresponds to an existing sales transaction in the SalesTransactions table.
            -   Validate returned items: Ensure that all itemId values in the items array are valid and were part of the original sale transaction.
            -   Validate returned quantities: For each item being returned, validate that the returned quantity is a positive integer and does not exceed the quantity originally sold in the transaction for that item. Prevent over-returns.
        -   **Calculation:**
            -   Calculate refund amount: Calculate the total refund amount based on the selling price of the returned items (using the original selling price from the SaleItems table) and any applicable discounts from the original sale. Accurately calculate partial refunds for partial returns.
        -   **Inventory Update:**
            -   Update stock levels: Upon successful return processing, increase the stockQuantity in the InventoryItems table for each returned item by the respective returned quantities. Update inventory levels in real-time.
        -   **Record Return Transaction:**
            -   Database operations:
                -   Insert a new record into a Returns table to record the overall return transaction details, including saleId (linking it to the original sale), returnDate, totalRefundAmount, refundMethod, and overall reasonForReturn.
                -   For each item returned, insert a record into a ReturnItems table to record item-specific details, including itemId, quantityReturned, refundAmountForItem, and reason (if provided for each item), linking it to the Returns record.
        -   **Update Sales Transaction (Optional):**
            -   Consider updating the original SalesTransactions record to reflect the return, potentially by adding a "returnStatus" flag or linking to the Returns record. This can help in tracking which sales have associated returns.
    -   **Shared Components:**
        -   **Sales Service:** Central service for managing sales transactions, including processing returns and refunds. Reused and extended from US-VSIM-008 and US-VSIM-009.
        -   **Inventory Management Service:** Essential for updating stock levels when items are returned. Reused from US-VSIM-004 and US-VSIM-005.
        -   **Calculation Module:** Reused from US-VSIM-013, US-VSIM-017, and US-VSIM-020 for calculating refund amounts accurately, potentially reusing discount and tax calculation logic from the original sale.
        -   **Authentication & Authorization Module:** Ensures that only authorized users (e.g., store staff, store owners) can process returns and issue refunds.
        -   **Transaction Management:** Implement database transactions to ensure atomicity of the entire return processing workflow. All operations (inventory update, return record creation, refund recording, sales record update) should be treated as a single transaction. If any operation fails, the entire transaction should be rolled back to maintain data consistency.
    -   **Error Handling:**
        -   Return 404 Not Found if the original sale transaction with the given saleId is not found.
        -   Return 400 Bad Request for validation failures, such as:
            -   "Invalid return quantity for item '{Item Name}'. Quantity exceeds originally sold quantity." if trying to return more than sold.
            -   "Invalid item '{Item Name}' for return. Item was not part of the original sale." if trying to return an item not in the original sale.
            -   "Invalid sale ID" if the provided saleId is not valid.
        -   Return 500 Internal Server Error for any unexpected server-side errors during return processing.
        -   Use standardized error responses for consistent error reporting.
    -   **Logic Flow:**
        1. Receive POST request to /api/sales/transactions/{saleId}/returns with return details.
        2. Authenticate and authorize the user.
        3. Validate input data: saleId, returned items, quantities, and ensure quantities do not exceed originally sold amounts using Validation Module and Sales Service.
        4. Check if the original sale transaction with saleId exists using Sales Service. Return 404 if not found.
        5. If validation fails, return 400 Bad Request with appropriate error messages.
        6. If validation passes and sale exists, perform the following operations within a database transaction:
            - Calculate the total refund amount using Calculation Module, based on returned items and original sale prices/discounts.
            - For each returned item, update stockQuantity in InventoryItems table using Inventory Management Service (increase stock).
            - Record the return transaction in the Returns table and returned items in the ReturnItems table using Sales Service.
            - (Optionally) Update the original SalesTransactions record to reflect the return status.
            - (Potentially, if refund processing is integrated with payment gateways) Initiate refund processing through Payment Processing Module (future enhancement, not explicitly required by this user story).
        7. If all operations within the transaction are successful, commit the transaction and return a success response (e.g., 201 Created) with return transaction details or refund confirmation.
        8. If any operation fails within the transaction, roll back the entire transaction and return an appropriate error response (e.g., 500 Internal Server Error).
-   **Data Model Impact:**
    -   **Returns Table (Returns):**
        -   Create a new table to record return transactions.
        -   Columns: returnId (PK, auto-generated), saleId (FK referencing SalesTransactions), returnDate (datetime), totalRefundAmount (decimal), refundMethod (string, optional), reasonForReturn (string, optional), transactionTimestamp (timestamp).
    -   **Return Items Table (ReturnItems):**
        -   Create a new table to record details of items returned in each return transaction.
        -   Columns: returnItemId (PK, auto-generated), returnId (FK referencing Returns), itemId (FK referencing InventoryItems), quantityReturned (integer), refundAmountForItem (decimal), reason (string, optional).
    -   **Sales Transactions Table (SalesTransactions):**
        -   (Optional) Add a column: returnStatus (string or boolean) or returnId (FK referencing Returns) to the SalesTransactions table to track if a sale has been returned or partially returned.
    -   **Inventory Table (InventoryItems):**
        -   Update the stockQuantity field for each returned item, increasing it by the returned quantity.
-   **User Feedback & Notifications:**
    -   **Success Message:** Display a success message (e.g., "Return processed and refund recorded successfully", "Return transaction completed") upon successful processing of the return and refund.
    -   **Error Alerts:** Display clear and informative error messages if return processing fails due to validation errors, invalid sale ID, insufficient quantities, or other issues (e.g., "Invalid return quantity for '{Item Name}'", "Sale transaction not found", "Error processing return. Please try again later.").
    -   **Real-Time Update:**
        -   Reflect updated inventory counts in the UI immediately after processing the return. Update the stock level display on the Inventory Item Detail Page or Inventory List View for returned items.
        -   Update the sales transaction status in the Sales History View to indicate that a return/refund has been processed for the sale (e.g., add a "Returned" status tag or icon).
    -   **Refund Amount Display:** Dynamically display the calculated refund amount in the UI during the return processing, ensuring transparency for the user.
-   **Dependencies & Considerations:**
    -   **Integration Points & Backend Dependencies:**
        -   **Sales Service:** Core dependency for retrieving original sale details and managing return transactions.
        -   **Inventory Service:** Essential for updating stock levels for returned items.
        -   **Calculation Module:** Crucial for accurate refund amount calculations, potentially reusing logic from sales and discount calculations.
        -   **Refund Processing Module:** (Future Enhancement) If integrating with payment gateways for automated refunds, a dedicated Refund Processing Module would be required to handle refund transactions with payment providers. For this user story, focus is primarily on recording the return and updating inventory/financial records.
        -   **Financial Reporting Module:** Returns and refunds directly impact financial records. Ensure that processed returns are correctly reflected in financial reports, profit and loss statements, and sales reports (US-VSIM-017, US-VSIM-018).
    -   **Other Considerations:**
        -   **Transaction Management:** Implement robust database transaction management to ensure atomicity of all operations involved in processing a return.
        -   **Security:** Implement proper authorization and access controls for processing returns and issuing refunds, as these actions have financial implications.
        -   **Audit Trail:** Maintain a comprehensive audit trail of all return transactions, including details of returned items, refund amounts, reasons for return, and timestamps, for audit purposes and to track return patterns.
        -   **Partial Returns and Refunds:** Ensure the system supports partial returns and accurately calculates partial refunds when only some items from a sale are returned or when quantities are partially returned.
        -   **Refund Methods:** Consider supporting various refund methods (cash, card, store credit) and track the chosen refund method for each return transaction.
        -   **Reporting and Analysis:** In future iterations, provide reporting and analysis capabilities to track return rates, reasons for returns, and the financial impact of returns on the business. This data can be valuable for improving product quality, customer satisfaction, and return processes.

## **US-VSIM-011: Generate Invoices/Receipts**

-   **Title:** Generate Invoices/Receipts
-   **As a:** Store Owner
-   **I want to:** generate invoices or receipts for sales transactions
-   **So that:** I can provide customers with proof of purchase and maintain proper records.
-   **Description:** The system should generate a printable/downloadable invoice/receipt for each sale, including store info, customer info (if available), items sold, quantities, prices, discounts (if any), total amount, and payment method.
-   **Acceptance Criteria:**
    -   Given I have recorded a sales transaction,
    -   When I view the details of that sale,
    -   Then I should see an option to "Generate Invoice/Receipt."
    -   And when I click this option, the system should generate a document with all necessary sale details, and options to print or email.

### **Implementation Framework:**

-   **UI Elements:**
    -   **Sales Transaction Detail Page:**
        -   Access from Sales History (US-VSIM-009): When viewing details of a specific sale transaction in the Sales History, provide a "Generate Invoice/Receipt" button or action link prominently displayed on the sale details page.
    -   **Invoice/Receipt Preview Modal/Page:**
        -   **Invoice/Receipt Header:** Display store information in the header, including:
            -   Store Name (from Store Information settings - US-VSIM-028).
            -   Store Address (from Store Information settings - US-VSIM-028).
            -   Store Contact Details (Phone, Email - from Store Information settings - US-VSIM-028).
            -   Store Logo (Optional, from Store Information settings - US-VSIM-028).
        -   **Invoice/Receipt Information:**
            -   Document Title: Clearly label as "Invoice" or "Receipt".
            -   Invoice/Receipt Number: Unique sequential number for each document.
            -   Date: Date of the sale transaction.
            -   Customer Information (Optional, if customer is associated with the sale - US-VSIM-014): Customer Name, Contact Details.
        -   **Sale Transaction Details Table:**
            -   Itemized list of items sold in the transaction.
            -   Columns: "Item Name," "Quantity," "Unit Price," "Discount (if any)," "Subtotal."
        -   **Summary Section:**
            -   Total Amount: Display the total amount of the sale transaction, including any applicable taxes and discounts.
            -   Payment Method: Indicate the payment method used for the transaction.
            -   Tax Details (If applicable, US-VSIM-020): Show the calculated tax amount separately, if taxes are configured.
        -   **Footer:**
            -   Store Footer Text (Optional): Include a customizable footer with store policies, return information, or promotional messages (from Store Information settings or Report Settings - US-VSIM-028, US-VSIM-030).
        -   **Action Buttons:**
            -   "Download as PDF": Button to download the invoice/receipt as a PDF file.
            -   "Print": Button to print the invoice/receipt directly from the browser.
            -   "Email Invoice" (Optional): Button to email the invoice/receipt to the customer's email address (if customer information is available).
            -   "Close": Button to close the invoice/receipt preview modal/page.
-   **Backend Architecture & Logic:**
    -   **API Endpoint:** GET /api/sales/transactions/{saleId}/invoice to generate and retrieve the invoice/receipt for a specific sale transaction, where {saleId} is the ID of the sale.
        -   Response Format: The API should return the invoice/receipt data in a format suitable for rendering in the UI (e.g., JSON) or directly as a PDF file (if PDF generation is handled server-side).
    -   **Business Logic:**
        -   **Data Retrieval:**
            -   Retrieve sale transaction details from the SalesTransactions table using the provided saleId.
            -   Retrieve item details for each sold item from the SaleItems and InventoryItems tables, including quantities, selling prices, and discounts.
            -   Retrieve store information (name, address, logo, etc.) from the StoreInformation settings (US-VSIM-028).
            -   Retrieve customer information (if associated with the sale) from the Customers table (US-VSIM-014).
            -   Retrieve tax settings (if applicable, US-VSIM-020) to include tax details in the invoice/receipt.
        -   **Invoice/Receipt Generation:**
            -   Document templating: Implement a templating engine or library to create the invoice/receipt layout and structure. The template should be designed to accommodate store information, sale details, customer information, and all necessary components of a professional invoice/receipt.
            -   Data population: Populate the invoice/receipt template with the retrieved data: store information, sale transaction details, item lists, quantities, prices, discounts, totals, payment method, customer information, and tax details.
            -   Number formatting: Format monetary values (prices, totals, discounts, taxes) according to the configured currency settings (US-VSIM-029).
            -   Date formatting: Format dates according to the user's preferred date format (US-VSIM-030) or a default format.
        -   **PDF Generation (Optional, Server-Side):**
            -   If server-side PDF generation is required, integrate with a PDF generation library (e.g., jsPDF, PDFMake, server-side PDF libraries).
            -   Generate the invoice/receipt as a PDF document based on the populated template.
    -   **Shared Components:**
        -   **Sales Service:** Provides access to sales transaction data and related item details. Reused from US-VSIM-008, US-VSIM-009, and US-VSIM-010.
        -   **Store Settings Service:** Provides access to store information settings (name, address, logo, etc.) for inclusion in invoices/receipts. Reused from US-VSIM-028.
        -   **Formatting Service:** (Potentially) A dedicated service to handle formatting of currency values, dates, numbers, and other data in invoices/receipts and reports, ensuring consistency across the application.
        -   **Reporting & Document Generation Service:** (If implemented as a separate service) Central service for generating various types of documents, including invoices, receipts, financial reports, etc. This service can manage document templating, data population, and export functionalities.
        -   **Authentication & Authorization Module:** Ensures that only authorized users can generate invoices/receipts for sales transactions.
    -   **Error Handling:**
        -   Return 404 Not Found if the sale transaction with the given saleId is not found.
        -   Return 500 Internal Server Error for any errors during invoice/receipt generation, data retrieval, or PDF generation (if applicable).
        -   Use standardized error responses for consistent error reporting.
    -   **Logic Flow:**
        1. Receive GET request to /api/sales/transactions/{saleId}/invoice to generate an invoice/receipt for a specific sale.
        2. Authenticate and authorize the user.
        3. Retrieve sale transaction data, item details, store information, customer information (if applicable), and tax settings using Sales Service, Store Settings Service, and potentially Customer Service and Tax Service.
        4. Populate the invoice/receipt template with the retrieved data, format currency values and dates, and generate the invoice/receipt document (either as HTML for preview in UI or as a PDF file).
        5. Return a success response (e.g., 200 OK) with the invoice/receipt data (e.g., JSON data for UI rendering or a direct download link to the generated PDF file).
        6. If any error occurs during data retrieval or document generation, return an appropriate error response (e.g., 500 Internal Server Error).
-   **Data Model Impact:**
    -   **Sales Transactions Table (SalesTransactions):** Source of sale transaction data for invoices/receipts.
    -   **Sale Items Table (SaleItems):** Source of item-level details for invoices/receipts.
    -   **Inventory Items Table (InventoryItems):** Source of item names and descriptions for invoices/receipts.
    -   **Store Settings Table (StoreSettings):** Provides store information (name, address, logo) for invoice/receipt headers and footers.
    -   **Customers Table (Customers):** (Optional) Provides customer information for invoices/receipts if customer tracking (US-VSIM-014) is enabled.
    -   **Tax Settings Table (TaxSettings):** (Optional) Provides tax rate and settings for calculating and displaying taxes on invoices/receipts (US-VSIM-020).
    -   **Optional Invoice History Table:** Consider adding an Invoice History table to log when and how invoices/receipts were generated, and potentially store generated invoice documents for future reference or re-downloading.
-   **User Feedback & Notifications:**
    -   **Invoice/Receipt Preview:** Display a clear and professional-looking preview of the generated invoice/receipt in a modal or dedicated page, allowing users to review the document before downloading or printing.
    -   **Download Option:** Provide a clear and functional "Download as PDF" button to allow users to download the invoice/receipt as a PDF file for saving or sharing.
    -   **Print Option:** Ensure the "Print" button works correctly and provides a printer-friendly output of the invoice/receipt.
    -   **Email Option (Optional):** If implemented, provide clear feedback to the user after successfully emailing the invoice/receipt to the customer (e.g., "Invoice emailed successfully to {customerEmail}"). Display error messages if email sending fails.
    -   **Loading Indicator:** Show a loading indicator while the invoice/receipt is being generated and prepared for preview or download, especially if server-side PDF generation is involved.
    -   **Success Message:** Display a success message (e.g., "Invoice generated successfully") upon successful generation of the invoice/receipt preview.
    -   **Error Notification:** Display user-friendly error notifications if invoice/receipt generation fails, informing the user about the issue (e.g., "Failed to generate invoice. Please try again later.").
-   **Dependencies & Considerations:**
    -   **Integration Points & Backend Dependencies:**
        -   **Sales Service:** Core dependency for retrieving sales transaction data required for invoice/receipt generation.
        -   **Store Settings Module:** Essential for fetching store information to be included in invoices/receipts.
        -   **Reporting & Document Generation Service:** (If using a dedicated service) Central component for handling document templating, data population, and PDF/document generation.
        -   **Formatting Service:** (Optional but recommended) For consistent formatting of currency, dates, and numbers across invoices/receipts.
        -   **Email Service (Optional):** If implementing the "Email Invoice" feature, integration with an email sending service (e.g., SendGrid, Mailgun, SMTP server) will be required.
    -   **Other Considerations:**
        -   **Customization:** Allow for some level of customization of invoice/receipt templates in future iterations, such as adding store-specific terms and conditions, customizing the layout, or adding additional information fields. Consider making invoice templates configurable through settings.
        -   **Performance:** Optimize invoice/receipt generation, especially PDF generation, to ensure documents are generated quickly and efficiently, without causing delays for the user. Consider server-side caching of templates or pre-generated document components.
        -   **Security:** Ensure that invoice/receipt generation is secure and that sensitive sales and customer data is handled appropriately and protected during document generation and transmission (especially if emailing invoices).
        -   **Compliance:** Ensure that generated invoices/receipts comply with relevant legal and accounting standards and include all legally required information (e.g., store name, address, tax information, invoice number, date, itemized details, totals).

---

## **US-VSIM-012: Manage Payment Methods**

-   **Title:** Manage Payment Methods
-   **As a:** Store Owner
-   **I want to:** manage the different payment methods accepted by my store
-   **So that:** I can accurately record sales based on how customers pay.
-   **Description:** The system should allow defining and managing accepted payment methods, such as cash, credit card, debit card, etc.
-   **Acceptance Criteria:**
    -   Given I am logged in as a Store Owner,
    -   When I navigate to the "Settings" section and then "Payment Methods,"
    -   Then I should see a list of currently accepted payment methods.
    -   And I should have options to add new payment methods, and edit or delete existing ones.

### **Implementation Framework:**

-   **UI Elements:**
    -   **Settings Section:** Navigation to the "Settings" section should be clear and accessible, typically in the main application menu.
    -   **Payment Methods Sub-section/Page:** Within the "Settings" section, create a dedicated sub-section or page labeled "Payment Methods."
    -   **Payment Methods List:**
        -   Display a list or table of currently configured payment methods.
        -   Columns in the list should include:
            -   "Payment Method Name" (e.g., "Cash," "Credit Card," "Mobile Payment").
            -   "Description" (Optional description or notes about the payment method).
            -   "Actions" (Buttons or icons for "Edit" and "Delete" actions for each payment method).
    -   **Add New Payment Method Button:**
        -   Button labeled "Add New Payment Method" to initiate the process of adding a new payment method.
    -   **Add/Edit Payment Method Form (Modal/Page):**
        -   Input field: "Payment Method Name" (text input, mandatory, with validation for uniqueness to prevent duplicate payment methods).
        -   Text Area: "Description" (optional text area to provide a description or notes about the payment method).
        -   "Save" Button: To save the new or updated payment method.
        -   "Cancel" Button: To discard changes and close the form.
    -   **Action Buttons (for each payment method in the list):**
        -   "Edit" Button/Icon: To open the "Edit Payment Method" form, pre-populated with the details of the selected payment method.
        -   "Delete" Button/Icon: To initiate the deletion of a payment method.
    -   **Confirmation Dialogs:**
        -   Display confirmation dialogs before performing deletion actions to prevent accidental removal of payment methods. The confirmation dialog should warn the user if the payment method is currently in use or has been used in past sales transactions and ask for confirmation before proceeding with deletion.
-   **Backend Architecture & Logic:**
    -   **API Endpoints:**
        -   GET /api/settings/payment-methods – Retrieve a list of all configured payment methods.
        -   POST /api/settings/payment-methods – Add a new payment method.
            -   Request Body (JSON): { "methodName": string, "description": string (optional) }
        -   PUT /api/settings/payment-methods/{methodId} – Update an existing payment method, where {methodId} is the ID of the payment method to be updated.
            -   Request Body (JSON): { "methodName": string, "description": string (optional) }
        -   DELETE /api/settings/payment-methods/{methodId} – Delete a payment method, where {methodId} is the ID of the payment method to be deleted.
    -   **Business Logic:**
        -   **Validation:**
            -   Validate uniqueness of payment method names: Ensure that payment method names are unique within the system to avoid confusion and duplication.
            -   Validate required fields: Ensure that mandatory fields, such as "Payment Method Name," are provided when adding or updating payment methods.
        -   **Dependency Checks (for Deletion):**
            -   Before deleting a payment method, check for dependencies to ensure that the payment method is not currently in use and has not been used in any past sales transactions.
            -   If the payment method is in use or has historical sales transactions associated with it, prevent deletion and return an error message to inform the user about the dependencies.
        -   **Database Operations:**
            -   Perform CRUD (Create, Read, Update, Delete) operations on the PaymentMethods table to manage payment method data.
    -   **Shared Components:**
        -   **Settings Service:** Central service for managing application-wide settings, including payment methods, store information, report settings, etc. This service will encapsulate the logic for storing, retrieving, and managing settings data.
        -   **Authentication & Authorization Module:** Ensures that only authorized users (e.g., store owners, administrators) can manage payment methods. Access to payment method settings should be restricted based on user roles and permissions.
        -   **Validation Module:** Reused from previous user stories to provide consistent data validation, specifically for payment method names and descriptions (e.g., non-empty names, maximum length, allowed characters, uniqueness).
        -   **Audit Logging Service:** (Optional but recommended) Log changes to payment method configurations (creation, updates, deletions) for audit trails and to track modifications to payment settings.
    -   **Error Handling:**
        -   Return 409 Conflict if deletion of a payment method is attempted when it is still in use or has dependencies (e.g., used in past sales transactions).
        -   Return 404 Not Found if a payment method with the given methodId is not found during update or delete operations.
        -   Return 400 Bad Request for validation errors, such as if the payment method name is missing or not unique.
        -   Use standardized error responses for consistent error reporting and handling across payment method management operations.
    -   **Logic Flow (Add New Payment Method):**
        1. Receive POST request to /api/settings/payment-methods with payment method details (method name, description).
        2. Authenticate and authorize the user.
        3. Validate payment method name for uniqueness and other rules using Validation Module.
        4. If validation passes, insert a new payment method record into the PaymentMethods table using Settings Service.
        5. Return a success response (e.g., 201 Created) with the new payment method ID.
    -   **Logic Flow (Edit Payment Method):**
        1. Receive PUT request to /api/settings/payment-methods/{methodId} with updated payment method details (method name, description).
        2. Authenticate and authorize the user.
        3. Validate payment method name for uniqueness and other rules using Validation Module.
        4. If validation passes, update the payment method record in the PaymentMethods table using Settings Service.
        5. Return a success response (e.g., 200 OK).
    -   **Logic Flow (Delete Payment Method):**
        1. Receive DELETE request to /api/settings/payment-methods/{methodId}.
        2. Authenticate and authorize the user.
        3. Check for dependencies: Query the SalesTransactions table to see if any sales transactions exist that used the payment method being deleted.
        4. If dependencies exist (payment method used in past sales), return a 409 Conflict error indicating that the payment method cannot be deleted due to existing references.
        5. If no dependencies are found, delete the payment method record from the PaymentMethods table using Settings Service.
        6. Return a success response (e.g., 200 OK).
-   **Data Model Impact:**
    -   **Payment Methods Table (PaymentMethods):**
        -   Manage records in the PaymentMethods table, including adding new payment methods, updating existing ones, and deleting payment methods.
        -   Columns: methodId (PK, auto-generated), methodName (string, unique index enforced), description (string, optional), createdAt (timestamp), updatedAt (timestamp).
    -   **Sales Transactions Table (SalesTransactions):**
        -   Ensure a foreign key relationship exists from the SalesTransactions table to the PaymentMethods table to link sales records to the payment method used. The paymentMethod field in SalesTransactions should reference methodId in PaymentMethods.
-   **User Feedback & Notifications:**
    -   **Success Messages:** Display success messages upon adding, updating, or deleting payment methods (e.g., "Payment method '{Payment Method Name}' added successfully", "Payment method updated successfully", "Payment method '{Payment Method Name}' deleted successfully").
    -   **Error Alerts:**
        -   Inform the user if deletion of a payment method is not possible due to existing references in sales transactions (e.g., "Cannot delete payment method '{Payment Method Name}'. It is currently in use or has been used in past sales.").
        -   Display error alerts for validation failures (e.g., "Payment method name is required", "Payment method name already exists").
    -   **Confirmation Prompts:** Display confirmation prompts before performing deletion actions to prevent accidental removal of payment methods, especially if there are dependencies.
    -   **Payment Methods List Update:** Update the payment methods list view in real-time after each operation (add, edit, delete) to reflect the changes immediately.
-   **Dependencies & Considerations:**
    -   **Integration Points & Backend Dependencies:**
        -   **Sales Transaction Module (US-VSIM-008):** The Sales Transaction Module is a primary dependency, as it needs to retrieve and use the list of configured payment methods to allow users to select a payment method when recording sales. Ensure that the Sales Transaction UI is updated to reflect changes in payment methods (e.g., newly added methods become available in the payment method dropdown).
        -   **Audit Module (Optional):** Integrate with an Audit Logging Service to track changes to payment method settings for compliance and security auditing.
    -   **Other Considerations:**
        -   **Security:** Implement strict access control and permissions to manage payment methods, as these settings are critical for financial transactions. Restrict access to payment method management to authorized users only (e.g., store owners, administrators).
        -   **Data Integrity:** Prevent deletion of payment methods that are currently in use or have been used in past sales transactions to maintain data integrity and avoid breaking historical sales records. Implement dependency checks and provide informative error messages to the user if deletion is not allowed due to dependencies.
        -   **Performance:** Ensure that retrieving the list of payment methods is efficient, especially when recording sales transactions, as this list may be accessed frequently. Consider caching payment method data for faster retrieval.

## **US-VSIM-013: Apply Discounts to Sales**

-   **Title:** Apply Discounts to Sales
-   **As a:** Store Owner
-   **I want to:** apply discounts to sales transactions
-   **So that:** I can offer promotions or discounts to customers.
-   **Description:** The system should allow flexible discount application (percentage or fixed amount) to entire sales or specific items during sale recording.
-   **Acceptance Criteria:**
    -   Given I am logged in as a Store Owner,
    -   When I record a sale,
    -   Then I should be able to apply a discount to the entire sale or specific items, choosing percentage or fixed amount.
    -   And the total should recalculate to reflect the discount.

### **Implementation Framework:**

-   **UI Elements:**
    -   **Sales Transaction Form (US-VSIM-008):** Enhance the "New Sale" form to include discount application features.
    -   **Discount Options:** Provide flexible options for applying discounts:
        -   **Sale-Level Discount:**
            -   Option to apply a discount to the entire sale transaction. This could be implemented as:
                -   "Discount Type" Dropdown: Select between "Percentage Discount" and "Fixed Amount Discount" for the entire sale.
                -   "Discount Value" Input Field: Input field to enter the discount value (percentage or fixed amount) for the sale-level discount.
        -   **Item-Level Discount:**
            -   Option to apply discounts to individual items within the sale. This could be implemented within each item row in the sales form:
                -   "Discount" Input Field per Item: Input field to enter a discount for the specific item. Consider allowing both percentage and fixed amount discounts at the item level as well, possibly through a dropdown to select discount type per item.
    -   **Discount Input Fields:**
        -   Number input fields for discount values: Ensure input fields for discount values accept numerical input and validate the input to ensure it is within acceptable ranges (e.g., percentage discount between 0% and 100%, fixed amount discount not exceeding the item price or sale total).
    -   **Dynamic Recalculation of Total Sale Amount:**
        -   Real-time discount application: Dynamically recalculate the total sale amount as discounts are applied, both at the sale level and item level. Update the displayed total in real-time to reflect the applied discounts.
    -   **Visual Cues for Discounts:**
        -   Display discount details clearly in the sales transaction form and on the invoice/receipt (US-VSIM-011):
            -   Show applied discounts: Clearly indicate the discount amount or percentage applied at both the item level (if applicable) and sale level.
            -   Display discounted prices: Show the original price and the discounted price for items with discounts applied.
            -   Summarize total discounts: Display the total discount amount applied to the entire sale.
-   **Backend Architecture & Logic:**

    -   **API Endpoint:** Integrate discount application logic into the POST /api/sales/transactions endpoint (US-VSIM-008) for recording sales transactions.

              -   Request Body (JSON) (Extend from US-VSIM-008):
                  `{

        "saleDate": datetime,
        "items": [
        { "itemId": number, "quantity": number, "discount": number (optional, item-level discount) }
        ],
        "paymentMethod": string,
        "customerId": number (optional),
        "saleDiscount": number (optional, sale-level discount)
        }`

    -   **Business Logic:**
        -   **Discount Validation:**
            -   Validate discount values: Ensure that discount values entered by the user are valid and within acceptable ranges (e.g., percentage discount between 0 and 100, fixed amount discount not exceeding item price or sale total).
            -   Validate discount rules: If there are predefined discount rules or promotions, validate that the applied discounts comply with these rules.
        -   **Discount Calculation:**
            -   Calculate item-level discounts: If item-level discounts are applied, calculate the discounted price for each item.
            -   Calculate sale-level discount: If a sale-level discount is applied, calculate the discount amount based on the chosen discount type (percentage or fixed amount) and the sale subtotal.
            -   Recalculate sale totals: After applying all discounts (item-level and sale-level), recalculate the final total sale amount, ensuring discounts are correctly subtracted from the subtotal.
        -   **Discount Logging:**
            -   Record discount details: Log the details of all applied discounts (discount type, discount value, discount amount) at both the item level and sale level when recording the sales transaction. This information should be stored in the SaleItems and SalesTransactions tables for reporting and analysis.
    -   **Shared Components:**
        -   **Calculation Service:** Reused from US-VSIM-017 and US-VSIM-020 for performing discount calculations, ensuring consistency with tax and profit/loss calculations. Extend the Calculation Service to include discount calculation functions.
        -   **Sales Processing Module:** Central module for handling all aspects of sales transaction processing, including discount application, payment processing, inventory updates, and record keeping. Reused and extended from US-VSIM-008.
        -   **Validation Module:** Reused from previous user stories to validate discount inputs and ensure they are within valid ranges and formats.
        -   **Authentication & Authorization Module:** (Optional, for future enhancements) Consider implementing authorization checks to control which users are allowed to apply certain types or levels of discounts (e.g., only managers can apply discounts above a certain percentage).
    -   **Error Handling:**
        -   Return 400 Bad Request for validation failures, such as:
            -   "Invalid discount value entered for item '{Item Name}'" if the discount value is not valid or exceeds limits.
            -   "Invalid discount value entered for sale. Discount must be a valid percentage or amount." if the sale-level discount is invalid.
            -   "Discount rule violation. Discount cannot be applied to this item/sale." if discount rules are not met.
        -   Use standardized error responses for consistent error reporting.
    -   **Logic Flow:**
        1. Receive POST request to /api/sales/transactions with sale details, including discount information.
        2. Authenticate and authorize the user.
        3. Validate discount inputs: discount values, discount types, and compliance with any predefined discount rules using Validation Module and potentially a Discount Rule Engine (if implemented).
        4. If validation fails, return 400 Bad Request with appropriate error messages.
        5. If validation passes, use Calculation Service to:
            - Calculate item-level discounts (if applicable).
            - Calculate sale-level discount (if applicable).
            - Recalculate the total sale amount after applying all discounts.
        6. Proceed with recording the sale transaction (as per US-VSIM-008 logic), including:
            - Update stockQuantity in InventoryItems table using Inventory Management Service.
            - Record the sale transaction in the SalesTransactions table and sale items in the SaleItems table, including discount details for both item-level and sale-level discounts.
        7. Return a success response (e.g., 201 Created) upon successful sale recording with discounts applied.
        8. If any error occurs during discount calculation or sale recording, roll back the transaction and return an appropriate error response (e.g., 500 Internal Server Error).

-   **Data Model Impact:**
    -   **Sales Transactions Table (SalesTransactions):**
        -   Add a new field: saleDiscount (decimal, optional). This field will store the discount amount or percentage applied to the entire sale transaction, if any.
    -   **Sale Items Table (SaleItems):**
        -   Add a new field: itemDiscount (decimal, optional). This field will store the discount amount or percentage applied to individual items within the sale, if any.
    -   **Audit Log (Optional):** Consider updating the audit log schema to record details of applied discounts for transparency and analysis of discount usage.
-   **User Feedback & Notifications:**
    -   **Success Message:** Display a success message (e.g., "Sale recorded with discount applied", "Discount successfully applied to sale") upon successful recording of the sale with discounts.
    -   **Error Notifications:** Display clear and informative error messages if discount validation fails or if there are issues applying discounts (e.g., "Invalid discount value", "Discount rule violation").
    -   **Real-Time Update of UI:**
        -   Dynamically update the total sale amount in the UI in real-time as discounts are applied and adjusted, ensuring users can see the impact of discounts immediately.
        -   Visually highlight discounted prices and discount amounts in the sales transaction form, making it clear to the user which discounts have been applied and how they affect the total.
-   **Dependencies & Considerations:**
    -   **Integration Points & Backend Dependencies:**
        -   **Calculation Module:** Integral dependency for performing all monetary computations, including discount calculations, tax calculations, and total amount calculations.
        -   **Sales Service:** Must be extended to integrate discount application logic seamlessly into the sale recording process.
        -   **Inventory Service:** Stock updates and inventory management should remain consistent and unaffected by discount application logic.
    -   **Other Considerations:**
        -   **Security:** Implement security measures to validate discount privileges and ensure that only authorized users (e.g., store managers, owners) can apply certain types or levels of discounts, especially larger or promotional discounts. Consider implementing role-based access control for discount functionality.
        -   **Data Consistency:** Ensure that discount values and applied discounts are consistently recorded and propagated throughout the application, including invoices/receipts (US-VSIM-011), sales history (US-VSIM-009), and financial reports (US-VSIM-018).
        -   **Testing:** Conduct thorough testing of the discount application functionality, including various discount scenarios (percentage discounts, fixed amount discounts, item-level discounts, sale-level discounts, combined discounts, zero discounts, maximum discount limits), to ensure accurate calculations and proper handling of different discount types and edge cases.

---

## **US-VSIM-014: Track Customer Information (Optional)**

-   **Title:** Track Customer Information (Optional)
-   **As a:** Store Owner
-   **I want to:** track basic customer information (optional)
-   **So that:** I can keep records of regular customers and their purchase history.
-   **Description:** The system should optionally allow creating customer profiles and linking them to sales for basic tracking of customer purchase history.
-   **Acceptance Criteria:**
    -   Given I am logged in as a Store Owner,
    -   When I navigate to the "Customers" section,
    -   Then I should be able to add a customer with name and contact details.
    -   And during a sale, I should optionally associate it with a customer.
    -   And I should be able to view a customer's purchase history.

### **Implementation Framework:**

-   **UI Elements:**
    -   **Customers Section:**
        -   Navigation: Add a navigation link or button to a "Customers" section in the main application menu.
        -   Customers List Page: Display a list of existing customers in a table or list format.
            -   Columns: "Customer ID," "Name," "Contact Details" (e.g., Phone, Email), "Actions" (e.g., "View Profile," "Edit," "Delete").
        -   Add Customer Button: Button labeled "Add Customer" to initiate the process of adding a new customer profile.
    -   **Add/Edit Customer Form (Modal/Page):**
        -   Input field: "Customer Name" (text input, mandatory).
        -   Input fields for contact details: "Contact Phone" (text input, optional), "Contact Email" (text input, optional, with email format validation).
        -   "Save" Button: To save the new or updated customer profile.
        -   "Cancel" Button: To discard changes and close the form.
    -   **Customer Profile Page:**
        -   Access from Customers List: Provide a "View Profile" action for each customer in the list to navigate to a dedicated Customer Profile page.
        -   Customer Information Display: Display the customer's details (Name, Contact Info).
        -   Purchase History Section: On the Customer Profile page, display a section showing the customer's purchase history.
            -   Sales History Table: List of sales transactions associated with the customer.
            -   Columns: "Sale ID," "Date of Sale," "Items Purchased (summary)," "Total Amount."
            -   "View Sale Details" links: Links to view details of each sale transaction.
    -   **Link Customer to Sale Option (in Sales Transaction Form - US-VSIM-008):**
        -   Customer Association Field: In the "New Sale" form (US-VSIM-008), provide an optional field to associate a customer with the sale.
        -   Searchable Dropdown/Autocomplete: Implement a searchable dropdown or autocomplete input field to allow users to search and select from existing customer profiles when recording a sale.
-   **Backend Architecture & Logic:**
    -   **API Endpoints:**
        -   GET /api/customers – Retrieve a list of all customers.
        -   POST /api/customers – Add a new customer.
            -   Request Body (JSON): { "name": string, "contactPhone": string (optional), "contactEmail": string (optional) }
        -   GET /api/customers/{customerId} – Retrieve details of a specific customer, where {customerId} is the ID of the customer.
        -   PUT /api/customers/{customerId} – Update an existing customer profile.
            -   Request Body (JSON): { "name": string, "contactPhone": string (optional), "contactEmail": string (optional) }
        -   DELETE /api/customers/{customerId} – Delete a customer profile.
        -   GET /api/customers/{customerId}/purchases – Retrieve purchase history for a specific customer.
    -   **Business Logic:**
        -   **Validation:**
            -   Validate customer details: Ensure that mandatory fields (e.g., "Customer Name") are provided when adding or updating customer profiles. Validate email format if provided.
        -   **Customer Linking to Sales:**
            -   When recording a sale transaction (US-VSIM-008), allow associating the sale with a customer by storing the customerId in the SalesTransactions table.
        -   **Purchase History Retrieval:**
            -   When retrieving purchase history for a customer, query the SalesTransactions table to find all sales records associated with the given customerId. Join with SaleItems and InventoryItems for detailed purchase information.
        -   **Database Operations:**
            -   Perform CRUD operations on the Customers table to manage customer profiles.
            -   Update SalesTransactions table to link sales to customers.
            -   Query SalesTransactions and related tables to retrieve purchase history for customers.
    -   **Shared Components:**
        -   **Customer Service:** A new central service dedicated to managing customer profiles, including CRUD operations, customer search, and retrieval of customer purchase history.
        -   **Authentication & Authorization Module:** Ensures that access to customer data and management functions is restricted to authorized users (e.g., store staff, marketing team, store owners).
        -   **Validation Service:** Reused from previous user stories to validate customer data, such as email format, phone number format, and mandatory fields.
    -   **Error Handling:**
        -   Return 404 Not Found if a customer with the given customerId is not found during update, delete, or profile retrieval operations.
        -   Return 400 Bad Request for validation errors, such as if the customer name is missing or email format is invalid.
        -   Use standardized error responses for consistent error reporting.
    -   **Logic Flow (Add New Customer):**
        1. Receive POST request to /api/customers with customer details (name, contact info).
        2. Authenticate and authorize the user.
        3. Validate customer data (name, email format) using Validation Module.
        4. If validation passes, insert a new customer record into the Customers table using Customer Service.
        5. Return a success response (e.g., 201 Created) with the new customer ID.
    -   **Logic Flow (Link Customer to Sale):**
        1. During sale recording (US-VSIM-008), if a customerId is provided in the request body, validate that the customerId is valid and exists in the Customers table using Customer Service.
        2. If valid, store the customerId in the SalesTransactions record when creating a new sale transaction.
    -   **Logic Flow (View Customer Purchase History):**
        1. Receive GET request to /api/customers/{customerId}/purchases to retrieve purchase history for a customer.
        2. Authenticate and authorize the user.
        3. Check if the customer with customerId exists using Customer Service. Return 404 if not found.
        4. Retrieve sales transactions associated with the customerId from the SalesTransactions table, joining with SaleItems and InventoryItems for detailed purchase information using Customer Service.
        5. Format the purchase history data for display in the UI.
        6. Return a success response (e.g., 200 OK) with the customer purchase history data (in JSON format).
-   **Data Model Impact:**
    -   **Customers Table (Customers):**
        -   Create a new table to store customer profiles.
        -   Columns: customerId (PK, auto-generated), name (string, mandatory), contactPhone (string, optional), contactEmail (string, optional), createdAt (timestamp), updatedAt (timestamp).
    -   **Sales Transactions Table (SalesTransactions):**
        -   Add a new field: customerId (FK referencing Customers, optional, nullable). This field will store the ID of the customer associated with a sale transaction.
-   **User Feedback & Notifications:**
    -   **Success Messages:** Display success messages upon adding, updating, or deleting customer profiles (e.g., "Customer '{Customer Name}' added successfully", "Customer profile updated successfully", "Customer '{Customer Name}' deleted successfully").
    -   **Error Alerts:** Display error alerts for validation failures (e.g., "Customer name is required", "Invalid email format", "Customer not found").
    -   **Confirmation Message:** Display a confirmation message when a sale is successfully associated with a customer during sale recording.
    -   **Customer Profile Display:** Display customer information and purchase history clearly on the Customer Profile page.
    -   **Customer List Update:** Update the customer list view in real-time after each customer management operation (add, edit, delete).
-   **Dependencies & Considerations:**
    -   **Integration Points & Backend Dependencies:**
        -   **Sales Service (US-VSIM-008, US-VSIM-009, US-VSIM-010, US-VSIM-011):** The Sales Service needs to be integrated with Customer Service to allow linking customers to sales transactions and to retrieve customer purchase history.
        -   **Reporting Module (US-VSIM-007, US-VSIM-018):** Customer purchase history data can be used in future reporting features to analyze customer purchasing patterns, generate customer-specific sales reports, or implement customer loyalty programs.
        -   **Authentication Module:** Ensure secure access to customer data and customer management functions, restricting access to authorized users.
    -   **Other Considerations:**
        -   **Privacy:** Implement appropriate data privacy measures to protect customer information. Ensure compliance with data protection regulations (e.g., GDPR, CCPA) regarding the storage, processing, and access to customer data. Store customer data securely and consider data encryption.
        -   **Optionality:** This user story is marked as optional. Ensure that the implementation of customer tracking is modular and does not introduce mandatory dependencies on other core functionalities like sale recording or inventory management if customer tracking is not enabled or used. The system should function correctly even if customer information is not tracked.
        -   **Scalability:** Plan for potential growth in customer data as the customer base expands. Design the Customers table and customer data retrieval queries to be efficient and scalable to handle a large number of customer profiles without performance degradation.
        -   **Search and Filtering:** For future enhancements, consider adding search and filtering capabilities to the Customers List View to allow users to easily find specific customers based on name, contact details, or other criteria.

---

# Financial Management

## **US-VSIM-015: Track Income from Sales**

-   **Title:** Track Income from Sales
-   **As a:** Store Owner
-   **I want to:** track income generated from sales
-   **So that:** I can monitor revenue and understand business performance.
-   **Description:** The system should automatically record income from each sale transaction, to be used in financial reports.
-   **Acceptance Criteria:**
    -   Given sales transactions have been recorded,
    -   When I view financial reports such as "Sales Report" or "Profit & Loss Statement,"
    -   Then the total income from sales should be accurately reflected.

### **Implementation Framework:**

-   **UI Elements:**
    -   **Financial Reports Dashboard:** Integrate income tracking visualization into a "Financial Reports" dashboard or section.
    -   **Income Display Widget/Section:**
        -   Display Total Income: Prominently display the total income generated from sales.
        -   Time Period Selection: Provide a date range selector to allow users to view income for different time periods (e.g., "Today," "This Week," "This Month," "Custom Date Range"). Use dropdowns or date pickers for easy selection.
        -   Summary Table/Widget: Display a summary table or widget breaking down income, potentially by day, week, or month, depending on the selected time period.
    -   **Sales Summary Section:** (Optional) Include a more detailed "Sales Summary" section that could show:
        -   Gross Sales: Total revenue from all sales before deductions.
        -   Discounts Applied: Total value of discounts applied to sales.
        -   Net Sales (Income): Gross sales minus discounts and returns, representing the actual income.
        -   Returns/Refunds: Total value of returns and refunds processed, deducted from gross sales to arrive at net sales.
    -   **Filter Controls:**
        -   Date Range Selector: Essential for filtering income data by specific periods.
        -   (Optional) Category Filter: Consider allowing filtering income by item category to analyze income from specific product types.
-   **Backend Architecture & Logic:**
    -   **API Endpoint:** GET /api/finances/income to retrieve income data.
        -   Query Parameters:
            -   startDate: Date (optional, start date for the income period).
            -   endDate: Date (optional, end date for the income period).
            -   timePeriod: String (optional, predefined periods like "today", "week", "month", "custom"). If timePeriod is provided, startDate and endDate might be derived or used as overrides.
    -   **Business Logic:**
        -   **Data Aggregation:**
            -   Aggregate income data from the SalesTransactions table.
            -   Calculate Gross Sales: Sum the totalAmount from all sales transactions within the specified date range.
            -   Calculate Total Discounts: Sum up all discounts applied to sales transactions and individual items within the date range (from SalesTransactions and SaleItems tables).
            -   Calculate Net Sales (Income): Subtract total discounts and total refunds (if returns tracking - US-VSIM-010 - is implemented and refunds are tracked) from the gross sales to get the net income.
            -   (Optional) Calculate Taxes Collected: If tax tracking (US-VSIM-020) is implemented, calculate the total taxes collected from sales within the date range.
        -   **Date Range Handling:**
            -   Implement logic to handle different date ranges selected by the user, including predefined periods ("Today," "This Week," "This Month") and custom date ranges (using startDate and endDate parameters).
    -   **Shared Components:**
        -   **Financial Service:** A central service dedicated to financial calculations and data aggregation, including income tracking, expense tracking (US-VSIM-016), profit and loss calculation (US-VSIM-017), and financial reporting (US-VSIM-018). Extend the Financial Service to include income tracking logic.
        -   **Calculation Service:** Reused from US-VSIM-013, US-VSIM-017, US-VSIM-020, and US-VSIM-018 for performing calculations related to income, discounts, taxes, and totals, ensuring consistency in financial computations.
        -   **Authentication & Authorization Module:** Ensures that access to income data and financial reports is restricted to authorized users (e.g., store owners, financial managers).
        -   **Reporting Engine:** (Potentially) Shared reporting engine used for generating various financial reports and dashboards, including income summaries.
    -   **Error Handling:**
        -   Return 200 OK with zero income if no sales data is found for the selected date range.
        -   Return 400 Bad Request for invalid date range parameters (e.g., invalid date format, end date before start date).
        -   Return 500 Internal Server Error for any unexpected server-side errors during data retrieval or calculation.
        -   Use standardized error responses for consistent error reporting.
    -   **Logic Flow:**
        1. Receive GET request to /api/finances/income with optional date range parameters.
        2. Authenticate and authorize the user.
        3. Validate date range parameters (if provided). Return 400 Bad Request for invalid parameters.
        4. Retrieve and aggregate sales transaction data from the SalesTransactions table within the specified date range using Financial Service.
        5. Calculate Gross Sales, Total Discounts, Net Sales (Income), and optionally Taxes Collected using Calculation Service and Financial Service.
        6. Format the income data for display in the UI, including total income, breakdowns, and potentially charts or graphs.
        7. Return a success response (e.g., 200 OK) with the income data (in JSON format).
        8. If no sales data is found for the selected period, return 200 OK with zero income values and a message indicating no data available.
-   **Data Model Impact:**
    -   **Sales Transactions Table (SalesTransactions):** Primary data source for tracking income from sales. The totalAmount field in SalesTransactions is used to calculate gross sales. Discount information from SalesTransactions and SaleItems (US-VSIM-013) is used to calculate net sales.
    -   **Expenses Table (Expenses):** (If calculating Profit & Loss in conjunction with income) Used in conjunction with income data to calculate profit and loss.
    -   **Optional Financial Snapshot Table:** Consider creating a Financial Snapshot table to cache pre-computed income data for different time periods (e.g., daily, weekly, monthly totals). This can improve performance for frequently accessed income summaries on dashboards or financial reports.
-   **User Feedback & Notifications:**
    -   **Dashboard Update:** Display the calculated income figures prominently on the Financial Reports dashboard or in the income display widget. Update the income display in real-time or at regular intervals (e.g., upon dashboard load or refresh).
    -   **Income Summary Display:** Present a clear and well-structured summary of income data in the UI, including total income, breakdowns (e.g., by day, week, month), and optionally visual representations like charts or graphs to illustrate income trends over time.
    -   **Date Range Selection:** Ensure the date range selector is user-friendly and allows users to easily select predefined periods or specify custom date ranges. Clearly indicate the selected time period for the displayed income data.
    -   **Loading Indicator:** Show a loading indicator while income data is being retrieved and calculated, especially for longer date ranges or complex calculations.
    -   **Success Notification:** Display a success message (e.g., "Income data loaded successfully") when income data is successfully retrieved and displayed.
    -   **Error Alerts:** Display user-friendly error alerts if there are issues retrieving or calculating income data, informing the user about the problem and suggesting possible actions (e.g., "Failed to load income data. Please check your internet connection or try again later.").
-   **Dependencies & Considerations:**
    -   **Integration Points & Backend Dependencies:**
        -   **Sales Module (US-VSIM-008, US-VSIM-009):** The Income Tracking feature is directly dependent on the Sales Module for accurate and up-to-date sales transaction data. Ensure seamless integration with the Sales Service to retrieve income-related information.
        -   **Financial Service:** Central service for financial calculations and data aggregation. The Income Tracking logic should be implemented within or integrated with the Financial Service to maintain a cohesive financial management system.
        -   **Reporting Service:** (Potentially) If using a dedicated Reporting Engine, integrate income data retrieval and formatting logic with the Reporting Service to ensure consistency with other financial reports.
    -   **Other Considerations:**
        -   **Performance:** Optimize database queries for retrieving and aggregating sales data, especially for longer date ranges and larger datasets, to ensure fast response times for income summaries and dashboards. Use database indexing on relevant columns (e.g., saleDate) to improve query performance. Consider caching frequently accessed income data or pre-calculated income summaries for different time periods.
        -   **Data Accuracy:** Ensure that income calculations are accurate and correctly account for all relevant factors, such as discounts, returns, taxes, and different payment methods. Implement thorough testing to validate income calculation logic and data accuracy.
        -   **Security:** Restrict access to income data and financial reports to authorized users only, as this information is sensitive and critical for business operations. Implement appropriate authentication and authorization mechanisms to protect financial data.
        -   **Currency Handling:** Ensure that income data and financial amounts are displayed in the correct currency (US-VSIM-029) and that currency formatting is consistent throughout the UI and in reports.

## **US-VSIM-016: Record Operational Expenses**

-   **Title:** Record Operational Expenses
-   **As a:** Store Owner
-   **I want to:** record operational expenses (e.g., rent, utilities)
-   **So that:** I can have a complete picture of business finances and accurately calculate profit.
-   **Description:** The system should allow recording various expenses, including date, amount, expense category, and optional description.
-   **Acceptance Criteria:**
    -   Given I am logged in as a Store Owner,
    -   When I navigate to the "Expenses" section,
    -   Then I should see an option to "Add New Expense."
    -   And when I click this option, I should see a form with fields for "Date," "Amount," "Category," and "Description" (optional).
    -   And when I fill in these details and click "Save,"
    -   Then the expense should be recorded and included in financial calculations, with ability to filter and view by date range and category.

### **Implementation Framework:**

-   **UI Elements:**
    -   **Finances Section:** Navigation link/button to a "Finances" section in the main application menu.
    -   **Expenses Sub-section/Page:** Within "Finances," create a sub-section or dedicated page labeled "Expenses."
    -   **Add New Expense Button:** Button labeled "Add New Expense" to initiate the process of recording a new operational expense.
    -   **Expense Entry Form (Modal/Page):**
        -   Date Picker: "Expense Date" (Date picker, mandatory, defaults to current date).
        -   Number Input: "Expense Amount" (Number input, mandatory, validation for positive value).
        -   Dropdown: "Expense Category" (Dropdown list to select an expense category, mandatory. Categories should be configurable, potentially linking to a "Manage Expense Categories" feature in future). Predefined categories could include "Rent," "Utilities," "Supplies," "Marketing," "Salaries," etc.
        -   Text Area: "Description" (Optional text area to provide a detailed description or notes about the expense).
        -   "Save Expense" Button: To record the expense.
        -   "Cancel" Button: To discard the expense entry.
    -   **Expense List View:**
        -   Display a list or table of recorded operational expenses.
        -   Columns: "Date," "Category," "Description," "Amount," "Actions" (e.g., "Edit," "Delete").
        -   Sorting: Allow sorting by "Date," "Category," "Amount." Default sort by "Date" (newest first).
        -   Filtering: Provide filters to view expenses by:
            -   Date Range Filter: Select expenses within a specific date range (e.g., "This Month," "Last Month," "Custom Range").
            -   Category Filter: Filter expenses by expense category (dropdown selection).
    -   **Actions on Expense Items:**
        -   "Edit" Button/Icon (per expense item): To open the "Edit Expense" form, pre-populated with the details of the selected expense.
        -   "Delete" Button/Icon (per expense item): To initiate the deletion of an expense record.
    -   **Confirmation Dialogs:** Display confirmation dialogs before deleting expense records to prevent accidental data loss.
-   **Backend Architecture & Logic:**

    -   **API Endpoint:** POST /api/expenses to record a new operational expense.

              -   Request Body (JSON):
                  `{

        "expenseDate": date, // Date of the expense
        "amount": number, // Amount of the expense
        "category": string, // Expense category (e.g., "Rent", "Utilities")
        "description": string (optional) // Description of the expense
        }`

    -   **Business Logic:**
        -   **Validation:**
            -   Validate required fields: Ensure that mandatory fields like "Expense Date," "Expense Amount," and "Expense Category" are provided.
            -   Validate amount: Ensure that the expense amount is a positive numerical value.
            -   Validate date format: Validate that the expense date is in a valid date format.
            -   Validate category: Ensure that the selected expense category is valid and from the list of allowed categories (predefined or managed through a category management feature - future enhancement).
        -   **Database Operation:**
            -   Insert a new record into an Expenses table to store the expense details, including date, amount, category, and description.
    -   **Shared Components:**
        -   **Financial Service:** Central service for managing financial data, including recording expenses, tracking income (US-VSIM-015), and calculating profit and loss (US-VSIM-017). Extend the Financial Service to include expense recording logic.
        -   **Validation Module:** Reused from previous user stories to validate expense data inputs, ensuring data integrity and consistency.
        -   **Authentication & Authorization Module:** Ensures that only authorized users (e.g., store owners, accountants) can record operational expenses, protecting financial data from unauthorized modification.
        -   **Audit Logging Service:** (Optional but recommended) Log expense recording events (creation, updates, deletions) for audit trails and to track changes to financial records.
    -   **Error Handling:**
        -   Return 400 Bad Request for validation failures, such as:
            -   "Expense date is required" if the date field is missing.
            -   "Expense amount is required and must be a positive number" if the amount is invalid.
            -   "Expense category is required" if the category is not selected.
            -   "Invalid date format for expense date" if the date format is incorrect.
        -   Return 500 Internal Server Error for any unexpected server-side errors during expense recording.
        -   Use standardized error responses for consistent error reporting.
    -   **Logic Flow (Add New Expense):**
        1. Receive POST request to /api/expenses with expense details (date, amount, category, description).
        2. Authenticate and authorize the user.
        3. Validate input data: expense date, amount, and category using Validation Module.
        4. If validation passes, insert a new expense record into the Expenses table using Financial Service.
        5. Return a success response (e.g., 201 Created) with the new expense record ID.
    -   **Logic Flow (View Expenses List):**
        1. Receive GET request to retrieve expenses, potentially with filter parameters (date range, category).
        2. Authenticate and authorize the user.
        3. Validate filter parameters (if provided).
        4. Query the Expenses table using Financial Service, applying filters based on the provided parameters.
        5. Format the expense data for display in the UI.
        6. Return a success response (e.g., 200 OK) with the list of expense records (in JSON format).

-   **Data Model Impact:**
    -   **Expenses Table (Expenses):**
        -   Create a new table to store operational expenses.
        -   Columns: expenseId (PK, auto-generated), expenseDate (date), amount (decimal), category (string), description (string, optional), recordedByUserId (FK referencing Users, to track who recorded the expense), recordedTimestamp (timestamp).
-   **User Feedback & Notifications:**
    -   **Success Message:** Display a success message (e.g., "Expense recorded successfully") upon successful recording of an expense.
    -   **Error Alerts:** Display clear and informative error messages if expense recording fails due to validation errors or other issues (e.g., "Expense amount is invalid", "Expense category is required", "Failed to record expense. Please try again.").
    -   **Expense List Update:** Update the expense list view in real-time after adding, editing, or deleting expenses to reflect the changes immediately.
    -   **Confirmation Dialogs:** Display confirmation dialogs before deleting expense records to prevent accidental data loss.
-   **Dependencies & Considerations:**
    -   **Integration Points & Backend Dependencies:**
        -   **Financial Service:** Central service for managing financial data, including expense recording and integration with other financial features like Profit & Loss calculation (US-VSIM-017) and financial reporting (US-VSIM-018).
        -   **Reporting Service:** Expense data recorded through this user story will be used to generate expense reports (US-VSIM-018) and calculate profit and loss (US-VSIM-017). Ensure seamless integration with reporting and financial analysis modules.
        -   **Authentication Module:** Secure access to expense recording and management functionalities to authorized users.
    -   **Other Considerations:**
        -   **Data Consistency:** Ensure consistency in data entry and formatting for expense records. Define clear guidelines for expense categories and descriptions to maintain data quality.
        -   **Security:** Secure storage of financial data and restrict access to expense recording and management functions to authorized personnel.
        -   **Performance:** Optimize database operations for expense recording and retrieval, especially for large volumes of expense records. Implement indexing on relevant columns (e.g., expenseDate, category) to improve query performance for expense list views and reports.
        -   **Expense Categories Management:** For future enhancements, consider implementing a "Manage Expense Categories" feature to allow administrators to define, edit, and manage expense categories dynamically. This would provide greater flexibility in categorizing and reporting on expenses.
        -   **Receipt Attachments:** (Future Enhancement) Consider allowing users to attach receipts or supporting documents to expense records for better record-keeping and audit trails.

## **US-VSIM-017: Calculate Profit and Loss**

-   **Title:** Calculate Profit and Loss
-   **As a:** Store Owner
-   **I want to:** calculate profit and loss
-   **So that:** I can understand business’s financial performance.
-   **Description:** The system should compute profit/loss by subtracting expenses from income over a chosen period.
-   **Acceptance Criteria:**
    -   Given I am logged in as a Store Owner,
    -   When I navigate to the "Finances" section and select "Profit & Loss,"
    -   Then I should be able to select a date range.
    -   And the system should show total income, total expenses, and calculated profit/loss for the selected period.

### **Implementation Framework:**

-   **UI Elements:**
    -   **Finances Section:** Navigation link/button to the "Finances" section in the main application menu.
    -   **Profit & Loss Sub-section/Page:** Within "Finances," create a sub-section or dedicated page labeled "Profit & Loss."
    -   **Date Range Selector:**
        -   Provide a date range selector to allow users to specify the period for which to calculate profit and loss. Use predefined date range options (e.g., "This Month," "Last Month," "This Quarter," "This Year," "Custom Range") and date pickers for custom start and end dates.
    -   **Profit & Loss Statement Display:**
        -   Display a clear and structured Profit & Loss statement on the page.
        -   Key components of the statement should include:
            -   **Total Income (from Sales - US-VSIM-015):** Display the total income generated from sales within the selected period. Clearly label as "Total Sales Income" or similar.
            -   **Total Expenses (from Operational Expenses - US-VSIM-016):** Display the total operational expenses recorded within the selected period. Clearly label as "Total Operational Expenses" or similar.
            -   **Profit/Loss Calculation:**
                -   Calculate and display the Profit or Loss figure. Profit is calculated as Total Income - Total Expenses. If expenses exceed income, display a Loss.
                -   Clearly label the result as "Profit" or "Loss" and indicate the calculated amount. Use visual cues to distinguish between profit (e.g., green color, positive sign) and loss (e.g., red color, negative sign or parentheses).
        -   **Breakdown (Optional):**
            -   Consider providing a more detailed breakdown of income and expenses within the statement.
            -   Income Breakdown: (Optional) Show a breakdown of income by category or item type, if relevant and feasible.
            -   Expense Breakdown: (Optional) Show a breakdown of expenses by expense category (e.g., Rent, Utilities, Marketing, etc.). This can provide more granular insights into the sources of income and types of expenses.
    -   **Export Options (Optional):**
        -   Consider adding options to export the Profit & Loss statement as a PDF or CSV file for offline analysis or sharing (similar to US-VSIM-007 and US-VSIM-018).
-   **Backend Architecture & Logic:**
    -   **API Endpoint:** GET /api/finances/profit-loss to calculate and retrieve the Profit & Loss statement for a specified date range.
        -   Query Parameters:
            -   startDate: Date (mandatory, start date for the Profit & Loss period).
            -   endDate: Date (mandatory, end date for the Profit & Loss period).
    -   **Business Logic:**
        -   **Data Retrieval:**
            -   Retrieve Total Income: Use the Income Tracking logic (US-VSIM-015) or Financial Service to fetch the total income from sales for the specified date range (Net Sales, considering discounts and returns).
            -   Retrieve Total Expenses: Use the Expense Recording logic (US-VSIM-016) or Financial Service to fetch the total operational expenses recorded for the specified date range.
        -   **Profit/Loss Calculation:**
            -   Calculate Profit/Loss: Subtract the total expenses from the total income to calculate the Profit or Loss.
            -   Profit/Loss = Total Income - Total Expenses
        -   **Data Formatting:**
            -   Format the Profit & Loss statement data for clear display in the UI, including formatting monetary values with currency symbols and appropriate decimal places.
            -   (Optional) Prepare data for optional breakdown sections, if implemented.
    -   **Shared Components:**
        -   **Financial Service:** Central service for handling all financial calculations and data aggregation, including Profit & Loss calculation. Extend the Financial Service to include Profit & Loss calculation logic. Reuses Income Tracking logic (US-VSIM-015) and Expense Tracking logic (US-VSIM-016).
        -   **Calculation Service:** Reused from US-VSIM-013, US-VSIM-015, US-VSIM-020, and US-VSIM-018 for performing consistent financial calculations, including subtraction, summation, and potentially more complex financial metrics in the future.
        -   **Authentication & Authorization Module:** Ensures that access to Profit & Loss statements and financial reports is restricted to authorized users (e.g., store owners, financial managers, accountants).
        -   **Reporting Engine:** (Potentially) Shared reporting engine used for generating various financial reports and statements, including the Profit & Loss statement.
    -   **Error Handling:**
        -   Return 400 Bad Request if mandatory date range parameters (startDate, endDate) are missing or invalid (e.g., invalid date format, end date before start date).
        -   Return 200 OK with zero profit/loss if no income or expense data is found for the selected date range, but clearly indicate "No data available for the selected period" in the UI.
        -   Return 500 Internal Server Error for any unexpected server-side errors during data retrieval or calculation.
        -   Use standardized error responses for consistent error reporting.
    -   **Logic Flow:**
        1. Receive GET request to /api/finances/profit-loss with mandatory startDate and endDate parameters.
        2. Authenticate and authorize the user.
        3. Validate date range parameters. Return 400 Bad Request for invalid parameters.
        4. Retrieve Total Income for the specified date range using Financial Service and Income Tracking logic (US-VSIM-015).
        5. Retrieve Total Expenses for the specified date range using Financial Service and Expense Tracking logic (US-VSIM-016).
        6. Calculate Profit/Loss by subtracting Total Expenses from Total Income using Calculation Service and Financial Service.
        7. Format the Profit & Loss statement data for display in the UI, including total income, total expenses, and the calculated profit/loss figure.
        8. Return a success response (e.g., 200 OK) with the Profit & Loss statement data (in JSON format).
        9. If no income or expense data is found for the selected period, return 200 OK with zero profit/loss values and a message indicating no data available.
-   **Data Model Impact:**
    -   **Sales Transactions Table (SalesTransactions):** Source of data for calculating Total Income. Reuses data from US-VSIM-015.
    -   **Expenses Table (Expenses):** Source of data for calculating Total Expenses. Reuses data from US-VSIM-016.
    -   **Optional Reporting Cache:** Consider implementing a reporting cache to store pre-calculated Profit & Loss statements for different time periods. This can improve performance for frequently accessed reports, especially for common periods like "This Month" or "Last Month."
-   **User Feedback & Notifications:**
    -   **Profit & Loss Statement Display:** Display a clear and well-structured Profit & Loss statement on the UI page, showing Total Income, Total Expenses, and the calculated Profit or Loss figure prominently.
    -   **Date Range Selection:** Ensure the date range selector is user-friendly and allows users to easily specify the period for the Profit & Loss calculation. Clearly indicate the selected date range in the displayed statement.
    -   **Visual Cues for Profit/Loss:** Use visual cues to clearly distinguish between profit and loss figures. For example, display profit in green and loss in red, or use positive/negative signs and parentheses to denote loss.
    -   **Loading Indicator:** Show a loading indicator while the Profit & Loss statement is being calculated and data is being retrieved, especially for longer date ranges or when calculating breakdowns.
    -   **Success Message:** Display a success message (e.g., "Profit & Loss statement generated successfully") upon successful calculation and display of the statement.
    -   **Error Alerts:** Display user-friendly error alerts if there are issues retrieving data or calculating the Profit & Loss statement, informing the user about the problem and suggesting possible actions (e.g., "Failed to generate Profit & Loss statement. Please check the date range and try again later.").
-   **Dependencies & Considerations:**
    -   **Integration Points & Backend Dependencies:**
        -   **Sales Module (US-VSIM-008, US-VSIM-015):** The Profit & Loss calculation is directly dependent on accurate income data from the Sales Module. Ensure seamless integration with the Sales Service and Income Tracking logic.
        -   **Expenses Module (US-VSIM-016):** Relies on accurate expense data from the Expenses Module. Ensure integration with the Expense Recording logic to retrieve total expenses for the specified period.
        -   **Financial Service:** Central service for financial calculations and data aggregation. The Profit & Loss calculation logic should be implemented within the Financial Service, reusing Income Tracking and Expense Tracking functionalities.
        -   **Reporting Engine:** (Potentially) If using a dedicated Reporting Engine, integrate Profit & Loss statement generation with the Reporting Engine for consistent report formatting and export capabilities.
    -   **Other Considerations:**
        -   **Performance:** Optimize database queries and calculations for Profit & Loss statement generation, especially for longer date ranges and larger datasets. Consider caching frequently accessed Profit & Loss statements or pre-calculated summary data for performance improvement.
        -   **Data Accuracy:** Ensure that Profit & Loss calculations are accurate and correctly account for all income and expense data within the specified period. Implement thorough testing to validate the calculation logic and data accuracy.
        -   **Security:** Restrict access to Profit & Loss statements and financial reports to authorized users only, as this information is highly sensitive and crucial for business decision-making. Implement appropriate authentication and authorization mechanisms to protect financial data.
        -   **Customization:** In future iterations, consider adding more customization options to the Profit & Loss statement, such as allowing users to choose different levels of detail (e.g., summary vs. detailed breakdown), customize the statement layout, or include additional financial metrics.

## **US-VSIM-018: Generate Financial Reports**

-   **Title:** Generate Financial Reports
-   **As a:** Store Owner
-   **I want to:** generate financial reports
-   **So that:** I can review business’s financial status.
-   **Description:** The system should offer reports like sales, expenses, profit/loss, and inventory value, with export options.
-   **Acceptance Criteria:**
    -   Given I am logged in as a Store Owner,
    -   When I navigate to the "Reports" section and select "Financial Reports,"
    -   Then I should be able to choose from "Sales Report," "Expense Report," "Profit & Loss Statement," or "Inventory Value Report."
    -   And I should be able to specify a date range for the report.
    -   And the report should display on-screen and be exportable to PDF or CSV.

### **Implementation Framework:**

-   **UI Elements:**
    -   **Reports Section:** Navigation link/button to the "Reports" section in the main application menu.
    -   **Financial Reports Sub-section/Page:** Within the "Reports" section, create a sub-section or dedicated page labeled "Financial Reports."
    -   **Report Type Selection:** Provide options to select different types of financial reports:
        -   "Sales Report": Button or link to generate a detailed Sales Report.
        -   "Expense Report": Button or link to generate an Expense Report.
        -   "Profit & Loss Statement": Button or link to generate a Profit & Loss Statement (reusing US-VSIM-017 logic and UI elements where applicable).
        -   "Inventory Value Report": Button or link to generate an Inventory Value Report (calculating the total value of current inventory based on purchase prices or selling prices).
    -   **Date Range Filters:** For each report type, provide a date range filter to allow users to specify the period for which to generate the report. Use predefined date range options and date pickers for custom ranges.
    -   **Report Display Area:** Designate an area on the page to display the generated financial report in a structured format, typically using tables, lists, and potentially charts or graphs for summary data.
    -   **Export Options:** Include buttons or links to export the generated financial reports in common formats:
        -   "Export to PDF": Button to export the report as a PDF (Portable Document Format) file, suitable for printing, sharing, and archival.
        -   "Export to CSV": Button to export the report data to a CSV (Comma Separated Values) file, suitable for further analysis in spreadsheet software.
-   **Backend Architecture & Logic:**
    -   **API Endpoints:**
        -   GET /api/reports/financial/sales-report – Generate and retrieve the Sales Report, accepting query parameters for startDate and endDate.
        -   GET /api/reports/financial/expense-report – Generate and retrieve the Expense Report, accepting query parameters for startDate and endDate.
        -   GET /api/reports/financial/profit-loss-statement – Generate and retrieve the Profit & Loss Statement, accepting query parameters for startDate and endDate (reusing US-VSIM-017 logic).
        -   GET /api/reports/financial/inventory-value-report – Generate and retrieve the Inventory Value Report.
    -   **Backend Service:** Extend the shared ReportGenerationService (from US-VSIM-007 and US-VSIM-015) to handle the generation of financial reports. It will have methods like:
        -   generateSalesReport(startDate, endDate)
        -   generateExpenseReport(startDate, endDate)
        -   generateProfitLossStatement(startDate, endDate) (reusing ProfitLossCalculationService from US-VSIM-017)
        -   generateInventoryValueReport() (calculating inventory value based on current stock and item prices).
    -   **Business Logic:**
        -   **Report Data Aggregation:** For each financial report type, implement specific logic to aggregate and process data from relevant tables (SalesTransactions, SaleItems, Expenses, InventoryItems, Categories).
        -   **Sales Report Logic:**
            -   Retrieve and aggregate sales data from the SalesTransactions and SaleItems tables for the specified date range.
            -   Include details such as: Date of Sale, Sale ID, Items Sold (with quantities and prices), Total Amount, Payment Method, Discounts Applied, Taxes Collected (if applicable), Customer Information (optional).
            -   Calculate summary metrics like Total Sales, Average Sale Value, Sales by Payment Method, Sales by Item Category (optional).
        -   **Expense Report Logic:**
            -   Retrieve and aggregate expense data from the Expenses table for the specified date range.
            -   Include details such as: Expense Date, Expense Category, Description, Amount.
            -   Calculate summary metrics like Total Expenses, Expenses by Category, Average Expense Amount.
        -   **Profit & Loss Statement Logic:** Reuse the Profit & Loss calculation logic from US-VSIM-017 (using ProfitLossCalculationService). Generate a structured Profit & Loss statement report.
        -   **Inventory Value Report Logic:**
            -   Retrieve current stock levels and item prices (purchase price or selling price, configurable) from the InventoryItems table.
            -   Calculate the total value of the current inventory by multiplying the stock quantity of each item by its price and summing up the values for all items.
            -   Report options: Allow users to choose whether to value inventory at purchase cost or selling price.
        -   **Data Formatting and Export:**
            -   Format the aggregated financial data into well-structured tables, lists, and potentially charts or graphs for display in the UI.
            -   Implement export functionality to generate reports in PDF and CSV formats, ensuring reports are professional-looking and easy to analyze.
    -   **Shared Components:**
        -   **Reporting Engine (ReportGenerationService):** Centralized service for generating all types of reports, including financial reports and inventory reports. Reused and extended from US-VSIM-007 and US-VSIM-015.
        -   **Data Aggregation Module:** Reusable module for common data aggregation tasks used in report generation, such as summing values, calculating averages, grouping data, and applying filters.
        -   **Export Utility Service:** Shared service for handling report export to CSV and PDF formats, ensuring consistent export functionality across all reports. Reused from US-VSIM-007.
        -   **Calculation Service:** Reused for performing financial calculations required for reports, such as summing sales, calculating profits, and valuing inventory.
        -   **Financial Service:** Provides access to financial data and financial calculation logic, reused for generating financial reports.
        -   **Authentication & Authorization Module:** Ensures that access to financial reports is restricted to authorized users.
    -   **Error Handling:**
        -   Return 400 Bad Request for invalid date range parameters or report type selections.
        -   Return 200 OK with an empty report or a message indicating "No data available for the selected criteria" if no data is found for the specified report parameters.
        -   Return 500 Internal Server Error for any unexpected server-side errors during report generation, data retrieval, or export processing.
        -   Use standardized error responses for consistent error reporting.
    -   **Logic Flow (Generate Sales Report):**
        1. Receive GET request to /api/reports/financial/sales-report with date range parameters.
        2. Authenticate and authorize the user.
        3. Validate date range parameters. Return 400 Bad Request for invalid parameters.
        4. Retrieve and aggregate sales data from the SalesTransactions and SaleItems tables for the specified date range using Financial Service and Reporting Engine.
        5. Format the sales report data for display in the UI and for export.
        6. Return a success response (e.g., 200 OK) with the sales report data (in JSON format) and options for PDF/CSV export.
    -   **Logic Flow (Generate Expense Report):** Similar logic flow as Sales Report, but retrieving and aggregating expense data from the Expenses table.
    -   **Logic Flow (Generate Profit & Loss Statement):** Reuse the logic and API endpoint from US-VSIM-017 (/api/reports/financial/profit-loss-statement).
    -   **Logic Flow (Generate Inventory Value Report):**
        1. Receive GET request to /api/reports/financial/inventory-value-report.
        2. Authenticate and authorize the user.
        3. Retrieve current stock levels and item prices from the InventoryItems table using Inventory Service and Reporting Engine.
        4. Calculate total inventory value based on the chosen valuation method (cost or selling price) using Calculation Service.
        5. Format the inventory value report data for display in the UI and for export.
        6. Return a success response (e.g., 200 OK) with the inventory value report data (in JSON format) and options for PDF/CSV export.
-   **Data Model Impact:**
    -   **Sales Transactions Table (SalesTransactions):** Source for Sales Report and Profit & Loss Statement. Reuses data from US-VSIM-015 and US-VSIM-017.
    -   **Sale Items Table (SaleItems):** Source for detailed sales information in Sales Report.
    -   **Expenses Table (Expenses):** Source for Expense Report and Profit & Loss Statement. Reuses data from US-VSIM-016 and US-VSIM-017.
    -   **Inventory Items Table (InventoryItems):** Source for Inventory Value Report and potentially for item-level sales analysis in Sales Report.
    -   **Categories Table (Categories):** (Optional) For category-based filtering or grouping in reports.
    -   **Optional Report Cache:** Consider implementing a report cache to store frequently generated financial reports for different time periods and report types to improve performance and reduce database load.
-   **User Feedback & Notifications:**
    -   **Report Display:** Display the generated financial report in a clear and structured format within the UI, using tables, lists, and charts as appropriate for each report type. Ensure reports are well-formatted, professional-looking, and easy to understand.
    -   **Report Type Selection:** Provide a clear and user-friendly interface for selecting different financial report types.
    -   **Date Range Filters:** Ensure date range filters are functional and allow users to easily specify the desired reporting period. Clearly indicate the selected date range in each generated report.
    -   **Export Options:** Provide prominent and functional "Export to PDF" and "Export to CSV" buttons for each report type, allowing users to easily export reports for offline use.
    -   **Success Message:** Display a success message (e.g., "Financial report generated successfully") upon successful report generation.
    -   **Loading Indicator:** Show a loading indicator while financial reports are being generated, as these reports may involve complex queries and data processing, especially for longer date ranges or detailed reports.
    -   **Error Alerts:** Display user-friendly error alerts if financial report generation fails, informing the user about the issue and suggesting possible actions (e.g., "Failed to generate {Report Type} report. Please check the date range and try again later.").
-   **Dependencies & Considerations:**
    -   **Integration Points & Backend Dependencies:**
        -   **Reporting Engine (ReportGenerationService):** Central dependency for handling all financial report generation tasks. Ensure it is robust, extensible, and efficient.
        -   **Data Aggregation Module:** Essential for efficiently aggregating and processing data from various tables for different financial reports.
        -   **Export Service (ExportUtilityService):** Provides reusable export functionality for generating PDF and CSV reports.
        -   **Financial Service:** Provides access to financial data and financial calculation logic, crucial for generating accurate financial reports.
        -   **Sales Module, Expenses Module, Inventory Module:** Depend on these modules as primary data sources for financial reports. Ensure seamless data retrieval and integration.
    -   **Other Considerations:**
        -   **Performance:** Optimize database queries and data processing for financial report generation to ensure reports are generated quickly and efficiently, even for large datasets and complex reports. Implement caching strategies for frequently accessed reports or pre-calculated report data.
        -   **Security:** Implement robust security measures to protect access to financial reports, as this data is highly sensitive. Restrict access to authorized users only and ensure secure data handling throughout the report generation and display process.
        -   **Customization:** In future iterations, consider adding more customization options to financial reports, such as allowing users to select specific data columns, customize report layouts, add charts and graphs, or define custom report templates.
        -   **Report Scheduling and Automation:** (Future Enhancement) Explore the possibility of adding report scheduling and automation features, allowing users to schedule reports to be generated and emailed automatically on a recurring basis (e.g., daily, weekly, monthly sales reports emailed to store owners).

---

## **US-VSIM-019: Manage Supplier Payments**

-   **Title:** Manage Supplier Payments
-   **As a:** Store Owner
-   **I want to:** manage supplier payments
-   **So that:** I can track what I owe and record payments made.
-   **Description:** The system should allow logging payments to suppliers, linking them to invoices or purchase orders.
-   **Acceptance Criteria:**
    -   Given I am logged in as a Store Owner,
    -   When I navigate to the "Suppliers" section and select a supplier,
    -   Then I should be able to view outstanding invoices/orders and record a payment with amount, date, and reference, linking it to specific invoices.
    -   And the outstanding balance for the supplier should update accordingly.

### **Implementation Framework:**

-   **UI Elements:**
    -   **Suppliers Section:** Navigation link/button to the "Suppliers" section in the main application menu.
    -   **Supplier Detail View (US-VSIM-021):**
        -   Access from Suppliers List: When viewing details of a specific supplier from the Suppliers List (US-VSIM-021), enhance the Supplier Detail View to include a section for managing payments.
        -   Outstanding Invoices/Orders Display: Within the Supplier Detail View, display a list or summary of outstanding invoices (US-VSIM-023) and/or purchase orders (US-VSIM-022) for the selected supplier, if applicable. This provides context for payment recording.
    -   **Record Payment Button:**
        -   In the Supplier Detail View (Payments section), provide a button labeled "Record Payment" or similar to initiate the payment recording process.
    -   **Payment Recording Form (Modal/Page):**
        -   Display-only field: "Supplier Name" (pre-filled with the selected supplier's name).
        -   Date Picker: "Payment Date" (Date picker, mandatory, defaults to current date).
        -   Number Input: "Amount Paid" (Number input, mandatory, validation for positive value).
        -   Payment Method Dropdown: Dropdown list to select the payment method used for the supplier payment (e.g., "Cash," "Bank Transfer," "Check"). Populate this list from managed payment methods (US-VSIM-012).
        -   Reference Number Input (Optional): Input field for entering a payment reference number (e.g., check number, transaction ID, bank reference).
        -   Link to Invoices/Orders (Optional but Recommended): Provide a mechanism to link the payment to specific outstanding invoices or purchase orders. This could be implemented as:
            -   List of Checkboxes: Display a list of outstanding invoices and/or purchase orders for the supplier, with checkboxes to select which invoices/orders the payment is intended to cover.
            -   Allocation Table: A more advanced option could be an allocation table where users can specify how much of the payment amount is allocated to each invoice or purchase order.
        -   "Record Payment" Button: To save the payment details.
        -   "Cancel" Button: To discard the payment recording and close the form.
    -   **Outstanding Balance Display:**
        -   Supplier Detail View: Display the current "Outstanding Balance" for the supplier prominently in the Supplier Detail View.
        -   Real-time Balance Update: Ensure that the outstanding balance is updated in real-time whenever a new payment is recorded for the supplier.
-   **Backend Architecture & Logic:**
    -   **API Endpoint:** POST /api/suppliers/{supplierId}/payments to record a supplier payment, where {supplierId} is the ID of the supplier. - Request Body (JSON):
        `{
  "paymentDate": date, // Date of the payment
  "amountPaid": number, // Amount paid to the supplier
  "paymentMethod": string, // Payment method used (e.g., "Cash", "Bank Transfer")
  "reference": string (optional), // Payment reference number
  "invoiceIds": [number] (optional), // Array of invoice IDs to link payment to
  "orderIds": [number] (optional) // Array of purchase order IDs to link payment to
}`
    -   **Business Logic:**
        -   **Validation:**
            -   Validate supplier ID: Ensure that the supplierId in the API request is valid and corresponds to an existing supplier in the Suppliers table.
            -   Validate payment data: Validate that mandatory fields like "Payment Date," "Amount Paid," and "Payment Method" are provided. Ensure that the payment amount is a positive numerical value. Validate that the selected payment method is valid and from the list of managed payment methods (US-VSIM-012).
        -   **Record Payment:**
            -   Database operation: Insert a new record into a SupplierPayments table to store the payment details, including supplierId, paymentDate, amountPaid, paymentMethod, reference, and links to associated invoices or purchase orders (if provided).
        -   **Update Outstanding Balance:**
            -   Recalculate outstanding balance: For the given supplier, recalculate the outstanding balance. This typically involves:
                -   Fetching all outstanding invoices for the supplier (from SupplierInvoices table, excluding paid invoices).
                -   Fetching all outstanding purchase orders for the supplier (from PurchaseOrders table, considering order amounts and prior payments).
                -   Summing up the amounts of outstanding invoices and purchase orders.
                -   Subtracting the total amount of all recorded payments made to the supplier (from SupplierPayments table) from the total outstanding amount.
                -   Update the outstandingBalance field in the Suppliers table with the recalculated balance. Alternatively, the outstanding balance can be calculated dynamically on-demand instead of storing it directly in the Suppliers table.
        -   **Update Invoice/Order Status (Optional):**
            -   Consider updating the status of linked invoices or purchase orders (in SupplierInvoices or PurchaseOrders tables) to reflect payments. For example, if a payment fully covers an invoice, update the invoice status to "Paid." If partially paid, update to "Partially Paid," etc. Implement logic to track invoice and order payment statuses.
    -   **Shared Components:**
        -   **Supplier Management Service:** Central service for managing supplier data, including recording payments, tracking outstanding balances, and retrieving supplier information. Extend the SupplierManagementService (from US-VSIM-021, US-VSIM-022, US-VSIM-023) to include payment management logic.
        -   **Financial Transaction Module:** (Potentially) A shared module for handling financial transactions, including supplier payments, customer payments, and refunds. This module can encapsulate common transaction recording and processing logic.
        -   **Validation Module:** Reused from previous user stories to validate payment data inputs, ensuring data integrity and consistency.
        -   **Authentication & Authorization Module:** Ensures that only authorized users (e.g., accountants, financial staff, store owners) can record supplier payments, protecting financial data and payment processes from unauthorized access and modification.
        -   **Audit Logging Service:** (Optional but recommended) Log supplier payment recording events (creation, updates, deletions) for audit trails and to track all payment transactions.
    -   **Error Handling:**
        -   Return 404 Not Found if the supplier with the given supplierId is not found.
        -   Return 400 Bad Request for validation failures, such as:
            -   "Invalid payment amount. Amount must be a positive number." if the payment amount is invalid.
            -   "Payment date is required" if the date field is missing.
            -   "Invalid payment method selected" if the selected payment method is not valid.
        -   Return 500 Internal Server Error for any unexpected server-side errors during payment recording or balance updates.
        -   Use standardized error responses for consistent error reporting.
    -   **Logic Flow (Record Supplier Payment):**
        1. Receive POST request to /api/suppliers/{supplierId}/payments with payment details.
        2. Authenticate and authorize the user.
        3. Validate input data: supplier ID, payment date, amount paid, payment method using Validation Module and Supplier Management Service.
        4. Check if the supplier with supplierId exists using Supplier Management Service. Return 404 if not found.
        5. If validation passes and supplier exists, perform the following operations within a database transaction:
            - Record the supplier payment in the SupplierPayments table using Supplier Management Service.
            - Recalculate the outstanding balance for the supplier using Supplier Management Service and update the Suppliers table (or calculate dynamically).
            - (Optionally) Update the status of linked invoices or purchase orders in SupplierInvoices or PurchaseOrders tables to reflect payment status.
        6. If all operations within the transaction are successful, commit the transaction and return a success response (e.g., 201 Created) with payment confirmation and updated supplier balance.
        7. If any operation fails within the transaction, roll back the entire transaction and return an appropriate error response (e.g., 500 Internal Server Error).
    -   **Logic Flow (View Supplier Detail with Outstanding Balance):**
        1. When viewing Supplier Detail (US-VSIM-021), the UI should call an API endpoint to retrieve supplier details, including the current outstanding balance.
        2. Backend retrieves supplier information from the Suppliers table using Supplier Management Service.
        3. Calculate the outstanding balance dynamically using Supplier Management Service by:
            - Fetching all outstanding invoices and purchase orders for the supplier.
            - Summing up invoice and order amounts.
            - Subtracting total payments made to the supplier.
        4. Return supplier details along with the calculated outstanding balance in the API response.
-   **Data Model Impact:**
    -   **Supplier Payments Table (SupplierPayments):**
        -   Create a new table to record supplier payment transactions.
        -   Columns: paymentId (PK, auto-generated), supplierId (FK referencing Suppliers), paymentDate (date), amountPaid (decimal), paymentMethod (string), reference (string, optional), createdAt (timestamp).
        -   Linking to Invoices/Orders: Implement relationships to link payments to specific invoices and/or purchase orders. This could be achieved through:
            -   Foreign keys: Adding invoiceId (FK to SupplierInvoices) and purchaseOrderId (FK to PurchaseOrders) columns to SupplierPayments table (for one-to-many relationships, if one payment can be linked to multiple invoices/orders, consider junction tables).
            -   Junction Tables: Create junction tables like PaymentInvoices and PaymentOrders to handle many-to-many relationships between payments and invoices/orders, allowing one payment to be allocated across multiple invoices and orders.
    -   **Suppliers Table (Suppliers):**
        -   Add a field: outstandingBalance (decimal). This field will store the calculated outstanding balance for each supplier. Decide whether to update this field directly upon each payment or calculate it dynamically when needed. Dynamic calculation is generally preferred for data consistency, but caching the calculated balance might be considered for performance if frequent access is needed.
    -   **Supplier Invoices Table (SupplierInvoices):**
        -   (Optional) Add a field: status (string, e.g., "Outstanding", "Paid", "Partially Paid") to track the payment status of supplier invoices.
    -   **Purchase Orders Table (PurchaseOrders):**
        -   (Optional) Add a field: status (string, e.g., "Open", "Pending Payment", "Paid", "Closed") to track the payment status of purchase orders.
-   **User Feedback & Notifications:**
    -   **Success Message:** Display a success message (e.g., "Payment recorded successfully. Supplier balance updated.") upon successful recording of a supplier payment.
    -   **Error Alerts:** Display clear and informative error messages if payment recording fails due to validation errors or other issues (e.g., "Invalid payment amount", "Payment date is required", "Supplier not found", "Failed to record payment. Please try again.").
    -   **Real-Time Balance Update:** Ensure that the "Outstanding Balance" displayed in the Supplier Detail View is updated in real-time immediately after a payment is recorded, reflecting the current balance accurately.
-   **Dependencies & Considerations:**
    -   **Integration Points & Backend Dependencies:**
        -   **Supplier Management Service:** Central service for managing supplier-related data and operations, including payment recording, balance tracking, and retrieval of supplier, invoice, and purchase order information.
        -   **Financial Reporting Module:** Supplier payment data is crucial for accurate financial reporting (US-VSIM-018), expense tracking (US-VSIM-016), and profit and loss calculations (US-VSIM-017). Ensure seamless integration with financial reporting modules to incorporate supplier payment information into financial summaries and reports.
        -   **Purchase Order Module (US-VSIM-022) and Supplier Invoice Module (US-VSIM-023):** Integration with Purchase Order and Supplier Invoice modules is essential for linking payments to specific orders and invoices, allowing for accurate tracking of payables and reconciliation of payments with outstanding obligations.
    -   **Other Considerations:**
        -   **Security:** Implement robust security measures to protect sensitive financial data related to supplier payments. Secure access to payment recording and management functions to authorized users only. Encrypt sensitive payment information if stored.
        -   **Data Consistency:** Ensure data consistency and accuracy in outstanding balance calculations and payment records. Implement database transactions to maintain atomicity and prevent data inconsistencies in case of errors during payment recording or balance updates.
        -   **Audit Trail:** Maintain a comprehensive audit trail of all supplier payment transactions, including details of payments, dates, amounts, payment methods, references, and users who recorded payments, for audit purposes and financial accountability.
        -   **Payment Reconciliation:** (Future Enhancement) Consider adding features to support payment reconciliation, such as matching recorded payments with bank statements or supplier payment confirmations, to ensure accuracy and completeness of payment records.
        -   **Payment Scheduling and Reminders:** (Future Enhancement) Explore the possibility of adding payment scheduling and reminder features to help manage supplier payments proactively and avoid late payments.

## **US-VSIM-020: Calculate Basic Taxes**

-   **Title:** Calculate Basic Taxes
-   **As a:** Store Owner
-   **I want to:** calculate basic taxes on sales
-   **So that:** I can comply with tax regulations.
-   **Description:** The system should apply a configurable tax rate to sales and display tax amounts in transactions and reports.
-   **Acceptance Criteria:**
    -   Given I am logged in as a Store Owner,
    -   When I navigate to "Settings" and select "Tax Settings,"
    -   Then I should be able to set a tax rate (e.g., percentage).
    -   And during a sale, the system should calculate and show the tax amount, included in the total.

### **Implementation Framework:**

-   **UI Elements:**
    -   **Settings Section:** Navigation link/button to the "Settings" section in the main application menu.
    -   **Tax Settings Sub-section/Page:** Within "Settings," create a sub-section or dedicated page labeled "Tax Settings."
    -   **Tax Rate Input Form:**
        -   Input field: "Tax Rate" (Number input, allows decimal values, with clear labeling indicating it's a percentage).
        -   Label/Hint: Add a label or hint to indicate that the tax rate should be entered as a percentage value (e.g., "Enter Tax Rate (%)").
        -   Validation: Implement input validation to ensure that the tax rate is a valid non-negative number, and potentially within a reasonable range (e.g., 0% to 100% or a maximum legally permissible tax rate).
    -   **Save Button:** To save the configured tax rate.
    -   **Tax Display in Sales Form (US-VSIM-008):**
        -   Sales Transaction Form: Enhance the "New Sale" form (US-VSIM-008) to display the calculated tax amount during sales transactions.
        -   Tax Amount Field: Add a display-only field labeled "Tax" or "Tax Amount" in the sales summary section of the form. This field should dynamically display the calculated tax amount based on the current sale total and the configured tax rate.
        -   Tax Included in Total Indication: Clearly indicate that the displayed "Total Amount" includes the calculated tax (e.g., "Total (Incl. Tax)").
    -   **Tax Breakdown in Invoice/Receipt (US-VSIM-011):**
        -   Invoice/Receipt Document: Ensure that generated invoices and receipts (US-VSIM-011) include a clear breakdown of the tax amount.
        -   Tax Details Section: Add a section in the invoice/receipt to display:
            -   "Tax Rate": Show the configured tax rate (percentage).
            -   "Tax Amount": Display the calculated tax amount separately.
            -   "Subtotal (Excl. Tax)": Show the subtotal of the sale before tax.
            -   "Total (Incl. Tax)": Show the final total amount including tax.
    -   **Tax Reporting (Optional, Future Enhancement):**
        -   Consider future enhancements to include tax-related reporting features, such as generating reports on taxes collected over specific periods (e.g., monthly tax reports, annual tax summaries).
-   **Backend Architecture & Logic:**
    -   **API Endpoint:** POST /api/settings/tax-rate to update the tax rate setting.
        -   Request Body (JSON): { "taxRate": number } (Tax rate as a decimal or percentage value)
    -   **Business Logic:**
        -   **Validation:**
            -   Validate tax rate input: Ensure that the tax rate value entered by the user is a valid non-negative number, and potentially within a reasonable range (e.g., 0 to 100).
        -   **Tax Rate Storage:**
            -   Store the configured tax rate in a TaxSettings table or within a general Settings table, ensuring it is persistently saved and can be retrieved for calculations.
        -   **Tax Calculation Logic:**
            -   Implement tax calculation logic within the Calculation Service (reused from US-VSIM-013, US-VSIM-017, US-VSIM-018, US-VSIM-015) to calculate taxes on sales transactions.
            -   Tax Calculation Formula: Tax Amount = Sale Subtotal \* (Tax Rate / 100) (if tax rate is stored as a percentage).
            -   Tax application during sale: When recording a sale transaction (US-VSIM-008), retrieve the configured tax rate from the TaxSettings table, calculate the tax amount based on the sale subtotal, and include the calculated tax in the total sale amount.
        -   **Tax Display Logic:**
            -   Ensure that the calculated tax amount is dynamically displayed in the sales transaction form (US-VSIM-008) and clearly presented in generated invoices/receipts (US-VSIM-011).
    -   **Shared Components:**
        -   **Calculation Service:** Central service for performing financial calculations, including tax calculations, discount calculations, and total amount computations. Extend the Calculation Service to include tax calculation functions.
        -   **Settings Service:** Central service for managing application-wide settings, including tax settings, currency settings, store information, etc. Reused from US-VSIM-028 and US-VSIM-029.
        -   **Sales Processing Module:** Reused and extended from US-VSIM-008 and US-VSIM-013 to integrate tax calculation into the sale recording process.
        -   **Authentication & Authorization Module:** Ensures that access to tax settings and modification of the tax rate is restricted to authorized users (e.g., store owners, administrators, financial staff).
    -   **Error Handling:**
        -   Return 400 Bad Request for validation failures, such as:
            -   "Invalid tax rate. Tax rate must be a non-negative number." if the tax rate input is invalid.
        -   Return 500 Internal Server Error for any unexpected server-side errors during tax setting updates or tax calculations.
        -   Use standardized error responses for consistent error reporting.
    -   **Logic Flow (Update Tax Rate Setting):**
        1. Receive POST request to /api/settings/tax-rate with the new tax rate value.
        2. Authenticate and authorize the user.
        3. Validate tax rate input using Validation Module, ensuring it is a valid non-negative number.
        4. If validation passes, store the tax rate in the TaxSettings table using Settings Service.
        5. Return a success response (e.g., 200 OK) upon successful tax rate update.
    -   **Logic Flow (Calculate Tax during Sale):**
        1. During sale transaction processing (US-VSIM-008), retrieve the current tax rate from the TaxSettings table using Settings Service.
        2. Use Calculation Service to calculate the tax amount based on the sale subtotal and the retrieved tax rate.
        3. Include the calculated tax amount in the total sale amount and store the tax amount in the SalesTransactions table for record-keeping and reporting.
        4. Display the calculated tax amount in the sales transaction form and on the generated invoice/receipt.
-   **Data Model Impact:**
    -   **Tax Settings Table (TaxSettings):**
        -   Create a new table to store tax configuration settings.
        -   Columns: settingId (PK, likely a single record table, can use a fixed ID like 1), taxRate (decimal, to store the tax rate percentage), updatedAt (timestamp).
    -   **Sales Transactions Table (SalesTransactions):**
        -   Consider adding a new field: taxAmount (decimal, optional). This field can be used to store the calculated tax amount for each sale transaction for historical reference and reporting purposes.
-   **User Feedback & Notifications:**
    -   **Success Message:** Display a success message (e.g., "Tax settings updated successfully") upon successful update of the tax rate.
    -   **Error Alerts:** Display error alerts if the tax rate input is invalid (e.g., "Invalid tax rate. Please enter a non-negative number.").
    -   **Real-Time Tax Display in Sales Form:** Ensure that the calculated tax amount is dynamically displayed in the sales transaction form as items are added and quantities are adjusted, providing immediate feedback to the user about the tax implications of the sale.
    -   **Tax Breakdown in Invoice/Receipt:** Verify that generated invoices and receipts clearly display the tax rate, tax amount, subtotal (excluding tax), and total amount (including tax), providing customers with a transparent breakdown of tax charges.
-   **Dependencies & Considerations:**
    -   **Integration Points & Backend Dependencies:**
        -   **Calculation Module:** Integral dependency for performing tax calculations accurately and consistently.
        -   **Sales Service:** Must integrate tax calculation logic seamlessly into the sale recording process (US-VSIM-008).
        -   **Settings Service:** Provides access to the configured tax rate setting.
        -   **Invoice/Receipt Generation (US-VSIM-011):** Ensure that tax details are correctly included in generated invoices and receipts.
    -   **Other Considerations:**
        -   **Compliance:** Ensure that tax calculations and invoice/receipt formats comply with relevant tax regulations and legal requirements in the store's jurisdiction. Consult with accounting or legal professionals to ensure tax compliance.
        -   **Performance:** Tax calculations should be efficient and have minimal impact on the performance of sale recording and invoice generation processes. Cache tax settings for faster retrieval during calculations.
        -   **Security:** Secure access to tax settings and restrict modification of the tax rate to authorized users only. Ensure that tax data is handled securely and in compliance with data privacy regulations.
        -   **Tax Inclusivity/Exclusivity:** Decide whether prices displayed in the system are tax-inclusive or tax-exclusive. If prices are tax-inclusive, adjust the tax calculation logic accordingly to extract the tax amount from the total price. If tax-exclusive (more common for business-to-business transactions), the current calculation logic is appropriate. Clearly document and communicate the pricing and tax policy to users.
        -   **Multiple Tax Rates/Tax Rules (Future Enhancement):** For future enhancements, consider supporting more complex tax scenarios, such as handling multiple tax rates (e.g., different tax rates for different product categories or regions), tax exemptions, or tiered tax rates. This would likely require a more sophisticated tax engine and data model to manage tax rules and calculations.

# Supplier Management

## **US-VSIM-021: Manage Supplier Information**

-   **Title:** Manage Supplier Information
-   **As a:** Store Owner
-   **I want to:** manage supplier information
-   **So that:** I can keep contact details and other relevant information about my suppliers.
-   **Description:** The system should allow maintaining supplier profiles with details like name, contact info, and address.
-   **Acceptance Criteria:**
    -   Given I am logged in as a Store Owner,
    -   When I navigate to the "Suppliers" section,
    -   Then I should be able to add a supplier with name, contact person, phone, email, and address.
    -   And I should be able to edit or delete suppliers, with a warning if linked to orders/invoices.

### **Implementation Framework:**

-   **UI Elements:**
    -   **Suppliers Section:** Navigation link/button to the "Suppliers" section in the main application menu.
    -   **Suppliers List Page:**
        -   Display a list or table of existing suppliers.
        -   Columns: "Supplier ID," "Supplier Name" (sortable), "Contact Person," "Contact Phone," "Contact Email," "Address (Summary)," "Actions" (e.g., "View Details," "Edit," "Delete").
        -   "Add Supplier" Button: Button labeled "Add Supplier" to initiate the process of adding a new supplier.
    -   **Supplier Form (Add/Edit Modal or Page):**
        -   Input fields for:
            -   "Supplier Name" (Text input, mandatory, with validation for uniqueness to prevent duplicate supplier entries).
            -   "Contact Person" (Text input, optional).
            -   "Contact Phone" (Text input, optional, with phone number format validation).
            -   "Contact Email" (Text input, optional, with email format validation).
            -   "Address" (Textarea, optional, for supplier's physical address).
        -   "Save Supplier" Button: To save the new or updated supplier information.
        -   "Cancel" Button: To discard changes and close the form.
    -   **Supplier Detail View Page:**
        -   Access from Suppliers List: Provide a "View Details" action for each supplier in the list to navigate to a dedicated Supplier Detail View page.
        -   Supplier Information Display: Display all details of the selected supplier, including: "Supplier Name," "Contact Person," "Contact Phone," "Contact Email," "Full Address."
        -   Purchase History Section: Include a section to view the purchase history for the supplier (as per US-VSIM-024), listing purchase orders and invoices associated with the supplier.
        -   Payments Section: Include a section for managing supplier payments (as per US-VSIM-019), showing outstanding balance and payment recording options.
    -   **Action Buttons (in Suppliers List and Supplier Detail View):**
        -   "Edit" Button/Icon: To open the "Edit Supplier" form, pre-populated with the details of the selected supplier. Available in both Suppliers List and Supplier Detail View.
        -   "Delete" Button/Icon: To initiate the deletion of a supplier record. Available in both Suppliers List and Supplier Detail View.
    -   **Confirmation Dialogs:** Display confirmation dialogs before deleting supplier records to prevent accidental data loss. The confirmation dialog should warn the user if the supplier is linked to any existing purchase orders or invoices and ask for explicit confirmation before proceeding with deletion.
-   **Backend Architecture & Logic:**
    -   **API Endpoints:**
        -   GET /api/suppliers – Retrieve a list of all suppliers.
        -   POST /api/suppliers – Add a new supplier.
            -   Request Body (JSON): { "name": string, "contactPerson": string (optional), "phone": string (optional), "email": string (optional), "address": string (optional) }
        -   GET /api/suppliers/{supplierId} – Retrieve details of a specific supplier, where {supplierId} is the ID of the supplier.
        -   PUT /api/suppliers/{supplierId} – Update an existing supplier's information, where {supplierId} is the ID of the supplier to be updated.
            -   Request Body (JSON): { "name": string, "contactPerson": string (optional), "phone": string (optional), "email": string (optional), "address": string (optional) }
        -   DELETE /api/suppliers/{supplierId} – Delete a supplier, where {supplierId} is the ID of the supplier to be deleted.
    -   **Business Logic:**
        -   **Validation:**
            -   Validate supplier name: Ensure that the "Supplier Name" is provided and is not empty. Validate for uniqueness to prevent duplicate supplier entries in the system.
            -   Validate contact information: Validate the format of "Contact Phone" (if provided) and "Contact Email" (if provided) to ensure they are in valid formats.
        -   **Dependency Checks (for Deletion):**
            -   Before deleting a supplier, perform dependency checks to ensure that the supplier is not currently linked to any active or historical purchase orders (US-VSIM-022), supplier invoices (US-VSIM-023), or supplier payments (US-VSIM-019).
            -   If dependencies exist, prevent deletion and return an error message to inform the user about the existing links and prevent data integrity issues.
        -   **Database Operations:**
            -   Perform CRUD operations on the Suppliers table to manage supplier information (create, read, update, delete supplier records).
    -   **Shared Components:**
        -   **Supplier Management Service:** Central service dedicated to managing all supplier-related data and operations, including CRUD operations for supplier profiles, retrieval of supplier details, dependency checks before deletion, and potentially future features like supplier search and reporting.
        -   **Validation Module:** Reused from previous user stories to validate supplier data inputs, ensuring data integrity and consistency (e.g., validating supplier name, phone number format, email format, mandatory fields).
        -   **Authentication & Authorization Module:** Ensures that access to supplier data and management functions is restricted to authorized users (e.g., purchasing managers, inventory managers, store owners).
        -   **Audit Logging Service:** (Optional but recommended) Log supplier management events (creation, updates, deletions) for audit trails and to track changes to supplier records, especially for sensitive information like contact details and addresses.
    -   **Error Handling:**
        -   Return 409 Conflict if deletion of a supplier is attempted when the supplier is linked to existing purchase orders or invoices, preventing deletion due to dependencies.
        -   Return 404 Not Found if a supplier with the given supplierId is not found during update, delete, or detail retrieval operations.
        -   Return 400 Bad Request for validation errors, such as if the supplier name is missing, or if contact information formats are invalid.
        -   Use standardized error responses for consistent error reporting.
    -   **Logic Flow (Add New Supplier):**
        1. Receive POST request to /api/suppliers with supplier details (name, contact person, phone, email, address).
        2. Authenticate and authorize the user.
        3. Validate supplier data (name, contact information formats) using Validation Module, ensuring supplier name is unique.
        4. If validation passes, insert a new supplier record into the Suppliers table using Supplier Management Service.
        5. Return a success response (e.g., 201 Created) with the new supplier ID.
    -   **Logic Flow (Edit Supplier):**
        1. Receive PUT request to /api/suppliers/{supplierId} with updated supplier details.
        2. Authenticate and authorize the user.
        3. Validate supplier data (name, contact information formats) using Validation Module, ensuring supplier name uniqueness (excluding the current supplier being edited).
        4. If validation passes, update the supplier record in the Suppliers table using Supplier Management Service.
        5. Return a success response (e.g., 200 OK) upon successful update.
    -   **Logic Flow (Delete Supplier):**
        1. Receive DELETE request to /api/suppliers/{supplierId}.
        2. Authenticate and authorize the user.
        3. Check for dependencies: Query the PurchaseOrders, SupplierInvoices, and SupplierPayments tables to see if any records exist with the given supplierId using Supplier Management Service.
        4. If dependencies are found (supplier linked to existing orders/invoices/payments), return a 409 Conflict error indicating that the supplier cannot be deleted due to existing links.
        5. If no dependencies are found, delete the supplier record from the Suppliers table using Supplier Management Service.
        6. Return a success response (e.g., 200 OK) upon successful deletion.
    -   **Logic Flow (View Supplier Detail):**
        1. Receive GET request to /api/suppliers/{supplierId} to retrieve details for a specific supplier.
        2. Authenticate and authorize the user.
        3. Check if the supplier with supplierId exists using Supplier Management Service. Return 404 if not found.
        4. Retrieve supplier details from the Suppliers table using Supplier Management Service.
        5. Return a success response (e.g., 200 OK) with the supplier details (in JSON format). The response should include all supplier information, and the UI will then render the Supplier Detail View, including purchase history and payment management sections by calling separate API endpoints for those features (US-VSIM-024, US-VSIM-019).
-   **Data Model Impact:**
    -   **Suppliers Table (Suppliers):**
        -   Create a new table to store supplier information.
        -   Columns: supplierId (PK, auto-generated), name (string, mandatory, unique index recommended), contactPerson (string, optional), phone (string, optional), email (string, optional), address (string, optional), createdAt (timestamp), updatedAt (timestamp).
        -   Consider adding indexes to columns frequently used in queries, such as name for searching and filtering suppliers.
    -   **Foreign Key Relationships:** Ensure that foreign key relationships are properly defined and enforced between the Suppliers table and related tables such as PurchaseOrders, SupplierInvoices, and SupplierPayments to maintain data integrity and enable efficient data retrieval for purchase history and payment tracking features.
-   **User Feedback & Notifications:**
    -   **Success Messages:** Display success messages upon adding, updating, or deleting supplier information (e.g., "Supplier '{Supplier Name}' saved successfully", "Supplier information updated successfully", "Supplier '{Supplier Name}' deleted successfully").
    -   **Error Alerts:**
        -   Inform the user if deletion of a supplier is prevented due to existing links to purchase orders or invoices (e.g., "Cannot delete supplier '{Supplier Name}'. Supplier is linked to existing purchase orders or invoices.").
        -   Display error alerts for validation failures (e.g., "Supplier name is required", "Supplier name already exists", "Invalid email format", "Invalid phone number format").
    -   **Confirmation Prompts:** Display confirmation prompts before performing deletion actions to prevent accidental removal of supplier records, especially if warnings about existing links need to be presented.
    -   **Suppliers List Update:** Update the suppliers list view in real-time after each supplier management operation (add, edit, delete) to reflect the changes immediately.
    -   **Supplier Detail View Display:** Ensure that the Supplier Detail View page accurately displays all relevant supplier information, including contact details, purchase history, and payment information, providing a comprehensive overview of the supplier relationship.
-   **Dependencies & Considerations:**
    -   **Integration Points & Backend Dependencies:**
        -   **Purchase Order Module (US-VSIM-022) & Invoice Module (US-VSIM-023):** The Supplier Management feature is a core dependency for Purchase Order and Supplier Invoice management. Purchase orders and invoices must be linked to suppliers managed through this feature. Ensure seamless integration with Purchase Order and Invoice modules to allow users to select suppliers from the managed list when creating orders and invoices.
        -   **Supplier Payments Module (US-VSIM-019):** Supplier Payment management is also tightly integrated with Supplier Information. Payment records need to be linked to suppliers, and supplier balance calculations rely on supplier information and payment history.
        -   **Audit Logging Service:** (Optional) Integrate with Audit Logging Service to track changes to supplier information for compliance and security auditing.
    -   **Other Considerations:**
        -   **Security:** Secure sensitive supplier data, including contact information and addresses. Implement proper access controls to ensure that only authorized users can manage supplier information.
        -   **Data Integrity:** Enforce data integrity rules, such as preventing deletion of suppliers that are linked to active purchase orders or invoices, to maintain data consistency and avoid orphaned records. Implement validation rules to ensure data accuracy and completeness.
        -   **Performance:** Optimize database operations for supplier management, especially for retrieving and displaying large lists of suppliers and their details. Use database indexing on relevant columns (e.g., supplierName) to improve search and retrieval performance.
        -   **Search and Filtering (Future Enhancement):** Consider adding search and filtering capabilities to the Suppliers List View to allow users to easily find specific suppliers based on name, contact person, or other criteria.
        -   **Supplier Portal/Self-Service (Future Enhancement):** For future iterations, explore the possibility of adding a supplier portal or self-service features to allow suppliers to view their information, order history, payment status, and potentially update their contact details directly (with appropriate security and access controls).

---

## **US-VSIM-022: Record Purchase Orders**

-   **Title:** Record Purchase Orders
-   **As a:** Store Owner
-   **I want to:** record purchase orders
-   **So that:** I can track orders placed with suppliers.
-   **Description:** The system should allow creating purchase orders with supplier details, items, quantities, and delivery dates.
-   **Acceptance Criteria:**
    -   Given I am logged in as a Store Owner,
    -   When I navigate to the "Suppliers" section and select "New Purchase Order,"
    -   Then I should be able to select a supplier, add items with quantities from inventory, and set an expected delivery date.
    -   And the purchase order should be recorded and linked to the selected supplier.

### **Implementation Framework:**

-   **UI Elements:**
    -   **Suppliers Section:** Navigation link/button to the "Suppliers" section in the main application menu.
    -   **Purchase Orders Sub-section/Page:** Within the "Suppliers" section, create a sub-section or dedicated page labeled "Purchase Orders."
    -   **New Purchase Order Button:** Button labeled "Create Purchase Order" or "New Purchase Order" to initiate the creation of a new purchase order.
    -   **Purchase Order Form (Modal/Page):**
        -   **Supplier Selection:**
            -   Dropdown or searchable select: Provide a dropdown list or searchable select field to choose a supplier for the purchase order. Populate this list from the managed suppliers (US-VSIM-021). Make supplier selection mandatory.
        -   **Order Date:**
            -   Date picker: Include a date picker for the purchase order date. Default to the current date. Make order date mandatory.
        -   **Expected Delivery Date:**
            -   Date picker: Include a date picker to set the expected delivery date for the purchase order. Make expected delivery date mandatory.
        -   **Items Ordered Section:**
            -   Add Items Row: Provide a mechanism to add items to the purchase order. This could be implemented as:
                -   Item Search/Dropdown: Searchable dropdown or autocomplete input field to select items from the inventory (US-VSIM-001). As users type, display matching inventory items.
                -   Quantity Input: For each selected item, include a number input field to specify the quantity being ordered. Validate that quantity is a positive integer.
                -   Item List Display: Display the list of items added to the purchase order in a table or list format, showing item name, selected quantity, and unit of measurement. Allow users to add multiple items to the order.
        -   **Purchase Order Number (Optional):**
            -   Text input field: Provide an optional text input field to enter a custom Purchase Order Number (e.g., for internal tracking or supplier reference).
        -   **Notes/Comments (Optional):**
            -   Text area: Optional text area to add notes or comments related to the purchase order.
        -   **Save Purchase Order Button:** To record and save the purchase order.
        -   **Cancel Button:** To discard the purchase order creation and close the form.
    -   **Purchase Orders List Page:**
        -   Display a list or table of recorded purchase orders.
        -   Columns: "Purchase Order ID," "Supplier Name" (linked to Supplier Detail View), "Order Date" (sortable), "Expected Delivery Date" (sortable), "Number of Items," "Total Value (Optional)," "Status (Optional)," "Actions" (e.g., "View Details," "Edit," "Delete," "Receive Stock").
        -   Filtering and Sorting: Provide options to filter and sort the purchase order list by relevant criteria (e.g., supplier name, order date, delivery date, status).
-   **Backend Architecture & Logic:**
    -   **API Endpoint:** POST /api/purchase-orders to record a new purchase order. - Request Body (JSON):
        `{
  "supplierId": number, // ID of the supplier for the purchase order
  "orderDate": date, // Date of the purchase order
  "expectedDeliveryDate": date, // Expected delivery date
  "purchaseOrderNumber": string (optional), // Optional PO number
  "notes": string (optional), // Optional notes or comments
  "items": [ // Array of items being ordered
    { "itemId": number, "quantity": number }
  ]
}`
    -   **Business Logic:**
        -   **Validation:**
            -   Validate supplier selection: Ensure that a valid supplierId is provided and corresponds to an existing supplier in the Suppliers table (US-VSIM-021).
            -   Validate order date and delivery date: Ensure that both "Order Date" and "Expected Delivery Date" are provided and are valid dates. Validate that the expected delivery date is not before the order date.
            -   Validate items ordered: Ensure that the "items" array is not empty and that each item in the array includes a valid itemId (corresponding to an existing inventory item in InventoryItems table - US-VSIM-001) and a positive integer quantity.
        -   **Record Purchase Order:**
            -   Database operations:
                -   Insert a new record into the PurchaseOrders table to store the purchase order header information, including supplierId, orderDate, expectedDeliveryDate, purchaseOrderNumber, and notes.
                -   For each item in the "items" array, insert a new record into the PurchaseOrderItems table to record the item-specific details for the purchase order, including purchaseOrderId (linking to the newly created purchase order), itemId, and quantity.
    -   **Shared Components:**
        -   **Supplier Management Service:** Essential for validating supplier selection and retrieving supplier information. Reused from US-VSIM-021.
        -   **Inventory Service:** Used to validate item selections and ensure that valid itemId values are provided. Reused from US-VSIM-001.
        -   **Authentication & Authorization Module:** Ensures that only authorized users (e.g., purchasing managers, inventory managers, store owners) can record purchase orders.
        -   **Validation Module:** Reused from previous user stories to validate input data, ensuring data integrity and consistency (e.g., validating supplier ID, item IDs, quantities, date formats).
        -   **Order Processing Module:** (Potentially) A shared module for handling order-related operations, including purchase order creation, tracking, and potentially integration with stock receiving (US-VSIM-004) and supplier invoice tracking (US-VSIM-023).
    -   **Error Handling:**
        -   Return 400 Bad Request for validation failures, such as:
            -   "Supplier is required" if no supplier is selected.
            -   "Invalid Supplier ID" if the provided supplierId is not valid.
            -   "Order date and expected delivery date are required" if date fields are missing.
            -   "Expected delivery date cannot be before order date" if delivery date is invalid.
            -   "Items must be added to the purchase order" if the items array is empty.
            -   "Invalid item ID '{Item Name}'" if an itemId is not valid.
            -   "Invalid quantity for item '{Item Name}'. Quantity must be a positive integer." if quantity is invalid.
        -   Return 500 Internal Server Error for any unexpected server-side errors during purchase order recording.
        -   Use standardized error responses for consistent error reporting.
    -   **Logic Flow (Record New Purchase Order):**
        1. Receive POST request to /api/purchase-orders with purchase order details.
        2. Authenticate and authorize the user.
        3. Validate input data: supplier selection, order date, expected delivery date, and items ordered (including item IDs and quantities) using Validation Module, Supplier Management Service, and Inventory Service.
        4. If validation fails, return 400 Bad Request with appropriate error messages.
        5. If validation passes, perform the following database operations within a transaction:
            - Insert a new purchase order record into the PurchaseOrders table using Supplier Management Service, including header information (supplier ID, dates, PO number, notes).
            - For each item in the order, insert a new record into the PurchaseOrderItems table, linking it to the newly created purchase order and including item ID and quantity.
        6. If all operations within the transaction are successful, commit the transaction and return a success response (e.g., 201 Created) with the new purchase order ID.
        7. If any operation fails within the transaction, roll back the entire transaction and return an appropriate error response (e.g., 500 Internal Server Error).
-   **Data Model Impact:**
    -   **Purchase Orders Table (PurchaseOrders):**
        -   Create a new table to store purchase order header information.
        -   Columns: purchaseOrderId (PK, auto-generated), supplierId (FK referencing Suppliers, mandatory), orderDate (date, mandatory), expectedDeliveryDate (date, mandatory), purchaseOrderNumber (string, optional, unique index recommended), notes (string, optional), createdAt (timestamp), updatedAt (timestamp), orderedByUserId (FK referencing Users, to track who created the order), orderStatus (string, e.g., "Pending", "Open", "Received", "Cancelled", optional, for future status tracking).
    -   **Purchase Order Items Table (PurchaseOrderItems):**
        -   Create a new table to store details of items ordered within each purchase order.
        -   Columns: orderItemId (PK, auto-generated), purchaseOrderId (FK referencing PurchaseOrders, mandatory), itemId (FK referencing InventoryItems, mandatory), quantity (integer, mandatory, validation for positive integer), unitPriceAtOrder (decimal, optional, to record price at time of order - for future pricing analysis), createdAt (timestamp), updatedAt (timestamp).
    -   **Relationships:**
        -   Establish foreign key relationships:
            -   supplierId in PurchaseOrders table referencing supplierId in Suppliers table.
            -   purchaseOrderId in PurchaseOrderItems table referencing purchaseOrderId in PurchaseOrders table.
            -   itemId in PurchaseOrderItems table referencing itemId in InventoryItems table.
-   **User Feedback & Notifications:**
    -   **Success Message:** Display a success message (e.g., "Purchase order recorded successfully") upon successful creation of a purchase order.
    -   **Error Alerts:** Display clear and informative error messages if purchase order recording fails due to validation errors or other issues (e.g., "Supplier is required", "Invalid item quantity", "Failed to record purchase order. Please try again.").
    -   **Purchase Orders List Update:** Update the purchase orders list view in real-time after adding, editing, or deleting purchase orders to reflect the changes immediately.
    -   **Order Summary/Preview (Optional):** Consider displaying an order summary or preview before final submission, allowing users to review all order details before saving.
-   **Dependencies & Considerations:**
    -   **Integration Points & Backend Dependencies:**
        -   **Supplier Management Module (US-VSIM-021):** Essential dependency to retrieve and validate supplier information. Ensure seamless integration with Supplier Management Service to access the list of managed suppliers.
        -   **Inventory Module (US-VSIM-001):** Dependency to retrieve and validate inventory item information. Integrate with Inventory Service to access the list of inventory items for item selection in purchase orders.
        -   **Order Processing Module:** (Potentially) Central module for handling order-related operations. The Purchase Order recording logic should be implemented within or integrated with the Order Processing Module for consistency and maintainability.
        -   **Stock Receiving Module (US-VSIM-004):** (Future Integration) Consider future integration with the Stock Receiving module to automate or streamline the stock receiving process when purchase orders are delivered. Potentially, updating purchase order status to "Received" could trigger stock receipt recording or pre-populate stock receipt forms with purchase order details.
    -   **Other Considerations:**
        -   **Security:** Implement proper access controls for purchase order creation and management functions, restricting access to authorized personnel.
        -   **Data Integrity:** Ensure data integrity by implementing robust validation rules and database constraints to prevent invalid purchase orders from being recorded (e.g., mandatory fields, valid supplier and item IDs, positive quantities). Use database transactions to ensure atomicity of purchase order creation operations.
        -   **Performance:** Optimize database operations for purchase order recording and retrieval, especially when dealing with large purchase orders with many items or a high volume of purchase orders. Use database indexing on relevant columns (e.g., supplierId, orderDate, purchaseOrderId) to improve query performance.
        -   **Purchase Order Status Tracking (Future Enhancement):** Consider adding a "Status" field to the PurchaseOrders table to track the status of purchase orders throughout their lifecycle (e.g., "Pending Approval," "Ordered," "Shipped," "Received," "Cancelled"). Implement workflow logic to manage and update purchase order statuses.
        -   **Reporting and Analytics (Future Enhancement):** In future iterations, consider adding reporting and analytics features related to purchase orders, such as reports on purchase order history, pending orders, order fulfillment times, supplier performance analysis based on order history, etc.

## **US-VSIM-023: Track Supplier Invoices**

-   **Title:** Track Supplier Invoices
-   **As a:** Store Owner
-   **I want to:** track supplier invoices
-   **So that:** I can manage payments and outstanding balances.
-   **Description:** The system should let me record and view supplier invoices, linking them to purchase orders if applicable.
-   **Acceptance Criteria:**
    -   Given I am logged in as a Store Owner,
    -   When I navigate to the "Suppliers" section and select a supplier,
    -   Then I should be able to add an invoice with number, date, amount, and optional purchase order link.
    -   And I should see a list of invoices for the supplier with status (paid or outstanding).

### **Implementation Framework:**

-   **UI Elements:**
    -   **Suppliers Section:** Navigation link/button to the "Suppliers" section in the main application menu.
    -   **Supplier Detail View (US-VSIM-021):**
        -   Access from Suppliers List: When viewing details of a specific supplier from the Suppliers List (US-VSIM-021), enhance the Supplier Detail View to include a section for managing invoices.
        -   Invoices List: Within the Supplier Detail View, display a list or summary of invoices recorded for the selected supplier.
        -   "Add Invoice" Button: Button labeled "Add Invoice" or "New Invoice" to initiate the process of recording a new supplier invoice.
    -   **Supplier Invoice Form (Modal/Page):**
        -   Display-only field: "Supplier Name" (pre-filled with the selected supplier's name).
        -   Text Input: "Invoice Number" (Text input, mandatory, with validation for uniqueness per supplier to prevent duplicate invoice entries for the same supplier).
        -   Date Picker: "Invoice Date" (Date picker, mandatory, defaults to current date).
        -   Number Input: "Invoice Amount" (Number input, mandatory, validation for positive value).
        -   Purchase Order Link (Optional):
            -   Dropdown or searchable select: Provide an optional dropdown list or searchable select field to link the invoice to a corresponding Purchase Order (US-VSIM-022). Populate this list with purchase orders placed with the selected supplier that are currently open or pending invoicing.
        -   Notes/Comments (Optional): Text area for adding optional notes or comments related to the invoice.
        -   "Save Invoice" Button: To record and save the supplier invoice.
        -   "Cancel" Button: To discard the invoice recording and close the form.
    -   **Supplier Invoices List (Within Supplier Detail View):**
        -   Display a list or table of invoices recorded for the selected supplier.
        -   Columns: "Invoice Number" (sortable, linked to invoice detail view - future enhancement), "Invoice Date" (sortable), "Amount" (sortable), "Payment Status" (e.g., "Outstanding," "Paid," "Partially Paid," status indicator), "Purchase Order (Link, Optional)."
        -   Sorting and Filtering: Allow sorting and filtering of the invoice list by relevant criteria (e.g., invoice number, invoice date, amount, payment status).
-   **Backend Architecture & Logic:**
    -   **API Endpoint:** POST /api/suppliers/{supplierId}/invoices to record a new supplier invoice, where {supplierId} is the ID of the supplier. - Request Body (JSON):
        `{
  "invoiceNumber": string, // Invoice number from the supplier
  "invoiceDate": date, // Date of the invoice
  "totalAmount": number, // Total amount due on the invoice
  "purchaseOrderId": number (optional), // ID of the linked purchase order (optional)
  "notes": string (optional) // Optional notes or comments related to the invoice
}`
    -   **Business Logic:**
        -   **Validation:**
            -   Validate supplier ID: Ensure that the supplierId in the API request is valid and corresponds to an existing supplier in the Suppliers table (US-VSIM-021).
            -   Validate invoice data: Validate that mandatory fields like "Invoice Number," "Invoice Date," and "Total Amount" are provided. Ensure that the invoice amount is a positive numerical value. Validate that the invoice number is unique for the given supplier to prevent duplicate invoice entries.
            -   Validate Purchase Order Link (Optional): If a purchaseOrderId is provided, validate that it is a valid Purchase Order ID and that it belongs to the selected supplier.
        -   **Record Supplier Invoice:**
            -   Database operation: Insert a new record into the SupplierInvoices table to store the invoice details, including supplierId, invoiceNumber, invoiceDate, totalAmount, purchaseOrderId (if linked), and notes.
        -   **Update Purchase Order Status (Optional, Future Enhancement):**
            -   If the invoice is linked to a purchase order, consider updating the status of the purchase order in the PurchaseOrders table to reflect that an invoice has been received (e.g., update status to "Invoiced," "Partially Invoiced," or similar).
    -   **Shared Components:**
        -   **Supplier Management Service:** Essential for validating supplier selection and managing supplier-related data. Reused from US-VSIM-021 and US-VSIM-022.
        -   **Authentication & Authorization Module:** Ensures that only authorized users (e.g., accounting staff, purchasing managers, store owners) can record supplier invoices, protecting financial data from unauthorized modification.
        -   **Validation Module:** Reused from previous user stories to validate input data, ensuring data integrity and consistency (e.g., validating supplier ID, invoice number format, date formats, amounts).
        -   **Order Processing Module:** (Potentially) Shared module for handling order and invoice related operations. The Supplier Invoice recording logic can be integrated with the Order Processing Module.
    -   **Error Handling:**
        -   Return 404 Not Found if the supplier with the given supplierId is not found.
        -   Return 400 Bad Request for validation failures, such as:
            -   "Supplier is required" if no supplier is selected.
            -   "Invalid Supplier ID" if the provided supplierId is not valid.
            -   "Invoice number, date, and amount are required" if mandatory fields are missing.
            -   "Invalid invoice amount. Amount must be a positive number." if the invoice amount is invalid.
            -   "Invoice number already exists for this supplier. Invoice numbers must be unique per supplier." if a duplicate invoice number is detected for the same supplier.
            -   "Invalid Purchase Order ID" if the provided purchaseOrderId is not valid or does not belong to the selected supplier.
        -   Return 500 Internal Server Error for any unexpected server-side errors during invoice recording.
        -   Use standardized error responses for consistent error reporting.
    -   **Logic Flow (Record New Supplier Invoice):**
        1. Receive POST request to /api/suppliers/{supplierId}/invoices with invoice details.
        2. Authenticate and authorize the user.
        3. Validate input data: supplier selection, invoice number, date, amount, and optional purchase order link using Validation Module and Supplier Management Service.
        4. Check if the supplier with supplierId exists using Supplier Management Service. Return 404 if not found.
        5. Validate invoice number uniqueness for the given supplier using Supplier Management Service. Return 400 if duplicate invoice number is found.
        6. If validation passes and supplier exists, insert a new invoice record into the SupplierInvoices table using Supplier Management Service, including invoice details and optional purchase order link.
        7. (Optionally, Future Enhancement) Update the status of the linked purchase order in the PurchaseOrders table to "Invoiced" or similar.
        8. Return a success response (e.g., 201 Created) with the new invoice ID.
    -   **Logic Flow (View Supplier Invoices List):**
        1. When viewing Supplier Detail (US-VSIM-021), the UI should call an API endpoint to retrieve the list of invoices for the selected supplier.
        2. Backend retrieves invoice records from the SupplierInvoices table, filtered by supplierId, using Supplier Management Service.
        3. Format the invoice data for display in the UI, including invoice number, date, amount, payment status, and optional link to purchase order.
        4. Return a success response (e.g., 200 OK) with the list of invoices (in JSON format).
-   **Data Model Impact:**
    -   **Supplier Invoices Table (SupplierInvoices):**
        -   Create a new table to store supplier invoice information.
        -   Columns: invoiceId (PK, auto-generated), supplierId (FK referencing Suppliers, mandatory), invoiceNumber (string, mandatory, unique index per supplier recommended), invoiceDate (date, mandatory), totalAmount (decimal, mandatory), purchaseOrderId (FK referencing PurchaseOrders, optional, nullable), notes (string, optional), createdAt (timestamp), updatedAt (timestamp), invoiceStatus (string, e.g., "Outstanding", "Paid", "Partially Paid", optional, for future status tracking).
    -   **Relationships:**
        -   Establish foreign key relationships:
            -   supplierId in SupplierInvoices table referencing supplierId in Suppliers table.
            -   purchaseOrderId in SupplierInvoices table referencing purchaseOrderId in PurchaseOrders table (optional relationship).
-   **User Feedback & Notifications:**
    -   **Success Message:** Display a success message (e.g., "Supplier invoice recorded successfully") upon successful creation of a supplier invoice.
    -   **Error Alerts:** Display clear and informative error messages if invoice recording fails due to validation errors or other issues (e.g., "Supplier is required", "Invoice number and amount are invalid", "Invoice number already exists for this supplier", "Failed to record invoice. Please try again.").
    -   **Invoice List Update:** Update the invoice list view in the Supplier Detail View in real-time after adding, editing, or deleting invoices to reflect the changes immediately.
    -   **Confirmation Dialogs:** (Optional) Consider adding confirmation dialogs before saving invoices, especially for large invoice amounts, to ensure user intent and prevent accidental entries.
-   **Dependencies & Considerations:**
    -   **Integration Points & Backend Dependencies:**
        -   **Supplier Management Module (US-VSIM-021):** Essential dependency to retrieve and validate supplier information. Ensure seamless integration with Supplier Management Service to access the list of managed suppliers.
        -   **Purchase Order Module (US-VSIM-022):** Optional dependency for linking invoices to purchase orders. If purchase order linking is implemented, integrate with Purchase Order Module to allow users to select from existing purchase orders for the selected supplier.
        -   **Supplier Payments Module (US-VSIM-019):** Supplier Invoice tracking is crucial for managing supplier payments and calculating outstanding balances. Ensure that the Supplier Payments module can access and utilize invoice data to track payment statuses and link payments to invoices.
    -   **Other Considerations:**
        -   **Security:** Implement proper access controls for supplier invoice recording and management functions, restricting access to authorized personnel who are responsible for accounts payable and financial record-keeping.
        -   **Data Integrity:** Enforce data integrity rules, such as preventing duplicate invoice numbers for the same supplier, ensuring mandatory fields are filled, and validating data formats. Use database constraints and validation logic to maintain data accuracy and consistency.
        -   **Performance:** Optimize database operations for invoice recording and retrieval, especially when dealing with a large volume of invoices. Use database indexing on relevant columns (e.g., supplierId, invoiceNumber, invoiceDate) to improve query performance for invoice lists and reports.
        -   **Invoice Status Tracking (Future Enhancement):** Consider adding a "Status" field to the SupplierInvoices table to track the payment status of invoices (e.g., "Outstanding," "Paid," "Partially Paid"). Implement logic to automatically update invoice statuses based on recorded payments (US-VSIM-019) and payment allocations.
        -   **Invoice Document Attachment (Future Enhancement):** Explore the possibility of allowing users to attach digital copies of supplier invoice documents (e.g., PDF scans, image files) to the invoice records for better record-keeping and easier access to original invoice documents.

## **US-VSIM-024: View Purchase History per Supplier**

-   **Title:** View Purchase History per Supplier
-   **As a:** Store Owner
-   **I want to:** view the purchase history for each supplier
-   **So that:** I can review past transactions.
-   **Description:** The system should display all purchase orders and invoices for a selected supplier.
-   **Acceptance Criteria:**
    -   Given I am logged in as a Store Owner,
    -   When I navigate to the "Suppliers" section and select a supplier,
    -   Then I should see a list of purchase orders (date, items, quantities, status) and invoices (number, date, amount, status) associated with that supplier.

### **Implementation Framework:**

-   **UI Elements:**
    -   **Suppliers Section:** Navigation link/button to the "Suppliers" section in the main application menu.
    -   **Supplier Detail View (US-VSIM-021):**
        -   Access from Suppliers List: When viewing details of a specific supplier from the Suppliers List (US-VSIM-021), enhance the Supplier Detail View to include a "Purchase History" section.
    -   **Purchase History Section (in Supplier Detail View):**
        -   Tabbed View (Recommended): Implement a tabbed interface within the Purchase History section to separate Purchase Orders and Invoices for better organization and clarity. Tabs could be labeled "Purchase Orders" and "Invoices."
        -   **Purchase Orders Tab:**
            -   Purchase Orders List: Display a list or table of purchase orders associated with the selected supplier.
            -   Columns: "Purchase Order ID," "Order Date," "Expected Delivery Date," "Number of Items," "Status (Optional)," "Total Value (Optional)," "View Order Details" (link/button).
        -   **Invoices Tab:**
            -   Invoices List: Display a list or table of invoices associated with the selected supplier.
            -   Columns: "Invoice Number," "Invoice Date," "Amount," "Payment Status," "Purchase Order (Link, Optional)," "View Invoice Details" (link/button).
        -   **"View Order Details" and "View Invoice Details" Links/Buttons:** Provide actions (links or buttons) to allow users to view detailed information for individual purchase orders and invoices. These actions would navigate to dedicated Purchase Order Detail and Invoice Detail views (future enhancements, not explicitly defined in user stories yet).
    -   **Filtering and Sorting (Optional, Future Enhancement):**
        -   Consider adding filtering and sorting options within the Purchase History section to allow users to filter purchase orders and invoices by date range, status, order/invoice number, or other relevant criteria.
-   **Backend Architecture & Logic:**
    -   **API Endpoint:** GET /api/suppliers/{supplierId}/purchase-history to retrieve the purchase history for a specific supplier, where {supplierId} is the ID of the supplier. - Response Format: The API should return a JSON response containing two lists: one for purchase orders and one for invoices, both associated with the specified supplier.
        `{
  "purchaseOrders": [
    { 
      "purchaseOrderId": number, 
      "orderDate": date, 
      "expectedDeliveryDate": date, 
      "numberOfItems": number, 
      "status": string (optional), 
      "totalValue": number (optional) 
    },
    // ... more purchase order objects
  ],
  "invoices": [
    { 
      "invoiceId": number, 
      "invoiceNumber": string, 
      "invoiceDate": date, 
      "amount": number, 
      "paymentStatus": string, 
      "purchaseOrderId": number (optional) 
    },
    // ... more invoice objects
  ]
}`
    -   **Business Logic:**
        -   **Data Retrieval:**
            -   Retrieve Purchase Orders: Query the PurchaseOrders table to fetch all purchase orders associated with the given supplierId. For each purchase order, retrieve relevant details such as order date, expected delivery date, number of items, status (if status tracking is implemented), and total value (if calculation is implemented).
            -   Retrieve Supplier Invoices: Query the SupplierInvoices table to fetch all invoices associated with the given supplierId. For each invoice, retrieve relevant details such as invoice number, invoice date, amount, payment status, and linked purchase order ID (if applicable).
        -   **Data Aggregation and Formatting:**
            -   Aggregate and format the retrieved purchase order and invoice data into separate lists for easy display in the UI.
            -   Sort purchase orders and invoices by date (e.g., newest first) or other relevant criteria.
    -   **Shared Components:**
        -   **Supplier Management Service:** Central service for managing supplier-related data, including retrieving purchase history. Extend the SupplierManagementService (from US-VSIM-021, US-VSIM-022, US-VSIM-023, US-VSIM-019) to include purchase history retrieval logic.
        -   **Authentication & Authorization Module:** Ensures that access to supplier purchase history data is restricted to authorized users (e.g., purchasing managers, inventory managers, accountants, store owners).
        -   **Data Aggregation Module:** Reusable module for aggregating data from multiple tables and formatting it for display in reports or lists.
    -   **Error Handling:**
        -   Return 404 Not Found if the supplier with the given supplierId is not found.
        -   Return 200 OK with empty lists for purchase orders and invoices if no purchase history is found for the supplier.
        -   Return 500 Internal Server Error for any unexpected server-side errors during data retrieval.
        -   Use standardized error responses for consistent error reporting.
    -   **Logic Flow (View Purchase History per Supplier):**
        1. Receive GET request to /api/suppliers/{supplierId}/purchase-history to retrieve purchase history for a specific supplier.
        2. Authenticate and authorize the user.
        3. Check if the supplier with supplierId exists using Supplier Management Service. Return 404 if not found.
        4. Retrieve purchase orders associated with the supplierId from the PurchaseOrders table using Supplier Management Service and Data Aggregation Module.
        5. Retrieve supplier invoices associated with the supplierId from the SupplierInvoices table using Supplier Management Service and Data Aggregation Module.
        6. Format the retrieved purchase order and invoice data into separate lists for display in the UI.
        7. Return a success response (e.g., 200 OK) with the purchase history data, including lists of purchase orders and invoices (in JSON format).
        8. If no purchase history records are found, return 200 OK with empty lists for purchase orders and invoices and a message indicating no records found.
-   **Data Model Impact:**
    -   **Suppliers Table (Suppliers):** Used to identify the supplier for whom purchase history is being retrieved.
    -   **Purchase Orders Table (PurchaseOrders):** Source of data for displaying purchase order history. Retrieve relevant fields like purchaseOrderId, orderDate, expectedDeliveryDate, orderStatus (if available).
    -   **Purchase Order Items Table (PurchaseOrderItems):** (Optionally) Can be joined to PurchaseOrders to retrieve a summary of items in each order, if needed for display in the purchase history list (e.g., "Number of Items").
    -   **Supplier Invoices Table (SupplierInvoices):** Source of data for displaying invoice history. Retrieve relevant fields like invoiceId, invoiceNumber, invoiceDate, totalAmount, invoiceStatus (if available), purchaseOrderId (optional link).
    -   **Relationships:** Leverage existing foreign key relationships between Suppliers, PurchaseOrders, and SupplierInvoices tables to efficiently retrieve related data.
-   **User Feedback & Notifications:**
    -   **Purchase History Display:** Display the purchase history in a clear and organized manner within the Supplier Detail View, using tabs to separate Purchase Orders and Invoices. Present purchase orders and invoices in separate lists or tables with the columns as defined in the UI Elements section.
    -   **"View Details" Actions:** Ensure that "View Order Details" and "View Invoice Details" links/buttons are functional and clearly indicate that clicking them will navigate to detailed views of individual purchase orders and invoices (future enhancements).
    -   **Sorting and Filtering (Future Enhancement):** If filtering and sorting are implemented, ensure that filter options are user-friendly and allow users to easily filter purchase history by relevant criteria.
    -   **Empty State Message:** Display a user-friendly message (e.g., "No purchase orders recorded for this supplier", "No invoices found for this supplier", or "No purchase history available for this supplier") if no purchase orders or invoices are found for the selected supplier.
    -   **Loading Indicator:** Show a loading indicator while purchase history data is being retrieved from the backend, especially when dealing with suppliers with extensive transaction histories.
    -   **Error Alerts:** Display user-friendly error alerts if there are issues retrieving purchase history data, informing the user about the problem and suggesting possible actions (e.g., "Failed to load purchase history. Please try again later.").
-   **Dependencies & Considerations:**
    -   **Integration Points & Backend Dependencies:**
        -   **Supplier Management Module (US-VSIM-021):** Essential dependency to retrieve supplier information and to access the Supplier Detail View where purchase history is displayed.
        -   **Purchase Order Module (US-VSIM-022) & Supplier Invoice Module (US-VSIM-023):** Depend on Purchase Order and Supplier Invoice modules as data sources for displaying purchase order and invoice history. Ensure seamless integration with these modules to retrieve and display relevant data.
        -   **Data Aggregation Service:** (Internal component) Used for efficiently aggregating purchase order and invoice data and formatting it for display in the UI.
    -   **Other Considerations:**
        -   **Performance:** Optimize database queries for retrieving purchase history data, especially when retrieving data for suppliers with a large number of purchase orders and invoices. Use database indexing on relevant columns (e.g., supplierId, orderDate, invoiceDate, purchaseOrderId, invoiceId) to improve query performance. Consider using efficient data retrieval techniques and pagination if necessary.
        -   **Security:** Ensure that access to supplier purchase history data is properly secured and restricted to authorized users only. Implement appropriate authentication and authorization mechanisms to protect sensitive supplier transaction information.
        -   **Scalability:** Design the purchase history view and backend data retrieval logic to handle potentially large datasets of purchase orders and invoices as the store grows over time. Efficient data retrieval, pagination, and potentially data streaming techniques may be necessary for very large datasets.
        -   **Future Enhancements:** Consider future enhancements such as:
            -   Adding filtering and sorting options to the purchase history view.
            -   Implementing detailed views for individual purchase orders and invoices, accessible from the purchase history list.
            -   Adding summary metrics or charts to visualize purchase history trends over time.
            -   Allowing export of purchase history data to CSV or PDF formats.

# Dashboard

## **US-VSIM-026: View Dashboard with Key Metrics**

-   **Title:** View Dashboard with Key Metrics
-   **As a:** Store Owner
-   **I want to:** view a dashboard with key business metrics
-   **So that:** I can quickly assess the status of my store.
-   **Description:** The dashboard should feature interactive widgets for metrics like sales, low stock, profit/loss, and supplier payments, clickable for details.
-   **Acceptance Criteria:**
    -   Given I am logged in as a Store Owner,
    -   When I navigate to the "Dashboard,"
    -   Then I should see widgets for "Total Sales (Today)," "Low Stock Items," "Profit/Loss (This Month)," and "Upcoming Supplier Payments."
    -   And clicking a widget (e.g., "Low Stock Items") should navigate to the relevant detailed section (Inventory -> Low Stock Items list).

### **Implementation Framework:**

-   **UI Elements:**
    -   **Dashboard Navigation:** Prominent navigation link/button labeled "Dashboard" in the main application menu, easily accessible after login.
    -   **Dashboard Page:** Create a dedicated page to serve as the central dashboard for the application.
    -   **Interactive Widgets:** Design interactive widgets to display key business metrics. Each widget should be visually appealing, informative, and interactive. Consider using cards or panels to organize widgets on the dashboard.
        -   **"Total Sales (Today)" Widget:**
            -   Metric Display: Display the total sales revenue generated for the current day. Use clear and large font size for the numerical value and appropriate currency formatting (US-VSIM-029).
            -   Label: Clearly label the widget as "Total Sales (Today)" or similar.
            -   Clickable/Interactive: Make the widget clickable. Clicking on this widget should navigate the user to the Sales History page (US-VSIM-009), pre-filtered to show sales transactions for the current day, allowing for detailed review of today's sales.
        -   **"Low Stock Items" Widget:**
            -   Metric Display: Display the number of inventory items that are currently below their reorder points (US-VSIM-006). Use a numerical count or a concise visual representation (e.g., a progress bar indicating percentage of low stock items).
            -   Label: Clearly label the widget as "Low Stock Items" or "Items Needing Reorder."
            -   Clickable/Interactive: Make the widget clickable. Clicking should navigate the user to the Inventory List View (US-VSIM-001), pre-filtered or highlighted to show only items that are currently below their reorder points, facilitating quick identification and restocking actions.
        -   **"Profit/Loss (This Month)" Widget:**
            -   Metric Display: Display the calculated Profit or Loss for the current month (US-VSIM-017). Use clear formatting to indicate whether it's a profit or a loss (e.g., green for profit, red for loss, +/- signs). Use appropriate currency formatting.
            -   Label: Clearly label the widget as "Profit/Loss (This Month)" or "Monthly Profitability."
            -   Clickable/Interactive: Make the widget clickable. Clicking should navigate the user to the Profit & Loss Statement page (US-VSIM-017), pre-filtered to show the Profit & Loss statement for the current month, allowing for detailed financial performance review.
        -   **"Upcoming Supplier Payments" Widget:**
            -   Metric Display: Display a summary of upcoming supplier payments that are due soon. This could be:
                -   Total Amount Due Soon: Display the total amount of payments due to suppliers within a defined upcoming period (e.g., next 7 days, next 30 days).
                -   Number of Payments Due Soon: Display the count of supplier payments due soon.
                -   List of Suppliers with Payments Due (Optional, if space allows): Display a concise list of suppliers with upcoming payments, potentially showing supplier name and amount due for each.
            -   Label: Clearly label the widget as "Upcoming Supplier Payments" or "Payments Due Soon."
            -   Clickable/Interactive: Make the widget clickable. Clicking should navigate the user to a Supplier Payments overview page (future enhancement, not explicitly defined yet) or to the Suppliers List (US-VSIM-021) potentially filtered to show suppliers with upcoming payments.
    -   **Interactive Elements:**
        -   Clickable Widgets: Ensure that all dashboard widgets are interactive and clickable, navigating users to relevant detailed views for further analysis and action.
        -   Real-time Data Updates (Optional): Consider implementing real-time data updates for dashboard widgets to reflect the most current business metrics. This could be achieved using techniques like polling, web sockets, or server-sent events.
    -   **Customization Option (US-VSIM-027):**
        -   "Customize Dashboard" Button: Include a button or link (e.g., "Customize Dashboard," "Edit Dashboard") to allow users to customize the dashboard layout and widget selection (as defined in US-VSIM-027).
-   **Backend Architecture & Logic:**
    -   **API Endpoint:** GET /api/dashboard to retrieve data for all dashboard widgets. - Response Format: The API should return a JSON response containing data for each dashboard widget.
        `{
  "totalSalesToday": { "value": number, "currency": string },
  "lowStockItemsCount": { "value": number },
  "profitLossThisMonth": { "value": number, "currency": string, "type": "profit" | "loss" },
  "upcomingSupplierPaymentsSummary": { "totalAmountDue": number, "currency": string, "paymentCount": number } 
}`
    -   **Backend Service:** Create a new DashboardService to handle data retrieval and aggregation for the dashboard widgets. This service will be responsible for fetching data from various modules and preparing it for display on the dashboard.
        -   Methods in DashboardService:
            -   getTotalSalesToday(): Retrieves and calculates total sales for the current day.
            -   getLowStockItemsCount(): Retrieves and counts inventory items below reorder point.
            -   getProfitLossThisMonth(): Calculates Profit/Loss for the current month (reusing ProfitLossCalculationService from US-VSIM-017).
            -   getUpcomingSupplierPaymentsSummary(): Retrieves and summarizes upcoming supplier payments.
    -   **Business Logic:**
        -   **Data Aggregation for Widgets:** Implement specific logic within the DashboardService to retrieve and aggregate data for each dashboard widget from relevant modules:
            -   Total Sales (Today): Query the SalesTransactions table to sum up totalAmount for sales transactions with saleDate equal to today's date.
            -   Low Stock Items Count: Query the InventoryItems table to count items where stockQuantity is less than or equal to reorderPoint.
            -   Profit/Loss (This Month): Reuse the ProfitLossCalculationService (US-VSIM-017) to calculate profit and loss for the current month.
            -   Upcoming Supplier Payments: Query the SupplierInvoices table to identify invoices due within a defined upcoming period (e.g., invoices with due dates within the next 7 or 30 days) and calculate the total amount due and count of payments. The definition of "upcoming" and the criteria for identifying "due soon" payments should be configurable or based on business rules.
        -   **Data Formatting:** Format the aggregated data for each widget for clear and concise display on the dashboard, including appropriate currency formatting, number formatting, and visual cues (e.g., profit/loss indicators).
    -   **Shared Components:**
        -   **Dashboard Service:** Central service dedicated to managing and providing data for the application dashboard. This service acts as an aggregator, fetching data from various modules and preparing it for dashboard display.
        -   **Sales Service:** Reused from US-VSIM-008, US-VSIM-009, US-VSIM-010, US-VSIM-011, US-VSIM-013, US-VSIM-015 for retrieving sales transaction data for the "Total Sales (Today)" widget.
        -   **Inventory Service:** Reused from US-VSIM-001, US-VSIM-002, US-VSIM-003, US-VSIM-004, US-VSIM-005, US-VSIM-006, US-VSIM-007 for retrieving inventory item data and low stock item counts for the "Low Stock Items" widget.
        -   **Financial Service:** Reused from US-VSIM-015, US-VSIM-016, US-VSIM-017, US-VSIM-018, US-VSIM-019 for calculating Profit/Loss and potentially for summarizing supplier payment data.
        -   **Supplier Management Service:** Reused from US-VSIM-021, US-VSIM-022, US-VSIM-023, US-VSIM-024, US-VSIM-019 for retrieving supplier invoice and payment data for the "Upcoming Supplier Payments" widget.
        -   **Calculation Service:** Reused for performing various calculations required for dashboard metrics, such as summing sales, calculating profit and loss, and potentially for summarizing payment amounts.
        -   **Authentication & Authorization Module:** Ensures that access to the dashboard and display of key business metrics is restricted to authorized users (e.g., store owners, managers).
        -   **Cache Service:** (Optional but highly recommended) Implement a caching mechanism to cache dashboard data, especially for metrics that are not frequently updated (e.g., daily sales, monthly profit/loss). Caching can significantly improve dashboard loading performance and reduce database load, especially for frequently accessed dashboards.
    -   **Error Handling:**
        -   Return 200 OK with default or placeholder values for widgets if data retrieval for any widget fails temporarily. The dashboard should be designed to handle partial data availability gracefully.
        -   Display error indicators or messages within individual widgets if data retrieval fails for that specific widget, informing the user that data is temporarily unavailable or could not be loaded.
        -   Implement robust error handling within the DashboardService to catch exceptions, log errors, and provide informative error responses without crashing the entire dashboard.
        -   Use standardized error responses for consistent error reporting.
    -   **Logic Flow (Retrieve Dashboard Data):**
        1. Receive GET request to /api/dashboard to retrieve data for the dashboard.
        2. Authenticate and authorize the user.
        3. For each dashboard widget:
            - Call the corresponding method in the DashboardService (e.g., getTotalSalesToday(), getLowStockItemsCount(), getProfitLossThisMonth(), getUpcomingSupplierPaymentsSummary()) to retrieve the data for that widget.
            - Implement error handling within each widget data retrieval method to gracefully handle potential data retrieval failures and return default or placeholder values if necessary.
        4. Aggregate the data retrieved for all widgets into a JSON response.
        5. Return a success response (e.g., 200 OK) with the dashboard data in JSON format.
        6. Implement caching:
            - Consider caching the aggregated dashboard data in the DashboardService or a dedicated Cache Service for a short duration (e.g., 5-15 minutes) to improve dashboard loading performance.
            - Implement cache invalidation logic to refresh the cached data when underlying data changes (e.g., after a new sale is recorded, at the end of the day for "Total Sales (Today)" widget, at the end of the month for "Profit/Loss (This Month)" widget).
-   **Data Model Impact:**
    -   **Sales Transactions Table (SalesTransactions):** Source of data for "Total Sales (Today)" widget. Reuses data from US-VSIM-015.
    -   **Inventory Items Table (InventoryItems):** Source of data for "Low Stock Items" widget. Reuses data from US-VSIM-006 and US-VSIM-007.
    -   **Expenses Table (Expenses):** Source of data (along with SalesTransactions) for "Profit/Loss (This Month)" widget. Reuses data from US-VSIM-017.
    -   **Supplier Invoices Table (SupplierInvoices):** Source of data for "Upcoming Supplier Payments" widget. Reuses data from US-VSIM-019 and US-VSIM-023.
    -   **Optional Dashboard Cache Table:** Consider implementing a cache table (e.g., DashboardCache) to store pre-calculated dashboard metrics for performance optimization. The cache table could store aggregated data for each widget along with a timestamp for cache invalidation.
-   **User Feedback & Notifications:**
    -   **Dashboard Display:** Display the dashboard with all key metrics widgets prominently on a dedicated page, providing a clear and concise overview of the store's current status.
    -   **Interactive Widgets:** Ensure that all dashboard widgets are interactive and clickable, navigating users to detailed views for further exploration of the data behind each metric.
    -   **Real-time Data Updates (Optional):** If real-time data updates are implemented, ensure that the dashboard widgets update dynamically to reflect the latest business data without requiring full page reloads, providing a live view of key metrics.
    -   **Loading Indicators:** Show loading indicators or progress spinners while dashboard data is being retrieved and widgets are loading, especially on initial dashboard load or when refreshing data.
    -   **Error Handling and Fallback:** Design the dashboard to handle potential data retrieval failures gracefully. If data for a widget cannot be loaded, display a user-friendly message within the widget (e.g., "Data temporarily unavailable", "Failed to load data") instead of breaking the entire dashboard. Provide options to retry loading data for individual widgets or the entire dashboard.
-   **Dependencies & Considerations:**
    -   **Integration Points & Backend Dependencies:**
        -   **Sales Module, Inventory Module, Financial Module, Supplier Management Module:** The Dashboard Service and widgets are heavily dependent on these core modules as data sources. Ensure seamless integration with these services to retrieve accurate and up-to-date data for dashboard metrics.
        -   **Calculation Service:** Used by the Dashboard Service for performing calculations required for dashboard metrics, such as summarizing sales, counting low stock items, calculating profit/loss, and summarizing payment amounts.
        -   **Cache Service:** (Optional, but highly recommended) A Cache Service can significantly improve dashboard performance and responsiveness.
        -   **Authentication Module:** Secure access to the dashboard and restrict viewing of key business metrics to authorized users.
    -   **Other Considerations:**
        -   **Performance:** Optimize data retrieval and aggregation logic within the DashboardService and database queries to ensure fast dashboard loading times. Implement caching strategies to minimize database load and improve responsiveness. Consider asynchronous data loading to prevent the dashboard from being blocked while data is being fetched.
        -   **Scalability:** Design the dashboard architecture to handle increasing data volumes and user load as the store grows. Efficient data aggregation, caching, and potentially horizontal scaling of the Dashboard Service may be necessary for large-scale deployments.
        -   **Customization (US-VSIM-027):** Ensure that the dashboard design is flexible and allows for customization of widgets and layout as defined in US-VSIM-027. The Dashboard Service should be designed to support dynamic widget selection and layout configuration based on user preferences.
        -   **Data Refresh Frequency:** Define the appropriate data refresh frequency for each dashboard widget based on the nature of the metric and the business needs. Some metrics (e.g., "Total Sales (Today)") may require more frequent updates than others (e.g., "Profit/Loss (This Month)"). Configure refresh intervals and consider allowing users to manually refresh dashboard data on demand.
        -   **Responsiveness and Mobile-Friendliness:** Design the dashboard to be responsive and mobile-friendly, ensuring that it is accessible and provides a good user experience across different devices (desktops, tablets, smartphones).

## **US-VSIM-027: Customize Dashboard Widgets**

-   **Title:** Customize Dashboard Widgets
-   **As a:** Store Owner
-   **I want to:** customize dashboard widgets
-   **So that:** I can display the most relevant information for my needs.
-   **Description:** The system should allow choosing and arranging dashboard widgets for a personalized view.
-   **Acceptance Criteria:**
    -   Given I am logged in as a Store Owner,
    -   When I navigate to the "Dashboard" and select "Customize,"
    -   Then I should be able to select widgets to display (e.g., "Total Sales," "Low Stock Items") from a list of available widgets and arrange their order via drag and drop or similar interface.
    -   And the dashboard should update to reflect my preferences, and these preferences should persist across sessions.

### **Implementation Framework:**

-   **UI Elements:**
    -   **Dashboard Page (US-VSIM-026):** Enhance the Dashboard page (US-VSIM-026) to include customization features.
    -   **"Customize Dashboard" Button/Link:** Add a button or link (e.g., "Customize Dashboard," "Edit Dashboard," "Add Widgets") on the Dashboard page to allow users to enter customization mode. This button should be clearly visible and easily accessible.
    -   **Dashboard Customization Mode:** When the "Customize Dashboard" button is activated, the dashboard should enter customization mode. In this mode:
        -   **Widget Selection Panel/Sidebar:** Display a panel or sidebar listing available dashboard widgets. This list should include all pre-defined widgets that can be added to the dashboard (e.g., "Total Sales," "Low Stock Items," "Profit & Loss," "Upcoming Supplier Payments," and potentially future widgets).
        -   **Widget Display Area:** The main dashboard area should become interactive, allowing users to:
            -   **Add Widgets:** Allow users to add new widgets to the dashboard by dragging and dropping widgets from the widget selection panel onto the dashboard area or by clicking an "Add" button next to each widget in the panel.
            -   **Remove Widgets:** Provide a clear way to remove existing widgets from the dashboard. This could be implemented using a "Remove" button/icon on each widget in customization mode.
            -   **Rearrange Widgets:** Enable users to rearrange the order and layout of widgets on the dashboard. Implement a drag-and-drop interface to allow users to easily drag and drop widgets to different positions on the dashboard.
        -   **Visual Cues for Customization:** Provide visual cues to indicate that the dashboard is in customization mode and that widgets can be manipulated (e.g., highlighting widgets, adding drag handles, using a different background color for the dashboard area).
        -   **"Save Layout" Button:** Button labeled "Save Layout," "Save Changes," or "Done Customizing" to save the customized dashboard layout and exit customization mode.
        -   **"Cancel Customization" Button/Link:** Button or link labeled "Cancel," "Discard Changes," or "Revert to Default" to discard any changes made during customization and revert the dashboard to its last saved layout or default layout.
        -   **Preview Section (Optional but Recommended):** Consider including a preview section within the customization panel or in the main dashboard area that dynamically shows how the dashboard will look as widgets are added, removed, and rearranged. This provides immediate visual feedback to the user during customization.
-   **Backend Architecture & Logic:**
    -   **API Endpoints:**
        -   GET /api/dashboard/widgets/available – Retrieve a list of available dashboard widgets that can be added to the dashboard.
        -   GET /api/dashboard/layout – Retrieve the user's current dashboard layout configuration.
        -   PUT /api/dashboard/layout – Update and save the user's dashboard layout configuration.
            -   Request Body (JSON): { "widgets": [ { "widgetId": string, "position": number }, ... ] } (Array of widget configurations, specifying widget ID and position/order on the dashboard)
    -   **Business Logic:**
        -   **Widget Configuration Management:**
            -   Store Dashboard Layout: Implement a mechanism to store the user's customized dashboard layout preferences persistently. This could be done in a DashboardPreferences table in the database, associated with the user's profile. Store the configuration as a JSON object or serialized data structure that defines which widgets are displayed, their order, and potentially their sizes or other layout properties.
            -   Retrieve Dashboard Layout: Implement logic to retrieve the user's saved dashboard layout configuration when the dashboard page is loaded. If no custom layout is saved for the user, load a default dashboard layout configuration.
            -   Update Dashboard Layout: Implement logic to update and save the user's dashboard layout configuration when the user saves their customizations through the "Save Layout" button.
        -   **Widget Availability:**
            -   Define a list of available dashboard widgets in the backend. This list could be configurable or hardcoded, depending on the application's requirements. The API endpoint /api/dashboard/widgets/available should return this list to the UI.
        -   **Layout Validation:**
            -   Validate the dashboard layout configuration when saving to ensure that it is valid and consistent (e.g., ensure that all widget IDs are valid, positions are within allowed ranges, no widget is duplicated in the layout).
    -   **Shared Components:**
        -   **Dashboard Service:** Extend the DashboardService (from US-VSIM-026) to handle dashboard customization logic, including retrieving available widgets, managing user layouts, and saving layout preferences.
        -   **User Settings Service:** (Potentially) A dedicated service to manage user-specific settings and preferences, including dashboard layouts, report settings (US-VSIM-030), currency settings (US-VSIM-029), etc. This service can provide a centralized way to store and retrieve user preferences.
        -   **Authentication & Authorization Module:** Ensures that only authenticated users can customize their own dashboards and that dashboard customizations are user-specific and secure.
        -   **Cache Service:** (Optional) Consider using a caching mechanism to cache dashboard layout configurations to improve performance when loading user dashboards, especially if layout configurations are stored in a database.
    -   **Error Handling:**
        -   Return 400 Bad Request for validation errors during dashboard layout saving, such as invalid widget IDs or inconsistent layout configurations.
        -   Return 500 Internal Server Error for any unexpected server-side errors during layout retrieval or saving.
        -   Use standardized error responses for consistent error reporting.
    -   **Logic Flow (Customize Dashboard):**
        1. User clicks "Customize Dashboard" button on the Dashboard page.
        2. UI retrieves the list of available widgets from the /api/dashboard/widgets/available endpoint and the user's current dashboard layout from the /api/dashboard/layout endpoint.
        3. UI enters customization mode, displaying the widget selection panel and allowing users to add, remove, and rearrange widgets on the dashboard.
        4. When the user clicks "Save Layout":
            - UI sends a PUT request to /api/dashboard/layout with the updated dashboard layout configuration (list of widgets and their positions).
            - Backend authenticates and authorizes the user.
            - Validates the dashboard layout configuration.
            - If validation passes, save the layout configuration to the DashboardPreferences table using Dashboard Service and User Settings Service.
            - Return a success response (e.g., 200 OK).
        5. When the user clicks "Cancel Customization," discard any changes made in the UI and revert to the last saved or default dashboard layout.
        6. When the Dashboard page is loaded:
            - UI retrieves the user's dashboard layout from the /api/dashboard/layout endpoint.
            - If a custom layout is found, render the dashboard using the saved layout configuration.
            - If no custom layout is found, render the dashboard using a default layout configuration.
-   **Data Model Impact:**
    -   **Dashboard Preferences Table (DashboardPreferences):**
        -   Create a new table to store user-specific dashboard layout preferences.
        -   Columns: preferenceId (PK, auto-generated), userId (FK referencing Users, mandatory, to associate layout with a user), widgetConfig (JSON or serialized string, to store the dashboard layout configuration, e.g., widget IDs and positions), createdAt (timestamp), updatedAt (timestamp).
    -   **Users Table (Users):**
        -   Establish a one-to-one or one-to-many relationship between the Users table and the DashboardPreferences table using the userId foreign key to link dashboard layouts to user profiles.
-   **User Feedback & Notifications:**
    -   **Customization Interface:** Provide a user-friendly and intuitive drag-and-drop interface for customizing the dashboard layout, making it easy for users to add, remove, and rearrange widgets.
    -   **Real-Time Preview:** If a preview section is implemented, ensure that it provides a real-time preview of the dashboard layout as widgets are being customized, giving users immediate visual feedback on their changes.
    -   **Persistence of Customizations:** Ensure that dashboard customizations are saved persistently and are loaded correctly across user sessions. User preferences should be retained even after logging out and logging back in.
    -   **Success Message:** Display a success message (e.g., "Dashboard preferences updated successfully", "Layout saved") upon successful saving of the customized dashboard layout.
    -   **Error Alerts:** Display user-friendly error alerts if there are issues saving the dashboard layout or retrieving customization data, informing the user about the problem and suggesting possible actions (e.g., "Failed to save dashboard layout. Please try again later.").
    -   **Visual Feedback during Customization:** Provide clear visual feedback during customization mode, such as highlighting selected widgets, using drag handles, and updating the preview dynamically, to guide the user and enhance the customization experience.
-   **Dependencies & Considerations:**
    -   **Integration Points & Backend Dependencies:**
        -   **Dashboard Service (US-VSIM-026):** The Dashboard Customization feature is an extension of the core Dashboard functionality. Ensure that the DashboardService is designed to support both data retrieval for widgets and management of dashboard layouts.
        -   **User Profile Module:** Integrate with the User Profile module to associate dashboard preferences with individual user profiles.
        -   **User Settings Service:** (Potentially) A User Settings Service can be used to manage dashboard layout preferences and other user-specific settings in a centralized manner.
        -   **Caching Service:** (Optional) Caching dashboard layout configurations can improve performance when loading user dashboards.
    -   **Other Considerations:**
        -   **Performance:** Optimize dashboard layout loading and saving operations to ensure quick response times, even with complex layouts or a large number of widgets. Use efficient data storage and retrieval mechanisms for layout configurations.
        -   **Security:** Ensure that dashboard customizations are user-specific and that users can only customize their own dashboards, not those of other users. Implement appropriate authentication and authorization checks to protect user preferences.
        -   **Default Layout:** Define a sensible default dashboard layout that is displayed to new users or when a user has not yet customized their dashboard. Provide an option to revert to the default layout if users want to reset their customizations.
        -   **Widget Library Extensibility (Future Enhancement):** Design the dashboard customization framework to be extensible and allow for easy addition of new dashboard widgets in the future. The widget selection panel should be dynamically populated with available widgets, and the system should be able to handle new widget types and configurations without major code changes.

---

# User and System Settings

## **US-VSIM-028: Manage Store Information**

-   **Title:** Manage Store Information
-   **As a:** Store Owner
-   **I want to:** manage store information
-   **So that:** it is correctly displayed on invoices and reports.
-   **Description:** The system should allow inputting and updating store details like name, address, phone, email and logo.
-   **Acceptance Criteria:**
    -   Given I am logged in as a Store Owner,
    -   When I navigate to "Settings" and select "Store Information,"
    -   Then I should be able to enter or update store name, address, phone, email, and upload a logo.
    -   And these details should appear on invoices, receipts, and reports.

### **Implementation Framework:**

-   **UI Elements:**
    -   **Settings Section:** Navigation link/button to the "Settings" section in the main application menu.
    -   **Store Information Sub-section/Page:** Within "Settings," create a sub-section or dedicated page labeled "Store Information."
    -   **Store Information Form:**
        -   Input field: "Store Name" (Text input, mandatory).
        -   Text Area: "Store Address" (Textarea, optional, for multi-line address input).
        -   Input field: "Store Phone Number" (Text input, optional, with phone number format validation).
        -   Input field: "Store Email" (Text input, optional, with email format validation).
        -   Logo Upload: File upload control to allow users to upload a store logo image. Provide guidance on recommended image formats and sizes.
        -   Preview Area (Optional but Recommended): Display a preview area that dynamically shows how the entered store information (especially store name and logo) will appear on invoices, receipts, and reports. This provides immediate visual feedback to the user.
    -   **Save Button:** To save the updated store information.
    -   **Cancel Button:** To discard changes and revert to the previously saved store information.
-   **Backend Architecture & Logic:**
    -   **API Endpoint:** PUT /api/settings/store-information to update store information. - Request Body (Multipart/form-data or JSON):
        `{
  "storeName": string,
  "storeAddress": string (optional),
  "storePhone": string (optional),
  "storeEmail": string (optional),
  "storeLogo": file (optional, image file for logo upload) 
}`
        (Use multipart/form-data if including file upload, otherwise JSON can be used for text-only updates)
    -   **Business Logic:**
        -   **Validation:**
            -   Validate Store Name: Ensure that the "Store Name" is provided and is not empty.
            -   Validate Contact Information: Validate the format of "Store Phone Number" (if provided) and "Store Email" (if provided) to ensure they are in valid formats (phone number and email format validation).
            -   Validate Logo Upload (Optional): If logo upload is implemented, validate the uploaded file to ensure it is a valid image format (e.g., JPEG, PNG, GIF) and within acceptable size limits.
        -   **Data Storage:**
            -   Store Store Information: Persistently store the store information in a StoreSettings table in the database. Since there is typically only one set of store information for the application, this table will likely contain a single record.
            -   Logo File Storage: If logo upload is implemented, handle the storage of the uploaded logo image file. Options for logo storage include:
                -   File System Storage: Store the logo image file on the server's file system in a designated directory. Store the file path or URL to the logo image in the StoreSettings table.
                -   Cloud Storage (e.g., AWS S3, Google Cloud Storage, Azure Blob Storage): Upload the logo image to a cloud storage service for scalability, reliability, and potentially CDN delivery. Store the URL of the logo image in the StoreSettings table.
        -   **Data Retrieval:**
            -   Implement logic to retrieve store information from the StoreSettings table when needed (e.g., for displaying store information in the settings page, for including store details in invoices/receipts and reports).
    -   **Shared Components:**
        -   **Settings Service:** Central service for managing application-wide settings, including store information, tax settings (US-VSIM-020), currency settings (US-VSIM-029), report settings (US-VSIM-030), etc. Extend the Settings Service to include store information management logic.
        -   **Validation Module:** Reused from previous user stories to validate store information inputs, ensuring data integrity and consistency (e.g., validating store name, phone number format, email format, mandatory fields).
        -   **File Storage Service:** (If logo upload is implemented) A dedicated service for handling file uploads and storage, including logo images. This service can encapsulate file upload logic, storage management, and retrieval of file URLs.
        -   **Authentication & Authorization Module:** Ensures that access to store information settings and modification of store details is restricted to authorized users (e.g., store owners, administrators).
    -   **Error Handling:**
        -   Return 400 Bad Request for validation failures, such as:
            -   "Store name is required" if the store name field is missing.
            -   "Invalid email format for store email" if the email format is incorrect.
            -   "Invalid phone number format for store phone number" if the phone number format is invalid.
            -   "Invalid logo file format or size" if the uploaded logo file is invalid.
        -   Return 500 Internal Server Error for any unexpected server-side errors during store information update or file upload/storage.
        -   Use standardized error responses for consistent error reporting.
    -   **Logic Flow (Update Store Information):**
        1. Receive PUT request to /api/settings/store-information with updated store details (including optional logo file).
        2. Authenticate and authorize the user.
        3. Validate input data: store name, contact information formats, and logo file (if uploaded) using Validation Module and File Storage Service (for file validation).
        4. If validation passes, update the store information record in the StoreSettings table using Settings Service.
        5. If a new logo image is uploaded, handle file storage using File Storage Service and update the logoUrl field in the StoreSettings table with the URL of the stored logo image. If no new logo is uploaded, retain the existing logo URL or set it to null if the logo is being removed.
        6. Return a success response (e.g., 200 OK) upon successful store information update.
-   **Data Model Impact:**
    -   **Store Settings Table (StoreSettings):**
        -   Create a new table to store store-wide information and settings. Since there is typically only one set of store information, this table will likely contain a single record.
        -   Columns: settingId (PK, likely a fixed ID like 1), storeName (string, mandatory), storeAddress (string, optional), storePhone (string, optional), storeEmail (string, optional), logoUrl (string, optional, to store URL/path to logo image file), updatedAt (timestamp).
-   **User Feedback & Notifications:**
    -   **Success Message:** Display a success message (e.g., "Store information updated successfully") upon successful update of store details.
    -   **Error Alerts:** Display clear and informative error alerts if store information update fails due to validation errors or other issues (e.g., "Store name is required", "Invalid email format", "Invalid logo file format", "Failed to update store information. Please try again.").
    -   **Real-Time Preview Update (Optional):** If a preview area is implemented in the UI, ensure that it updates dynamically in real-time as the user enters or modifies store information, providing immediate visual feedback on how the information will appear on invoices and reports.
-   **Dependencies & Considerations:**
    -   **Integration Points & Backend Dependencies:**
        -   **Settings Service:** Central service for managing store information settings and providing access to store details to other modules.
        -   **File Storage Service:** (If logo upload is implemented) Dependency for handling logo image uploads and storage. Ensure seamless integration with File Storage Service for secure and efficient logo management.
        -   **Invoice/Receipt Generation (US-VSIM-011) and Reporting Modules (US-VSIM-007, US-VSIM-018):** The Store Information settings are crucial for displaying store details (name, address, logo) on generated invoices, receipts, and financial reports. Ensure that these modules are integrated with the Settings Service to retrieve and utilize the latest store information when generating documents and reports.
    -   **Other Considerations:**
        -   **Security:** Secure storage of store information, especially contact details. Implement proper access controls to ensure that only authorized users can modify store settings. Secure file uploads to prevent malicious file uploads or vulnerabilities.
        -   **Data Consistency:** Ensure data consistency across the application by using the centralized StoreSettings table as the single source of truth for store information. When store information is updated, ensure that changes are reflected consistently in all relevant parts of the application (invoices, reports, UI displays).
        -   **Performance:** Optimize data retrieval for store information, as these details may be accessed frequently when generating invoices, receipts, and reports. Consider caching store information in memory for faster access if needed.
        -   **Logo Image Handling:** If logo upload is implemented, consider aspects like:
            -   Image format and size validation to ensure uploaded logos are suitable for display and printing.
            -   Image optimization and resizing to reduce storage space and improve loading times.
            -   Secure storage of logo images and protection against unauthorized access or modification.
            -   Display of a default placeholder logo if no logo is uploaded or if there are issues retrieving the logo image.

---

## **US-VSIM-029: Set Currency Settings**

-   **Title:** Set Currency Settings
-   **As a:** Store Owner
-   **I want to:** set the currency for the application
-   **So that:** all financial transactions are in the correct currency.
-   **Description:** The system should let me select a currency for all monetary displays and calculations from a predefined list of currencies.
-   **Acceptance Criteria:**
    -   Given I am logged in as a Store Owner,
    -   When I navigate to "Settings" and select "Currency Settings,"
    -   Then I should be able to choose a currency from a dropdown list (e.g., USD, EUR, GBP).
    -   And all financial amounts displayed throughout the application should be in the selected currency.

### **Implementation Framework:**

-   **UI Elements:**
    -   **Settings Section:** Navigation link/button to the "Settings" section in the main application menu.
    -   **Currency Settings Sub-section/Page:** Within "Settings," create a sub-section or dedicated page labeled "Currency Settings."
    -   **Currency Selection Dropdown:**
        -   Dropdown list: Provide a dropdown list populated with a predefined set of supported currencies. The list should include commonly used currencies (e.g., USD, EUR, GBP, CAD, AUD, JPY, INR, etc.) and any other currencies relevant to the store's operations.
        -   Currency Symbols and Names: Display both the currency symbol (e.g., $, €, £) and the full currency name (e.g., US Dollar, Euro, British Pound) in the dropdown list to make it user-friendly and easy to select the correct currency.
    -   **Save Button:** To save the selected currency setting.
    -   **Live Preview (Optional but Highly Recommended):**
        -   Currency Preview Area: Include a section on the Currency Settings page to provide a live preview of how monetary values will be displayed in the application with the selected currency.
        -   Example Values: Display example monetary values (e.g., prices, amounts, totals) formatted according to the selected currency, showing the currency symbol, decimal places, and thousand separators. This provides immediate visual feedback to the user on the impact of their currency selection.
-   **Backend Architecture & Logic:**
    -   **API Endpoint:** PUT /api/settings/currency to update the currency setting.
        -   Request Body (JSON): { "currencyCode": string } (Currency code selected by the user, e.g., "USD", "EUR", "GBP")
    -   **Business Logic:**
        -   **Validation:**
            -   Validate currency code: Ensure that the selected currencyCode is valid and from the predefined list of supported currencies. Maintain a list of supported currency codes in the backend (e.g., in a configuration file or database table).
        -   **Currency Setting Storage:**
            -   Store the configured currency code in a CurrencySettings table or within a general Settings table, ensuring it is persistently saved and can be retrieved for use throughout the application. As with Store Information, a single-record table is likely sufficient.
        -   **Currency Application Logic:**
            -   Implement logic throughout the application to use the configured currency setting for displaying and formatting monetary values. This includes:
                -   Sales Transaction Forms (US-VSIM-008): Displaying prices, totals, discounts, and tax amounts in the selected currency.
                -   Invoices/Receipts (US-VSIM-011): Generating invoices and receipts with currency symbols and correct formatting.
                -   Financial Reports (US-VSIM-018): Displaying financial data in reports (Sales Reports, Expense Reports, Profit & Loss Statements, Inventory Value Reports) using the selected currency.
                -   Dashboard Widgets (US-VSIM-026): Displaying monetary metrics on the dashboard (e.g., "Total Sales," "Profit/Loss") in the selected currency.
    -   **Shared Components:**
        -   **Settings Service:** Central service for managing application settings, including currency settings, store information, report settings, etc. Reused and extended from US-VSIM-028.
        -   **Formatting Service:** (New or extend existing Calculation Service) Implement a dedicated Formatting Service or extend the Calculation Service to handle currency formatting consistently across the application. This service should take a numerical value and a currency code as input and return a formatted string with the correct currency symbol, decimal places, thousand separators, and currency-specific formatting rules. This ensures consistent currency display throughout the UI and in reports.
        -   **Authentication & Authorization Module:** Ensures that access to currency settings and modification of the currency is restricted to authorized users (e.g., store owners, administrators, financial staff).
    -   **Error Handling:**
        -   Return 400 Bad Request for validation failures, such as:
            -   "Invalid currency selected. Please choose a currency from the list." if the selected currencyCode is not valid or not in the list of supported currencies.
        -   Return 500 Internal Server Error for any unexpected server-side errors during currency setting updates.
        -   Use standardized error responses for consistent error reporting.
    -   **Logic Flow (Update Currency Setting):**
        1. Receive PUT request to /api/settings/currency with the selected currencyCode.
        2. Authenticate and authorize the user.
        3. Validate currency code using Validation Module and Settings Service, ensuring it is a valid and supported currency code.
        4. If validation passes, store the selected currencyCode in the CurrencySettings table using Settings Service.
        5. Return a success response (e.g., 200 OK) upon successful currency setting update.
    -   **Logic Flow (Display Currency):**
        1. Whenever monetary values need to be displayed in the UI (e.g., prices, totals, amounts in sales forms, invoices, reports, dashboards), retrieve the configured currency code from the CurrencySettings table using Settings Service.
        2. Use the Formatting Service to format the numerical value according to the retrieved currency code, applying appropriate currency symbols, decimal places, and thousand separators.
        3. Display the formatted currency string in the UI.
-   **Data Model Impact:**
    -   **Currency Settings Table (CurrencySettings):**
        -   Create a new table to store currency configuration settings. Since there is typically only one currency setting for the application, this table will likely contain a single record.
        -   Columns: settingId (PK, likely a fixed ID like 1), currencyCode (string, to store the selected currency code, e.g., "USD", "EUR", "GBP"), updatedAt (timestamp).
-   **User Feedback & Notifications:**
    -   **Success Message:** Display a success message (e.g., "Currency settings updated successfully") upon successful update of the currency setting.
    -   **Error Alerts:** Display error alerts if the selected currency is invalid (e.g., "Invalid currency selected. Please choose a currency from the list.").
    -   **Live Preview Update:** Ensure that the live currency preview area (if implemented) updates dynamically in real-time as the user selects different currencies from the dropdown, providing immediate visual feedback on the currency formatting.
    -   **Application-Wide Currency Update:** After successfully updating the currency setting, ensure that all monetary values displayed throughout the application (in sales forms, invoices, reports, dashboards) are updated to reflect the newly selected currency consistently.
-   **Dependencies & Considerations:**
    -   **Integration Points & Backend Dependencies:**
        -   **Settings Service:** Central service for managing currency settings and providing access to the configured currency code to all modules that need to display or process monetary values.
        -   **Formatting Service:** (New or extended) Essential for consistent and accurate currency formatting throughout the application.
        -   **Sales Module (US-VSIM-008), Invoice/Receipt Generation (US-VSIM-011), Financial Reporting Module (US-VSIM-018), Dashboard (US-VSIM-026), Expenses Module (US-VSIM-016), Supplier Payments (US-VSIM-019):** All these modules and UI components are dependent on the Currency Settings to display monetary values in the correct currency format. Ensure seamless integration with the Settings Service and Formatting Service to apply currency settings consistently across the application.
    -   **Other Considerations:**
        -   **Data Consistency:** Ensure that the currency setting is applied consistently across the entire application and that all monetary values are displayed and formatted according to the selected currency.
        -   **Internationalization (i18n) and Localization (l10n):** Consider broader internationalization and localization aspects for future enhancements. While this user story focuses on currency, future localization efforts might involve supporting multiple languages, date formats, number formats, and other locale-specific settings. Design the application with i18n/l10n in mind to facilitate future expansion to support multiple locales.
        -   **Currency Symbol and Formatting Data:** Maintain a comprehensive and up-to-date list of supported currencies along with their currency codes, symbols, decimal places, thousand separators, and formatting rules. This data can be stored in a configuration file, database table, or an external data source. Ensure that currency data is accurate and reflects current currency formatting conventions.
        -   **User Experience:** Provide a user-friendly currency selection interface and clear visual feedback to the user when they change the currency setting. The live preview area (if implemented) is crucial for enhancing user experience and ensuring users understand the impact of their currency selection.

## **US-VSIM-030: Customize Report Options**

-   **Title:** Customize Report Options
-   **As a:** Store Owner
-   **I want to:** customize report options
-   **So that:** I can generate reports tailored to my needs.
-   **Description:** The system should allow setting report preferences like date formats and default filters.
-   **Acceptance Criteria:**
    -   Given I am logged in as a Store Owner,
    -   When I navigate to "Settings" and select "Report Settings,"
    -   Then I should be able to set date format (e.g., DD/MM/YYYY, MM/DD/YYYY), and default date range for reports.
    -   And reports should be generated using these customized settings.

### **Implementation Framework:**

-   **UI Elements:**
    -   **Settings Section:** Navigation link/button to the "Settings" section in the main application menu.
    -   **Report Settings Sub-section/Page:** Within "Settings," create a sub-section or dedicated page labeled "Report Settings."
    -   **Report Options Form:**
        -   Date Format Setting:
            -   Dropdown list or radio buttons: Provide options to select the preferred date format for reports. Include common date formats such as "DD/MM/YYYY," "MM/DD/YYYY," "YYYY-MM-DD," and potentially others. Label options clearly with examples (e.g., "DD/MM/YYYY (e.g., 25/12/2024)").
        -   Default Date Range Setting:
            -   Dropdown list: Provide options to set the default date range for reports when they are initially generated. Include options like "This Month," "Last Month," "Last 3 Months," "This Year," "Last Year," "All Time," and "Custom Range."
            -   Custom Date Range (Conditional): If "Custom Range" is selected as the default date range, conditionally display date pickers to allow users to set a custom start and end date as the default range.
    -   **Save Button:** To save the customized report options.
    -   **Preview Section (Optional but Recommended):**
        -   Report Preview Area: Include a section to provide a preview of how reports will look with the selected date format and default date range.
        -   Example Report Snippet: Display a snippet of a sample report (e.g., a small table or list) with dates formatted according to the selected date format and data filtered to the selected default date range. This provides visual confirmation to the user.
-   **Backend Architecture & Logic:**
    -   **API Endpoint:** PUT /api/settings/report-options to update report options settings. - Request Body (JSON):
        `{
  "dateFormat": string, // Selected date format code (e.g., "DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD")
  "defaultDateRange": string // Selected default date range identifier (e.g., "this_month", "last_month", "custom_range", "all_time")
  // If "custom_range" is selected, also include:
  "defaultStartDate": date (optional, for custom date range),
  "defaultEndDate": date (optional, for custom date range)
}`
        **content_copydownload**Use code [**with caution**](https://support.google.com/legal/answer/13505487).Json
    -   **Business Logic:**
        -   **Validation:**
            -   Validate date format: Ensure that the selected dateFormat is valid and from the predefined list of supported date formats.
            -   Validate default date range: Ensure that the selected defaultDateRange is valid and from the predefined options. If "custom_range" is selected, validate that defaultStartDate and defaultEndDate are provided and are valid dates, and that the start date is not after the end date.
        -   **Report Settings Storage:**
            -   Store the configured report options (date format, default date range) in a ReportSettings table or within a general Settings table, ensuring they are persistently saved and associated with the user's profile. User-specific settings are important for report customization preferences.
        -   **Report Generation Logic Update:**
            -   Modify the report generation logic within the ReportGenerationService (US-VSIM-007, US-VSIM-018) to utilize the user's configured report options when generating reports.
            -   Date Formatting: When generating reports, use the selected dateFormat to format all dates displayed in the reports.
            -   Default Date Range: When a user initially accesses a report (e.g., Sales Report, Expense Report), apply the configured defaultDateRange as the initial filter for the report data. Allow users to override the default date range and select different date ranges as needed.
    -   **Shared Components:**
        -   **Settings Service:** Central service for managing application settings, including report settings, currency settings, store information, etc. Reused and extended from US-VSIM-028, US-VSIM-029.
        -   **Validation Module:** Reused from previous user stories to validate report settings inputs, ensuring data integrity and consistency (e.g., validating date format codes, default date range identifiers, date ranges).
        -   **Reporting Engine (ReportGenerationService):** Reused and extended from US-VSIM-007, US-VSIM-015, US-VSIM-018 to incorporate report customization options into report generation logic.
        -   **User Settings Service:** (Potentially) A dedicated service to manage user-specific settings and preferences, including report options, dashboard layouts (US-VSIM-027), etc.
        -   **Date Formatting Utility:** (New or extend Formatting Service) Implement a utility function or extend the Formatting Service to handle date formatting according to different date format codes. This utility should be used by the Reporting Engine to format dates in reports based on user preferences.
        -   **Authentication & Authorization Module:** Ensures that access to report settings and modification of report options is restricted to authorized users and that user-specific report preferences are managed securely.
    -   **Error Handling:**
        -   Return 400 Bad Request for validation failures, such as:
            -   "Invalid date format selected. Please choose a date format from the list." if the selected dateFormat is not valid.
            -   "Invalid default date range selected. Please choose a valid date range option." if the selected defaultDateRange is not valid.
            -   "Invalid custom date range. End date must be after start date." if a custom date range is selected and the date range is invalid.
        -   Return 500 Internal Server Error for any unexpected server-side errors during report settings update.
        -   Use standardized error responses for consistent error reporting.
    -   **Logic Flow (Update Report Options Setting):**
        1. Receive PUT request to /api/settings/report-options with report settings data (date format, default date range).
        2. Authenticate and authorize the user.
        3. Validate report settings input using Validation Module, ensuring date format and default date range selections are valid.
        4. If validation passes, store the report settings in the ReportSettings table using Settings Service, associating them with the current user.
        5. Return a success response (e.g., 200 OK) upon successful report settings update.
    -   **Logic Flow (Generate Report with Customized Options):**
        1. When a user requests to generate a report (e.g., Sales Report, Expense Report), retrieve the user's report settings from the ReportSettings table using User Settings Service and Settings Service.
        2. Apply the user's configured report options during report generation in the ReportGenerationService:
            - Date Formatting: Use the selected dateFormat to format all dates in the generated report using the Date Formatting Utility.
            - Default Date Range: If no date range is explicitly specified by the user when generating the report, apply the configured defaultDateRange as the default filter for the report data.
        3. Generate the report data and format it according to the user's preferences.
        4. Return the generated report data to the UI.
-   **Data Model Impact:**
    -   **Report Settings Table (ReportSettings):**
        -   Create a new table to store user-specific report customization settings.
        -   Columns: settingId (PK, auto-generated), userId (FK referencing Users, mandatory, to associate settings with a user), dateFormat (string, to store the selected date format code), defaultDateRange (string, to store the selected default date range identifier), defaultStartDate (date, optional, for custom date range), defaultEndDate (date, optional, for custom date range), updatedAt (timestamp).
    -   **Users Table (Users):**
        -   Establish a one-to-one or one-to-many relationship between the Users table and the ReportSettings table using the userId foreign key to link report preferences to user profiles.
-   **User Feedback & Notifications:**
    -   **Success Message:** Display a success message (e.g., "Report settings updated successfully") upon successful update of report options.
    -   **Error Alerts:** Display error alerts if report settings update fails due to validation errors (e.g., "Invalid date format selected", "Invalid default date range").
    -   **Preview Update (Optional):** If a preview area is implemented in the UI, ensure that it updates dynamically in real-time as the user changes report options, providing immediate visual feedback on how reports will be formatted and filtered with the new settings.
    -   **Report Generation with Custom Settings:** Verify that subsequently generated reports (Sales Reports, Expense Reports, etc.) are generated using the user's customized report options, including the selected date format and default date range.
-   **Dependencies & Considerations:**
    -   **Integration Points & Backend Dependencies:**
        -   **Settings Service:** Central service for managing report settings and providing access to user preferences to the Reporting Engine.
        -   **Reporting Engine (ReportGenerationService):** Must be extended to consume and apply the user's configured report options (date format, default date range) when generating reports.
        -   **User Profile Module:** Integrate with the User Profile module to associate report preferences with individual user profiles, allowing each user to have their own report customization settings.
        -   **Date Formatting Utility:** (New or extended) A Date Formatting Utility is essential for consistently formatting dates in reports according to user-selected date formats.
    -   **Other Considerations:**
        -   **User Experience:** Provide a user-friendly and intuitive interface for customizing report options, making it easy for users to understand and set their preferences. The preview section (if implemented) is crucial for enhancing user experience and providing visual confirmation of settings.
        -   **Data Consistency:** Ensure that report settings are applied consistently across all report generation modules and that dates in all reports are formatted according to the user's selected date format.
        -   **Performance:** Optimize retrieval of user-specific report settings to ensure that report generation performance is not negatively impacted by the need to fetch and apply user preferences. Consider caching user report settings for faster access.
        -   **Scalability:** Design the report settings management system to handle a growing number of users and report customization preferences efficiently. User-specific settings should be stored and retrieved in a scalable manner.
        -   **Default Settings:** Define sensible default report settings (e.g., a default date format, a common default date range) that are applied when a user has not yet customized their report options or if user-specific settings are not found. Provide an option to revert to default settings if users want to reset their report preferences.

## **US-VSIM-031: Manage User Profile**

-   **Title:** Manage User Profile
-   **As a:** Store Owner
-   **I want to:** manage my user profile
-   **So that:** I can update my personal information and password for security.
-   **Description:** The system should allow viewing and editing user profile and changing password.
-   **Acceptance Criteria:**
    -   Given I am logged in as a Store Owner,
    -   When I navigate to "Settings" and select "User Profile,"
    -   Then I should be able to view and update my name and email.
    -   And I should be able to change my password by entering the current and new passwords, with password complexity requirements enforced.

### **Implementation Framework:**

-   **UI Elements:**
    -   **Settings Section:** Navigation link/button to the "Settings" section in the main application menu.
    -   **User Profile Sub-section/Page:** Within "Settings," create a sub-section or dedicated page labeled "User Profile" or "My Profile."
    -   **User Profile Information Display:**
        -   Display the currently logged-in user's basic profile information, such as:
            -   "Name" (Display-only field, showing the user's full name or display name).
            -   "Email" (Display-only field, showing the user's email address).
    -   **Change Password Section:**
        -   "Change Password" Form: Include a section to allow users to change their password.
            -   Input field: "Current Password" (Password input type, mandatory, to verify the user's identity before allowing password change).
            -   Input field: "New Password" (Password input type, mandatory, with clear password complexity requirements displayed to the user, e.g., minimum length, mix of characters).
            -   Input field: "Confirm New Password" (Password input type, mandatory, must match the "New Password" field for confirmation).
        -   "Change Password" Button: Button labeled "Change Password" to initiate the password change process.
    -   **Save Profile Button (Optional):** If other profile information fields are added in the future (e.g., "Profile Picture," "Preferred Language," "Time Zone"), include a "Save Profile" button to save changes to the user profile (beyond password changes).
-   **Backend Architecture & Logic:**
    -   **API Endpoints:**
        -   GET /api/users/profile – Retrieve the current user's profile information.
        -   PUT /api/users/profile – Update the user's profile information (for future enhancements, e.g., updating name, email, profile picture).
        -   POST /api/users/change-password – Change the user's password.
            -   Request Body (JSON): { "currentPassword": string, "newPassword": string }
    -   **Business Logic:**
        -   **Retrieve User Profile:**
            -   Implement logic to retrieve the profile information for the currently logged-in user from the Users table.
        -   **Change Password Logic:**
            -   Authentication: Verify the user's identity by authenticating the provided "Current Password" against the user's stored password (using password hashing and verification techniques).
            -   Password Validation: Validate the "New Password" to ensure it meets predefined password complexity requirements (e.g., minimum length, character types, etc.).
            -   Password Confirmation: Verify that the "New Password" and "Confirm New Password" fields match.
            -   Password Update: If all validations pass, hash the "New Password" securely using a strong password hashing algorithm (e.g., bcrypt, Argon2) and update the user's password hash in the Users table.
    -   **Shared Components:**
        -   **User Service:** Central service for managing user-related operations, including user profile retrieval, password changes, user authentication, and potentially user registration and management in the future. Extend the User Service to include user profile management logic.
        -   **Authentication Service:** Reused from previous user stories for user authentication and authorization. The Authentication Service is crucial for verifying the user's current password before allowing a password change.
        -   **Validation Module:** Reused from previous user stories to validate user inputs, such as password complexity, email format (if email update is allowed in the future), and other profile data.
        -   **Security Service:** (Password Hashing Service) A dedicated service responsible for secure password hashing and verification. This service should implement strong password hashing algorithms and best practices for password security.
        -   **Audit Logging Service:** (Optional but recommended) Log user profile updates, especially password changes, for security audit trails and to track account modifications.
    -   **Error Handling:**
        -   Return 400 Bad Request for validation failures, such as:
            -   "Incorrect current password" if the provided "Current Password" does not match the user's actual password.
            -   "New password does not meet complexity requirements" if the "New Password" does not satisfy password policy rules.
            -   "New password and confirmation password do not match" if the new password and confirmation password fields do not match.
            -   "Invalid email format" (if email update is allowed in the future and email format is invalid).
        -   Return 401 Unauthorized if the user is not properly authenticated or authorized to access user profile management functions.
        -   Return 500 Internal Server Error for any unexpected server-side errors during profile retrieval or password change operations.
        -   Use standardized error responses for consistent error reporting.
    -   **Logic Flow (Retrieve User Profile):**
        1. Receive GET request to /api/users/profile to retrieve the user's profile information.
        2. Authenticate and authorize the user.
        3. Retrieve user profile data from the Users table using User Service for the currently logged-in user.
        4. Return a success response (e.g., 200 OK) with the user profile data (in JSON format).
    -   **Logic Flow (Change Password):**
        1. Receive POST request to /api/users/change-password with current password and new password.
        2. Authenticate and authorize the user.
        3. Validate input data: current password, new password, and password confirmation using Validation Module and User Service. Ensure new password meets complexity requirements and confirmation matches.
        4. Authenticate the user by verifying the provided "Current Password" against the stored password hash using Authentication Service and Security Service (Password Hashing Service). Return 400 Bad Request with "Incorrect current password" error if authentication fails.
        5. If authentication and validation pass, hash the "New Password" securely using Security Service (Password Hashing Service).
        6. Update the user's password hash in the Users table using User Service.
        7. Log the password change event using Audit Logging Service (optional).
        8. Return a success response (e.g., 200 OK) upon successful password change.
        9. If any error occurs during validation, authentication, or password update, roll back any changes and return an appropriate error response (e.g., 400 Bad Request, 500 Internal Server Error).
-   **Data Model Impact:**
    -   **Users Table (Users):**
        -   Update user profile information in the Users table.
        -   Columns: userId (PK), name (string), email (string, unique index recommended), passwordHash (string, to store securely hashed password), createdAt (timestamp), updatedAt (timestamp), and potentially other profile fields in the future (e.g., profilePictureUrl, preferredLanguage, timeZone).
-   **User Feedback & Notifications:**
    -   **Success Message:** Display a success message (e.g., "Profile updated successfully", "Password changed successfully") upon successful update of the user profile or password change.
    -   **Error Alerts:** Display clear and informative error alerts if profile update or password change fails due to validation errors or other issues (e.g., "Incorrect current password", "New password does not meet complexity requirements", "Passwords do not match", "Failed to update profile. Please try again later.").
    -   **Inline Validation Messages:** Provide inline validation messages next to input fields in the "Change Password" form to guide users in meeting password complexity requirements and confirming passwords correctly.
    -   **Security Notification (Optional):** Consider sending a security notification to the user's email address upon successful password change to inform them of the password update and provide an alert in case the password change was not authorized by the user.
-   **Dependencies & Considerations:**
    -   **Integration Points & Backend Dependencies:**
        -   **User Service:** Central service for managing user profiles and user-related operations. The User Profile Management feature is built around and depends on the User Service.
        -   **Authentication Service:** Essential for user authentication and verifying current passwords before allowing password changes.
        -   **Security Service (Password Hashing Service):** Crucial for secure password hashing and verification, ensuring that passwords are stored and handled securely.
        -   **Audit Logging Service:** (Optional) Integrate with Audit Logging Service to track user profile updates and password changes for security auditing and compliance.
    -   **Other Considerations:**
        -   **Security:** Implement robust security measures for password management and user profile updates. Enforce strong password policies, use secure password hashing algorithms, and protect user credentials and profile information from unauthorized access and modification. Securely handle password reset mechanisms (if implemented, though not explicitly in this user story).
        -   **Data Consistency:** Ensure data consistency across the application when user profile information is updated. Updated profile details should be reflected consistently in all user-facing modules and reports.
        -   **Performance:** Password hashing can be computationally intensive. Ensure that password change operations are handled efficiently without causing significant delays. Optimize database operations for user profile retrieval and updates.
        -   **Password Complexity Requirements:** Define clear and reasonable password complexity requirements and communicate them effectively to users in the UI (e.g., display password strength indicators, provide tooltips with password requirements). Enforce password complexity rules during password changes to improve account security.
        -   **Email Verification (Future Enhancement):** For future enhancements, consider adding email verification steps to the user profile management workflow, especially if email updates are allowed. Email verification can help ensure the validity of user-provided email addresses and enhance account security.
