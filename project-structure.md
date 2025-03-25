# Inventory Management System - Project Structure

src/
├── app/
│ ├── (auth)/ # Authentication routes
│ │ ├── login/
│ │ ├── register/
│ │ └── forgot-password/
│ ├── (dashboard)/ # Dashboard routes
│ │ ├── dashboard/
│ │ │ ├── page.tsx # Main dashboard
│ │ │ └── layout.tsx # Dashboard layout
│ │ └── settings/ # User settings
│ ├── (inventory)/ # Inventory management
│ │ ├── inventory/
│ │ │ ├── page.tsx # Inventory list
│ │ │ ├── [id]/ # Single inventory item
│ │ │ └── add/ # Add new inventory
│ │ ├── categories/ # Inventory categories
│ │ └── suppliers/ # Suppliers management
│ ├── (sales)/ # Sales management
│ │ ├── sales/
│ │ │ ├── page.tsx # Sales list
│ │ │ ├── [id]/ # Single sale details
│ │ │ └── new/ # New sale
│ │ └── customers/ # Customer management
│ ├── (reports)/ # Reports section
│ │ ├── inventory-reports/
│ │ ├── sales-reports/
│ │ └── financial-reports/
│ ├── api/ # API routes
│ │ ├── auth/
│ │ ├── inventory/
│ │ ├── sales/
│ │ ├── reports/
│ │ └── settings/
│ ├── globals.css # Global styles
│ ├── layout.tsx # Root layout
│ └── page.tsx # Home page
├── components/
│ ├── ui/ # Shadcn UI components
│ ├── dashboard/ # Dashboard components
│ │ ├── metrics-card.tsx
│ │ ├── recent-sales.tsx
│ │ └── inventory-summary.tsx
│ ├── inventory/ # Inventory components
│ │ ├── inventory-form.tsx
│ │ ├── inventory-table.tsx
│ │ └── inventory-card.tsx
│ ├── sales/ # Sales components
│ │ ├── sales-form.tsx
│ │ ├── sales-table.tsx
│ │ └── receipt.tsx
│ ├── reports/ # Report components
│ │ ├── report-filters.tsx
│ │ └── report-chart.tsx
│ └── layout/ # Layout components
│ ├── sidebar.tsx
│ ├── header.tsx
│ └── footer.tsx
├── lib/
│ ├── utils.ts # Utility functions
│ ├── supabase.ts # Supabase client
│ ├── hooks/ # Custom hooks
│ │ ├── use-inventory.ts
│ │ ├── use-sales.ts
│ │ └── use-auth.ts
│ └── services/ # Services
│ ├── inventory-service.ts
│ ├── sales-service.ts
│ ├── report-service.ts
│ └── calculation-service.ts
├── types/
│ ├── index.ts # Common types
│ ├── inventory.ts # Inventory types
│ ├── sales.ts # Sales types
│ └── supabase.ts # Supabase generated types
└── schemas/ # Zod schemas
├── inventory-schema.ts
├── sales-schema.ts
└── user-schema.ts
