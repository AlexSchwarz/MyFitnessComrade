import { useState, useEffect } from 'react'
import './App.css'
import { signIn, logout, subscribeToAuthChanges } from './services/firebase'
import { getUserGoal, setUserGoal, addEntry, getTodaysEntries, updateEntry, deleteEntry } from './services/calories'
import { getUserFoods, addFood, updateFood, deleteFood, calculateCalories, seedDefaultFoods } from './services/foods'
import Navigation from './components/Navigation'
import TodayView from './components/views/TodayView'
import FoodsView from './components/views/FoodsView'
import WeightView from './components/views/WeightView'
import AccountView from './components/views/AccountView'

function App() {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  // Navigation state
  const [currentTab, setCurrentTab] = useState('calories')

  // Login state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState(null)
  const [loginLoading, setLoginLoading] = useState(false)

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

  const loadUserData = async () => {
    try {
      const [goal, todaysEntries, userFoods] = await Promise.all([
        getUserGoal(user.uid),
        getTodaysEntries(user.uid),
        getUserFoods(user.uid)
      ])

      setDailyGoal(goal)
      setEntries(todaysEntries)
      setFoods(userFoods)
    } catch (err) {
      console.error('Error loading user data:', err)
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()

    if (!email.trim() || !password.trim()) {
      setLoginError('Please enter email and password')
      return
    }

    try {
      setLoginLoading(true)
      setLoginError(null)
      await signIn(email, password)
      setEmail('')
      setPassword('')
    } catch (err) {
      setLoginError(err.message)
    } finally {
      setLoginLoading(false)
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
    setSelectedFoodId(entry.foodId)
    setGrams(entry.grams.toString())
    setEntryError(null)
  }

  const handleCancelEditEntry = () => {
    setEditingEntryId(null)
    setSelectedFoodId('')
    setGrams('')
    setCalculatedCalories(0)
    setEntryError(null)
  }

  const handleAddEntry = async (e) => {
    e.preventDefault()

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

      setSelectedFoodId('')
      setGrams('')
      setCalculatedCalories(0)
    } catch (err) {
      setEntryError(err.message)
    } finally {
      setEntryLoading(false)
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
        <h1>MyFitnessComrade</h1>
        <p className="subtitle">Your Personal Calorie Tracker</p>

        <div className="card">
          <h2>Login</h2>
          <form onSubmit={handleLogin}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              disabled={loginLoading}
              className="input"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              disabled={loginLoading}
              className="input"
            />

            {loginError && (
              <div className="error">
                <p>{loginError}</p>
              </div>
            )}

            <button type="submit" disabled={loginLoading} className="button">
              {loginLoading ? 'Logging in...' : 'Login'}
            </button>
          </form>
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
            entries={entries}
            handleEditEntry={handleEditEntry}
            handleDeleteEntry={handleDeleteEntry}
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
        return <WeightView />
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
