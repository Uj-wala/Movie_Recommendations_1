import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext.jsx';
// import { ErrorBoundary } from './components/ErrorBoundary.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { ToastContainer } from './components/Toast.jsx';
import { Home } from './pages/Home';
import { ProfilePage } from './pages/ProfilePage';
import { AdminDashboard } from './pages/AdminDashboard';
import './index.css';

function App() {
  return (
    // <ErrorBoundary>
      <BrowserRouter>
      <ThemeProvider>
        
        <ToastProvider>
          <Routes>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="*" element={<Home />} />
          </Routes>
          <ToastContainer />
        </ToastProvider>
      </ThemeProvider>
      </BrowserRouter>
    /* </ErrorBoundary> */
  );
}

export default App;
