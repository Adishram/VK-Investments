# VK Investments - PG Accommodation Finder

<p align="center">
  <img src="assets/images/logo.png" alt="VK Investments Logo" width="120" />
</p>

<p align="center">
  <strong>A comprehensive mobile application for finding and managing Paying Guest (PG) accommodations</strong>
</p>

<p align="center">
  Built with React Native + Expo | Node.js + Express | PostgreSQL
</p>

---

## 📋 Table of Contents

1. [Project Overview](#-project-overview)
2. [Technology Stack](#-technology-stack)
3. [Architecture](#-architecture)
4. [Features](#-features)
5. [Project Structure](#-project-structure)
6. [Installation & Setup](#-installation--setup)
7. [Environment Variables](#-environment-variables)
8. [Authentication System](#-authentication-system)
9. [Database Schema](#-database-schema)
10. [API Documentation](#-api-documentation)
11. [User Flows](#-user-flows)
12. [Screen Descriptions](#-screen-descriptions)
13. [Third-Party Integrations](#-third-party-integrations)
14. [Deployment](#-deployment)
15. [Testing](#-testing)
16. [Known Issues & Future Enhancements](#-known-issues--future-enhancements)

---

## 🎯 Project Overview

**VK Investments** is a full-stack mobile application designed to connect PG seekers with PG owners. The platform offers three distinct user experiences:

1. **Regular Users** - Can browse, filter, and book PG accommodations
2. **PG Owners** - Can list and manage their properties, customers, visits, and payments
3. **Super Admin** - Can manage all PG owners and oversee the entire platform

### Problem Statement

Finding quality PG accommodation is challenging for students and working professionals. This app solves:
- **Discovery** - Find PGs by location, price, amenities, and gender preference
- **Trust** - View verified images, reviews, and ratings
- **Convenience** - Schedule visits, book rooms, and pay online
- **Management** - For owners, manage multiple properties from one dashboard

### Key Differentiators

- **Interactive Map Integration** - Browse PGs on a map with visual markers
- **Multi-step Listing Creation** - Guided 5-step process for PG owners
- **Real-time Announcements** - Owners can broadcast messages to all customers
- **Role-based Access Control** - Separate experiences for users, owners, and admins
- **Clerk Authentication** - Secure email-verified signup/signin

---

## 🛠 Technology Stack

### Frontend (Mobile Application)

| Technology | Version | Purpose |
|------------|---------|---------|
| **React Native** | 0.76.x | Cross-platform mobile framework |
| **Expo SDK** | 52 | Development and build tooling |
| **Expo Router** | 4.x | File-based navigation |
| **TypeScript** | 5.3 | Type-safe JavaScript |
| **Clerk** | @clerk/clerk-expo | Authentication & user management |
| **React Native Maps** | 1.18.x | Map integration for iOS/Android |
| **Expo Image Picker** | 15.x | Image selection for uploads |
| **Expo Blur** | 14.x | iOS-style blur effects |
| **AsyncStorage** | 2.1.x | Local data persistence |
| **DateTimePicker** | 8.x | Native date/time selection |

### Backend (API Server)

| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 18+ | JavaScript runtime |
| **Express.js** | 4.x | Web framework |
| **PostgreSQL** | 15+ | Relational database |
| **node-postgres (pg)** | 8.x | PostgreSQL client |
| **bcrypt** | 5.x | Password hashing |
| **nodemailer** | 6.x | Email sending |
| **axios** | 1.x | HTTP client for geocoding |
| **cors** | 2.x | Cross-origin resource sharing |
| **Groq AI** | SDK | AI-powered chat assistant |

### External Services

| Service | Purpose |
|---------|---------|
| **Clerk** | User authentication with email verification |
| **Razorpay** | Payment processing (Indian market) |
| **Nominatim (OpenStreetMap)** | Geocoding service for address lookup |
| **Groq AI** | AI chatbot for user assistance |

---

## 🏗 Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        MOBILE APPLICATION                       │
│                     (React Native + Expo)                       │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   (auth)    │  │   (home)    │  │        (owner)          │  │
│  │  Sign In    │  │  Home Feed  │  │   Owner Dashboard       │  │
│  │  Sign Up    │  │  PG Details │  │   My Listings           │  │
│  │  Owner Login│  │  My PG      │  │   Add PG (5-step)       │  │
│  └─────────────┘  │  Maps       │  │   Customers/Visits      │  │
│                   │  Share      │  │   Payments/Announcements│  │
│  ┌─────────────┐  └─────────────┘  └─────────────────────────┘  │
│  │   (admin)   │                                                │
│  │  Dashboard  │                                                │
│  │  Owners Mgmt│                                                │
│  └─────────────┘                                                │
├─────────────────────────────────────────────────────────────────┤
│                        Context Layer                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ OwnerContext│  │ PGFormContext│  │  PGContext  │             │
│  │ (Session)   │  │ (Form State) │  │  (PG List)  │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
├─────────────────────────────────────────────────────────────────┤
│                        API Layer                                │
│                      utils/api.ts                               │
│          (Centralized API client with all endpoints)            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/REST
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        BACKEND SERVER                           │
│                     (Node.js + Express)                         │
├─────────────────────────────────────────────────────────────────┤
│                       server.js                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Route Handlers                          │ │
│  │  /api/pg           - PG CRUD operations                   │ │
│  │  /api/owner        - Owner authentication & management     │ │
│  │  /api/admin        - Super admin operations               │ │
│  │  /api/payment      - Razorpay integration                 │ │
│  │  /api/chat         - AI chatbot                           │ │
│  │  /api/visits       - Visit scheduling                     │ │
│  │  /api/announcements- Owner announcements                  │ │
│  └───────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                      Database Layer                             │
│                    PostgreSQL (pg pool)                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        PostgreSQL                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ pg_listings │  │  pg_owners  │  │  customers  │             │
│  │ pg_reviews  │  │visit_requests│ │announcements│             │
│  │ super_admins│  │    users    │  │             │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
User Action (Tap/Input)
        │
        ▼
Component (React Native)
        │
        ▼
API Client (utils/api.ts)
        │
        ▼ HTTP Request
Backend (Express.js)
        │
        ▼
PostgreSQL Query
        │
        ▼
Response → Component State → UI Update
```

---

## ✨ Features

### 👤 For Regular Users

| Feature | Description |
|---------|-------------|
| **Browse PGs** | Scroll through available PG listings with images, prices, and ratings |
| **Filter & Sort** | Filter by gender (Men/Women/Unisex), price range, occupancy type |
| **Map View** | See all PGs on an interactive map, tap markers for details |
| **Location-based** | Set city/use current location to find nearby PGs |
| **PG Details** | View images carousel, amenities, rules, rooms, reviews |
| **Schedule Visit** | Book a visit with date/time picker (6-hour advance minimum) |
| **Book Room** | Select room type and proceed to payment via Razorpay |
| **My PG** | View booked PG, payment status, check-in date, announcements |
| **Reviews** | Read and write reviews with star ratings and photos |
| **AI Chat** | Get assistance from AI-powered chatbot |

### 🏠 For PG Owners

| Feature | Description |
|---------|-------------|
| **Owner Dashboard** | Bento-grid style overview with stats and quick actions |
| **My Listings** | View all owned PGs with guest counts and room availability |
| **Add PG (5-Step)** | Guided property creation with validation |
| **Customer Management** | View all customers, search, assign room/floor |
| **Visit Management** | Approve/reject visit requests with filter tabs |
| **Payments Dashboard** | Track earnings, view paid vs due payments |
| **Announcements** | Broadcast messages to all customers of a PG |
| **Settings** | Change password, view profile |

### 👑 For Super Admin

| Feature | Description |
|---------|-------------|
| **Admin Dashboard** | Overview of platform statistics |
| **Manage Owners** | Add, view, edit PG owners |
| **Password Generation** | Auto-generate and email credentials to new owners |
| **Copy Password** | Clipboard integration for easy sharing |

---

## 📁 Project Structure

```
VK-invstment/
├── app/                          # Expo Router screens (file-based routing)
│   ├── _layout.tsx               # Root layout with ClerkProvider & OwnerProvider
│   ├── index.tsx                 # Entry redirect to welcome screen
│   │
│   ├── (auth)/                   # Authentication screens
│   │   ├── sign-in.tsx           # User sign in with Clerk
│   │   ├── sign-up.tsx           # User sign up with email verification
│   │   └── owner-login.tsx       # PG owner login (database auth)
│   │
│   ├── (home)/                   # Main user screens
│   │   ├── index.tsx             # Home feed with PG listings
│   │   ├── pg-details.tsx        # Full PG details page
│   │   ├── my-pg.tsx             # User's booked PG info
│   │   ├── maps.tsx              # Map view of all PGs
│   │   ├── chat.tsx              # AI chatbot
│   │   ├── payment.tsx           # Razorpay payment screen
│   │   └── share.tsx             # Share PG functionality
│   │
│   ├── (owner)/                  # PG Owner dashboard
│   │   ├── _layout.tsx           # Owner layout with OwnerProvider check
│   │   ├── index.tsx             # Owner dashboard (bento grid)
│   │   ├── my-listings.tsx       # List of owner's PGs
│   │   ├── customers.tsx         # Customer management
│   │   ├── visits.tsx            # Visit request management
│   │   ├── payments.tsx          # Payment tracking
│   │   ├── announcements.tsx     # Broadcast announcements
│   │   ├── settings.tsx          # Owner settings
│   │   └── add-pg/               # Multi-step form for adding PG
│   │       ├── _layout.tsx       # Add PG flow layout
│   │       ├── index.tsx         # Step indicator landing
│   │       ├── step1-basic.tsx   # Basic details + map picker
│   │       ├── step2-amenities.tsx # Amenity selection grid
│   │       ├── step3-rules.tsx   # House rules configuration
│   │       ├── step4-rooms.tsx   # Room types and pricing
│   │       └── step5-images.tsx  # Image uploads + final submission
│   │
│   └── (admin)/                  # Super Admin screens
│       ├── _layout.tsx           # Admin layout
│       ├── index.tsx             # Admin dashboard
│       └── owners.tsx            # Manage PG owners
│
├── components/                   # Reusable UI components
│   ├── BottomNavBar.tsx          # Bottom navigation for users
│   ├── MapComponents.native.tsx  # Native map components
│   ├── MapComponents.web.tsx     # Web placeholder for maps
│   ├── LocationPickerMap.tsx     # Map picker for address selection
│   └── PGDetailsMap.tsx          # Map display in PG details
│
├── context/                      # React Context providers
│   ├── OwnerContext.tsx          # Owner session management
│   ├── PGContext.tsx             # PG listings state
│   └── PGFormContext.tsx         # Multi-step form state
│
├── utils/                        
│   └── api.ts                    # Centralized API client (40+ functions)
│
├── backend/                      # Node.js backend server
│   ├── server.js                 # Main server with all routes
│   ├── package.json              # Backend dependencies
│   └── db/
│       ├── schema.sql            # Base database schema
│       └── migration_super_admin.sql # Admin migration
│
├── assets/                       # Static assets
│   ├── images/                   # App images and logo
│   └── fonts/                    # Custom fonts
│
├── app.json                      # Expo configuration
├── package.json                  # Frontend dependencies
├── tsconfig.json                 # TypeScript configuration
└── .env                          # Environment variables (not in repo)
```

---

## 🚀 Installation & Setup

### Prerequisites

- Node.js 18.x or higher
- npm or yarn
- PostgreSQL 15+
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac) or Android Emulator
- Clerk account (for authentication)

### 1. Clone the Repository

```bash
git clone https://github.com/Adishram/VK-Investments.git
cd VK-invstment
```

### 2. Install Frontend Dependencies

```bash
npm install
```

### 3. Set Up Backend

```bash
cd backend
npm install
```

### 4. Configure PostgreSQL Database

Create a PostgreSQL database and run the migrations:

```sql
-- Create database
CREATE DATABASE vk_investments;

-- Connect and run schema
\c vk_investments
\i db/schema.sql
\i db/migration_super_admin.sql
```

The server will auto-run additional migrations on startup.

### 5. Configure Environment Variables

Create `.env` file in root:

```env
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_key
```

Create `.env` in backend:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/vk_investments
PORT=3000
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
GROQ_API_KEY=your_groq_api_key
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
```

### 6. Start the Backend

```bash
cd backend
node server.js
```

Server runs at `http://localhost:3000`

### 7. Start the Frontend

```bash
# Back to root
cd ..

# Start Expo
npx expo start
```

Press `i` for iOS simulator or `a` for Android emulator.

---

## 🔐 Environment Variables

### Frontend (.env)

| Variable | Required | Description |
|----------|----------|-------------|
| `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` | ✅ | Clerk publishable key for authentication |

### Backend (.env)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `PORT` | ❌ | Server port (default: 3000) |
| `EMAIL_USER` | ✅ | Gmail address for sending emails |
| `EMAIL_PASS` | ✅ | Gmail app password |
| `GROQ_API_KEY` | ❌ | Groq API key for AI chat |
| `RAZORPAY_KEY_ID` | ✅ | Razorpay key ID for payments |
| `RAZORPAY_KEY_SECRET` | ✅ | Razorpay secret key |

---

## 🔒 Authentication System

### User Authentication (Clerk)

The app uses **Clerk** for user authentication with the following flow:

```
User opens app
    │
    ▼
Welcome Screen
    │
    ├── "Sign In" → Email + Password → Clerk Auth → Home
    │
    └── "Sign Up" → Email + Password + Name
                          │
                          ▼
                  Email Verification Code
                          │
                          ▼
                  Verify Code → Account Created → Home
```

**Key Files:**
- `app/(auth)/sign-in.tsx` - Sign in with email
- `app/(auth)/sign-up.tsx` - Sign up with email verification
- `app/_layout.tsx` - ClerkProvider wrapper

### Owner Authentication (Database)

PG Owners are authenticated against the PostgreSQL database:

```
Owner opens app → Owner Login
    │
    ▼
Email + Password → API: /api/owner/login
    │
    ▼
Bcrypt password verification
    │
    ▼
Success → OwnerContext stores session → Owner Dashboard
```

**Key Files:**
- `app/(auth)/owner-login.tsx` - Owner login screen
- `context/OwnerContext.tsx` - Session management with AsyncStorage
- `backend/server.js` - `/api/owner/login` endpoint

### Super Admin Authentication

Super Admin uses a simple email/password check:

```
Admin opens app → Admin Login
    │
    ▼
Email + Password → API: /api/admin/login
    │
    ▼
Check super_admins table → Success → Admin Dashboard
```

---

## 🗄 Database Schema

### Tables Overview

```sql
-- Core PG listing table
pg_listings (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255),
    description TEXT,
    price VARCHAR(50),
    location VARCHAR(255),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    image_url TEXT,
    images JSONB,                    -- Array of image URLs/base64
    owner_contact VARCHAR(100),
    owner_id INTEGER,
    owner_email VARCHAR(255),
    gender VARCHAR(50),              -- 'men', 'women', 'unisex'
    occupancy_types JSONB,           -- ['Single Room', 'Double Sharing', ...]
    occupancy_prices JSONB,          -- {"Single Room": 5000, ...}
    rooms JSONB,                     -- Detailed room config
    amenities JSONB,                 -- ['Wi-Fi', 'AC', ...]
    rules JSONB,                     -- ['No Smoking', ...]
    food_included BOOLEAN,
    notice_period VARCHAR(100),
    gate_close_time VARCHAR(50),
    safety_deposit VARCHAR(50),
    rating DECIMAL(3,2),
    rating_count INTEGER,
    house_no VARCHAR(100),
    street VARCHAR(255),
    city VARCHAR(100),
    pincode VARCHAR(20),
    created_at TIMESTAMP
);

-- PG Owners
pg_owners (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    mobile VARCHAR(20),
    city VARCHAR(100),
    state VARCHAR(100),
    profile_picture TEXT,
    password_hash VARCHAR(255),
    created_at TIMESTAMP
);

-- Customers (Users who booked)
customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255),
    mobile VARCHAR(20),
    pg_id INTEGER REFERENCES pg_listings(id),
    room_no VARCHAR(50),
    room_type VARCHAR(50),
    floor VARCHAR(50),
    move_in_date DATE,
    status VARCHAR(50),              -- 'Paid', 'Due'
    booking_id VARCHAR(100),
    amount DECIMAL(10, 2),
    paid_date TIMESTAMP,
    created_at TIMESTAMP
);

-- Visit Requests
visit_requests (
    id SERIAL PRIMARY KEY,
    user_email VARCHAR(255),
    user_name VARCHAR(255),
    pg_id INTEGER REFERENCES pg_listings(id),
    owner_email VARCHAR(255),
    visit_date DATE,
    visit_time VARCHAR(50),
    status VARCHAR(50),              -- 'pending', 'approved', 'rejected'
    created_at TIMESTAMP
);

-- PG Reviews
pg_reviews (
    id SERIAL PRIMARY KEY,
    pg_id INTEGER REFERENCES pg_listings(id),
    user_name VARCHAR(255),
    rating INTEGER,
    review_text TEXT,
    review_images JSONB,
    created_at TIMESTAMP
);

-- Announcements
announcements (
    id SERIAL PRIMARY KEY,
    pg_id INTEGER REFERENCES pg_listings(id),
    owner_id VARCHAR(255),
    message TEXT,
    created_at TIMESTAMP
);

-- Super Admins
super_admins (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255),
    name VARCHAR(255),
    created_at TIMESTAMP
);
```

### Entity Relationship

```
pg_owners ──────┬────── pg_listings ──────┬────── pg_reviews
                │                         │
                │                         ├────── customers
                │                         │
                │                         ├────── visit_requests
                │                         │
                └───────────────────────────────── announcements
```

---

## 📚 API Documentation

### Base URL

```
Development: http://localhost:3000/api
Production: https://your-backend-url.com/api
```

### PG Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/pg` | Get all PGs | No |
| GET | `/pg?owner_id=X` | Get PGs by owner | No |
| GET | `/pg/:id` | Get PG by ID | No |
| POST | `/pg` | Create new PG | Owner |
| PUT | `/pg/:id` | Update PG | Owner |
| DELETE | `/pg/:id` | Delete PG | Owner |

### Owner Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/owner/login` | Owner authentication |
| GET | `/owner/:id/stats` | Get owner statistics |
| GET | `/owner/:id/guests` | Get owner's customers |
| GET | `/owner/:id/visits` | Get visit requests |
| GET | `/owner/:id/payments` | Get payment details |
| PUT | `/owner/:id/password` | Change password |

### Admin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/admin/login` | Admin authentication |
| GET | `/admin/owners` | Get all owners |
| POST | `/admin/owners` | Add new owner |
| DELETE | `/admin/owners/:id` | Delete owner |

### Visit Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/visit` | Schedule a visit |
| PUT | `/visit/:id/approve` | Approve visit |
| PUT | `/visit/:id/reject` | Reject visit |
| GET | `/visit/user/:email` | Get user's visits |

### Payment Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/payment/create-order` | Create Razorpay order |
| POST | `/payment/verify` | Verify payment signature |

### Other Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/chat` | AI chatbot |
| GET | `/geocode?address=X` | Get coordinates for address |
| GET | `/pg/:id/reviews` | Get PG reviews |
| POST | `/pg/:id/review` | Add review |
| GET | `/announcements/:pgId` | Get announcements |
| POST | `/announcements` | Create announcement |

---

## 🔄 User Flows

### User Booking Flow

```
Home Screen → Browse PGs → Tap PG Card
    │
    ▼
PG Details Screen
    │
    ├── View Images (Carousel)
    ├── View Amenities
    ├── View Rooms & Pricing
    ├── View Rules
    ├── View Location on Map
    │
    ├── "Schedule Visit" → Pick Date/Time → Submit
    │
    └── "Book Now" → Select Room Type
            │
            ▼
    Payment Screen → Razorpay Checkout
            │
            ▼
    Payment Success → Customer Record Created
            │
            ▼
    My PG Screen (Shows booking details)
```

### Owner Add PG Flow

```
Owner Dashboard → "My Listings" → "Add New PG"
    │
    ▼
Step 1: Basic Details
    ├── PG Name, Gender, Registration
    ├── State, City, Locality
    ├── Contact Person, Mobile, Email
    ├── Map Picker (Search + Drag marker)
    ├── Food, Gate Close, Notice Period
    │
    ▼
Step 2: Amenities
    ├── Grid of 27 amenities with icons
    ├── Tap to select/deselect
    │
    ▼
Step 3: Rules
    ├── Default: No Smoking, No Drinking (locked)
    ├── Add custom rules
    │
    ▼
Step 4: Rooms
    ├── Select room types (Single/Double/Triple/Four/Six)
    ├── For each: Quantity, AC toggle, Price, Deposit
    │
    ▼
Step 5: Images
    ├── Building images (min 3, max 10)
    ├── Amenity images (min 2)
    ├── One image per room type
    │
    ▼
Submit → PG Created → Redirect to My Listings
```

---

## 📱 Screen Descriptions

### User Screens

| Screen | File | Description |
|--------|------|-------------|
| **Welcome** | `app/welcome.tsx` | Landing page with background, "Get Started" opens location modal |
| **Home** | `app/(home)/index.tsx` | PG listings grid, location picker, filters, search |
| **PG Details** | `app/(home)/pg-details.tsx` | Full details with image carousel, amenities, booking |
| **My PG** | `app/(home)/my-pg.tsx` | User's booked PG info, announcements, payment status |
| **Maps** | `app/(home)/maps.tsx` | Full-screen map with PG markers |
| **Chat** | `app/(home)/chat.tsx` | AI chatbot for assistance |
| **Payment** | `app/(home)/payment.tsx` | Razorpay integration screen |

### Owner Screens

| Screen | File | Description |
|--------|------|-------------|
| **Dashboard** | `app/(owner)/index.tsx` | Bento grid with stats, quick actions |
| **My Listings** | `app/(owner)/my-listings.tsx` | All PGs with guest count, rooms |
| **Customers** | `app/(owner)/customers.tsx` | Customer list with room assignment modal |
| **Visits** | `app/(owner)/visits.tsx` | Visit requests with approve/reject |
| **Payments** | `app/(owner)/payments.tsx` | Earnings chart, payment list |
| **Announcements** | `app/(owner)/announcements.tsx` | PG selector, message broadcast |
| **Settings** | `app/(owner)/settings.tsx` | Profile display, password change |
| **Add PG** | `app/(owner)/add-pg/*` | 5-step form with validation |

### Admin Screens

| Screen | File | Description |
|--------|------|-------------|
| **Dashboard** | `app/(admin)/index.tsx` | Platform stats overview |
| **Manage Owners** | `app/(admin)/owners.tsx` | CRUD for PG owners with password copy |

---

## 🔗 Third-Party Integrations

### Clerk (Authentication)

- **Purpose:** User sign-up, sign-in with email verification
- **SDK:** `@clerk/clerk-expo`
- **Features Used:** Email codes, session management, user metadata

### Razorpay (Payments)

- **Purpose:** Room booking payments
- **Integration:** Server-side order creation + client-side checkout
- **Flow:** Create order → Open Razorpay modal → Verify signature → Confirm booking

### Nominatim (Geocoding)

- **Purpose:** Convert addresses to coordinates
- **API:** OpenStreetMap's Nominatim
- **Usage:** Address search in map picker

### Groq AI (Chatbot)

- **Purpose:** AI-powered user assistance
- **Model:** LLaMA variant via Groq
- **Features:** Context-aware responses about PG accommodations

---

## 🚢 Deployment

### Backend Deployment (Render/Railway)

1. Push backend to separate repo or use monorepo
2. Connect to hosting platform
3. Set environment variables
4. Deploy with `npm start`

### Database (Supabase/Neon)

1. Create PostgreSQL instance
2. Run migrations
3. Update `DATABASE_URL` in backend

### Frontend (Expo EAS)

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure
eas build:configure

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

---

## 🧪 Testing

### Manual Testing Checklist

- [ ] User sign-up with email verification
- [ ] User sign-in
- [ ] Browse PG listings with filters
- [ ] View PG details page
- [ ] Schedule a visit
- [ ] Complete booking with Razorpay
- [ ] View My PG page
- [ ] Owner login
- [ ] Complete 5-step Add PG form
- [ ] Manage customers (assign room)
- [ ] Approve/reject visits
- [ ] Send announcement
- [ ] Admin login
- [ ] Add new owner
- [ ] Copy generated password

---

## 🔮 Known Issues & Future Enhancements

### Known Issues

1. **Map on Web:** React Native Maps doesn't work on web; placeholder shown
2. **Image Size:** Large base64 images may slow down API responses
3. **Offline Mode:** No offline support currently

### Future Enhancements

1. **Edit PG:** Full edit functionality for existing listings
2. **Push Notifications:** For visit approvals, announcements
3. **Payment History:** Detailed transaction records
4. **Multi-language:** Hindi/Regional language support
5. **Dark Mode:** System-based theme switching
6. **Favorites:** Save PGs to wishlist
7. **Chat with Owner:** Direct messaging

---

## 👨‍💻 Author

**VK Investments Team**

---

## 📄 License

This project is proprietary software. All rights reserved.

---

<p align="center">
  Made with ❤️ using React Native + Expo
</p>
