# MyFitnessComrade - Calorie Tracking App

## Project Overview
MyFitnessComrade is a modern calorie tracking application that helps users manage their daily calorie intake. Users can set daily calorie goals, log meals throughout the day, and track their progress toward their goals.

## Current Features

**Core Functionality:**
- User authentication (email/password via Firebase Auth)
- Set and edit daily calorie goals
- Personal food library with calories per 100g
- **Import foods from USDA FoodData Central database**
- Log food entries with gram amounts (calories auto-calculated)
- View today's entries with timestamps
- Edit and delete entries
- Real-time calorie totals and progress tracking
- Color-coded progress indicators (green/yellow/red)
- Persistent data storage in Firestore

**Navigation & UI:**
- Tabbed navigation with 4 sections: Calories, Foods, Weight, Account
- Mobile-first responsive design
- Bottom navigation bar on mobile devices
- Top sticky navigation on desktop
- Dark theme optimized for all screen sizes

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
- Vercel Serverless Functions (USDA API proxy only)

**Development:**
- Node.js >= 18.0.0
- Vite dev server with HMR
- Separate dev and prod Firebase projects

## Architecture

### Serverless Client-Only Design

MyFitnessComrade is a **fully client-side application** with **no backend server**. The React app communicates directly with Firebase services using the Firebase JavaScript SDK. This architecture was chosen for simplicity, cost-effectiveness, and ease of deployment.

The application runs entirely in the user's browser as a Single Page Application (SPA) built with React and Vite. It consists of three main layers: the **Views** (UI components like TodayView, FoodsView, WeightView), the **Services** (data access functions for calories, foods, weights), and **Contexts** (state management like ThemeContext).

The React app uses the Firebase JavaScript SDK to communicate over HTTPS directly with Firebase's cloud services. **Firebase Authentication** handles user login with email/password, session management, and secure token generation. **Cloud Firestore** serves as the NoSQL database, storing user data in collections: `users/{userId}`, `foods/{foodId}`, `entries/{entryId}`, `weightEntries/{id}`, and `dailySummaries/{id}`.

There is no Express server and no traditional backend. All business logic runs in the browser, and all database operations go directly from the client to Firestore.

### USDA Food Import (Serverless Proxy)

The only exception to the client-only architecture is the **USDA FoodData Central integration**. Since the USDA API requires an API key that must remain confidential, this feature uses **Vercel Serverless Functions** as a thin proxy layer:

- The browser calls `/api/usda-search` and `/api/usda-food` endpoints
- These Vercel functions hold the USDA API key securely (never exposed to client)
- Functions verify Firebase authentication before forwarding requests
- Shared rate limiting via Firestore prevents exceeding USDA's 1,000 requests/hour limit
- All other app operations remain direct client-to-Firebase

### Why No Backend?

| Aspect | Traditional Backend | This App (Serverless) |
|--------|--------------------|-----------------------|
| **Server** | Express/Node.js server required | No server needed |
| **API Layer** | Custom REST/GraphQL endpoints | Direct Firebase SDK calls |
| **Authentication** | JWT handling, session management | Firebase Auth handles everything |
| **Database Access** | Server queries database | Client queries Firestore directly |
| **Security** | Server-side validation | Firestore Security Rules |
| **Hosting** | Server + static files | Static files only (Vercel) |
| **Cost** | Server runtime costs | Pay-per-use (Firebase free tier) |
| **Scaling** | Manual scaling needed | Auto-scales with Firebase |

### Security Without a Backend

Since there's no backend to protect the database, security is enforced through **Firestore Security Rules**:

- Users can only read/write their own data (rules check `request.auth.uid`)
- All operations require authentication
- Data validation happens at the Firestore level
- The Firebase SDK handles secure token management

### Data Flow Example

```
User logs a meal:
1. User clicks "Add Entry" in TodayView.jsx
2. React calls addEntry() from services/calories.js
3. Firebase SDK sends authenticated request to Firestore
4. Firestore Security Rules verify user owns the data
5. Entry is written to entries/{entryId} collection
6. React state updates, UI re-renders with new entry
```

### Trade-offs of This Architecture

**Advantages:**
- Zero server maintenance
- No backend deployment complexity
- Automatic scaling with Firebase
- Lower hosting costs (static site hosting)
- Simpler development workflow

**Limitations:**
- Business logic runs in the client (visible to users)
- Complex queries limited by Firestore capabilities
- No server-side processing (e.g., scheduled tasks, webhooks)
- Vendor lock-in to Firebase ecosystem

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
        ├── App.jsx                 # Main app component (state + routing)
        ├── App.css                 # App styling (mobile-first)
        ├── index.css               # Global styles
        ├── config/
        │   └── firebase.js         # Firebase initialization (dev/prod switching)
        ├── components/
        │   ├── Navigation.jsx      # Tab navigation component
        │   └── views/
        │       ├── TodayView.jsx   # Calories tab (goal, summary, entries)
        │       ├── FoodsView.jsx   # Foods tab (food library management)
        │       ├── WeightView.jsx  # Weight tab (placeholder)
        │       └── AccountView.jsx # Account tab (user info, logout)
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

    // System documents (rate limiting for USDA API) - server-side only via Admin SDK
    match /system/{document} {
      allow read, write: if false; // Only accessible via Firebase Admin SDK
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
2. **Calories Tab (default):**
   - View today's calorie summary (consumed, goal, remaining)
   - Edit daily calorie goal (default: 2000 calories)
   - Log food entries by selecting from personal food library
   - Track progress with color-coded indicators (green/yellow/red)
   - View, edit, or delete today's entries
3. **Foods Tab:**
   - Manage personal food library
   - Add new foods with name and calories per 100g
   - Edit or delete existing foods
4. **Weight Tab:**
   - Placeholder for future weight tracking feature
5. **Account Tab:**
   - View logged-in user email
   - Logout button
6. **Persistence:** All data saved to Firestore, loads on page refresh

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

### Navigation Architecture
- State-based navigation using React `useState` (no React Router)
- `currentTab` state controls which view is rendered
- Views are modular components in `components/views/` directory
- All state managed in `App.jsx` and passed as props to views

### Mobile-First Responsive Design
- Base CSS targets mobile devices (< 640px)
- Desktop overrides applied via `@media (min-width: 641px)`
- Navigation: fixed bottom bar on mobile, sticky top bar on desktop
- Cards and layouts adapt to screen size

### Entry Date Handling
- Uses ISO date format (YYYY-MM-DD) for consistent querying
- Timezone-aware date calculation
- Entries sorted by `entryTime` in descending order (most recent first)

### Firestore Query Optimization
- Composite index required for foods collection (userId + name ordering)
- Entry sorting done in JavaScript instead of Firestore
- Efficient queries with `where` clauses on `userId` and `date`

### User Goal Storage
- Uses `setDoc` with `{ merge: true }` option to handle both new and existing users
- Automatically creates user document if it doesn't exist
- Prevents "No document to update" errors for new users

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

# USDA FoodData Central API (for food import feature)
USDA_API_KEY=...

# Firebase Admin SDK (for serverless function auth verification)
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
```

4. **Vercel Build Process:**
- Runs `npm install` (installs client dependencies via postinstall)
- Runs `npm run build` (builds React app with Vite)
- Serves static files from `client/dist`
- Automatic deployments on git push

## Development Patterns

### State Management
```javascript
// Navigation state
const [currentTab, setCurrentTab] = useState('calories');

// Data state
const [user, setUser] = useState(null);
const [entries, setEntries] = useState([]);
const [foods, setFoods] = useState([]);
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

### View Rendering
```javascript
const renderCurrentView = () => {
  switch (currentTab) {
    case 'calories':
      return <TodayView {...caloriesProps} />;
    case 'foods':
      return <FoodsView {...foodsProps} />;
    case 'weight':
      return <WeightView />;
    case 'account':
      return <AccountView userEmail={user.email} onLogout={handleLogout} />;
    default:
      return <TodayView {...caloriesProps} />;
  }
};
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
- Weight tracking tab is a placeholder (not yet implemented)

## Future Enhancements

Potential features to consider:
- Sign-up form for new users
- Weight tracking functionality (tab exists as placeholder)
- Historical calorie data (calendar view)
- Weekly/monthly analytics and trends
- Macros tracking (protein, carbs, fats)
- Food database integration (USDA, etc.)
- Photo uploads for meals
- Export data to CSV
- Light theme option
- Mobile app (React Native)

## License
ISC

## Repository
https://github.com/AlexSchwarz/MyFitnessComrade
