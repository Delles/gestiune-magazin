# Project: Inventory Management System

This document outlines the tech stack, key principles, and rules for the Inventory Management System project.

## Overview

This project is an Inventory Management System built using Next.js 15, React 19, and Supabase. It provides a user interface for managing inventory, sales, suppliers, and financial data.

## Tech Stack

-   Next.js 15: Framework (App Router)
-   React 19: UI Library
-   Shadcn UI: UI Component Library (Tailwind CSS based). **Note:** Use `npx shadcn add` (package name is `shadcn`, not `shadcn-ui`).
-   Tailwind CSS: Styling (utility-first)
-   TanStack Query: Data Fetching and Server State Management
-   TanStack Forms: Form Management
-   TanStack Table: Headless Table Implementation
-   Zod: Schema Validation (integrated with TanStack Forms)
-   Supabase: Backend (PostgreSQL, authentication, storage). You have read-only access using `query(tool)`. Provide SQL code for manual insertion into the SQL editor for any modifications.
-   date-fns: Date/Time Manipulation
-   lucide-react: Icons
-   TypeScript: Type Safety (Strict Mode)

## Key Principles

-   **Type Safety:** Strict TypeScript usage throughout. No `any` types allowed. Use `unknown` when necessary, but prefer specific types or interfaces.
-   **Component-Based UI:** Build UI using composable, reusable Shadcn UI components.
-   **Server-Side Rendering (SSR) / Static Site Generation (SSG):** Leverage Next.js's capabilities for optimal performance.
-   **Data Consistency:** TanStack Query for all data fetching and mutations. Invalidate queries after mutations.
-   **Form Validation:** Zod schemas for all forms, integrated with TanStack Forms.
-   **Database Security:** Supabase Row Level Security (RLS) is mandatory for all tables.
-   **Code Style:** Consistent formatting, naming conventions, and file structure.

## Next.js 15 Specific Guidelines

-   **Async Route Handlers:** In Next.js 15, route handlers require proper async/await patterns. Always await dynamic parameters from route contexts.

    ```typescript
    // CORRECT: Always await params in dynamic routes
    export async function GET(request: NextRequest, { params }: RouteContext) {
        const { itemId } = await params; // Correctly await params
        // Rest of the handler
    }

    // INCORRECT: Will cause runtime errors
    export async function GET(request: NextRequest, { params }: RouteContext) {
        const itemId = params.itemId; // Error: params needs to be awaited
        // Rest of the handler
    }
    ```

-   **Caching and Data Revalidation:** Use `noStore()` from `next/cache` for data that should never be cached. Note that in Next.js 15, the API is `unstable_noStore` and should be aliased if used:

    ```typescript
    import { unstable_noStore as noStore } from "next/cache";

    export async function GET() {
        noStore(); // Prevent caching entirely
        // Rest of the handler
    }
    ```

-   **Dialog Accessibility:** When using `DialogContent` from Shadcn UI components, always include a `DialogTitle` even if it's visually hidden:
    ```tsx
    <DialogContent>
        <DialogTitle className="sr-only">Modal Title</DialogTitle>
        {/* Modal content */}
    </DialogContent>
    ```

## Rules

### TypeScript Rules

-   **RULE 1: Strict Mode:** Always use TypeScript's strict mode (`"strict": true` in `tsconfig.json`).
-   **RULE 2: No `any`:** Absolutely no use of the `any` type. Use `unknown` if the type is truly unknown, but then narrow it down with type guards. Prefer specific types, interfaces, or type aliases.
-   **RULE 3: Type Inference:** Leverage TypeScript's type inference where possible. Don't explicitly define types when the compiler can infer them correctly. _Example: `const count = 0;` (no need for `: number`) But be explicit with complex types._
-   **RULE 4: Interfaces for Objects:** Use interfaces to define the shape of objects and component props. _Example: `interface Product { id: string; name: string; price: number; }`_
-   **RULE 5: Type Aliases for Unions/Intersections:** Use type aliases for complex types created with unions (`|`) or intersections (`&`). _Example: `type ProductId = string | number;`_
-   **RULE 6: Generics:** Use generics to create reusable and type-safe components and functions that work with various types. Ensure generic type parameters are always used.
-   **RULE 7: Avoid `Number`, `String`, `Boolean`, `Symbol`, `Object`:** Use lowercase `number`, `string`, `boolean`, `symbol`, and `object` instead of their uppercase counterparts, which refer to boxed objects.
-   **RULE 8: Callback Return Types:** Do _not_ use `any` as the return type for callbacks whose values are ignored. Use `void` if the return value is intentionally ignored.
-   **RULE 9: Explicit `unknown`:** If a type is truly unknown at a certain point, use `unknown` rather than `any`. Then, use type guards (e.g., `typeof`, `instanceof`) to narrow the type before using the value.
-   **RULE 10: Consistent Types:** Maintain consistency between Supabase database types, Zod schemas, and TypeScript interfaces. Use the Supabase CLI to generate types from your database schema.

### Styling Rules

-   **RULE 11: Tailwind First:** Use Tailwind CSS utility classes exclusively for styling. No custom CSS files or `style` props.
-   **RULE 12: Shadcn UI Components:** Use Shadcn UI components as the primary building blocks for all UI elements. Copy and paste components from the Shadcn UI documentation - just use them into the files, we will add later. Shadcn is already initialized. Check `components/ui` before adding them.
-   **RULE 13: Customize via Classes:** Customize Shadcn UI components only by adding or modifying Tailwind CSS classes. Do not directly edit the component's internal JSX.
-   **RULE 14: Responsiveness:** Use Tailwind's responsive modifiers (`sm:`, `md:`, `lg:`, `xl:`, `2xl:`) for all responsive styling.
-   **RULE 15: Consistent Design System:** Maintain consistent spacing, typography, and colors using Tailwind's configuration and Shadcn UI's theming.
-   **RULE 16: Dark Mode:** Ensure all components and styles support Shadcn UI's dark mode.

### React Component Rules

-   **RULE 17: Functional Components:** All components must be functional components using React Hooks. No class components.
-   **RULE 18: Hooks:** Use React Hooks (`useState`, `useEffect`, `useContext`, etc.) for state, side effects, and context.
-   **RULE 19: Component Composition:** Break down complex UI into smaller, reusable components.
-   **RULE 20: Props Typing:** Define TypeScript interfaces for _all_ component props.
-   **RULE 21: `use client` Sparingly:** Minimize the use of `'use client'` directives. Prefer Server Components where possible for improved performance. Use client components only when necessary for interactivity or browser-only APIs.
-   **RULE 22: No Inline Styles:** Do not use the `style` prop for styling. Use Tailwind CSS classes exclusively.

### Data Fetching Rules (TanStack Query)

-   **RULE 23: TanStack Query Exclusively:** Use TanStack Query (`useQuery`, `useMutation`) for all data fetching. No direct `fetch` or `axios` calls.
-   **RULE 24: Query Key Structure:** Use array-based query keys: `['entity', 'identifier', { filters }]`. _Example: `['products', productId]`_
-   **RULE 25: Data Transformations:** Perform data transformations within `useQuery`'s `select` option or in separate helper functions.
-   **RULE 26: Mutations:** Use `useMutation` for create/update/delete. Invalidate queries after mutations. _Example: `queryClient.invalidateQueries(['products'])`_
-   **RULE 27: Loading/Error Handling:** Use TanStack Query's `isLoading`, `isFetching`, `isError`, and `error` for UI feedback.
-   **RULE 28: Type-Safe Queries:** Provide type parameters to `useQuery` and `useMutation` to ensure type safety. _Example: `useQuery<Product[], Error>(...)`_.
-   **RULE 29: `skipToken` for Conditional Queries:** Use `skipToken` to disable queries when necessary, while maintaining type safety.

### Form Rules (TanStack Forms & Zod)

-   **RULE 30: TanStack Forms:** Use TanStack Forms (`useForm`) for all form management.
-   **RULE 31: Zod Schemas:** Define Zod schemas for all form validation. Use `@tanstack/zod-form-adapter`.
-   **RULE 32: Shadcn UI Form Components:** Use Shadcn UI components for form inputs. Use `useController`.
-   **RULE 33: Error Display:** Display errors using `formState.errors`. Style error messages consistently.
-   **RULE 34: Type-Safe Forms:** Ensure Zod schemas and form field types are consistent with TypeScript interfaces.

### Table Rules (TanStack Table)

-   **RULE 35: TanStack Table:** Use TanStack Table for all tables. No direct `<table>` tags.
-   **RULE 36: Column Definitions:** Define column definitions separately. Specify `header`, `accessorKey` (or `accessorFn`).
-   **RULE 37: Features via Props:** Use TanStack Table's props for sorting, filtering, and pagination.

### Database Rules (Supabase)

-   **RULE 38: Supabase Client:** Use `@supabase/supabase-js` for all Supabase interactions.
-   **RULE 39: API Routes:** Use Next.js API Routes (`/app/api`) for backend logic and database interactions. Do _not_ access Supabase directly from client components.
-   **RULE 40: Row Level Security (RLS):** Enable and configure RLS policies in Supabase for all tables. This is mandatory.
-   **RULE 41: Secure Supabase SQL:** When writing or suggesting SQL code for Supabase (especially for functions and triggers), adhere to secure coding practices. Specifically:
    -   **Fixed `search_path`:** Always explicitly set the `search_path` to `$user,public` within function definitions to prevent privilege escalation vulnerabilities. _Example: `CREATE FUNCTION my_function() SECURITY DEFINER SET search_path = '$user', public ...`_
    -   **Principle of Least Privilege:** Grant only the necessary permissions to database roles and functions. Avoid using `SECURITY DEFINER` unless absolutely necessary and with extreme caution.
    -   **Input Validation & Sanitization:** Sanitize all user inputs in SQL queries to prevent SQL injection vulnerabilities. Use parameterized queries or prepared statements whenever possible (though less relevant for agent-suggested manual SQL, but important to keep in mind for backend API logic).
    -   **Audit Logging:** Consider implementing audit logging for critical database operations.
    -   **Regular Security Reviews:** Conduct regular security reviews of database schema, functions, and RLS policies.
-   **RULE 42: Error Handling with Supabase:** Handle the `error` that could be returned within the Supabase response.

### Code Organization Rules

-   **RULE 43: File Structure:** Maintain a consistent file structure:

    ```
    src/
    ├── middleware.ts                # Auth middleware for route protection
    ├── app/                         # Next.js pages and layouts
    │   ├── globals.css             # Global styles
    │   ├── layout.tsx              # Root layout
    │   ├── page.tsx               # Home page
    │   ├── (auth)/                # Authentication routes group
    │   │   └── _components/       # Auth-specific components
    │   └── (authenticated)/       # Protected routes group
    │       └── _components/       # Route-specific components
    ├── components/                 # Shared components
    │   ├── providers.tsx          # App providers (Auth, Query, Theme)
    │   ├── layout/               # Layout components (header, etc.)
    │   └── ui/                   # Shadcn UI components
    ├── contexts/                  # React contexts
    ├── lib/                      # Utility functions and setup
    │   ├── constants/           # App constants
    │   ├── supabase/           # Supabase client setup
    │   └── validation/         # Zod schemas
    └── types/                   # TypeScript types
        └── supabase.ts         # Generated Supabase types
    ```

-   **RULE 44: Naming Conventions:**
    -   Components: PascalCase (e.g., `ProductCard.tsx`)
    -   Files/Folders: kebab-case (e.g., `product-card.tsx`, `product-details`)
    -   Variables/Functions: camelCase (e.g., `productName`, `fetchProducts`)
    -   Constants: UPPER_SNAKE_CASE (e.g., `MAX_PRODUCTS`)
    -   Hooks: `use` prefix (e.g., `useProductData`)
-   **RULE 45: Imports:** Use absolute imports with the `@` alias (configured in `tsconfig.json`). _Example: `import { Button } from '@/components/ui/button';`_
-   **RULE 46: Comments:** Use JSDoc comments for functions and components to improve IDE intellisense and documentation.
