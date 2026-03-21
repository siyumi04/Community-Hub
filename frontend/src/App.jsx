import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Header from './components/Header/Header'
import Footer from './components/Footer/Footer'
import HomePage from './components/HomePage/HomePage'
import Dashboard from './components/Dashboard/Dashboard'
import EditProfile from './components/EditProfile/EditProfile'
import Login from './components/Login/Login'
import Register from './components/Register/Register'
import PopupMessage from './components/PopupMessage/PopupMessage'
import ForgotPassword from './components/ForgotPassword/ForgotPassword'

function App() {
  return (
    <Router>
      <PopupMessage />
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/edit-profile" element={<EditProfile />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Routes>
      <Footer />
    </Router>
  )
}

export default App
