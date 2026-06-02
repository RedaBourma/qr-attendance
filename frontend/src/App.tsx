import { BrowserRouter, Navigate, Routes, Route} from 'react-router-dom'
// import './App.css'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/Dashboard'
import MesSeancesPage from './pages/MesSeances'
import EtudiantsPage from './pages/EtudiantsPage'
import EnseignantsPage from './pages/EnseignantsPage'
import ProfileSettingsPage from './pages/ProfileSettingsPage'
import QRSessionDashboard from './pages/QrPage'
import ScanPage from './pages/ScanPage'

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path='/login' element={<LoginPage/>}/>
        <Route path='/scan/:token' element={<ScanPage/>}/>
        <Route element={<ProtectedRoute/>}>
          <Route path='/dashboard' element={<DashboardPage/>}/>
          <Route path='/seances' element={<MesSeancesPage/>}/>
          <Route path='/etudiants' element={<EtudiantsPage/>}/>
          <Route path='/enseignants' element={<EnseignantsPage/>}/>
          <Route path='/qr' element={<QRSessionDashboard/>}/>
          <Route path='/qr/:seanceId' element={<QRSessionDashboard/>}/>
          <Route path='/parametres' element={<ProfileSettingsPage/>}/>
        </Route>
        <Route path='*' element={<Navigate to="/login" replace/>}/>
      </Routes>
    </BrowserRouter>
  )
}

export default App
