# Inventory Management System - Project Structure

Directory structure:
gestiune-magazin/
├── components.json
├── eslint.config.mjs
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── tsconfig.json
├── src/
│ ├── middleware.ts
│ ├── app/
│ │ ├── globals.css
│ │ ├── layout.tsx
│ │ ├── page.tsx
│ │ ├── (auth)/
│ │ │ ├── login/
│ │ │ │ ├── page.tsx
│ │ │ │ └── \_components/
│ │ │ │ └── login-form.tsx
│ │ │ ├── reset-password/
│ │ │ │ ├── page.tsx
│ │ │ │ ├── \_components/
│ │ │ │ │ └── reset-password-form.tsx
│ │ │ │ └── update/
│ │ │ │ ├── page.tsx
│ │ │ │ └── \_components/
│ │ │ │ └── update-password-form.tsx
│ │ │ └── signup/
│ │ │ ├── page.tsx
│ │ │ └── \_components/
│ │ │ └── signup-form.tsx
│ │ └── (authenticated)/
│ │ ├── dashboard/
│ │ │ └── page.tsx
│ │ └── settings/
│ │ ├── page.tsx
│ │ ├── categories/
│ │ │ ├── page.tsx
│ │ │ └── \_components/
│ │ │ ├── categories-list.tsx
│ │ │ └── category-form.tsx
│ │ ├── currency/
│ │ │ ├── page.tsx
│ │ │ └── \_components/
│ │ │ └── currency-settings-form.tsx
│ │ └── store-information/
│ │ ├── page.tsx
│ │ └── \_components/
│ │ └── store-info-form.tsx
│ ├── components/
│ │ ├── providers.tsx
│ │ ├── layout/
│ │ │ └── header.tsx
│ │ └── ui/
│ │ ├── button.tsx
│ │ ├── card.tsx
│ │ ├── dialog.tsx
│ │ ├── dropdown-menu.tsx
│ │ ├── form.tsx
│ │ ├── input.tsx
│ │ ├── label.tsx
│ │ ├── select.tsx
│ │ ├── separator.tsx
│ │ ├── skeleton.tsx
│ │ ├── table.tsx
│ │ ├── textarea.tsx
│ │ └── toaster.tsx
│ ├── contexts/
│ │ └── auth-context.tsx
│ ├── lib/
│ │ ├── utils.ts
│ │ ├── constants/
│ │ │ └── currencies.ts
│ │ ├── supabase/
│ │ │ ├── client.ts
│ │ │ ├── route-handler.ts
│ │ │ └── server.ts
│ │ └── validation/
│ │ └── settings-schemas.ts
│ └── types/
│ └── supabase.ts
└── .cursor/
└── rules/
└── project-rule.mdc
