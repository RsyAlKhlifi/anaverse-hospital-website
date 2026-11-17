# ANAVERSE Hospital Website & Digital Healthcare Platform

ANAVERSE is a hospital website and digital healthcare platform prototype designed to provide accessible healthcare information and improve the digital patient experience.

## Project Status

**Current Status: Frontend Prototype**

This project currently uses `localStorage` to simulate data storage and user interactions. Supabase integration is planned but has not yet been fully configured.

No real appointments, payments, email notifications, or medical transactions are processed.

## Tech Stack

- **Frontend:** React, TypeScript, Vite
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Animations:** Framer Motion
- **Routing:** React Router
- **Database Integration (Planned):** Supabase

## Features

- **Public Website:** Hospital information, services, doctors, and healthcare content.
- **Authentication:** Demo login and registration interfaces.
- **Patient Portal:** Patient dashboard and appointment management prototype.
- **Doctor Portal:** Doctor dashboard and consultation management prototype.
- **Admin Dashboard:** Content management system prototype.

## Getting Started

### Prerequisites

- Node.js
- npm

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/RsyAlKhlifi/anaverse-hospital-website.git
   ```

2. Navigate to the project directory:

   ```bash
   cd anaverse-hospital-website
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Build the project:

   ```bash
   npm run build
   ```

## Demo Accounts

The following accounts are available for testing the prototype:

| Role | Email | Password |
|---|---|---|
| Patient | pasien@anaverse.id | Demo12345 |
| Doctor | dokter@anaverse.id | Demo12345 |
| Admin | admin@anaverse.id | Demo12345 |

## Project Structure

```text
anaverse-hospital-website/
├── public/
├── src/
│   ├── components/
│   ├── data/
│   ├── lib/
│   ├── pages/
│   └── services/
├── supabase/
│   └── schema.sql
├── .env.example
├── index.html
├── package.json
└── vite.config.ts
```

## Planned Improvements

- Complete Supabase database integration.
- Implement secure authentication and role-based access control.
- Connect appointment management to a real database.
- Implement real-time updates.
- Develop the video consultation feature.

## Disclaimer

ANAVERSE is a portfolio and educational prototype. It is not an operational healthcare service and should not be used for real medical appointments or transactions.