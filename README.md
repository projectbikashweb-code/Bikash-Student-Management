# Bikash Educational Institution — Student Management System

A production-grade, full-stack web application for managing students, fees, invoices, and payments at Bikash Educational Institution.

---

## Tech Stack

- **Framework**: Next.js 14 (App Router, TypeScript)
- **Styling**: Tailwind CSS + Radix UI primitives
- **Database**: PostgreSQL via Prisma ORM
- **Auth**: NextAuth.js (credentials — email + password + JWT)
- **Charts**: Recharts
- **PDF**: jsPDF + jspdf-autotable
- **Forms**: React Hook Form + Zod
- **Server State**: TanStack Query (React Query)
- **Toasts**: Sonner
- **Dates**: date-fns

---

## Prerequisites

- Node.js 18+
- PostgreSQL database (local or hosted, e.g. Supabase, Neon, Railway)

---

## Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd bikash-institute
npm install
```

### 2. Configure environment variables

Create a `.env.local` file in the project root:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/bikash_institute"
NEXTAUTH_SECRET="some-long-random-secret-string"
NEXTAUTH_URL="http://localhost:3000"
```

- `DATABASE_URL`: Your PostgreSQL connection string
- `NEXTAUTH_SECRET`: Any random string (use `openssl rand -base64 32`)
- `NEXTAUTH_URL`: Your app URL (use `http://localhost:3000` for development)

### 3. Set up database

```bash
# Push schema to database
npm run db:push

# (Optional) Open Prisma Studio to view data
npm run db:studio
```

### 4. Seed database

```bash
npm run db:seed
```

This creates:
- 1 admin user: `admin@bikashinstitute.com` / `Admin@1234`
- 10 sample students (Class 9–12)
- Fee records for last 3 months (mixed PAID/PENDING/PARTIAL)
- 5 sample invoices
- 10 sample payment history records

### 5. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Default Login

| Field    | Value                        |
|----------|------------------------------|
| Email    | admin@bikashinstitute.com    |
| Password | Admin@1234                   |

> You will be prompted to change your password on first login.

---

## Environment Variables Reference

| Variable          | Description                              | Required |
|-------------------|------------------------------------------|----------|
| `DATABASE_URL`    | PostgreSQL connection string             | ✅       |
| `NEXTAUTH_SECRET` | Secret for JWT signing                   | ✅       |
| `NEXTAUTH_URL`    | Public URL of the app                    | ✅       |

---

## Available Scripts

| Command              | Description                              |
|----------------------|------------------------------------------|
| `npm run dev`        | Start development server                 |
| `npm run build`      | Build for production                     |
| `npm start`          | Start production server                  |
| `npm run db:push`    | Push Prisma schema to database           |
| `npm run db:seed`    | Seed database with sample data           |
| `npm run db:studio`  | Open Prisma Studio                       |
| `npm run db:generate`| Regenerate Prisma client                 |

---

## Features

| Page               | Features                                                                 |
|--------------------|--------------------------------------------------------------------------|
| **Dashboard**      | Stats, bar chart (6-month collection), pie chart (status), top pending, recent payments |
| **Students**       | Paginated table, search, filters, add/edit/delete, bulk WhatsApp         |
| **Student Detail** | Profile card, fee history, payment history, invoices, reminders tabs     |
| **Fee Management** | Fee records with filters, record payment, mark as paid, bulk assignment  |
| **Invoices**       | Generate from fee records, preview, PDF download, print                  |
| **Payment Tracker**| Full history, filters, date range, CSV export, bar chart                 |
| **WhatsApp**       | Pending fee list, customizable template, bulk send, reminder history     |
| **Settings**       | Institute info, change password, staff management, data export           |

---

## Invoice PDF

Invoices generate a professional PDF with:
- Institute letterhead (Bikash Educational Institution, address, contact)
- Auto-incremented invoice number: `BI-YYYY-XXXX`
- Student details, line items, totals, balance due
- Color-coded payment status
- Print stylesheet for browser printing

---

## WhatsApp Reminders

WhatsApp links use the `wa.me` API format:
- Mobile: Opens WhatsApp app directly
- Desktop: Opens web.whatsapp.com

Message template variables: `[Student Name]`, `₹[Amount]`, `[Month]`, `[Due Date]`

---

## Security

- All routes protected via NextAuth middleware
- Passwords hashed with bcrypt (12 salt rounds)
- Zod validation on all form inputs and API routes
- Prisma parameterized queries (SQL injection safe)
- No secrets exposed via `NEXT_PUBLIC_` variables
- CSRF protection via NextAuth built-in

---

## Deployment

### Vercel (recommended)

```bash
npm run build
# Deploy via Vercel CLI or GitHub integration
```

Set environment variables in Vercel dashboard.

### Self-hosted

```bash
npm run build
npm start
```

Use PM2 or similar for process management:

```bash
pm2 start npm --name "bikash-institute" -- start
```

---

## License

Private — Bikash Educational Institution internal use only.
