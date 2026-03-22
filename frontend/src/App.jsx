import { Routes, Route, Navigate } from 'react-router-dom'
import Header from './components/Header/Header'
import Footer from './components/Footer/Footer'
import CommunityDetailsPage from './pages/CommunityDetailsPage'
import CommunityMemberPage from './pages/CommunityMemberPage'

import './App.css'

function App() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Navigate to="/communities/cricket" replace />} />
          <Route path="/communities/:id" element={<CommunityDetailsPage />} />
          <Route path="/communities/:id/member" element={<CommunityMemberPage />} />
          <Route path="*" element={<div className="flex items-center justify-center py-32 text-2xl text-slate-500">Page Not Found</div>} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default App
