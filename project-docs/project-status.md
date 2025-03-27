## Current Project Status

**Foundation:** Project setup is solid (Next.js 15 App Router, React 19, TS, Tailwind, Shadcn UI, Supabase client/server/middleware, TanStack Query, Zod).

**Authentication:** Core authentication flow (Login, Signup, Password Reset) is implemented and functional, including route protection via middleware and client-side state management (AuthContext).

**Basic Layout:** A root layout with a header, providers (QueryClientProvider, ThemeProvider, AuthProvider), and toaster is in place.

**Settings:**

-   **Store Information:** Form and update logic exist (US-VSIM-028 - Done).
-   **Currency Settings:** Form and update logic exist (US-VSIM-029 - Done).
-   **Inventory Categories:** CRUD functionality (List, Add, Edit, Delete) is implemented (US-VSIM-003 - Partially Done, Category Management aspect).

**Dashboard:** A basic authenticated dashboard page exists but needs metric widgets (US-VSIM-026 - Scaffolding Done).

**User Profile:** Password change logic exists within the reset flow, but a dedicated profile page for viewing/updating name/email and changing password from within settings is missing (US-VSIM-031 - Partially Done).
