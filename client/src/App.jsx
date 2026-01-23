import { useState, useEffect, useMemo } from 'react'
import './App.css'
import { signIn, signUp, logout, subscribeToAuthChanges } from './services/firebase'
import { getUserGoal, setUserGoal, addEntry, getTodaysEntries, updateEntry, deleteEntry, deleteEntriesForDate } from './services/calories'
import { getUserFoods, addFood, updateFood, deleteFood, calculateCalories, seedDefaultFoods } from './services/foods'
import { addWeightEntry, getWeightEntries, updateWeightEntry, deleteWeightEntry } from './services/weights'
import { getDailySummaries, calculateStreak, hasDailySummaries, backfillDailySummaries } from './services/dailySummary'
import Navigation from './components/Navigation'
import TodayView from './components/views/TodayView'
import FoodsView from './components/views/FoodsView'
import WeightView from './components/views/WeightView'
import AccountView from './components/views/AccountView'
import CalorieStatsView from './components/views/CalorieStatsView'

function App() {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  // Navigation state
  const [currentTab, setCurrentTab] = useState('calories')

  // Login/Register state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [authError, setAuthError] = useState(null)
  const [authFormLoading, setAuthFormLoading] = useState(false)
  const [isRegisterMode, setIsRegisterMode] = useState(false)

  // Calorie tracking state
  const [dailyGoal, setDailyGoal] = useState(2000)
  const [entries, setEntries] = useState([])
  const [totalCalories, setTotalCalories] = useState(0)

  // Foods state
  const [foods, setFoods] = useState([])
  const [showFoodForm, setShowFoodForm] = useState(false)
  const [foodFormName, setFoodFormName] = useState('')
  const [foodFormCalories, setFoodFormCalories] = useState('')
  const [foodError, setFoodError] = useState(null)
  const [foodLoading, setFoodLoading] = useState(false)
  const [editingFoodId, setEditingFoodId] = useState(null)

  // Entry form state
  const [selectedFoodId, setSelectedFoodId] = useState('')
  const [grams, setGrams] = useState('')
  const [calculatedCalories, setCalculatedCalories] = useState(0)
  const [entryError, setEntryError] = useState(null)
  const [entryLoading, setEntryLoading] = useState(false)
  const [editingEntryId, setEditingEntryId] = useState(null)

  // Custom entry state (for entries without food reference)
  const [customName, setCustomName] = useState('')
  const [customCalories, setCustomCalories] = useState('')
  const [isCustomMode, setIsCustomMode] = useState(false)

  // Weight tracking state
  const [weightEntries, setWeightEntries] = useState([])
  const [weightFormValue, setWeightFormValue] = useState('')
  const [weightFormDateTime, setWeightFormDateTime] = useState('')
  const [weightError, setWeightError] = useState(null)
  const [weightLoading, setWeightLoading] = useState(false)
  const [editingWeightId, setEditingWeightId] = useState(null)
  const [selectedWeightDays, setSelectedWeightDays] = useState(30)

  // Stats state
  const [dailySummaries, setDailySummaries] = useState([])
  const [selectedStatsDays, setSelectedStatsDays] = useState(7)
  const [statsLoading, setStatsLoading] = useState(false)

  // Derived streak calculation
  const currentStreak = useMemo(() => {
    return calculateStreak(dailySummaries, dailyGoal)
  }, [dailySummaries, dailyGoal])

  // Helper to get current datetime in local format for datetime-local input
  const getCurrentDateTimeLocal = () => {
    const now = new Date()
    const offset = now.getTimezoneOffset()
    const local = new Date(now.getTime() - offset * 60 * 1000)
    return local.toISOString().slice(0, 16)
  }

  // Initialize weight form datetime on mount
  useEffect(() => {
    setWeightFormDateTime(getCurrentDateTimeLocal())
  }, [])

  // Subscribe to auth state changes
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((user) => {
      setUser(user)
      setAuthLoading(false)
    })
    return () => unsubscribe()
  }, [])

  // Load user data when logged in
  useEffect(() => {
    if (user) {
      loadUserData()
    }
  }, [user])

  // Calculate total calories whenever entries change
  useEffect(() => {
    const total = entries.reduce((sum, entry) => sum + entry.calories, 0)
    setTotalCalories(total)
  }, [entries])

  // Calculate calories when food or grams change
  useEffect(() => {
    if (selectedFoodId && grams) {
      const food = foods.find(f => f.id === selectedFoodId)
      if (food) {
        const calories = calculateCalories(food.caloriesPer100g, parseFloat(grams))
        setCalculatedCalories(calories)
      }
    } else {
      setCalculatedCalories(0)
    }
  }, [selectedFoodId, grams, foods])

  // Load stats data when entering stats tab
  useEffect(() => {
    if (user && currentTab === 'stats') {
      loadStatsData()
    }
  }, [user, currentTab])

  // Reload weight entries when selected range changes
  useEffect(() => {
    if (user) {
      loadWeightEntries()
    }
  }, [user, selectedWeightDays])

  const loadWeightEntries = async () => {
    try {
      const entries = await getWeightEntries(user.uid, selectedWeightDays)
      setWeightEntries(entries)
    } catch (error) {
      console.error('Error loading weight entries:', error)
    }
  }

  const loadStatsData = async () => {
    setStatsLoading(true)
    try {
      // Check for migration need (first time only)
      const hasSummaries = await hasDailySummaries(user.uid)
      if (!hasSummaries) {
        await backfillDailySummaries(user.uid)
      }

      const summaries = await getDailySummaries(user.uid, 30)
      setDailySummaries(summaries)
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setStatsLoading(false)
    }
  }

  const loadUserData = async () => {
    try {
      const [goal, todaysEntries, userFoods, userWeightEntries] = await Promise.all([
        getUserGoal(user.uid),
        getTodaysEntries(user.uid),
        getUserFoods(user.uid),
        getWeightEntries(user.uid, 30)
      ])

      setDailyGoal(goal)
      setEntries(todaysEntries)
      setFoods(userFoods)
      setWeightEntries(userWeightEntries)
    } catch (err) {
      console.error('Error loading user data:', err)
    }
  }

  const handleAuth = async (e) => {
    e.preventDefault()

    if (!email.trim() || !password.trim()) {
      setAuthError('Please enter email and password')
      return
    }

    if (isRegisterMode && password !== confirmPassword) {
      setAuthError('Passwords do not match')
      return
    }

    try {
      setAuthFormLoading(true)
      setAuthError(null)

      if (isRegisterMode) {
        await signUp(email, password)
      } else {
        await signIn(email, password)
      }

      setEmail('')
      setPassword('')
      setConfirmPassword('')
    } catch (err) {
      setAuthError(err.message)
    } finally {
      setAuthFormLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      setEntries([])
      setFoods([])
      setDailyGoal(2000)
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  // Food management functions
  const handleShowFoodForm = () => {
    setShowFoodForm(true)
    setEditingFoodId(null)
    setFoodFormName('')
    setFoodFormCalories('')
    setFoodError(null)
  }

  const handleEditFood = (food) => {
    setShowFoodForm(true)
    setEditingFoodId(food.id)
    setFoodFormName(food.name)
    setFoodFormCalories(food.caloriesPer100g.toString())
    setFoodError(null)
  }

  const handleCancelFoodForm = () => {
    setShowFoodForm(false)
    setEditingFoodId(null)
    setFoodFormName('')
    setFoodFormCalories('')
    setFoodError(null)
  }

  const handleSaveFood = async (e) => {
    e.preventDefault()

    if (!foodFormName.trim()) {
      setFoodError('Please enter a food name')
      return
    }

    const caloriesNum = parseFloat(foodFormCalories)
    if (isNaN(caloriesNum) || caloriesNum <= 0) {
      setFoodError('Please enter valid calories per 100g')
      return
    }

    try {
      setFoodLoading(true)
      setFoodError(null)

      if (editingFoodId) {
        // Update existing food
        await updateFood(user.uid, editingFoodId, foodFormName, caloriesNum)
        setFoods(foods.map(f =>
          f.id === editingFoodId
            ? { ...f, name: foodFormName, caloriesPer100g: caloriesNum }
            : f
        ))
      } else {
        // Add new food
        const newFood = await addFood(user.uid, foodFormName, caloriesNum)
        setFoods([...foods, newFood].sort((a, b) => a.name.localeCompare(b.name)))
      }

      handleCancelFoodForm()
    } catch (err) {
      setFoodError(err.message)
    } finally {
      setFoodLoading(false)
    }
  }

  const handleDeleteFood = async (foodId) => {
    if (!confirm('Are you sure you want to delete this food?')) {
      return
    }

    try {
      await deleteFood(user.uid, foodId)
      setFoods(foods.filter(f => f.id !== foodId))
    } catch (err) {
      console.error('Error deleting food:', err)
    }
  }

  // Entry logging functions
  const handleEditEntry = (entry) => {
    setEditingEntryId(entry.id)
    setEntryError(null)

    // Check if this is a custom entry (no foodId)
    if (entry.foodId) {
      // Food-based entry - open in Food mode
      setIsCustomMode(false)
      setSelectedFoodId(entry.foodId)
      setGrams(entry.grams.toString())
      setCustomName('')
      setCustomCalories('')
    } else {
      // Custom entry - open in Custom mode
      setIsCustomMode(true)
      setSelectedFoodId('')
      setGrams('')
      setCustomName(entry.foodName)
      setCustomCalories(entry.calories.toString())
    }
  }

  const handleCancelEditEntry = () => {
    setEditingEntryId(null)
    setIsCustomMode(false)
    setSelectedFoodId('')
    setGrams('')
    setCalculatedCalories(0)
    setCustomName('')
    setCustomCalories('')
    setEntryError(null)
  }

  // Mode toggle handlers with input clearing
  const handleSwitchToCustomMode = () => {
    setIsCustomMode(true)
    // Clear food mode inputs
    setSelectedFoodId('')
    setGrams('')
    setCalculatedCalories(0)
    setEntryError(null)
  }

  const handleSwitchToFoodMode = () => {
    setIsCustomMode(false)
    // Clear custom mode inputs
    setCustomName('')
    setCustomCalories('')
    setEntryError(null)
  }

  const handleAddEntry = async (e) => {
    e.preventDefault()

    if (isCustomMode) {
      // Custom entry validation
      if (!customName.trim()) {
        setEntryError('Please enter a name')
        return
      }
      const caloriesNum = parseFloat(customCalories)
      if (isNaN(caloriesNum) || caloriesNum <= 0) {
        setEntryError('Please enter valid calories')
        return
      }

      try {
        setEntryLoading(true)
        setEntryError(null)

        if (editingEntryId) {
          // Update existing entry to custom
          await updateEntry(user.uid, editingEntryId, null, customName.trim(), null, caloriesNum)
          setEntries(entries.map(e =>
            e.id === editingEntryId
              ? { ...e, foodId: undefined, foodName: customName.trim(), grams: undefined, calories: caloriesNum }
              : e
          ))
          setEditingEntryId(null)
        } else {
          // Add new custom entry
          const newEntry = await addEntry(user.uid, null, customName.trim(), null, caloriesNum)
          setEntries([newEntry, ...entries])
        }

        // Reset to default state (Food mode)
        setIsCustomMode(false)
        setCustomName('')
        setCustomCalories('')
      } catch (err) {
        setEntryError(err.message)
      } finally {
        setEntryLoading(false)
      }
    } else {
      // Food-based entry validation
      if (!selectedFoodId) {
        setEntryError('Please select a food')
        return
      }
      const gramsNum = parseFloat(grams)
      if (isNaN(gramsNum) || gramsNum <= 0) {
        setEntryError('Please enter a valid amount in grams')
        return
      }

      try {
        setEntryLoading(true)
        setEntryError(null)

        const food = foods.find(f => f.id === selectedFoodId)
        const calories = calculateCalories(food.caloriesPer100g, gramsNum)

        if (editingEntryId) {
          // Update existing entry
          await updateEntry(user.uid, editingEntryId, selectedFoodId, food.name, gramsNum, calories)
          setEntries(entries.map(e =>
            e.id === editingEntryId
              ? { ...e, foodId: selectedFoodId, foodName: food.name, grams: gramsNum, calories }
              : e
          ))
          setEditingEntryId(null)
        } else {
          // Add new entry
          const newEntry = await addEntry(
            user.uid,
            selectedFoodId,
            food.name,
            gramsNum,
            calories
          )
          setEntries([newEntry, ...entries])
        }

        // Reset to default state (Food mode, no selection)
        setSelectedFoodId('')
        setGrams('')
        setCalculatedCalories(0)
      } catch (err) {
        setEntryError(err.message)
      } finally {
        setEntryLoading(false)
      }
    }
  }

  const handleDeleteEntry = async (entryId) => {
    try {
      await deleteEntry(user.uid, entryId)
      setEntries(entries.filter(entry => entry.id !== entryId))
    } catch (err) {
      console.error('Error deleting entry:', err)
    }
  }

  // Weight tracking functions
  const handleEditWeight = (entry) => {
    setEditingWeightId(entry.id)
    setWeightFormValue(entry.weight.toString())
    // Convert ISO string to datetime-local format
    const entryDate = new Date(entry.entryTime)
    const offset = entryDate.getTimezoneOffset()
    const local = new Date(entryDate.getTime() - offset * 60 * 1000)
    setWeightFormDateTime(local.toISOString().slice(0, 16))
    setWeightError(null)
  }

  const handleCancelEditWeight = () => {
    setEditingWeightId(null)
    setWeightFormValue('')
    setWeightFormDateTime(getCurrentDateTimeLocal())
    setWeightError(null)
  }

  const handleAddWeight = async (e) => {
    e.preventDefault()

    const weightNum = parseFloat(weightFormValue)
    if (isNaN(weightNum) || weightNum <= 0) {
      setWeightError('Please enter a valid weight')
      return
    }

    // Convert datetime-local to ISO string
    const entryTime = new Date(weightFormDateTime).toISOString()

    try {
      setWeightLoading(true)
      setWeightError(null)

      if (editingWeightId) {
        // Update existing entry
        await updateWeightEntry(user.uid, editingWeightId, weightNum, entryTime)
        setWeightEntries(weightEntries.map(e =>
          e.id === editingWeightId
            ? { ...e, weight: weightNum, entryTime, updatedAt: new Date().toISOString() }
            : e
        ).sort((a, b) => new Date(b.entryTime) - new Date(a.entryTime)))
        setEditingWeightId(null)
      } else {
        // Add new entry
        const newEntry = await addWeightEntry(user.uid, weightNum, entryTime)
        setWeightEntries([newEntry, ...weightEntries].sort((a, b) => new Date(b.entryTime) - new Date(a.entryTime)))
      }

      setWeightFormValue('')
      setWeightFormDateTime(getCurrentDateTimeLocal())
    } catch (err) {
      setWeightError(err.message)
    } finally {
      setWeightLoading(false)
    }
  }

  const handleDeleteWeight = async (entryId) => {
    if (!confirm('Are you sure you want to delete this weight entry?')) {
      return
    }

    try {
      await deleteWeightEntry(user.uid, entryId)
      setWeightEntries(weightEntries.filter(entry => entry.id !== entryId))
    } catch (err) {
      console.error('Error deleting weight entry:', err)
    }
  }

  // Stats functions
  const handleDeleteDayEntries = async (date) => {
    if (!confirm(`Are you sure you want to delete all entries for ${date}?`)) {
      return
    }

    try {
      await deleteEntriesForDate(user.uid, date)
      // Refresh stats data
      await loadStatsData()
      // Also refresh today's entries if the deleted date is today
      const today = new Date().toISOString().split('T')[0]
      if (date === today) {
        const todaysEntries = await getTodaysEntries(user.uid)
        setEntries(todaysEntries)
      }
    } catch (err) {
      console.error('Error deleting day entries:', err)
    }
  }

  const remainingCalories = dailyGoal - totalCalories
  const percentageConsumed = (totalCalories / dailyGoal) * 100

  if (authLoading) {
    return (
      <div className="app">
        <h1>MyFitnessComrade</h1>
        <p>Loading...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="app login-screen">
        <div className="login-container">
          <div className="login-header">
            <h2 className="login-title">MyFitnessComrade</h2>
          </div>

          <div className="card login-card">
            <div className="login-card-inner">
              <h2>{isRegisterMode ? 'Register' : 'Login'}</h2>
              <form onSubmit={handleAuth} className="login-form">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  disabled={authFormLoading}
                  className="input"
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  disabled={authFormLoading}
                  className="input"
                />

                {isRegisterMode && (
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm Password"
                    disabled={authFormLoading}
                    className="input"
                  />
                )}

                {authError && (
                  <div className="error">
                    <p>{authError}</p>
                  </div>
                )}

                <button type="submit" disabled={authFormLoading} className="button">
                  {authFormLoading
                    ? (isRegisterMode ? 'Creating account...' : 'Logging in...')
                    : (isRegisterMode ? 'Create Account' : 'Login')
                  }
                </button>
              </form>

              <p className="auth-toggle-text">
                {isRegisterMode ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegisterMode(!isRegisterMode)
                    setAuthError(null)
                    setConfirmPassword('')
                  }}
                  className="auth-toggle-link"
                  disabled={authFormLoading}
                >
                  {isRegisterMode ? 'Login' : 'Register'}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }



  const renderCurrentView = () => {
    switch (currentTab) {
      case 'calories':
        return (
          <TodayView
            dailyGoal={dailyGoal}
            totalCalories={totalCalories}
            remainingCalories={remainingCalories}
            percentageConsumed={percentageConsumed}
            foods={foods}
            selectedFoodId={selectedFoodId}
            setSelectedFoodId={setSelectedFoodId}
            grams={grams}
            setGrams={setGrams}
            calculatedCalories={calculatedCalories}
            entryError={entryError}
            entryLoading={entryLoading}
            editingEntryId={editingEntryId}
            handleAddEntry={handleAddEntry}
            handleCancelEditEntry={handleCancelEditEntry}
            isCustomMode={isCustomMode}
            handleSwitchToCustomMode={handleSwitchToCustomMode}
            handleSwitchToFoodMode={handleSwitchToFoodMode}
            customName={customName}
            setCustomName={setCustomName}
            customCalories={customCalories}
            setCustomCalories={setCustomCalories}
            entries={entries}
            handleEditEntry={handleEditEntry}
            handleDeleteEntry={handleDeleteEntry}
          />
        )
      case 'stats':
        return (
          <CalorieStatsView
            dailySummaries={dailySummaries}
            dailyGoal={dailyGoal}
            streak={currentStreak}
            selectedDays={selectedStatsDays}
            onDaysChange={setSelectedStatsDays}
            loading={statsLoading}
            onDeleteDayEntries={handleDeleteDayEntries}
          />
        )
      case 'foods':
        return (
          <FoodsView
            foods={foods}
            showFoodForm={showFoodForm}
            foodFormName={foodFormName}
            setFoodFormName={setFoodFormName}
            foodFormCalories={foodFormCalories}
            setFoodFormCalories={setFoodFormCalories}
            foodError={foodError}
            foodLoading={foodLoading}
            editingFoodId={editingFoodId}
            handleShowFoodForm={handleShowFoodForm}
            handleEditFood={handleEditFood}
            handleCancelFoodForm={handleCancelFoodForm}
            handleSaveFood={handleSaveFood}
            handleDeleteFood={handleDeleteFood}
          />
        )
      case 'weight':
        return (
          <WeightView
            weightEntries={weightEntries}
            weightFormValue={weightFormValue}
            setWeightFormValue={setWeightFormValue}
            weightFormDateTime={weightFormDateTime}
            setWeightFormDateTime={setWeightFormDateTime}
            weightError={weightError}
            weightLoading={weightLoading}
            editingWeightId={editingWeightId}
            handleAddWeight={handleAddWeight}
            handleEditWeight={handleEditWeight}
            handleCancelEditWeight={handleCancelEditWeight}
            handleDeleteWeight={handleDeleteWeight}
            selectedDays={selectedWeightDays}
            onDaysChange={setSelectedWeightDays}
          />
        )
      case 'account':
        return (
          <AccountView
            userEmail={user.email}
            userId={user.uid}
            onLogout={handleLogout}
            onSeedFoods={async () => {
              await seedDefaultFoods(user.uid)
              const updatedFoods = await getUserFoods(user.uid)
              setFoods(updatedFoods)
            }}
            dailyGoal={dailyGoal}
            onSaveGoal={async (newGoal) => {
              await setUserGoal(user.uid, newGoal)
              setDailyGoal(newGoal)
            }}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="app">
      <Navigation currentTab={currentTab} onTabChange={setCurrentTab} />

      <main className="main-content">
        {renderCurrentView()}
      </main>
    </div>
  )
}

export default App
