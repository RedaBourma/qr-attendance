import { BrowserRouter, Navigate, Routes, Route} from 'react-router-dom'
// import './App.css'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/Dashboard'
import StatistiquesPage from './pages/StatistiquesPage'
import MesSeancesPage from './pages/MesSeances'
import GestionEmploiPage from './pages/GestionEmploiPage'
import EtudiantsPage from './pages/EtudiantsPage'
import EnseignantsPage from './pages/EnseignantsPage'
import ProfileSettingsPage from './pages/ProfileSettingsPage'
import QRSessionDashboard from './pages/QrPage'
import ScanPage from './pages/ScanPage'
import FilieresModulesPage from './pages/FilieresModulesPage'

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path='/login' element={<LoginPage/>}/>
        <Route path='/scan/:token' element={<ScanPage/>}/>
        <Route element={<ProtectedRoute/>}>
          <Route path='/dashboard' element={<ProtectedRoute allowedRoles={["enseignant"]}><DashboardPage/></ProtectedRoute>}/>
          <Route path='/statistiques' element={<ProtectedRoute allowedRoles={["admin"]}><StatistiquesPage/></ProtectedRoute>}/>
          <Route path='/seances' element={<ProtectedRoute allowedRoles={["enseignant"]}><MesSeancesPage/></ProtectedRoute>}/>
          <Route path='/gestion-academique' element={<ProtectedRoute allowedRoles={["admin"]}><GestionEmploiPage/></ProtectedRoute>}/>
          <Route path='/filieres-modules' element={<ProtectedRoute allowedRoles={["admin"]}><FilieresModulesPage/></ProtectedRoute>}/>
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
