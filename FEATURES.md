# 🎬 CineFind Features & User Guide

## 📖 Table of Contents
1. [Search Features](#search-features)
2. [Movie Details](#movie-details)
3. [Theme Customization](#theme-customization)
4. [Favorites Management](#favorites-management)
5. [Component Overview](#component-overview)

---

## 🔍 Search Features

### Real-Time Movie Search
- **How it works**: Type in the search bar to find movies
- **Debouncing**: Automatically waits for you to finish typing (300ms delay)
- **Results**: Shows up to 10 movies per page
- **Auto-clear**: Click the ✕ button to clear search

**Example searches:**
- "Avatar" - Find Avatar movies
- "Inception" - Sci-fi thriller
- "Spider-Man" - Marvel superhero films

### Search Results Display
Each movie card shows:
- **Movie Poster**: High-quality cover image (with placeholder if unavailable)
- **Title**: Full movie name
- **Release Year**: When the movie was released
- **Movie Type**: Movie/Series indicator
- **IMDb Rating**: Star rating out of 10
- **Favorite Button**: Heart icon to save to watchlist

### Pagination
- Browse through pages of results
- Shows current page and total available pages
- Navigate with Previous/Next buttons
- Jump to specific pages directly

---

## 🎞️ Movie Details Modal

### Accessing Movie Details
Click on any movie card to open the detailed modal

### Information Displayed
1. **Movie Poster**: Large cover image
2. **Title & Year**: Movie name and release year
3. **IMDb Rating**: Visual star rating (1-5 stars) + numeric score
4. **Average Rating**: Community average rating shown alongside IMDb data
5. **Plot Summary**: Full synopsis of the movie
6. **Genre**: Movie categories
7. **Cast**: Main actors
8. **Director**: Film director name
9. **Runtime**: Movie duration
10. **Language**: Original language
11. **Release Date**: Exact release date
12. **Community Reviews**: Submitted reviews with pagination and per-user edit/delete support
13. **Review Form**: Authenticated users can submit or update a review and star rating

### Modal Interactions
- **Close**: Click X button or click outside the modal
- **Add to Favorites**: Click heart button to save movie
- **Smooth Animations**: Beautiful fade-in and zoom effects
- **Backdrop Blur**: Semi-transparent background for focus

---

## 🌓 Theme Customization

### Dark Mode
- **Background**: Slate-900 (very dark)
- **Text**: Light gray for readability
- **Accents**: Red gradients stand out
- **Perfect for**: Night viewing, eye comfort

### Light Mode
- **Background**: Slate-50 (very light)
- **Text**: Dark gray for contrast
- **Accents**: Red for emphasis
- **Perfect for**: Daytime, brightness preference

### Toggle Theme
1. Click the **sun/moon icon** in the top-right
2. Theme changes instantly with smooth transition
3. Your preference is saved automatically

### Theme Persistence
- Your chosen theme is saved in browser
- Returns to your preference on next visit
- Also follows system preference if available

---

## ❤️ Favorites Management

### Adding to Favorites
**Method 1: From Movie Card**
- Hover over a movie card
- Click the heart icon (top-right of card)
- Heart fills with red color

**Method 2: From Movie Detail**
- Open movie details modal
- Click "Add to Favorites" button
- Button changes to "Remove from Favorites"

### Viewing Favorites
1. Click **Favorites** button in navbar (top-right)
2. Sidebar slides in from the right
3. See all your saved movies in a list
4. Click any favorite to view details again

### Managing Favorites
- **Remove**: Click the heart icon again
- **Search**: Click favorite movie to search for it
- **Organize**: Favorites stay in order of addition
- **Persistent**: Favorites saved even after closing app

### Favorites Counter
- Badge on navbar shows count
- Updates in real-time
- Only shows when you have favorites

---

## 🏗️ Component Overview

### Navbar Component
- CineFind logo with icon
- Displays favorite movies count
- Quick access to favorites panel
- Professional, sticky header
- Responsive on all devices

### SearchBar Component
- Prominent search input
- Gradient border on focus
- Clear button (X) when typing
- Loading spinner while searching
- Real-time results with debounce
- Placeholder text for guidance

### MovieCard Component
- Beautiful grid layout
- Animated hover effects
- Image zoom on hover
- Gradient overlay on hover
- Quick favorite toggle
- Responsive sizing
- Smooth shadow transitions

### MovieModal Component
- Large poster image
- Comprehensive movie info
- Star rating visualization
- Favorite button in modal
- Close button and backdrop click
- Smooth fade-in animation
- Mobile-friendly layout

### Loader Component
- Skeleton screen placeholders
- 8 placeholder cards in grid
- Animated shimmer effect
- Professional loading experience
- Shows while fetching data
- Matches actual card layout

### Pagination Component
- Previous/Next navigation
- Direct page selection
- Smart pagination (5 pages visible)
- Current page highlighted
- Disabled state for first/last page
- Loading state indication

### Favorites Sidebar
- Slides in from right
- Close button (X)
- Favorites counter in header
- Movie list with thumbnails
- Click to view movie details
- Remove favorites from sidebar
- Smooth animations

### ThemeToggle Component
- Sun/Moon icon
- Top-right corner
- Color-coded (yellow/blue)
- Smooth hover animation
- Instant visual feedback

---

## 🎯 User Workflows

### Workflow 1: Discover a Movie
1. Type "Avatar" in search bar
2. Browse movie cards in results
3. Click "Avatar 2009" card
4. Read full plot and details in modal
5. Click heart to save
6. Close modal

### Workflow 2: Build a Watchlist
1. Search for "Inception"
2. Click ❤️ on card (or in modal)
3. Search for "The Matrix"
4. Add to favorites
5. Click "Favorites" to see your list
6. Remove movies as you watch them

### Workflow 3: Evening Movie Session
1. Click theme toggle 🌙
2. Switch to dark mode for eye comfort
3. Search for "Horror" movies
4. Browse through pages of results
5. Click movies to read reviews
6. Add good ones to favorites
7. Come back later to watch!

### Workflow 4: Resume Your Session
1. App remembers your theme preference
2. All favorites are still there
3. Continue from where you left off
4. No need to re-add movies

---

## ⚡ Performance Features

### Search Debounce
- Waits 300ms after you stop typing
- Reduces API calls from 50+ to ~5 per search
- Saves bandwidth and API quota
- Feels more responsive

### Image Optimization
- Placeholder for missing posters
- Lazy loading of images
- Efficient caching
- Fast load times

### Smooth Animations
- GPU-accelerated transforms
- 60 FPS animations
- Smooth transitions throughout
- Professional feel

### Responsive Design
- Mobile-first approach
- Efficient grid system
- Touch-friendly buttons
- Works on all browsers

---

## 🎨 Design Highlights

### Color Palette
- **Primary**: Red-500 to Red-600 (cinematic)
- **Background**: Slate-900 (dark) / Slate-50 (light)
- **Accent**: Yellow-400 (ratings) / Blue-600 (theme)
- **Neutral**: Slate-400 (secondary text)

### Typography
- **Headings**: Bold, large (2xl, 3xl)
- **Body**: Regular weight, readable size
- **Code**: Monospace in modals
- **All**: Proper contrast ratios

### Effects
- **Glassmorphism**: Blur + transparency
- **Glow Effects**: Red gradient shadows
- **Smooth Transitions**: 300ms timing
- **Hover States**: Scale + Shadow

---

## 💾 Local Storage

### Saved Data
```javascript
{
  favorites: [
    { imdbID: "tt0468569", Title: "The Dark Knight", ... },
    { imdbID: "tt1375666", Title: "Inception", ... }
  ],
  theme: "dark" // or "light"
}
```

### Data Persistence
- Survives page refreshes
- Persists across browser sessions
- Stored securely in browser
- No cloud sync required
- ~5MB storage available

---

## 🔐 Privacy & Security

- ✅ No personal data collected
- ✅ No tracking pixels
- ✅ No external analytics
- ✅ API key kept server-side only
- ✅ All data stored locally
- ✅ Secure HTTPS API calls

---

## 🆘 Keyboard Shortcuts

While in search bar:
- **Enter**: Search immediately
- **Escape**: Clear search
- **Backspace**: Delete characters

While modal open:
- **Escape**: Close modal

---

## 🎬 Enjoy Your Movie Discovery!

CineFind is designed for a smooth, enjoyable experience. 
Explore thousands of movies, build your watchlist, and enjoy the cinematic interface!

**Happy viewing!** 🍿✨

---

## 🧠 Recommendation Requirements

The recommendation layer now persists and uses the following data:

- **Recently viewed movies**: Stored in the `movie_views` table and exposed through the `recently_viewed_movies` relationship on `User`
- **User preferences**: Stored in the `user_preferences` table as inferred genre preferences
- **Activity analysis**: Recommendations are generated from favorites, search history, and recently viewed movies
- **Duplicate prevention**: Already saved or viewed movies are filtered out before recommendations are returned
- **Empty state guidance**: When no recommendations are available yet, show `Start searching and adding favorites to get personalized recommendations.`
