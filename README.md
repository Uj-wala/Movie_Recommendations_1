# 🎬 CineFind - Movie Discovery Web App

A visually engaging and responsive Movie Discovery application built with React, Vite, and Tailwind CSS. Dynamically fetches movie data from the OMDb API and provides users with an immersive cinematic experience.

## 🌟 Features

### Core Features
- **Dynamic Movie Search** - Real-time search functionality with API integration
- **Beautiful Movie Cards** - Modern designs with poster images, ratings, and details
- **Detailed Movie Modal** - Comprehensive information including plot, cast, director, runtime, and more
- **Pagination** - Navigate through movie search results efficiently
- **Dark/Light Mode** - Theme toggle with smooth transitions and localStorage persistence
- **Favorites Watchlist** - Save and manage favorite movies with localStorage storage

### Advanced Features
- **Search Debounce** - Optimized API calls with debounced search input
- **Skeleton Loaders** - Professional loading animations while fetching data
- **Error Handling** - Graceful error messages and user feedback
- **Responsive Design** - Mobile-first approach that works on all device sizes
- **Smooth Animations** - Tailwind CSS animations and transitions throughout
- **Glassmorphism Effects** - Modern UI design with blur and transparency effects

### UI/UX Features
- **Responsive Grid Layout** - Adaptive layout for desktop, tablet, and mobile
- **Interactive Hover Effects** - Scale, glow, and shadow animations
- **Animated Buttons** - Smooth transitions and interactive states
- **Staggered Card Animation** - Cascading fade-in effects for search results
- **Smooth Modal Transitions** - Beautiful opening and closing animations
- **Cinematic Design** - Dark gradients, glowing accents, and professional styling

## 🛠️ Tech Stack

- **React 19** - Latest React with hooks and functional components
- **Vite** - Fast build tool and development server
- **Tailwind CSS 4** - Utility-first CSS framework
- **JavaScript (ES6+)** - Modern JavaScript features
- **Fetch API** - API integration for OMDb
- **localStorage** - Client-side data persistence

## 📦 Project Structure

```
src/
├── components/
│   ├── Navbar.jsx           # Navigation bar with logo and favorites button
│   ├── SearchBar.jsx        # Search input with debouncing
│   ├── MovieCard.jsx        # Individual movie card component
│   ├── MovieModal.jsx       # Detailed movie information modal
│   ├── Loader.jsx           # Skeleton loading animation
│   ├── Pagination.jsx       # Pagination controls
│   ├── Favorites.jsx        # Favorites sidebar
│   └── ThemeToggle.jsx      # Dark/Light mode toggle
├── hooks/
│   └── useDebounce.js       # Custom debounce hook
├── services/
│   └── api.js               # OMDb API integration
├── context/
│   └── ThemeContext.jsx     # Theme management context
├── pages/
│   └── Home.jsx             # Main home page
├── App.jsx                  # Main app component
├── main.jsx                 # Entry point
├── index.css                # Global Tailwind styles
└── App.css                  # App-specific styles
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn package manager

### Installation

1. **Clone or extract the project**
   ```bash
   cd movie-recommendation
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup Environment Variables**
   - Rename `.env.example` to `.env`
   - Get a free API key from [OMDb API](http://www.omdbapi.com/apikey.aspx)
   - Add your API key to `.env`:
   ```env
   VITE_OMDB_API_KEY=your_api_key_here
   VITE_OMDB_API_URL=https://www.omdbapi.com
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:5173`

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## 🎨 Design Features

### Color Scheme
- **Dark Mode**: Slate-900 background with red-500 accents
- **Light Mode**: Slate-50 background with red-600 accents
- **Gradients**: Red-600 to red-900 and Purple-600 to purple-900

### Animations
- **Fade-in**: Smooth opacity and position transitions
- **Hover Effects**: Scale (1.05x), glow effects, and shadow transitions
- **Modal**: Backdrop blur with smooth zoom animations
- **Staggered Grid**: Sequential card animations with delays

### Typography
- **Headings**: Bold, large, with gradient colors
- **Body Text**: Clear, readable with proper contrast
- **Badges**: Rounded pills for categories and ratings

## 📱 Responsive Breakpoints

- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px
- **Large Desktop**: > 1280px

## 🎬 API Integration

The app uses the OMDb API to:
- Search for movies by title
- Fetch detailed movie information
- Retrieve IMDb ratings and reviews
- Get cast, director, and production details

## 💾 Local Storage

The app persists the following to localStorage:
- **Favorites**: Array of favorited movies (key: `favorites`)
- **Theme**: User's theme preference (key: `theme`)

## 🐛 Error Handling

- **No API Key**: Warning message in console
- **Network Errors**: User-friendly error messages
- **No Results**: Helpful empty state UI
- **API Errors**: Graceful fallbacks and error recovery

## 🌐 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 📄 License

This project is open source and available under the MIT License.
