## 🚀 Quick Start Guide for CineFind

### Step 1: Install Dependencies
```bash
npm install
```
This will install all required packages including React, Vite, Tailwind CSS, and other dependencies.

### Step 2: Setup OMDb API Key
1. Visit [OMDb API](http://www.omdbapi.com/apikey.aspx)
2. Sign up for a free API key (registration is quick)
3. Open `.env` file in the project root
4. Replace `your_api_key_here` with your actual API key:
   ```
   VITE_OMDB_API_KEY=your_actual_key_here
   ```

### Step 3: Start Development Server
```bash
npm run dev
```
Your app will open at `http://localhost:5173`

### Step 4: Start Searching!
- Type a movie title in the search bar
- Browse movie results with beautiful cards
- Click on any movie to see detailed information
- Add movies to your favorites
- Toggle between dark and light mode

---

## 📦 What's Included

✅ **8 React Components** with full functionality
✅ **Dark/Light Theme** with smooth animations
✅ **Real API Integration** with OMDb
✅ **Favorites Watchlist** with persistent storage
✅ **Search Debounce** for optimized API calls
✅ **Responsive Design** for all devices
✅ **Smooth Animations** using Tailwind CSS
✅ **Error Handling** and loading states
✅ **Pagination** for search results
✅ **Skeleton Loaders** for better UX

---

## 🎯 Project Features

### Search & Discovery
- Type movie titles to search
- Real-time results with automatic API debouncing
- Pagination to browse through results

### Movie Details
- Click any movie to view complete information
- See plot, cast, director, runtime, rating
- Beautiful modal with smooth animations

### Personalization
- Dark mode and light mode toggle
- Save movies to your favorites
- Favorites persist even after refresh

### Visual Design
- Modern glassmorphism UI
- Cinematic color scheme (dark grays + red accents)
- Smooth hover animations
- Professional gradient backgrounds

---

## 📱 Responsive Design

The app works perfectly on:
- 📱 Mobile phones (320px+)
- 📱 Tablets (640px+)
- 💻 Desktops (1024px+)
- 🖥️ Large screens (1280px+)

---

## 🔧 Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linting
npm run lint
```

---

## 💡 Tips & Tricks

1. **API Limit**: Free tier has 1000 requests/day
2. **Search Optimization**: Debounce reduces API calls by ~80%
3. **Dark Mode**: Try it for a better movie-watching experience
4. **Favorites**: Your saved movies persist even after closing the app
5. **Responsive**: Resize your browser to see the mobile layout

---

## 🐛 Troubleshooting

**"Movie not found" error**
- Check your API key is correct in .env
- Try searching for popular movies first
- Make sure you have internet connection

**Styling looks broken**
- Run `npm install` again
- Clear browser cache (Ctrl+Shift+Delete)
- Restart the dev server

**API key not working**
- Get a new key from OMDb
- Restart the dev server after updating .env
- Check that VITE_OMDB_API_KEY is spelled correctly

---

## 🎬 Enjoy CineFind!

You're all set! Start searching for your favorite movies and building your watchlist.

For detailed documentation, see **README.md**

Happy movie hunting! 🍿
