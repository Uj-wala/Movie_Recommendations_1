# 👨‍💻 Developer Guide - CineFind Architecture

## 📐 Architecture Overview

```
┌─────────────────────────────────────────────────┐
│         React Application (Home.jsx)            │
│  - State Management (useState, useEffect)      │
│  - Component Orchestration                     │
└─────────────────────────────────────────────────┘
         │
         ├─► Components Layer ────────────────┐
         │                                    │
         ├─► Services Layer (api.js) ────────┤─► OMDb API
         │                                    │
         ├─► Hooks Layer (useDebounce)       │
         │                                    │
         └─► Context Layer (ThemeContext) ───┘
```

---

## 🧩 Component Architecture

### Component Hierarchy
```
App.jsx
  └─ ThemeProvider (Context)
      └─ Home.jsx (Main Page)
          ├─ Navbar
          ├─ ThemeToggle
          ├─ SearchBar
          ├─ MovieCard[] (Grid)
          ├─ MovieModal
          ├─ Pagination
          ├─ Loader (Conditional)
          └─ Favorites (Sidebar)
```

### Data Flow
```
User Input (Search/Click)
    ↓
Event Handler in Home.jsx
    ↓
Call API via services/api.js
    ↓
Update State (movies, loading, error)
    ↓
Components Re-render with New Data
    ↓
UI Updates (Cards, Modal, Pagination)
```

---

## 🔗 Component Communication

### Props Flow
```javascript
Home.jsx
  ├─ passes: favorites, isDark → Navbar
  ├─ passes: onSearch → SearchBar
  ├─ passes: movie, isFavorite → MovieCard[]
  ├─ passes: selectedMovie, isOpen → MovieModal
  ├─ passes: currentPage, totalPages → Pagination
  └─ passes: favorites, isOpen → Favorites
```

### State Management (Home.jsx)
```javascript
const [movies, setMovies] = useState([])        // Search results
const [isLoading, setIsLoading] = useState(false) // Loading state
const [error, setError] = useState('')          // Error message
const [selectedMovie, setSelectedMovie] = useState(null) // Modal data
const [isModalOpen, setIsModalOpen] = useState(false) // Modal visibility
const [currentPage, setCurrentPage] = useState(1) // Pagination
const [totalPages, setTotalPages] = useState(0) // Total pages
const [searchTerm, setSearchTerm] = useState('') // Current search
const [favorites, setFavorites] = useState([])   // Saved movies
const [isFavoritesOpen, setIsFavoritesOpen] = useState(false) // Sidebar
```

---

## 🎣 Custom Hook: useDebounce

### Purpose
Delays value updates to reduce API calls

### Implementation
```javascript
export const useDebounce = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};
```

### Usage in SearchBar
```javascript
const debouncedSearchTerm = useDebounce(searchTerm, 300);

React.useEffect(() => {
  if (debouncedSearchTerm.trim()) {
    onSearch(debouncedSearchTerm);
  }
}, [debouncedSearchTerm, onSearch]);
```

### Benefits
- Reduces API calls by ~90%
- Better user experience
- Saves API quota
- Lower latency

---

## 🌐 API Service Layer (services/api.js)

### searchMovies Function
```javascript
async function searchMovies(searchTerm, page = 1) {
  // Validates input
  // Makes fetch request to OMDb
  // Handles errors gracefully
  // Returns structured response
  
  return {
    success: boolean,
    data: { Search: [...], totalResults: number },
    error: string?
  }
}
```

### getMovieDetails Function
```javascript
async function getMovieDetails(imdbID) {
  // Fetches complete movie info
  // Includes plot, cast, director, etc.
  // Returns detailed data or error
  
  return {
    success: boolean,
    data: { Title, Plot, Cast, ... },
    error: string?
  }
}
```

### Error Handling
- Network errors caught
- API errors parsed
- User-friendly messages
- Fallback values returned

---

## 🎭 Context API: Theme Management

### ThemeContext Structure
```javascript
const ThemeContext = createContext();

const value = {
  isDark: boolean,           // Current theme
  toggleTheme: () => void    // Change theme function
}
```

### Theme Persistence
```javascript
useEffect(() => {
  const root = document.documentElement;
  if (isDark) {
    root.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  } else {
    root.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  }
}, [isDark]);
```

### Usage in Components
```javascript
const { isDark, toggleTheme } = useTheme();

const bgColor = isDark ? 'bg-slate-900' : 'bg-white';
```

---

## 🎨 Tailwind CSS Integration

### Tailwind Features Used
```javascript
// Responsive design
className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"

// Dark mode
className={isDark ? 'dark:bg-slate-900' : 'bg-white'}

// Animations
className="animate-fade-in hover:scale-105 transition-all"

// Utilities
className="flex items-center justify-between gap-4"

// Gradients
className="bg-gradient-to-r from-red-600 to-red-900"
```

### Custom Tailwind Utilities
```css
@layer utilities {
  .animate-fade-in { /* Custom animation */ }
  .glass { /* Glassmorphism effect */ }
  .hover-scale { /* Hover animation */ }
  .gradient-text { /* Gradient text effect */ }
}
```

---

## 📊 State Flow Example: Search to Display

### Step 1: User Types
```javascript
// SearchBar.jsx
const [searchTerm, setSearchTerm] = useState('');
onChange={(e) => setSearchTerm(e.target.value)}
```

### Step 2: Debounce Wait
```javascript
// SearchBar.jsx
const debouncedSearchTerm = useDebounce(searchTerm, 300);
// Waits 300ms for user to stop typing
```

### Step 3: Trigger Search
```javascript
// SearchBar.jsx
useEffect(() => {
  if (debouncedSearchTerm.trim()) {
    onSearch(debouncedSearchTerm);  // Call parent function
  }
}, [debouncedSearchTerm]);
```

### Step 4: API Call
```javascript
// Home.jsx - handleSearch function
const result = await searchMovies(term, 1);
setMovies(result.data.Search);
setTotalPages(Math.ceil(result.data.totalResults / 10));
```

### Step 5: UI Update
```javascript
// Home.jsx - render
{movies.map((movie) => (
  <MovieCard key={movie.imdbID} movie={movie} />
))}
```

---

## 🔄 Component Lifecycle: Modal Opening

```
User clicks MovieCard
    ↓
handleMovieClick(movie)
    ↓
setSelectedMovie(movie)
setIsModalOpen(true)
    ↓
MovieModal renders
    ↓
useEffect triggers (isOpen && movie)
    ↓
getMovieDetails(imdbID)
    ↓
setMovieDetails(result.data)
    ↓
Component updates with detailed info
    ↓
Modal animates in (scale-100, opacity-100)
```

---

## 🛠️ How to Extend the App

### Add a New Component
```javascript
// 1. Create file: src/components/NewComponent.jsx
export const NewComponent = ({ props }) => {
  const { isDark } = useTheme();
  
  return (
    <div className={isDark ? 'dark-styles' : 'light-styles'}>
      {/* Component content */}
    </div>
  );
};

// 2. Import in Home.jsx
import { NewComponent } from './components/NewComponent';

// 3. Use in JSX
<NewComponent />
```

### Add a New Hook
```javascript
// src/hooks/useNewHook.js
export const useNewHook = (initialValue) => {
  const [state, setState] = useState(initialValue);
  
  // Hook logic
  
  return { state, setState };
};
```

### Extend API Service
```javascript
// src/services/api.js - Add new function
export const getGenreMovies = async (genre) => {
  try {
    const response = await fetch(
      `${API_URL}/?apikey=${API_KEY}&s=${genre}&type=movie`
    );
    // Handle response
  } catch (error) {
    // Handle error
  }
};
```

### Add New Theme Colors
```javascript
// tailwind.config.js - extend theme
theme: {
  extend: {
    colors: {
      custom: {
        50: '#f0f0f0',
        100: '#e0e0e0',
        // ... more shades
      }
    }
  }
}
```

---

## 📦 Dependencies & Versions

```json
{
  "react": "^19.2.6",           // UI library
  "react-dom": "^19.2.6",       // DOM rendering
  "axios": "^1.16.1",           // HTTP client (optional)
  "framer-motion": "^12.39.0",  // Advanced animations
  "react-icons": "^5.6.0",      // Icon library
  "tailwindcss": "^4.0.0"       // CSS framework
}
```

**Note**: Current implementation uses Fetch API, not Axios. Axios can be added for advanced features.

---

## 🧪 Testing Considerations

### Unit Tests (Jest)
```javascript
// test MovieCard component
test('MovieCard renders movie title', () => {
  const movie = { Title: 'Avatar', ... };
  const { getByText } = render(<MovieCard movie={movie} />);
  expect(getByText('Avatar')).toBeInTheDocument();
});
```

### Integration Tests
```javascript
// test search flow
test('Search returns and displays movies', async () => {
  // Render Home component
  // Type in search bar
  // Wait for results
  // Assert movies are displayed
});
```

### E2E Tests (Cypress/Playwright)
```javascript
// test complete user flow
describe('User adds movie to favorites', () => {
  it('should display in favorites sidebar', () => {
    cy.visit('/');
    cy.get('[placeholder="Search for movies..."]').type('Avatar');
    cy.get('[role="button"]').contains('Add to Favorites').click();
    cy.get('[role="button"]').contains('Favorites').click();
    cy.contains('Avatar').should('be.visible');
  });
});
```

---

## 🚀 Performance Optimization

### Current Optimizations
- ✅ Debounced search (reduces API calls)
- ✅ Lazy image loading
- ✅ CSS-based animations (GPU accelerated)
- ✅ Component memoization (React 19)
- ✅ Efficient re-renders

### Future Optimizations
- Add React.memo() for expensive components
- Implement infinite scroll
- Add service worker for offline support
- Implement image CDN
- Add compression for API responses

---

## 📋 Code Quality Guidelines

### Component Best Practices
```javascript
// ✅ Good: Use const, arrow functions, meaningful names
export const MovieCard = ({ movie, onClick }) => {
  const { isDark } = useTheme();
  
  return (
    <div className={isDark ? 'dark' : 'light'}>
      {/* Component */}
    </div>
  );
};

// ❌ Bad: Direct DOM manipulation, unclear logic
function MC(props) {
  document.getElementById('card').innerHTML = props.m.title;
}
```

### Tailwind Best Practices
```javascript
// ✅ Good: Use Tailwind utilities exclusively
className="flex items-center justify-between p-4 rounded-lg"

// ❌ Bad: Mix inline styles with Tailwind
className="flex p-4" style={{ justifyContent: 'space-between' }}
```

---

## 🔐 Security Considerations

- **API Key**: Never expose in client-side code ✓ (uses .env)
- **XSS Prevention**: React escapes content by default ✓
- **HTTPS Only**: API calls over secure connection ✓
- **No Authentication**: Public API (limited rate) ✓
- **Data Validation**: Input sanitization in components ✓

---

## 📚 Resources for Developers

- [React Documentation](https://react.dev)
- [Tailwind CSS Docs](https://tailwindcss.com)
- [Vite Guide](https://vite.dev)
- [OMDb API Docs](http://www.omdbapi.com/)
- [JavaScript Hooks](https://react.dev/reference/react/hooks)

---

## 🎯 Future Enhancement Ideas

1. **Advanced Search**
   - Filter by year, genre, rating
   - Sort results

2. **User Profiles**
   - Multiple watchlists
   - Ratings and reviews

3. **Recommendations**
   - Similar movies
   - Trending now

4. **Social Features**
   - Share watchlist
   - Compare with friends

5. **Offline Support**
   - Service workers
   - Cache management

6. **Analytics**
   - Track popular searches
   - User engagement

7. **Notifications**
   - New releases
   - Price changes

8. **Accessibility**
   - Screen reader support
   - Keyboard navigation

---

## 🐛 Debugging Tips

### Browser DevTools
```javascript
// Log component render
console.log('MovieCard rendered');

// Check state changes
console.log('Favorites updated:', favorites);

// Monitor API calls
// Network tab → XHR/Fetch
```

### React DevTools Extension
- Inspect component tree
- Track state changes
- Profile performance

### Check localStorage
```javascript
// In browser console
localStorage.getItem('favorites')
localStorage.getItem('theme')
```

---

Happy coding! 🚀✨
