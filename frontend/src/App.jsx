import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import NavBar from './components/NavBar'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import NotFound from './pages/NotFound'
import { Analytics } from '@vercel/analytics/react'

function AppRoutes() {
    return (
      <>
          <NavBar />
          <Routes>
              <Route path="/" element={<HomePage />}/>
              <Route path="/dashboard" element={<Dashboard />}/>
              <Route path="/profile" element={<Profile />}/>
              <Route path="*" element={<NotFound />} />
          </Routes>
      </>
    )
}

export default function App() {
    return (
        <BrowserRouter>
            <Analytics />
            <AppRoutes />
        </BrowserRouter>
    )
}
