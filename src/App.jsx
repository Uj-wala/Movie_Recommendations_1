import { ThemeProvider } from './context/ThemeContext.jsx';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';
import { Home } from './pages/Home';
import './index.css';

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <Home />
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
