# MyFitnessComrade - Calorie Tracking App

## Project Overview
MyFitnessComrade is a modern calorie tracking application that helps users manage their daily calorie intake. Users can set daily calorie goals, log meals throughout the day, and track their progress toward their goals.

## Current Features

**Core Functionality:**
- User authentication (email/password via Firebase Auth)
- Set and edit daily calorie goals
- Log meals with food name and calorie count
- View today's meals with timestamps
- Real-time calorie totals and progress tracking
- Delete meals
- Color-coded progress indicators (green/yellow/red)
- Persistent data storage in Firestore

## Tech Stack

**Frontend:**
- React 19 with Vite
- Firebase SDK 12.7.0 (client-side integration)
- Modern CSS with dark theme
- Responsive design

**Backend/Database:**
- Firebase Authentication (email/password)
- Cloud Firestore (NoSQL database)
- Client-side Firebase integration (no Express server)

**Development:**
- Node.js >= 18.0.0
- Vite dev server with HMR
- Separate dev and prod Firebase projects

## Architecture

This is a **client-only application** that communicates directly with Firebase services. No backend server required.

```
Client (React + Vite)
    ↓
Firebase SDK
    ↓
Firebase Auth + Firestore
```

## Project Structure

```
MyFitnessComrade/
├── .gitignore
├── package.json                    # Root scripts (primarily for Railway)
├── README.md
│
└── client/                         # React application
    ├── .env                        # Firebase credentials (not in git)
    ├── .env.example                # Template for environment variables
    ├── .gitignore
    ├── package.json                # Client dependencies
    ├── vite.config.js              # Vite configuration
    ├── index.html                  # HTML entry point
    └── src/
        ├── main.jsx                # React entry point
        ├── App.jsx                 # Main app component
        ├── App.css                 # App styling
        ├── index.css               # Global styles
        ├── config/
        │   └── firebase.js         # Firebase initialization (dev/prod switching)
        └── services/
            ├── firebase.js         # Auth helper functions
            └── calories.js         # Calorie tracking functions
```

## Data Model

### Firestore Collections

**users/{userId}**
```javascript
{
  email: string,
  displayName: string,
  dailyCalorieGoal: number,      // Default: 2000
  createdAt: timestamp,
  updatedAt: timestamp
}
```

**meals/{mealId}**
```javascript
{
  userId: string,                 // Reference to user
  date: string,                   // YYYY-MM-DD format
  foodName: string,               // e.g., "Chicken Breast"
  calories: number,               // e.g., 350
  mealTime: timestamp,            // When meal was logged
  createdAt: timestamp
}
```

## Setup Instructions

### 1. Clone Repository
```bash
git clone https://github.com/AlexSchwarz/MyFitnessComrade.git
cd MyFitnessComrade
```

### 2. Install Dependencies
```bash
cd client
npm install
```

### 3. Firebase Setup

**Create Firebase Projects:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create two projects: one for development, one for production
3. Enable **Authentication** → Email/Password provider
4. Create **Firestore Database** in each project

**Get Firebase Credentials:**
1. In each Firebase project: Project Settings > General
2. Under "Your apps", click the web icon (</>)
3. Copy the config values

**Configure Environment Variables:**
1. Copy `client/.env.example` to `client/.env`
2. Fill in your Firebase credentials:
   - `VITE_FIREBASE_DEV_*` - Development project credentials
   - `VITE_FIREBASE_PROD_*` - Production project credentials

### 4. Firestore Security Rules

**Important:** Configure these rules in Firebase Console for both dev and prod:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }

    // Users can only read/write/delete their own meals
    match /meals/{mealId} {
      allow read, delete: if request.auth.uid == resource.data.userId;
      allow create: if request.auth.uid == request.resource.data.userId;
      allow update: if request.auth.uid == resource.data.userId;
    }
  }
}
```

### 5. Create Test User

In Firebase Console:
1. Go to Authentication > Users
2. Add user manually with email and password
3. Use these credentials to log in to the app

## Running Locally

**Start development server:**
```bash
cd client
npm run dev
```

The app runs at http://localhost:5173 (or 5174, 5175 if ports are in use)

**Development Features:**
- Hot Module Replacement (HMR)
- Automatic browser refresh on file changes
- Connects to dev Firebase project automatically

## User Flow

1. **Login:** User logs in with email/password
2. **View Dashboard:** See today's calorie summary (consumed, goal, remaining)
3. **Set Goal:** Edit daily calorie goal (default: 2000 calories)
4. **Log Meal:** Enter food name and calories, submit
5. **Track Progress:**
   - Progress bar shows percentage of goal consumed
   - Color indicators: green (under goal), yellow (near goal), red (over goal)
   - Real-time total calculation
6. **Manage Meals:** View today's meals list, delete meals if needed
7. **Persistence:** All data saved to Firestore, loads on page refresh

## API / Service Functions

### Authentication (`services/firebase.js`)
```javascript
import { signIn, logout, subscribeToAuthChanges } from './services/firebase';

// Sign in
await signIn(email, password);

// Sign out
await logout();

// Listen to auth changes
subscribeToAuthChanges((user) => {
  console.log('User:', user);
});
```

### Calorie Tracking (`services/calories.js`)
```javascript
import { getUserGoal, setUserGoal, addMeal, getTodaysMeals, deleteMeal } from './services/calories';

// Get user's daily goal
const goal = await getUserGoal(userId);

// Update goal
await setUserGoal(userId, 2500);

// Log a meal
const meal = await addMeal(userId, 'Grilled Chicken', 350);

// Get today's meals
const meals = await getTodaysMeals(userId);

// Delete a meal
await deleteMeal(mealId);
```

## Key Implementation Details

### Firebase Configuration (`client/src/config/firebase.js`)
- Automatically switches between dev and prod Firebase projects based on `import.meta.env.MODE`
- Development mode uses `VITE_FIREBASE_DEV_*` variables
- Production mode uses `VITE_FIREBASE_PROD_*` variables

### Meal Date Handling
- Uses ISO date format (YYYY-MM-DD) for consistent querying
- Timezone-aware date calculation
- Meals sorted by `mealTime` in descending order (most recent first)

### Firestore Query Optimization
- No composite indexes required
- Sorting done in JavaScript instead of Firestore
- Efficient queries with `where` clauses on `userId` and `date`

### Security Best Practices
- All `.env` files excluded from git
- Client-side security rules enforce user-specific access
- Authentication required for all Firestore operations
- No API keys or credentials in source code

## Deployment

### Railway Deployment (Production)

1. **Push to GitHub:**
```bash
git push origin main
```

2. **Connect Railway:**
- Create new project in Railway dashboard
- Connect to GitHub repository

3. **Configure Environment Variables in Railway:**
```
NODE_ENV=production
VITE_FIREBASE_PROD_API_KEY=...
VITE_FIREBASE_PROD_AUTH_DOMAIN=...
VITE_FIREBASE_PROD_PROJECT_ID=...
VITE_FIREBASE_PROD_STORAGE_BUCKET=...
VITE_FIREBASE_PROD_MESSAGING_SENDER_ID=...
VITE_FIREBASE_PROD_APP_ID=...
```

4. **Railway Build Process:**
- Runs `npm install` (installs client dependencies via postinstall)
- Runs `npm run build` (builds React app with Vite)
- Serves static files from `client/dist`

## Development Patterns

### State Management
```javascript
const [user, setUser] = useState(null);
const [meals, setMeals] = useState([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

// Loading pattern
try {
  setLoading(true);
  setError(null);
  const result = await someAsyncOperation();
  // Handle success
} catch (err) {
  setError(err.message);
} finally {
  setLoading(false);
}
```

### Form Handling
```javascript
const handleSubmit = async (e) => {
  e.preventDefault();

  // Validate input
  if (!value.trim()) {
    setError('Value required');
    return;
  }

  // Submit
  await submitData(value);
};
```

### Real-time Calculations
```javascript
// Recalculate total whenever meals change
useEffect(() => {
  const total = meals.reduce((sum, meal) => sum + meal.calories, 0);
  setTotalCalories(total);
}, [meals]);
```

## Common Tasks

**View browser console:**
- Open DevTools (F12)
- Check Console tab for errors or logs

**Clear local data:**
- Meals are stored per day, automatically reset at midnight (UTC)
- Or delete meals manually in the app

**Stop dev server:**
- Press `Ctrl+C` in terminal

**Rebuild production:**
```bash
cd client
npm run build
```

**Lint code:**
```bash
cd client
npm run lint
```

## Troubleshooting

**"Missing or insufficient permissions" error:**
- Check Firestore security rules are configured
- Verify user is logged in
- Ensure rules match the structure in Setup Instructions

**Meals not loading after page refresh:**
- Check browser console for errors
- Verify Firestore has data with correct structure
- Ensure `date` field format is YYYY-MM-DD
- Check `userId` matches authenticated user

**Firebase initialization errors:**
- Verify `.env` file exists in `client/` directory
- Check all Firebase credentials are filled in
- Restart dev server after changing `.env`

**Authentication errors:**
- Verify Email/Password provider is enabled in Firebase Console
- Check user exists in Firebase Authentication
- Ensure correct credentials

## Security Checklist

✅ No `.env` files committed to git
✅ Firebase credentials in environment variables only
✅ Firestore security rules require authentication
✅ User-specific data access enforced by rules
✅ No hardcoded API keys in source code
✅ `.env.example` has placeholder values only

## Known Limitations

- No sign-up UI (users created manually in Firebase Console)
- No historical data / past days view
- No meal editing (delete and re-add only)
- No macros tracking (protein, carbs, fats)
- No food database / search integration
- Single timezone (UTC for date calculations)

## Future Enhancements

Potential features to consider:
- Sign-up form for new users
- Historical calorie data (calendar view)
- Weekly/monthly analytics
- Meal templates for quick logging
- Macros tracking (protein, carbs, fats)
- Food database integration
- Photo uploads for meals
- Social features / meal sharing
- Export data to CSV
- Dark/light theme toggle
- Mobile app (React Native)

## License
ISC

## Repository
https://github.com/AlexSchwarz/MyFitnessComrade
