# Tech Stack

- AI SDK 6
- Tailwind CSS
- NextJS 16
- PostgreSQL
- Auth.js
- Drizzle ORM

# Programming

- Use explicit variable names.

# Project Structure & Architecture

## Directory Organization

```text
app/
├── api/ # API routes
├── (authenticated)/ # Protected routes (require auth)
└── (public)/ # Public routes
components/
├── ui/ # shadcn/ui primitives
├── [feature]/ # Feature-specific components
└── [shared].tsx # Shared components at root level
lib/
├── services/ # Business logic and external integrations
├── utils/ # Pure utility functions
├── constants.ts # App-wide constants
└── config.ts # Configuration and environment
