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
