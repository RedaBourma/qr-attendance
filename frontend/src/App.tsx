import { BrowserRouter, Navigate, Routes, Route} from 'react-router-dom'
// import './App.css'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/Dashboard'
import MesSeancesPage from './pages/MesSeances'
import EtudiantsPage from './pages/EtudiantsPage'
import EnseignantsPage from './pages/EnseignantsPage'

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path='/login' element={<LoginPage/>}/>
        <Route element={<ProtectedRoute/>}>
          <Route path='/dashboard' element={<DashboardPage/>}/>
          <Route path='/seances' element={<MesSeancesPage/>}/>
          <Route path='/etudiants' element={<EtudiantsPage/>}/>
          <Route path='/enseignants' element={<EnseignantsPage/>}/>
        </Route>
        <Route path='*' element={<Navigate to="/login" replace/>}/>
      </Routes>
    </BrowserRouter>
  )
}

export default App
