import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext.jsx';
// import { ErrorBoundary } from './components/ErrorBoundary.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { ToastContainer } from './components/Toast.jsx';
import { Home } from './pages/Home';
import './index.css';

function App() {
  return (
    // <ErrorBoundary>
      <BrowserRouter>
      <ThemeProvider>
        
        <ToastProvider>
          <Home />
          <ToastContainer />
        </ToastProvider>
      </ThemeProvider>
      </BrowserRouter>
    /* </ErrorBoundary> */
  );
}

export default App;
