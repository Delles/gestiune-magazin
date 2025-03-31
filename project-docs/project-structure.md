# Project Structure

This document outlines the directory structure of the Inventory Management System. The `project-docs/` and `.cursor/` directories are not included in this update and remain as they were.

```plaintext
gestiune-magazin/
├── .cursor/                      # Cursor IDE specific configuration and rules
│   └── rules/
│       └── project-rule.mdc      # Specific rules for AI collaboration in Cursor
├── project-docs/                 # Project documentation
│   ├── Requirement.md            # Project requirements
│   ├── project-rule.md           # (Legacy/duplicate?) Project rules (see .cursor/rules)
│   ├── project-status.md         # Current status of the project
│   ├── project-structure.md      # This file
│   └── architecture/             # Architectural diagrams and documents
│       └── inventory-stock-flow.md # Diagram for inventory stock flow
├── src/                          # Main source code directory
│   ├── app/                      # Next.js App Router directory
│   │   ├── (auth)/               # Route group for authentication pages (login, signup, reset)
│   │   │   ├── login/            # Login page and components
│   │   │   │   ├── page.tsx
│   │   │   │   └── _components/
│   │   │   │       └── login-form.tsx
│   │   │   ├── reset-password/   # Password reset flow pages and components
│   │   │   │   ├── page.tsx
│   │   │   │   ├── _components/
│   │   │   │   │   └── reset-password-form.tsx
│   │   │   │   └── update/
│   │   │   │       ├── page.tsx
│   │   │   │       └── _components/
│   │   │   │           └── update-password-form.tsx
│   │   │   └── signup/           # Signup page and components
│   │   │       ├── page.tsx
│   │   │       └── _components/
│   │   │           └── signup-form.tsx
│   │   ├── (authenticated)/      # Route group for pages requiring authentication
│   │   │   ├── dashboard/        # Main dashboard page after login
│   │   │   │   └── page.tsx
│   │   │   ├── inventory/        # Inventory management section
│   │   │   │   ├── page.tsx
│   │   │   │   ├── [itemId]/     # Dynamic route for individual inventory items (view/edit)
│   │   │   │   │   ├── edit-form-container.tsx
│   │   │   │   │   └── page.tsx
│   │   │   │   └── _components/  # Components specific to the inventory feature
│   │   │   │       ├── inventory-item-form-client.tsx
│   │   │   │       ├── inventory-item-form.tsx
│   │   │   │       ├── inventory-list.tsx
│   │   │   │       ├── stock-transaction-history.tsx
│   │   │   │       └── stock-adjustment/
│   │   │   │           ├── index.tsx
│   │   │   │           └── components/
│   │   │   │               ├── FeedbackMessages.tsx
│   │   │   │               ├── StockAdjustmentActions.tsx
│   │   │   │               ├── StockAdjustmentFields.tsx
│   │   │   │               ├── StockAdjustmentHeader.tsx
│   │   │   │               └── StockAdjustmentTypeTabs.tsx
│   │   │   └── settings/         # Application settings section
│   │   │       │   ├── categories/   # Category management page and components
│   │   │       │   │   ├── page.tsx
│   │   │       │   │   └── _components/
│   │   │       │   │       ├── categories-list.tsx
│   │   │       │   │       └── category-form.tsx
│   │   │       │   ├── currency/     # Currency settings page and components
│   │   │       │   │   ├── page.tsx
│   │   │       │   │   └── _components/
│   │   │       │   │       └── currency-settings-form.tsx
│   │   │       │   └── store-information/ # Store details page and components
│   │   │       │       ├── page.tsx
│   │   │       │       └── _components/
│   │   │       └── store-info-form.tsx
│   │   ├── api/                  # Next.js API routes (backend logic)
│   │   │   ├── categories/       # API endpoints for categories
│   │   │   └── inventory/        # API endpoints for inventory
│   │   │       ├── items/        # Endpoints for inventory items (list, create)
│   │   │       │   └── [itemId]/ # Endpoints for specific inventory items (get, update, delete)
│   │   │       │       ├── stock/ # Endpoints for managing stock levels
│   │   │       │       └── transactions/ # Endpoints for stock transactions
│   │   ├── globals.css           # Global CSS styles (Tailwind base, etc.)
│   │   ├── layout.tsx            # Root layout component for the entire application
│   │   └── page.tsx              # Root page component (usually the landing page or redirects)
│   ├── components/               # Reusable UI components
│   │   ├── layout/               # Layout specific components (e.g., Header, Footer, Sidebar)
│   │   │   └── header.tsx        # Application header component
│   │   ├── providers.tsx         # Context providers (e.g., TanStack Query, Auth)
│   │   └── ui/                   # Shadcn UI components (copied/generated)
│   │       ├── badge.tsx
│   │       ├── button.tsx
│   │       ├── calendar.tsx
│   │       ├── card.tsx
│   │       ├── dialog.tsx
│   │       ├── dropdown-menu.tsx
│   │       ├── form.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       ├── popover.tsx
│   │       ├── select.tsx
│   │       ├── separator.tsx
│   │       ├── skeleton.tsx
│   │       ├── table.tsx
│   │       ├── tabs.tsx
│   │       ├── textarea.tsx
│   │       ├── toaster.tsx
│   │       ├── tooltip.tsx
│   │       └── visually-hidden.tsx
│   ├── contexts/                 # React Context definitions
│   │   └── auth-context.tsx      # Authentication context
│   ├── lib/                      # Utility functions, helpers, and core modules
│   │   └── validation/           # Zod schemas for data validation
│   │       ├── inventory-schemas.ts # Schemas related to inventory items and stock
│   │       └── settings-schemas.ts  # Schemas related to application settings
│   ├── services/
│   │   └── inventoryService.ts
│   ├── types/                    # TypeScript type definitions
│   │   └── supabase.ts           # Types generated from the Supabase schema
│   └── middleware.ts             # Next.js middleware (e.g., for authentication checks)
├── .eslintrc.js                # ESLint configuration (Linting rules)
├── .gitignore                  # Files and directories ignored by Git
├── components.json             # Shadcn UI configuration
├── eslint.config.mjs
├── next.config.mjs               # Next.js configuration file
├── package.json                # Project dependencies and scripts
├── postcss.config.mjs            # PostCSS configuration (for Tailwind CSS)
├── README.md                   # Project overview and setup instructions
└── tsconfig.json               # TypeScript configuration
```

## Key Directory Explanations:

-   **`src/app/`**: Contains all routes, UI, and logic related to the Next.js App Router.
    -   **`(auth)` / `(authenticated)`**: These are Route Groups, used to organize routes without affecting the URL path. They often group pages based on layout or access control (e.g., pages requiring login).
    -   **`api/`**: Holds backend API endpoints built with Next.js Route Handlers. These interact with the database (Supabase) and are called by the frontend using TanStack Query.
    -   **`_components/`**: A convention (often indicated by the underscore) for components specific to a particular route segment or feature, not intended for reuse elsewhere.
-   **`src/components/`**: Houses reusable React components.
    -   **`ui/`**: Specifically contains the Shadcn UI components added to the project.
    -   **`layout/`**: Components forming the overall page structure (header, sidebar, etc.).
-   **`src/lib/`**: A central place for shared utilities, configurations, and helper functions.
    -   **`validation/`**: Zod schemas used for form validation and potentially API request validation.
-   **`src/types/`**: Global TypeScript type definitions, including `supabase.ts` which should contain types generated from your database schema.
-   **`project-docs/`**: All non-code documentation related to the project.
-   **`.cursor/`**: Configuration specific to the Cursor IDE, including the detailed project rules (`project-rule.mdc`).
