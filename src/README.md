# Abuzar Khan | Portfolio Terminal

A high-performance, production-ready developer portfolio built with a futuristic HUD/Cyber aesthetic. This project features automated "No Internet" detection, interactive post-contact mini-games, and a fully responsive design.

## 🚀 Tech Stack

- **Framework**: React (Vite)
- **Styling**: Tailwind CSS v4
- **Animations**: Motion (framer-motion)
- **Icons**: Lucide React
- **Validation**: Zod + React Hook Form
- **Backend**: Supabase Edge Functions (Hono)

---

## 📂 Project Structure & Sections

### 1. Hero Section (`/sections/Hero.tsx`)

**Purpose**: The landing experience and primary "above-the-fold" branding.

- **Content**:
  - Personal Branding: Name (Abuzar Khan) and Role (Flutter & Front-End Developer).
  - Status Indicators: Animated "System.Optimal" status pill.
  - CTAs: Primary "View Projects" and secondary "Resume" buttons.
  - Social Links: Quick access to GitHub, LinkedIn, and Email.

### 2. Skills Section (`/sections/Skills.tsx`)

**Purpose**: Technical capability showcase.

- **Content**:
  - Categorized technical stacks (Frontend, Mobile, Backend, Tools).
  - Interactive hover states and grid-based layout.

### 3. Experience Section (`/sections/Experience.tsx`)

**Purpose**: Professional career timeline.

- **Content**:
  - Vertical timeline layout.
  - Role titles, company names, and bulleted achievements.

### 4. Projects Section (`/sections/Projects.tsx`)

**Purpose**: Portfolio showcase.

- **Content**:
  - High-quality project cards with category tags.
  - "Live Demo" and "Source Code" links.
  - Tech stack labels for each project.

### 5. Education Section (`/sections/Education.tsx`)

**Purpose**: Academic credentials.

- **Content**:
  - Listing degrees (BCA at Manipal University Jaipur, etc.).
  - Institution details and dates.

### 6. Contact Section (`/sections/Contact.tsx`)

**Purpose**: Lead generation and conversion.

- **Content**:
  - **Contact Form**: Conditional fields (Freelance vs Job), honeypot spam protection, and inline Zod validation.
  - **Success Game**: A "Data Restoration" mini-game that triggers upon form submission to keep users engaged.

---

## 🛠️ Key Components

- **Navbar (`/components/Navbar.tsx`)**: Features a custom-designed "A" vector logo and glass-morphism mobile navigation.
- **Success Game (`/components/SuccessGame.tsx`)**: A Canvas-based mini-game integrated into the contact workflow.
- **No Internet Screen (`/NotFound.tsx`)**: An automated HUD screen that triggers globally when `navigator.onLine` is false.
- **Mouse Glow (`/components/MouseGlow.tsx`)**: An interactive radial gradient that follows the user's cursor.

---

## 💻 Local Setup

1. **Install Dependencies**:

   ```bash
   npm install
   ```

2. **Environment Variables**:
   Create a `.env` file with your Supabase credentials if you wish to connect to a custom backend:

   ```env
   SUPABASE_URL=your_url
   SUPABASE_ANON_KEY=your_key
   ```

3. **Start Development Server**:
   ```bash
   npm run dev
   ```

---

## ✉️ Contact

**Abuzar Khan**

- **Email**: abuzxarrr87@gmail.com
- **Phone/WhatsApp**: +91 8770206120
- **GitHub**: [Abuzar7024](https://github.com/Abuzar7024)