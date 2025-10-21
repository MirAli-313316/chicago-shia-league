# Chicago Shia League - Basketball Management System

A comprehensive full-stack web application for managing basketball league statistics, built with Firebase and vanilla JavaScript.

## Project Overview

The Chicago Shia League management system provides a complete solution for tracking basketball games, player statistics, and team management. Built with modern web technologies, it offers real-time data synchronization and a responsive user interface.

## Features

### Public Features
- **Homepage**: Current week games with live scores and game leaders
- **Games by Week**: Historical game data organized by week
- **Player Statistics**: Season averages and performance metrics by team
- **Responsive Design**: Optimized for desktop and mobile devices

### Admin Dashboard Tools
The admin panel provides comprehensive league management capabilities:

#### Game Management
- **Add Game Statistics**: Create new games and immediately add player performance data
- **Add Stats to Existing Games**: Retroactively add player statistics to any previous game
- **View Game Leaders**: Automatic calculation of top performers (points, rebounds, blocks, steals)
- **Game History**: Complete historical record of all games with detailed statistics

#### Player Management
- **Add New Players**: Register players to specific teams with jersey numbers
- **Edit Player Information**: Update player details, team assignments, and jersey numbers
- **Delete Players**: Remove players and associated statistics (with confirmation)
- **Player Statistics**: Comprehensive career statistics with game-by-game breakdowns

#### Team Management
- **Add New Teams**: Create teams with custom colors and branding
- **Edit Team Details**: Modify team names, colors, and logos
- **Delete Teams**: Remove teams and associated players (with confirmation)
- **Team Rosters**: Automatic roster management and player assignments

#### Data Management
- **Edit Existing Data**: Modify any game, player, team, or statistical record
- **Delete Operations**: Remove data with cascading cleanup of related records
- **Data Integrity**: Automatic validation and consistency checks
- **Bulk Operations**: Efficient management of large datasets

## Technology Stack

- **Frontend**: Vanilla HTML, CSS, JavaScript (no frameworks)
- **Backend**: Firebase Firestore (NoSQL database)
- **Authentication**: Firebase Auth (email/password)
- **Hosting**: GitHub Pages
- **Real-time**: Firebase real-time listeners

## Data Architecture

### Firebase Collections
- `settings`: League configuration (current season, week, name)
- `teams`: Team information (name, colors, logos)
- `players`: Player details (name, number, team assignment)
- `games`: Game records (teams, scores, dates, weeks)
- `gameStats`: Individual player performance per game

### Key Algorithms
- **Statistical Calculations**: Automatic computation of shooting percentages, season averages
- **Game Leaders**: Real-time identification of top performers
- **Data Validation**: Form validation and data integrity checks
- **Cascading Deletes**: Safe removal of related data

## User Interface

- **Dark Theme**: Modern dark design with orange accents
- **Mobile-First**: Responsive layout for all screen sizes
- **Interactive Elements**: Hover effects and smooth transitions
- **Sticky Navigation**: Headers remain visible during scrolling
- **Real-time Updates**: Live data synchronization

## Getting Started

1. **Access the Application**:
   - Homepage: [Chicago Shia League](https://mirali-313316.github.io/chicago-shia-league/)
   - Admin Dashboard: [Admin Panel](https://mirali-313316.github.io/chicago-shia-league/admin.html)

2. **Admin Access**:
   - Navigate to the admin dashboard
   - Sign in with league admin credentials
   - Access all management tools and data operations

3. **Adding Data**:
   - Use the admin dashboard to add teams, players, and games
   - Player statistics are automatically calculated and stored
   - All data is synchronized in real-time

## Performance Metrics

- **Real-time Data**: Sub-second updates across all connected clients
- **Efficient Queries**: Optimized Firestore queries with composite indexes
- **Responsive Design**: < 3 second load times on mobile devices
- **Data Integrity**: Automatic validation and consistency checks

## Security

- **Firebase Security Rules**: Configured for authenticated admin access
- **Data Validation**: Client-side and server-side validation
- **Secure Authentication**: Email/password-based admin authentication
- **Data Privacy**: League data accessible only to authorized administrators

## Admin Tools Summary

The admin dashboard provides a complete suite of tools for league management:

| Tool | Description | Features |
|------|-------------|----------|
| **Add Game Stats** | Create games and add player statistics | Real-time stat calculation, game leaders |
| **Add Player** | Register new players to teams | Team assignment, jersey number management |
| **Add Team** | Create new teams | Custom colors, branding, roster management |
| **Add Stats to Existing Game** | Retroactively add player stats | Historical data completion |
| **Manage Existing Data** | Edit/delete all data types | Full CRUD operations with safety checks |

## Contributing

This project demonstrates expertise in:
- Full-stack web development
- Database design and optimization
- Real-time data synchronization
- Responsive UI/UX design
- Sports analytics and statistical processing

---

*Built for the Chicago Shia Basketball League community*