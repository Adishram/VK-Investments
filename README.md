# Book My PG

A modern PG (Paying Guest) accommodation booking app built with React Native and Expo.

## Features

- Multi-role authentication (Normal Users, PG Owners, Super Admins)
- Clerk authentication with Google OAuth for normal users
- Beautiful UI with custom authentication flows
- Cross-platform (iOS, Android, Web)

## Getting Started

```bash
# Install dependencies
pnpm install

# Start the app
pnpm start

# Run on iOS
pnpm run ios

# Run on Android
pnpm run android
```

## Test Credentials

### Normal Users
- Use Clerk sign-up to create an account
- Or sign in with Google OAuth

### PG Owner
- Email: `owner@bookmypg.com`
- Password: `Owner@123`
- Access: Tap "Are you a PG Owner?" link on main login screen

### Super Admin (Hidden)
- Email: `admin@bookmypg.com`
- Password: `Admin@123`
- Access: Triple-tap the logo on the main login screen to reveal admin login

## Tech Stack

- **Framework**: Expo SDK 54
- **Navigation**: Expo Router
- **Authentication**: Clerk
- **Language**: TypeScript
- **Package Manager**: pnpm

## Environment Variables

Create a `.env` file with:

```
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
```

## Project Structure

```
app/
├── (auth)/          # Authentication screens
│   ├── sign-in.tsx  # Normal user login with Clerk
│   ├── sign-up.tsx  # Normal user signup
│   ├── owner-login.tsx  # PG owner login
│   └── admin-login.tsx  # Super admin login (hidden)
├── (home)/          # Normal user screens
├── (owner)/         # PG owner dashboard
├── (admin)/         # Super admin panel
└── _layout.tsx      # Root layout with Clerk provider
```

## License

MIT
