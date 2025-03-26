# Project: Inventory Management System

This project is an Inventory Management System built using Next.js 15, React 19, and Supabase. It provides a user interface for managing inventory, sales, suppliers, and financial data.

# Tech Stack:

-   Next.js 15: Framework (App Router)
-   React 19: UI Library
-   Shadcn UI: UI Component Library (Tailwind CSS based) - package name is shadcn and NOT shadcn-ui . so we shoull use npx shadcn add and not npx shadcn-ui add
-   Tailwind CSS: Styling (utility-first)
-   TanStack Query: Data Fetching and Server State Management
-   TanStack Forms: Form Management
-   TanStack Table: Headless Table Implementation
-   Zod: Schema Validation (integrated with TanStack Forms)
-   Supabase: Backend (PostgreSQL, authentication, storage) - you have read-only access using query(tool). Any modification provide sql code for manually insert into sql editor
-   date-fns: Date/Time Manipulation
-   lucide-react: Icons
-   TypeScript: Type Safety (Strict Mode)

# Key Principles:

-   **Type Safety:** Strict TypeScript usage throughout. No `any` types allowed. Use `unknown` when necessary, but prefer specific types or interfaces.
-   **Component-Based UI:** Build UI using composable, reusable Shadcn UI components.
-   **Server-Side Rendering (SSR) / Static Site Generation (SSG):** Leverage Next.js's capabilities for optimal performance.
-   **Data Consistency:** TanStack Query for all data fetching and mutations. Invalidate queries after mutations.
-   **Form Validation:** Zod schemas for all forms, integrated with TanStack Forms.
-   **Database Security:** Supabase Row Level Security (RLS) is mandatory for all tables.
-   **Code Style:** Consistent formatting, naming conventions, and file structure.

# TypeScript Rules

-   RULE 1: _Strict Mode:_ Always use TypeScript's strict mode (`"strict": true` in `tsconfig.json`).
-   RULE 2: _No `any`:_ Absolutely no use of the `any` type. Use `unknown` if the type is truly unknown, but then narrow it down with type guards. Prefer specific types, interfaces, or type aliases.
-   RULE 3: _Type Inference:_ Leverage TypeScript's type inference where possible. Don't explicitly define types when the compiler can infer them correctly. _Example: `const count = 0;` (no need for `: number`) But be explicit with complex types._
-   RULE 4: _Interfaces for Objects:_ Use interfaces to define the shape of objects and component props. _Example: `interface Product { id: string; name: string; price: number; }`_
-   RULE 5: _Type Aliases for Unions/Intersections:_ Use type aliases for complex types created with unions (`|`) or intersections (`&`). _Example: `type ProductId = string | number;`_
-   RULE 6: _Generics:_ Use generics to create reusable and type-safe components and functions that work with various types. Ensure generic type parameters are always used.
-   RULE 7: _Avoid `Number`, `String`, `Boolean`, `Symbol`, `Object`_: Use lowercase `number`, `string`, `boolean`, `symbol`, and `object` instead of their uppercase counterparts, which refer to boxed objects.
-   RULE 8: _Callback Return Types_: Do _not_ use `any` as the return type for callbacks whose values are ignored. Use `void` if the return value is intentionally ignored.
-   RULE 9: _Explicit `unknown`_: If a type is truly unknown at a certain point, use `unknown` rather than `any`. Then, use type guards (e.g., `typeof`, `instanceof`) to narrow the type before using the value.
-   RULE 10: _Consistent Types_: Maintain consistency between Supabase database types, Zod schemas, and TypeScript interfaces. Use the Supabase CLI to generate types from your database schema.

# Styling Rules

-   RULE 11: _Tailwind First:_ Use Tailwind CSS utility classes exclusively for styling. No custom CSS files or `style` props.
-   RULE 12: _Shadcn UI Components:_ Use Shadcn UI components as the primary building blocks for all UI elements. Copy and paste components from the Shadcn UI documentation - just use them into the files , we will add later . Shadcn already init . Check compones/ui before adding them.
-   RULE 13: _Customize via Classes:_ Customize Shadcn UI components only by adding or modifying Tailwind CSS classes. Do not directly edit the component's internal JSX.
-   RULE 14: _Responsiveness:_ Use Tailwind's responsive modifiers (`sm:`, `md:`, `lg:`, `xl:`, `2xl:`) for all responsive styling.
-   RULE 15: _Consistent Design System:_ Maintain consistent spacing, typography, and colors using Tailwind's configuration and Shadcn UI's theming.
-   RULE 16: _Dark Mode:_ Ensure all components and styles support Shadcn UI's dark mode.

# React Component Rules

-   RULE 17: _Functional Components:_ All components must be functional components using React Hooks. No class components.
-   RULE 18: _Hooks:_ Use React Hooks (`useState`, `useEffect`, `useContext`, etc.) for state, side effects, and context.
-   RULE 19: _Component Composition:_ Break down complex UI into smaller, reusable components.
-   RULE 20: _Props Typing:_ Define TypeScript interfaces for _all_ component props.
-   RULE 21: _`use client` Sparingly:_ Minimize the use of `'use client'` directives. Prefer Server Components where possible for improved performance. Use client components only when necessary for interactivity or browser-only APIs.
-   RULE 22: _No Inline Styles:_ Do not use the `style` prop for styling. Use Tailwind CSS classes exclusively.

# Data Fetching Rules (TanStack Query)

-   RULE 23: _TanStack Query Exclusively:_ Use TanStack Query (`useQuery`, `useMutation`) for all data fetching. No direct `fetch` or `axios` calls.
-   RULE 24: _Query Key Structure:_ Use array-based query keys: `['entity', 'identifier', { filters }]`. _Example: `['products', productId]`_
-   RULE 25: _Data Transformations:_ Perform data transformations within `useQuery`'s `select` option or in separate helper functions.
-   RULE 26: _Mutations:_ Use `useMutation` for create/update/delete. Invalidate queries after mutations. _Example: `queryClient.invalidateQueries(['products'])`_
-   RULE 27: _Loading/Error Handling:_ Use TanStack Query's `isLoading`, `isFetching`, `isError`, and `error` for UI feedback.
-   RULE 28: _Type-Safe Queries:_ Provide type parameters to `useQuery` and `useMutation` to ensure type safety. _Example: `useQuery<Product[], Error>(...)`_.
-   RULE 29: _`skipToken` for Conditional Queries:_ Use `skipToken` to disable queries when necessary, while maintaining type safety.

# Form Rules (TanStack Forms & Zod)

-   RULE 30: _TanStack Forms:_ Use TanStack Forms (`useForm`) for all form management.
-   RULE 31: _Zod Schemas:_ Define Zod schemas for all form validation. Use `@tanstack/zod-form-adapter`.
-   RULE 32: _Shadcn UI Form Components:_ Use Shadcn UI components for form inputs. Use `useController`.
-   RULE 33: _Error Display:_ Display errors using `formState.errors`. Style error messages consistently.
-   RULE 34: _Type-Safe Forms:_ Ensure Zod schemas and form field types are consistent with TypeScript interfaces.

# Table Rules (TanStack Table)

-   RULE 35: _TanStack Table:_ Use TanStack Table for all tables. No direct `<table>` tags.
-   RULE 36: _Column Definitions:_ Define column definitions separately. Specify `header`, `accessorKey` (or `accessorFn`).
-   RULE 37: _Features via Props:_ Use TanStack Table's props for sorting, filtering, and pagination.

# Database Rules (Supabase)

-   RULE 38: _Supabase Client:_ Use `@supabase/supabase-js` for all Supabase interactions.
-   RULE 39: _API Routes:_ Use Next.js API Routes (`/app/api`) for backend logic and database interactions. Do _not_ access Supabase directly from client components.
-   RULE 40: _Row Level Security (RLS):_ Enable and configure RLS policies in Supabase for all tables. This is mandatory.
-   RULE 41: _Secure Supabase SQL:_ When writing or suggesting SQL code for Supabase (especially for functions and triggers), adhere to secure coding practices. Specifically:\*\*
    -   **Fixed `search_path`:** Always explicitly set the `search_path` to `$user,public` within function definitions to prevent privilege escalation vulnerabilities. _Example: `CREATE FUNCTION my_function() SECURITY DEFINER SET search_path = '$user', public ...`_
    -   **Principle of Least Privilege:** Grant only the necessary permissions to database roles and functions. Avoid using `SECURITY DEFINER` unless absolutely necessary and with extreme caution.
    -   **Input Validation & Sanitization:** Sanitize all user inputs in SQL queries to prevent SQL injection vulnerabilities. Use parameterized queries or prepared statements whenever possible (though less relevant for agent-suggested manual SQL, but important to keep in mind for backend API logic).
    -   **Audit Logging:** Consider implementing audit logging for critical database operations.
    -   **Regular Security Reviews:** Conduct regular security reviews of database schema, functions, and RLS policies.
-   RULE 42: _Error Handling with Supabase_ Handle the `error` that could be returned within the Supabase response.

# Code Organization Rules

-   RULE 43: _File Structure:_ Maintain a consistent file structure:
    """
    src/
    app/ # Next.js pages (routes) and layouts
    api/ # Next.js API Routes (backend logic)
    components/ # Reusable UI components (Shadcn UI based)
    ui/ # Shadcn UI components (copied and pasted)
    [feature]/ # Feature-specific components
    lib/ # Utility functions, helper modules, Supabase client setup
    services/ # Data fetching logic with TanStack Query (calls API routes)
    types/ # TypeScript types and interfaces
    styles/ # Global styles, Tailwind CSS configuration
    utils/ # General utility functions
    """
-   RULE 44: _Naming Conventions:_
    -   Components: PascalCase (e.g., `ProductCard.tsx`)
    -   Files/Folders: kebab-case (e.g., `product-card.tsx`, `product-details`)
    -   Variables/Functions: camelCase (e.g., `productName`, `fetchProducts`)
    -   Constants: UPPER_SNAKE_CASE (e.g., `MAX_PRODUCTS`)
    -   Hooks: `use` prefix (e.g., `useProductData`)
-   RULE 45: _Imports:_ Use absolute imports with the `@` alias (configured in `tsconfig.json`). _Example: `import { Button } from '@/components/ui/button';`_
-   RULE 46: _Comments:_ Use JSDoc comments for functions and components to improve IDE intellisense and documentation.
