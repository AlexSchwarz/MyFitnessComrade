# MyFitnessComrade - Calorie Tracking App

## Project Overview
MyFitnessComrade is a modern calorie tracking application that helps users manage their daily calorie intake. Users can set daily calorie goals, log meals throughout the day, and track their progress toward their goals.

## Current Features

**Core Functionality:**
- User authentication (email/password via Firebase Auth)
- Set and edit daily calorie goals
- Personal food library with calories per 100g
- Log food entries with gram amounts (calories auto-calculated)
- View today's entries with timestamps
- Edit and delete entries
- Real-time calorie totals and progress tracking
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
├── package.json                    # Root scripts
├── vercel.json                     # Vercel deployment configuration
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
            ├── calories.js         # Entry tracking functions
            └── foods.js            # Food library functions
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

**foods/{foodId}**
```javascript
{
  userId: string,                 // Reference to user
  name: string,                   // e.g., "Chicken Breast"
  caloriesPer100g: number,        // e.g., 165
  createdAt: timestamp,
  updatedAt: timestamp
}
```

**entries/{entryId}**
```javascript
{
  userId: string,                 // Reference to user
  date: string,                   // YYYY-MM-DD format
  foodId: string,                 // Reference to food
  foodName: string,               // Denormalized for display
  grams: number,                  // Amount in grams
  calories: number,               // Pre-calculated calories
  entryTime: timestamp,           // When entry was logged
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

    // Users can only read/write/delete their own foods
    match /foods/{foodId} {
      allow read, delete: if request.auth.uid == resource.data.userId;
      allow create: if request.auth.uid == request.resource.data.userId;
      allow update: if request.auth.uid == resource.data.userId;
    }

    // Users can only read/write/delete their own entries
    match /entries/{entryId} {
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
4. **Manage Foods:** Add foods to personal library with name and calories per 100g
5. **Log Entry:** Select food from library, enter grams, calories auto-calculated
6. **Track Progress:**
   - Progress bar shows percentage of goal consumed
   - Color indicators: green (under goal), yellow (near goal), red (over goal)
   - Real-time total calculation
7. **Manage Entries:** View today's entries, edit or delete as needed
8. **Persistence:** All data saved to Firestore, loads on page refresh

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

### Entry Tracking (`services/calories.js`)
```javascript
import { getUserGoal, setUserGoal, addEntry, getTodaysEntries, updateEntry, deleteEntry } from './services/calories';

// Get user's daily goal
const goal = await getUserGoal(userId);

// Update goal
await setUserGoal(userId, 2500);

// Log an entry
const entry = await addEntry(userId, foodId, 'Grilled Chicken', 150, 248);

// Get today's entries
const entries = await getTodaysEntries(userId);

// Update an entry
await updateEntry(entryId, foodId, 'Grilled Chicken', 200, 330);

// Delete an entry
await deleteEntry(entryId);
```

### Food Library (`services/foods.js`)
```javascript
import { getUserFoods, addFood, updateFood, deleteFood, calculateCalories } from './services/foods';

// Get user's food library
const foods = await getUserFoods(userId);

// Add a new food
const food = await addFood(userId, 'Chicken Breast', 165);

// Update a food
await updateFood(foodId, 'Grilled Chicken Breast', 165);

// Delete a food
await deleteFood(foodId);

// Calculate calories for a given amount
const calories = calculateCalories(165, 150); // 248 calories for 150g
```

## Key Implementation Details

### Firebase Configuration (`client/src/config/firebase.js`)
- Automatically switches between dev and prod Firebase projects based on `import.meta.env.MODE`
- Development mode uses `VITE_FIREBASE_DEV_*` variables
- Production mode uses `VITE_FIREBASE_PROD_*` variables

### Entry Date Handling
- Uses ISO date format (YYYY-MM-DD) for consistent querying
- Timezone-aware date calculation
- Entries sorted by `entryTime` in descending order (most recent first)

### Firestore Query Optimization
- Composite index required for foods collection (userId + name ordering)
- Entry sorting done in JavaScript instead of Firestore
- Efficient queries with `where` clauses on `userId` and `date`

### Security Best Practices
- All `.env` files excluded from git
- Client-side security rules enforce user-specific access
- Authentication required for all Firestore operations
- No API keys or credentials in source code

## Deployment

### Vercel Deployment (Recommended)

1. **Push to GitHub:**
```bash
git push origin main
```

2. **Connect Vercel:**
- Go to [vercel.com/new](https://vercel.com/new)
- Import your GitHub repository
- Vercel auto-detects Vite configuration

3. **Configure Environment Variables in Vercel Dashboard:**
```
VITE_FIREBASE_PROD_API_KEY=...
VITE_FIREBASE_PROD_AUTH_DOMAIN=...
VITE_FIREBASE_PROD_PROJECT_ID=...
VITE_FIREBASE_PROD_STORAGE_BUCKET=...
VITE_FIREBASE_PROD_MESSAGING_SENDER_ID=...
VITE_FIREBASE_PROD_APP_ID=...
```

4. **Vercel Build Process:**
- Runs `npm install` (installs client dependencies via postinstall)
- Runs `npm run build` (builds React app with Vite)
- Serves static files from `client/dist`
- Automatic deployments on git push

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

**Entries not loading after page refresh:**
- Check browser console for errors
- Verify Firestore has data with correct structure
- Ensure `date` field format is YYYY-MM-DD
- Check `userId` matches authenticated user

**Foods not loading / index error:**
- Create composite index for foods collection in Firebase Console
- Index required: userId (Ascending), name (Ascending)

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
- No macros tracking (protein, carbs, fats)
- No food database / search integration
- Single timezone (UTC for date calculations)

## Future Enhancements

Potential features to consider:
- Sign-up form for new users
- Historical calorie data (calendar view)
- Weekly/monthly analytics
- Macros tracking (protein, carbs, fats)
- Food database integration (USDA, etc.)
- Photo uploads for meals
- Export data to CSV
- Dark/light theme toggle
- Mobile app (React Native)

## License
ISC

## Repository
https://github.com/AlexSchwarz/MyFitnessComrade
