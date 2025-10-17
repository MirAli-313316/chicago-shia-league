# Chicago Shia Basketball League Website - Project Context

## Project Overview
A basketball league statistics website built with Firebase (Firestore + Auth) and hosted on GitHub Pages. The site tracks games, players, teams, and automatically calculates shooting percentages and season averages.

## Tech Stack
- **Frontend:** Vanilla HTML, CSS, JavaScript (no frameworks)
- **Database:** Firebase Firestore
- **Authentication:** Firebase Auth (Email/Password)
- **Hosting:** GitHub Pages
- **CDN:** Firebase SDK 9.22.0 (compat mode)

## Live URLs
- **Homepage:** https://mirali-313316.github.io/chicago-shia-league/
- **Admin:** https://mirali-313316.github.io/chicago-shia-league/admin.html
- **Player Stats:** https://mirali-313316.github.io/chicago-shia-league/players.html

## Project Structure
```
chicago-shia-league/
├── index.html          # Homepage - shows current week games
├── admin.html          # Admin dashboard - add games, players, teams
├── players.html        # Player stats page - stats by team
├── games.html          # Games by week - view all games organized by week
├── js/
│   ├── config.js       # Firebase configuration
│   ├── home.js         # Homepage logic - loads games from Firestore
│   ├── admin.js        # Admin functions - CRUD operations
│   └── auth.js         # (OPTIONAL) Separate auth functions
└── css/
    └── style.css       # (OPTIONAL) Separate stylesheet
```

## Firebase Collections

### `settings` (Single document: 'league')
```javascript
{
  currentSeason: 3,           // number
  currentWeek: 1,             // number
  leagueName: "Chicago Shia League",  // string
  logoUrl: ""                 // string (optional)
}
```

### `teams`
```javascript
{
  name: "Bulls",              // string
  color: "#CE1141",           // string (hex color)
  logoUrl: "",                // string (optional)
  createdAt: timestamp        // timestamp
}
```

### `players`
```javascript
{
  name: "John Smith",         // string
  number: 23,                 // number (0-99)
  teamId: "team_doc_id",      // string (reference to team document)
  createdAt: timestamp        // timestamp
}
```

### `games`
```javascript
{
  week: 1,                    // number
  season: 3,                  // number
  date: timestamp,            // timestamp
  team1Id: "team_doc_id",     // string
  team2Id: "team_doc_id",     // string
  team1Score: 85,             // number
  team2Score: 72,             // number
  status: "completed",        // string
  createdAt: timestamp        // timestamp
}
```

### `gameStats`
```javascript
{
  gameId: "game_doc_id",      // string (reference to game)
  playerId: "player_doc_id",  // string (reference to player)
  points: 24,                 // number
  rebounds: 8,                // number
  assists: 5,                 // number
  steals: 2,                  // number
  blocks: 1,                  // number
  fgMade: 10,                 // number (field goals made)
  fgAtt: 18,                  // number (field goals attempted)
  twoMade: 7,                 // number (2-pointers made)
  twoAtt: 12,                 // number (2-pointers attempted)
  threeMade: 3,               // number (3-pointers made)
  threeAtt: 6,                // number (3-pointers attempted)
  ftMade: 1,                  // number (free throws made)
  ftAtt: 2,                   // number (free throws attempted)
  createdAt: timestamp        // timestamp
}
```

## Key Features

### Automatic Calculations (Client-Side)
- **FG%** = (fgMade / fgAtt) × 100
- **2PT%** = (twoMade / twoAtt) × 100
- **3PT%** = (threeMade / threeAtt) × 100
- **FT%** = (ftMade / ftAtt) × 100
- **PPG** = Total points / Games played
- **RPG** = Total rebounds / Games played
- **APG** = Total assists / Games played
- **SPG** = Total steals / Games played
- **BPG** = Total blocks / Games played

### Current Pages

#### 1. Homepage (index.html)
- Displays current season and week
- Shows this week's games (3 games per week)
- Game leaders: top scorer, rebounder, shot blocker, stealer per game
- Mobile responsive
- **ISSUE:** Currently showing static data, not loading from Firebase

#### 2. Admin Dashboard (admin.html)
- Secure login (Firebase Auth)
- Three tabs:
  - **Add Game Stats:** Create game + add player stats
  - **Add Player:** Add new players to teams
  - **Add Team:** Add new teams
- Only authenticated users can write data
- **ISSUE:** Player stats form disappears when switching tabs

#### 3. Player Stats Page (players.html)
- Team selector tabs (one tab per team)
- Complete stats table with all shooting stats
- Season averages calculated automatically
- Sortable columns
- Mobile responsive with horizontal scroll

### Current Pages
- **games.html** - Games by week page with week selector and game history

## Current Issues

### Critical Issues ✅ RESOLVED
1. **Homepage not loading Firebase data** - ✅ FIXED: Added Firebase scripts and home.js to index.html
2. **Admin player stats form resets** - ✅ FIXED: Added "Add Stats to Existing Game" feature
3. **No way to edit existing games/stats** - Can only add, not update or delete through UI

### Minor Issues
1. No team standings/win-loss tracking
2. No individual player detail pages
3. No search/filter functionality
4. Static data validation missing (e.g., FG Made can't exceed FG Attempted)

## Firebase Security Rules (Current)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;  // TEMPORARY - open to all
    }
  }
}
```

**TODO:** Restrict write access to authenticated users only:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read: if true;           // Anyone can read
      allow write: if request.auth != null;  // Only logged-in users can write
    }
  }
}
```

## Firebase Configuration
```javascript
// js/config.js
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

window.db = db;
window.auth = auth;
```

## Common Firebase Patterns Used

### Reading Data
```javascript
// Get single document
const doc = await db.collection('settings').doc('league').get();
const data = doc.data();

// Query collection
const snapshot = await db.collection('games')
  .where('week', '==', 1)
  .orderBy('date', 'desc')
  .get();

snapshot.forEach(doc => {
  const game = doc.data();
  game.id = doc.id;
  // process game
});
```

### Writing Data
```javascript
// Add document (auto-generated ID)
await db.collection('teams').add({
  name: "Bulls",
  color: "#CE1141",
  createdAt: firebase.firestore.FieldValue.serverTimestamp()
});

// Set document (specific ID)
await db.collection('settings').doc('league').set({
  currentSeason: 3,
  currentWeek: 1
});
```

### Authentication
```javascript
// Sign in
await firebase.auth().signInWithEmailAndPassword(email, password);

// Sign out
await firebase.auth().signOut();

// Auth state listener
firebase.auth().onAuthStateChanged(user => {
  if (user) {
    // User logged in
  } else {
    // User logged out
  }
});
```

## Design Patterns

### Color Scheme
- **Primary:** #FF6B35 (Orange)
- **Background:** Dark gradient (#1a1a1a to #2d2d2d)
- **Text:** White (#fff)
- **Accent:** Semi-transparent overlays

### Responsive Breakpoints
- Mobile: < 768px
- Tablet/Desktop: ≥ 768px

### CSS Classes
- `.loading` - Loading state messages
- `.hidden` - Hide elements
- `.game-card` - Individual game display
- `.stats-table` - Player statistics table
- `.admin-dashboard` - Admin panel container

## Deployment Process

1. Edit files locally or on GitHub
2. Commit changes to `main` branch
3. GitHub Pages automatically rebuilds (takes 1-2 minutes)
4. Changes live at: https://mirali-313316.github.io/chicago-shia-league/

## Testing Checklist

- [ ] Homepage loads games from Firestore
- [ ] Admin login works
- [ ] Can add teams
- [ ] Can add players
- [ ] Can create games
- [ ] Can add player stats to games
- [ ] Player stats page shows correct data
- [ ] Percentages calculate correctly
- [ ] Season averages calculate correctly
- [ ] Mobile responsive on all pages
- [ ] No console errors

## Future Enhancements

### High Priority
1. Fix homepage to load real Firebase data
2. Fix admin player stats form persistence
3. Create "Games by Week" page
4. Add edit/delete functionality for games and stats

### Medium Priority
5. Team standings page (W-L records)
6. Individual player detail pages
7. Search and filter functionality
8. Data validation on forms
9. Bulk player upload (CSV import)

### Low Priority
10. Team logos upload
11. Photo gallery
12. Schedule/calendar view
13. Email notifications
14. Export stats to PDF/CSV
15. League leader boards
16. Custom team pages

## Known Constraints

- **7 teams total** (one sits each week)
- **3 games per week** (6 teams play)
- **Max 10 players per team**
- **No roster changes mid-season** (yet)
- **Single admin account** (shared email)
- **Free tier limits:**
  - 50,000 Firestore reads/day
  - 20,000 Firestore writes/day
  - Current usage: ~500 reads/day, ~50 writes/week

## Development Notes

- All JavaScript uses Firebase SDK **compat mode** (not modular SDK)
- No build tools or package managers (no npm, webpack, etc.)
- Firebase CDN scripts must load before config.js
- All calculations done client-side (no Cloud Functions)
- GitHub Pages doesn't support server-side code
- All CSS is inline in HTML files (can be extracted to style.css)

## Contact & Access

- **GitHub Repo:** https://github.com/MirAli-313316/chicago-shia-league
- **Firebase Project:** chicago-shia-league
- **Admin Email:** [User's admin email]
- **Firebase Console:** https://console.firebase.google.com