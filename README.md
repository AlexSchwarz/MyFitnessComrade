# MyFitnessComrade - Project Summary (Updated)

## Project Goal
Building a full-stack fitness tracking application called MyFitnessComrade that allows users to log workouts, track progress, and manage their fitness journey. The application is designed to be lightweight and deployable on Railway.

## Current State - Foundation Complete with Communication Layer

### What We've Built So Far

**Architecture:**
- Monorepo structure with separate client and server directories
- Express.js backend (Node.js)
- React 19 + Vite frontend
- Designed for Railway deployment (monorepo single-service approach)
- Full client-server communication layer with API service abstraction

**Backend (Express Server):**
- Location: `/server`
- Main entry: `server/index.js`
- Port: 3001 (configurable via environment variable)
- Dependencies: express, cors, dotenv
- Structure:
  - `/routes` - Route definitions
    - `health.js` - Health check (GET) and logging (POST) routes
  - `/controllers` - Business logic
    - `healthController.js` - Health check and log value handlers
  - Environment-based configuration via `.env`
  - CORS configured for both development and production
  - Static file serving in production mode (serves built React app)

**Current API Endpoints:**
1. `GET /api/health` - Returns server status (health check)
2. `POST /api/health/log` - Accepts a value, logs it to server console, returns success

**Frontend (React + Vite):**
- Location: `/client`
- React 19 with Vite dev server
- Dev server runs on port 5173
- API service layer for backend communication
- Structure:
  - `/src/services/` - API communication layer
    - `api.js` - Centralized API service with base `apiFetch()` wrapper
  - `App.jsx` - Main component with two features:
    1. Server Status Card - Displays health check results
    2. Input Sanity Check Card - Tests POST requests with input field
  - `App.css` - Styling with dark theme

**API Service Pattern (`client/src/services/api.js`):**
- Base `apiFetch()` function handles all HTTP requests
- Automatic JSON parsing and error handling
- Environment-based API URL configuration (VITE_API_URL)
- Exported functions:
  - `getHealth()` - Fetches server health status
  - `logValue(value)` - Sends POST request to log a value

**Configuration Files:**

1. **Root `package.json`:**
   - `postinstall`: Installs dependencies for both client and server (Railway uses this)
   - `build`: Builds the React client
   - `start`: Starts the Express server (used by Railway)
   - `dev:server` and `dev:client`: For local development

2. **Environment Variables:**
   - `server/.env`: PORT, NODE_ENV, CORS_ORIGIN (local dev only, not in git)
   - `client/.env`: VITE_API_URL=http://localhost:3001 (local dev only, not in git)
   - For Railway: Set NODE_ENV=production, CORS_ORIGIN in dashboard

3. **Git Configuration:**
   - Repository: https://github.com/AlexSchwarz/MyFitnessComrade.git
   - Branch: main
   - `.gitignore` properly excludes: node_modules, .env files, build outputs, IDE files, .claude/

**Deployment Setup:**
- Railway-ready monorepo configuration
- Production mode serves React app from Express server on same port
- Build process: Install deps → Build React → Start server → Server serves both API and static files
- Node version: >=18.0.0

### Data Flow Pattern (Established)

**Example: Logging a value from client to server**

```
1. User types "Hello World" in input field and clicks Submit
   ↓
2. App.jsx calls logValue("Hello World") from api.js
   ↓
3. api.js -> apiFetch('/api/health/log', { method: 'POST', body: '{"value":"Hello World"}' })
   ↓
4. HTTP POST to http://localhost:3001/api/health/log
   ↓
5. server/routes/health.js routes to healthController.logValue
   ↓
6. server/controllers/healthController.js:
   - Extracts value from req.body
   - Logs: "Received value from client: Hello World"
   - Returns: { ok: true, message: 'Value logged successfully', received: 'Hello World' }
   ↓
7. Response flows back through api.js to App.jsx
   ↓
8. App.jsx displays success message and clears input field
```

### How to Run Locally

**Development mode (two terminals):**

Terminal 1 - Start backend:
```bash
cd server
npm start
```
Server runs at http://localhost:3001
Watch this terminal for server logs (e.g., logged values from client)

Terminal 2 - Start frontend:
```bash
cd client
npm run dev
```
Client runs at http://localhost:5173

**What you'll see at http://localhost:5173:**
- "MyFitnessComrade" heading
- **Server Status Card:**
  - Shows connection status to backend
  - Green success message when connected
  - "Refresh Status" button
- **Input Sanity Check Card:**
  - Text input field
  - "Submit Value" button
  - Sends value to server and displays success/error

### What's NOT Built Yet

**No fitness features implemented yet:**
- No user authentication or authorization
- No database connection or models
- No workout tracking functionality
- No user profiles
- No exercise library
- No progress tracking or analytics
- No data persistence beyond console logs
- No actual fitness-related features

**The application currently:**
- Only has diagnostic/testing endpoints (health check, logging)
- Shows basic UI for testing client-server communication
- Has no routing beyond the two test endpoints
- Has minimal styling (dark theme, card layout)
- Does not store any data

## Technical Implementation Details

### Best Practices Established

**1. API Service Layer Pattern:**
- Single source of truth for API URL
- Centralized error handling
- Consistent request/response format
- Easy to extend with new endpoints

**2. Controller-Route Separation:**
- Routes define HTTP methods and paths
- Controllers contain business logic
- Clear separation of concerns
- Easy to test and maintain

**3. State Management Pattern:**
- Separate state for loading, error, and data
- Try/catch/finally for async operations
- Clear error messages to users
- Loading states prevent double submissions

**4. Environment Configuration:**
- Sensitive values in .env files (not committed)
- Defaults for missing environment variables
- Different configs for dev/production
- Railway can inject environment variables

**5. CORS Configuration:**
- Environment-based origins
- Credentials support enabled
- Configurable for different deployment environments

### Code Quality Standards

**Backend:**
- Express middleware properly ordered
- JSON body parsing enabled
- Async error handling via try/catch
- Consistent response format: `{ ok: boolean, message: string, ...data }`

**Frontend:**
- React Hooks for state management (useState, useEffect)
- Controlled form components
- Proper form submission with preventDefault()
- Input validation before API calls
- Disabled states during loading

## Next Steps for Future Development

The foundation and communication layer are complete. Next steps would typically include:

1. **Database Integration:**
   - Choose database (PostgreSQL, MongoDB, or SQLite)
   - Set up connection and configuration
   - Create database schema/models

2. **Authentication System:**
   - User registration and login
   - JWT or session-based auth
   - Protected routes and middleware
   - User profile management

3. **Workout Tracking Features:**
   - Create workout models (exercises, sets, reps, weight)
   - API endpoints for CRUD operations
   - Frontend forms for logging workouts
   - Workout history display

4. **Data Visualization:**
   - Progress charts and graphs
   - Exercise statistics
   - Personal records tracking
   - Goal setting and tracking

5. **Frontend Routing:**
   - Install React Router
   - Create pages (Home, Workouts, Profile, etc.)
   - Navigation components

6. **Enhanced UI/UX:**
   - Design system/component library
   - Responsive design for mobile
   - Loading skeletons
   - Toast notifications

## Technical Decisions Made

- **Deployment strategy**: Monorepo on Railway (single service, not microservices)
- **Frontend**: React 19 with Vite (not Create React App)
- **Backend framework**: Express.js with organized routes/controllers
- **API pattern**: RESTful with centralized API service layer
- **State management**: React Hooks (no Redux/MobX needed yet)
- **Styling**: Plain CSS with dark theme (no Tailwind/styled-components yet)
- **CORS handling**: Environment-based configuration with credentials support
- **Static serving**: Express serves production React build
- **Error handling**: Consistent try/catch patterns with user-friendly messages

## File Structure

```
MyFitnessComrade/
├── .gitignore                      # Excludes env files, node_modules, build outputs
├── package.json                    # Root monorepo scripts for Railway
├── README.md                       # Repository README
│
├── client/                         # React frontend
│   ├── .env                        # Client env vars (not in git)
│   ├── .gitignore                  # Client-specific ignores
│   ├── package.json                # Client dependencies
│   ├── vite.config.js              # Vite configuration
│   ├── index.html                  # HTML entry point
│   └── src/
│       ├── main.jsx                # React entry point
│       ├── App.jsx                 # Main app component with UI
│       ├── App.css                 # App styling
│       ├── index.css               # Global styles
│       └── services/
│           └── api.js              # API service layer ⭐
│
└── server/                         # Express backend
    ├── .env                        # Server env vars (not in git)
    ├── .gitignore                  # Server-specific ignores
    ├── package.json                # Server dependencies
    ├── index.js                    # Express app entry point
    ├── controllers/
    │   └── healthController.js     # Health & log endpoints ⭐
    └── routes/
        └── health.js               # Health routes ⭐
```

⭐ = Key files for understanding the API pattern

## How to Add New API Endpoints

Follow this established pattern:

1. **Create Controller Function** in `/server/controllers/`:
   ```javascript
   const myFunction = (req, res) => {
     // Extract data from req.body or req.params
     // Perform business logic
     // Return response: res.json({ ok: true, ...data })
   };
   module.exports = { myFunction };
   ```

2. **Create/Update Route** in `/server/routes/`:
   ```javascript
   const controller = require("../controllers/myController");
   router.post("/path", controller.myFunction);
   ```

3. **Register Route** in `/server/index.js`:
   ```javascript
   const myRoutes = require("./routes/myRoute");
   app.use("/api/myresource", myRoutes);
   ```

4. **Add API Function** in `/client/src/services/api.js`:
   ```javascript
   export async function myApiCall(data) {
     return apiFetch('/api/myresource/path', {
       method: 'POST',
       body: JSON.stringify(data),
     });
   }
   ```

5. **Use in React Component**:
   ```javascript
   import { myApiCall } from './services/api';

   const handleSubmit = async () => {
     try {
       setLoading(true);
       const result = await myApiCall(data);
       // Handle success
     } catch (err) {
       // Handle error
     } finally {
       setLoading(false);
     }
   };
   ```

## Common Development Tasks

**Start development servers:**
```bash
# Terminal 1
cd server && npm start

# Terminal 2
cd client && npm run dev
```

**Stop all node processes (Windows):**
```bash
taskkill //F //IM node.exe
```

**View server logs:**
Watch Terminal 1 (where server is running) for console.log output

**Test API with curl:**
```bash
# GET request
curl http://localhost:3001/api/health

# POST request
curl -X POST http://localhost:3001/api/health/log \
  -H "Content-Type: application/json" \
  -d '{"value":"test"}'
```

**Deploy to Railway:**
1. Push code to GitHub
2. Connect Railway to GitHub repo
3. Set environment variables in Railway dashboard:
   - NODE_ENV=production
   - CORS_ORIGIN=* (or specific domain)
4. Railway automatically runs:
   - `npm install` (triggers postinstall)
   - `npm run build` (builds client)
   - `npm start` (starts server)

## Known Working Features

✅ Server starts and listens on port 3001
✅ Client dev server runs on port 5173
✅ CORS properly configured for cross-origin requests
✅ Health check endpoint returns server status
✅ Client can fetch and display server health
✅ POST endpoint receives and logs client data
✅ Input form validates and submits data to server
✅ Error handling works (empty input, server down)
✅ Loading states prevent double submissions
✅ Success/error messages display to user
✅ Railway deployment configuration ready
✅ Git repository properly configured with .gitignore
✅ Environment variables properly excluded from version control

## Troubleshooting

**Server won't start:**
- Check port 3001 is not already in use
- Verify .env file exists in server directory
- Check dependencies installed: `cd server && npm install`

**Client can't connect to server:**
- Verify server is running (check Terminal 1)
- Check CORS_ORIGIN in server/.env includes client URL
- Restart server if .env was modified

**CORS errors in browser:**
- Verify server has CORS middleware enabled
- Check server/.env has CORS_ORIGIN=http://localhost:5173
- Restart server after environment changes

**Background node processes won't stop:**
- Use: `taskkill //F //IM node.exe` (Windows)
- Don't run server with `&` operator in production

The codebase is clean, well-organized, and ready for feature development with established patterns for API communication, error handling, and state management.