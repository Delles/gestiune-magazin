# Delles Gestiune Magazin (Inventory Management System)

A web application designed for managing store inventory, built with Next.js, TypeScript, Supabase, and shadcn/ui.

## Overview

This project provides a platform for tracking inventory items, managing stock levels, organizing products into categories, and handling basic store settings. It features user authentication to secure access.

## Key Features

-   **User Authentication:** Secure login, signup, and password reset functionality using Supabase Auth.
-   **Inventory Management:**
    -   Add, view, edit, and delete inventory items.
    -   Track stock quantity, unit price (selling), purchase prices (initial, last, average).
    -   Set reorder points for low stock warnings.
    -   View detailed stock transaction history per item.
    -   Adjust stock levels with different transaction types (purchase, sale, damage, etc.).
-   **Categorization:** Organize inventory items into user-defined categories.
-   **Settings:**
    -   Manage store information (name, address, contact).
    -   Set the default currency.
    -   Manage inventory categories.

## Technology Stack

-   **Framework:** Next.js (App Router)
-   **Language:** TypeScript
-   **Styling:** Tailwind CSS
-   **UI Components:** shadcn/ui
-   **Database & Auth:** Supabase
-   **State Management:** Zustand (listed in `package.json`, usage may vary)
-   **Data Fetching/Caching:** TanStack Query (React Query)
-   **Forms:** React Hook Form + Zod (for validation)
-   **Tables:** TanStack Table (React Table)

## Getting Started

Follow these steps to set up and run the project locally.

### Prerequisites

-   Node.js (Version specified in `.nvmrc` if available, otherwise LTS recommended)
-   npm, yarn, or pnpm
-   A Supabase account and project.

### Installation

1.  **Clone the repository:**

    ```bash
    git clone <your-repository-url>
    cd delles-gestiune-magazin
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    ```

### Environment Variables

This project requires Supabase credentials.

1.  Create a `.env.local` file in the root of the project.
2.  Go to your Supabase project dashboard.
3.  Navigate to **Project Settings** > **API**.
4.  Find your **Project URL** and **Project API Keys** (use the `anon public` key).
5.  Add the following lines to your `.env.local` file, replacing the placeholder values:

    ```env
    NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
    NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
    ```

### Database Setup

1.  **Set up your Supabase project:** Ensure you have created the necessary tables (e.g., `InventoryItems`, `categories`, `StockTransactions`, `StoreSettings`, `CurrencySettings`, `profiles`) and functions (`record_item_purchase`) in your Supabase database. Refer to the SQL schema definitions if available, or inspect `src/types/supabase.ts` for table structures.
2.  **Enable Row Level Security (RLS):** It is highly recommended to set up RLS policies on your Supabase tables (especially `InventoryItems`, `StockTransactions`, `categories`, etc.) to ensure users can only access their own data. The API routes and server-side logic assume appropriate RLS is in place.
3.  **(Optional but Recommended) Update Supabase Types:** After setting up your database schema and having your Supabase project ID, run the following command to generate TypeScript types based on your schema:
    ```bash
    npm run update-types
    ```
    _Note: You might need to install Supabase CLI globally (`npm install supabase --global`) or use `npx`._

### Running the Development Server

Once dependencies are installed and environment variables are set:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```
