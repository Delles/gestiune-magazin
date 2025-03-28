# System Architecture - Inventory Management System

This document provides a high-level overview of the Inventory Management System's architecture. It illustrates the main components and how they interact.

## Architecture Diagram

The diagram below shows the key components and data flow.

```
+-----------------------+      +----------------------------+      +---------------------------+
| 👤 User               |----->| 💻 Web Application (Browser)|----->| ⚙️ API Layer              |
| (Store Owner / Staff) |      | (Next.js/React/Shadcn/    |      | (Next.js API Routes)      |
+-----------------------+      |  TanStack)                 |      +-------------+-------------+
                               +----------------------------+                    |
                                                                               |
                                       +---------------------------------------+ V
                                       |             ☁️ Supabase (BaaS)        |
                                       |                                       |
                                       | +-----------------+  +--------------+ |
                                       | | 💾 PostgreSQL   |  | 🔑 Supabase  | |
                                       | |    Database     |  |    Auth      | |
                                       | +-----------------+  +--------------+ |
                                       |                                       |
                                       | +-----------------+                     |
                                       | | 📦 Supabase     |                     |
                                       | |    Storage      |                     |
                                       | | (Optional/Future)|                     |
                                       | +-----------------+                     |
                                       +---------------------------------------+

Interaction Flow:
1. User --- (HTTPS) ---> Web Application
2. Web App --- (HTTPS/JSON) ---> API Layer
3. API Layer --- (Supabase Client) ---> Supabase Auth
4. API Layer --- (SQL/Supabase Client) ---> PostgreSQL DB
5. API Layer --- (Supabase Client) ---> Supabase Storage (Optional)
```

## Component Explanations

1.  **User (Store Owner / Staff):** The person interacting with the system through their web browser.
2.  **Web Application (Browser - Next.js/React):**
    -   The frontend application built with Next.js (App Router), React, Shadcn UI, and the TanStack suite.
    -   Runs in the user's browser.
    -   Provides the user interface for all features.
    -   Uses TanStack Query to communicate with the API Layer.
3.  **API Layer (Next.js API Routes):**
    -   The backend logic layer handling business rules and data access.
    -   Receives requests from the Web Application.
    -   Validates data (using Zod).
    -   Interacts with Supabase services.
4.  **Supabase (BaaS - Backend as a Service):**
    -   **PostgreSQL Database:** The primary data store (inventory, sales, users, settings).
    -   **Supabase Auth:** Handles user authentication and authorization.
    -   **Supabase Storage:** Optional service for file storage (e.g., product images).

## Interactions Flow

1.  The **User** accesses the **Web Application** in their browser via HTTPS.
2.  The **Web Application** (using TanStack Query) sends requests (e.g., for data, to perform actions) to the **API Layer** over HTTPS, usually exchanging JSON data.
3.  The **API Layer** uses **Supabase Auth** to verify the user's identity and permissions for the requested action.
4.  The **API Layer** interacts with the **PostgreSQL Database** (via the Supabase client) to read or write application data (e.g., fetch inventory, record a sale).
5.  Optionally, the **API Layer** interacts with **Supabase Storage** to upload or retrieve files.
