# Chicago Shia League - Tasks & Issues

## 🔴 CRITICAL - Fix Immediately

### 1. Homepage Not Loading Firebase Data
**File:** `index.html`

**Problem:** Homepage shows static hardcoded games instead of loading from Firebase.

**Current State:** 
- Console shows: "Homepage loaded with static data" 
- Static game cards are hardcoded in HTML
- `home.js` script is not being loaded or executed

**Solution:**
1. Add `<script src="js/home.js"></script>` before `</body>` in `index.html`
2. Verify Firebase SDK scripts load before `home.js`
3. Ensure `gamesContainer` ID exists in HTML
4. Test that games from Firestore appear on page

**Expected Behavior:**
- Homepage loads games from Firestore for current season/week
- Shows real team names and scores from database
- Displays game leaders (points, rebounds, blocks, steals)
- Updates automatically when new games are added

---

### 2. Admin Player Stats Form Disappears
**File:** `admin.html`, `js/admin.js`

**Problem:** After creating a game, if user switches tabs, the player stats form disappears and can't add more stats to that game.

**Current State:**
- Create game → form appears
- Switch to different tab → form gone
- No way to add more player stats later
- `currentGameId` variable gets lost

**Solution Options:**

**Option A: Persist currentGameId across tab switches**
```javascript
// In admin.js - save gameId when created
function switchTab(tabName) {
    // Don't reset currentGameId
    // Keep player stats form visible if game exists
    if (currentGameId && tabName === 'addGame') {
        document.getElementById('playerStatsSection').classList.remove('hidden');
        loadPlayersForGame(currentGameId);
    }
}
```

**Option B( I Want this): Add "Add Stats to Existing Game" feature** 
- Dropdown to select existing games
- Load players from those teams
- Add stats to any game retroactively

**Option C: Show warning before switching**
- Alert user: "You have an active game. Add all player stats before switching tabs."
- Confirm before switching

**Recommended:** Implement Option B for best user experience

---

## 🟡 HIGH PRIORITY - Fix Soon

### 3. Create Games by Week Page
**File:** `games.html` (DOES NOT EXIST)

**Requirements:**
- Show all games organized by week
- Week selector (dropdown or tabs for Week 1, 2, 3, etc.)
- Display game cards similar to homepage
- Show game date, teams, scores, leaders
- Filter by season
- Mobile responsive

**Similar To:** Homepage, but shows all past weeks not just current

---

### 4. Add Edit/Delete Functionality
**Files:** `admin.html`, `js/admin.js`

**Missing Features:**
- Cannot edit existing games
- Cannot delete games through UI
- Cannot edit player stats
- Cannot delete player stats
- Cannot edit teams/players after creation

**Solution:**
Add fourth tab: "Manage Existing Data"
- Dropdown to select game → Edit button
- Show all player stats → Edit/Delete buttons
- List all teams → Edit/Delete buttons
- List all players → Edit/Delete buttons

---

### 5. Data Validation
**Files:** All forms in `admin.html`

**Missing Validations:**
- FG Made can exceed FG Attempted (shouldn't be possible)
- 2PT + 3PT should equal FG (currently not checked)
- Points should equal (2PT×2 + 3PT×3 + FT) (not validated)
- Negative numbers allowed
- Team can play against itself
- Same player can be added to game multiple times

**Solution:** Add validation in `admin.js` before saving:
```javascript
// Example validation
if (fgMade > fgAtt) {
    alert('FG Made cannot exceed FG Attempted');
    return;
}

const calculatedFG = twoMade + threeMade;
if (fgMade !== calculatedFG) {
    alert('FG Made must equal 2PT Made + 3PT Made');
    return;
}
```

---

## 🟢 MEDIUM PRIORITY - Nice to Have

### 6. Team Standings Page
**File:** `standings.html` (NEW)

**Features:**
- Calculate win-loss record for each team
- Winning percentage
- Sort by wins
- Show games played
- Points for/against
- Current week standings

---

### 7. Individual Player Pages
**File:** `player.html` (NEW)

**Features:**
- Detailed player profile
- Season stats
- Game-by-game breakdown
- Career highs
- Charts/graphs of performance
- Link from player stats page

---

### 8. Search and Filter
**Files:** `players.html`, new search page

**Features:**
- Search players by name
- Filter by team
- Sort by any stat column
- Filter games by date range
- Search games by team

---

### 9. Improved Security Rules
**File:** Firebase Console → Firestore Rules

**Current:** Open read/write to everyone (temporary)

**Needed:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Anyone can read
    match /{document=**} {
      allow read: if true;
    }
    
    // Only authenticated admins can write
    match /teams/{teamId} {
      allow write: if request.auth != null;
    }
    
    match /players/{playerId} {
      allow write: if request.auth != null;
    }
    
    match /games/{gameId} {
      allow write: if request.auth != null;
    }
    
    match /gameStats/{statId} {
      allow write: if request.auth != null;
    }
    
    // Only specific admin can edit settings
    match /settings/{settingId} {
      allow write: if request.auth != null && 
                     request.auth.token.email == 'admin@chicagoshialeague.com';
    }
  }
}
```

---

## 🔵 LOW PRIORITY - Future Enhancements

### 10. Bulk Player Import
- CSV upload for players
- Excel file import
- Validate data before import
- Show preview before confirming

### 11. Team Logos
- Image upload functionality
- Store in Firebase Storage
- Display on all pages
- Fallback to initials if no logo

### 12. Schedule/Calendar View
- Visual calendar of games
- Mark completed vs upcoming
- Filter by team
- Export to Google Calendar

### 13. Email Notifications
- Send admins weekly reminders
- Notify league when stats posted
- Player stat summaries

### 14. Export Functionality
- Export stats to CSV
- Generate PDF reports
- Print-friendly views
- Season summary PDFs

### 15. Advanced Stats
- Player efficiency rating
- True shooting percentage
- Plus/minus
- Usage rate
- Advanced team stats

---

## 🐛 Known Bugs

### Bug 1: Console Warnings
**Severity:** Low
**Issue:** Permissions-Policy warnings in console
**Fix:** These are informational, can be ignored or suppressed

### Bug 2: Form Auto-complete Warning
**Severity:** Low  
**Issue:** "An element doesn't have an autocomplete attribute"
**Fix:** Add autocomplete attributes to form inputs

### Bug 3: API Key Exposed Warning (GitHub)
**Severity:** Low
**Issue:** GitHub detects API key in config.js
**Fix:** This is normal for Firebase - API keys are meant to be public. Dismiss the alert. Security is handled by Firestore rules.

---

## 📝 Code Quality Improvements

### Refactoring Needed

1. **Extract CSS to separate file**
   - All CSS currently inline in HTML
   - Create `css/style.css`
   - Link in all HTML files

2. **Modularize JavaScript**
   - Create separate files for common functions
   - `js/utils.js` for calculations
   - `js/firebase-helpers.js` for database operations
   - Reduce code duplication

3. **Error Handling**
   - Add try-catch blocks
   - Show user-friendly error messages
   - Log errors for debugging
   - Handle network failures gracefully

4. **Loading States**
   - Show loading spinners
   - Disable buttons during operations
   - Provide feedback on actions
   - Handle slow connections

5. **Code Comments**
   - Add JSDoc comments
   - Document complex functions
   - Explain business logic
   - Add usage examples

---

## 🧪 Testing Needed

### Manual Testing Checklist
- [ ] Create team → Verify in Firestore
- [ ] Create player → Verify in Firestore
- [ ] Create game → Verify in Firestore
- [ ] Add player stats → Verify in Firestore
- [ ] Homepage shows games correctly
- [ ] Player stats calculate correctly
- [ ] Percentages calculate correctly
- [ ] Mobile responsive on all pages
- [ ] Admin logout works
- [ ] Unauthorized access blocked
- [ ] Form validation works
- [ ] Error messages display
- [ ] Loading states show

### Browser Testing
- [ ] Chrome (desktop)
- [ ] Firefox (desktop)
- [ ] Safari (desktop)
- [ ] Chrome (mobile)
- [ ] Safari (iOS)
- [ ] Samsung Internet (Android)

---

## 📚 Documentation Needed

1. **User Guide**
   - How to add games
   - How to add player stats
   - What each stat means
   - Troubleshooting common issues

2. **Admin Training Manual**
   - Step-by-step workflows
   - Weekly checklist
   - Data entry best practices
   - Error recovery

3. **Developer Documentation**
   - Setup instructions
   - Code architecture
   - Database schema
   - Deployment process

4. **API Documentation**
   - Firebase queries used
   - Data structures
   - Calculation formulas
   - Common patterns

---

## 🚀 Deployment Checklist

Before going live:
- [ ] Fix homepage Firebase loading
- [ ] Fix admin player stats form
- [ ] Add data validation
- [ ] Secure Firestore rules
- [ ] Test all features
- [ ] Create user documentation
- [ ] Train admins
- [ ] Have backup admin
- [ ] Test on mobile devices
- [ ] Set up error monitoring
- [ ] Create backup strategy

---

## 💡 Optimization Opportunities

1. **Caching**
   - Cache team/player data
   - Reduce redundant Firestore reads
   - Use local storage for recent data

2. **Lazy Loading**
   - Load player stats on demand
   - Paginate game history
   - Defer image loading

3. **Index Creation**
   - Create Firestore indexes for common queries
   - Speed up sorting and filtering

4. **Code Splitting**
   - Load admin.js only on admin page
   - Minimize initial bundle size

---

## 📊 Analytics to Track

- Page views per page
- Admin actions (games created, players added)
- Average time to add game stats
- Most viewed teams/players
- Mobile vs desktop usage
- Browser/device breakdown
- Error rates
- Load times