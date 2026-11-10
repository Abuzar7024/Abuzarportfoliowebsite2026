# Abuzar Khan — 3D Developer Portfolio & AI Hackathon Platform

Interactive 3D developer portfolio (`abuzarcode.in`) featuring an interactive 3D developer office, AK-OS desktop environment, and the **AI HACKATHON — The Ultimate AI Developer Challenge** pre-registration, PayU checkout, QR-verifiable digital participant badge, and Supabase + EmailJS lead system.

## Tech Stack

| Layer | Choice |
| --- | --- |
| Frontend | React 19, TypeScript 5.9, Tailwind CSS v4, Motion |
| 3D Engine | Three.js 0.185, `@react-three/fiber` 9, `@react-three/drei` 10 |
| Payments | PayU Custom Integration (`SHA-512` server-side hash & `verify_payment` verification) |
| Database | Supabase (`@supabase/supabase-js` & `@supabase/ssr`) with Row-Level Security (RLS) |
| Notifications | EmailJS (`service_6beu4lx` / `template_sf95ton`) + automatic retry & backup lead outbox |

## Getting Started

```bash
npm install
cp .env.example .env.local   # Configure PayU, Supabase, and EmailJS variables
npm run dev                  # http://localhost:3000
```

## Security & Privacy Architecture

1. **PayU Secrets Isolation**: `PAYU_MERCHANT_KEY`, `PAYU_MERCHANT_SALT`, `PAYU_CLIENT_ID`, and `PAYU_CLIENT_SECRET` are strictly backend-only environment variables (`process.env.*`) and are never exposed in `VITE_*` client bundles.
2. **Supabase Data Minimization & RLS**:
   - The `public.ai_hackathon_registrations` table stores only essential registration fields (`participant_id`, `full_name`, `email`, `whatsapp_number`, `payment_amount`, `payment_status`, `payu_txnid`, `payu_mihpayid`, `registered_at`, `paid_at`).
   - Row-Level Security (RLS) is enabled with anonymous table `SELECT` revoked so participant emails and WhatsApp numbers cannot be scraped via the publishable key.
   - Public QR badge verification (`/competition/verify/:id` and `/api/avatar/verify`) returns only `participant_id`, `full_name`, `status: "VERIFIED"`, and `registered_at`—personal contact details (`email` and `whatsapp_number`) are always redacted.
3. **Contact Draft Hygiene**: Contact form drafts clear all personal fields (including `phoneNumber`) immediately upon submission.
