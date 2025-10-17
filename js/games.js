// games.js - Games by week functionality

// Wait for DOM and Firebase to be ready
document.addEventListener('DOMContentLoaded', async function() {
    await initializeGamesPage();
});

// Initialize the games page
async function initializeGamesPage() {
    try {
        // Load season info and populate week dropdown
        await updateSeasonInfo();
        await loadAvailableWeeks();
    } catch (error) {
        console.error('Error initializing games page:', error);
        document.getElementById('gamesContainer').innerHTML =
            '<div class="loading">Error loading games page. Please try again later.</div>';
    }
}

// Update season info in header
async function updateSeasonInfo() {
    try {
        const settingsDoc = await db.collection('settings').doc('league').get();
        const settings = settingsDoc.data();

        document.getElementById('seasonInfo').textContent =
            `Season ${settings.currentSeason} • Current Week: ${settings.currentWeek}`;
        document.querySelector('.league-name').textContent = settings.leagueName;

    } catch (error) {
        console.error('Error updating season info:', error);
        document.getElementById('seasonInfo').textContent = 'Error loading season information';
    }
}

// Load all available weeks for the dropdown
async function loadAvailableWeeks() {
    try {
        const settingsDoc = await db.collection('settings').doc('league').get();
        const settings = settingsDoc.data();
        const currentSeason = settings.currentSeason;

        // Query all games for current season to find available weeks
        const gamesSnapshot = await db.collection('games')
            .where('season', '==', currentSeason)
            .get();

        if (gamesSnapshot.empty) {
            document.getElementById('gamesContainer').innerHTML =
                '<div class="no-games">No games found for this season yet.</div>';
            return;
        }

        // Extract unique weeks
        const weeks = new Set();
        gamesSnapshot.forEach(doc => {
            const game = doc.data();
            weeks.add(game.week);
        });

        // Sort weeks
        const sortedWeeks = Array.from(weeks).sort((a, b) => a - b);

        // Populate dropdown
        const weekSelect = document.getElementById('weekSelect');
        weekSelect.innerHTML = '<option value="">Select Week...</option>';

        sortedWeeks.forEach(week => {
            const option = document.createElement('option');
            option.value = week;
            option.textContent = `Week ${week}`;
            if (week === settings.currentWeek) {
                option.textContent += ' (Current)';
            }
            weekSelect.appendChild(option);
        });

    } catch (error) {
        console.error('Error loading available weeks:', error);
        document.getElementById('gamesContainer').innerHTML =
            '<div class="loading">Error loading weeks. Please try again later.</div>';
    }
}

// Load games for selected week
async function loadGamesForWeek() {
    const weekSelect = document.getElementById('weekSelect');
    const selectedWeek = parseInt(weekSelect.value);
    const gamesContainer = document.getElementById('gamesContainer');

    if (!selectedWeek) {
        gamesContainer.innerHTML = '<div class="loading">Select a week to view games</div>';
        return;
    }

    gamesContainer.innerHTML = '<div class="loading">Loading games for Week ' + selectedWeek + '...</div>';

    try {
        // Get current season
        const settingsDoc = await db.collection('settings').doc('league').get();
        const currentSeason = settingsDoc.data().currentSeason;

        // Query games for selected week
        const gamesSnapshot = await db.collection('games')
            .where('season', '==', currentSeason)
            .where('week', '==', selectedWeek)
            .orderBy('date', 'desc')
            .get();

        // Clear loading state
        gamesContainer.innerHTML = '';

        if (gamesSnapshot.empty) {
            gamesContainer.innerHTML =
                '<div class="no-games">No games scheduled for Week ' + selectedWeek + '.</div>';
            return;
        }

        // Process each game
        for (const gameDoc of gamesSnapshot.docs) {
            const game = gameDoc.data();
            game.id = gameDoc.id;

            // Get team details
            const team1Doc = await db.collection('teams').doc(game.team1Id).get();
            const team2Doc = await db.collection('teams').doc(game.team2Id).get();

            const team1 = team1Doc.data();
            const team2 = team2Doc.data();

            // Get game leaders
            const leaders = await getGameLeaders(game.id);

            // Create game card
            const gameCard = createGameCard(game, team1, team2, leaders);
            gamesContainer.appendChild(gameCard);
        }

    } catch (error) {
        console.error('Error loading games for week:', error);
        gamesContainer.innerHTML =
            '<div class="loading">Error loading games. Please try again later.</div>';
    }
}

// Get game leaders (top performers) - same as home.js
async function getGameLeaders(gameId) {
    try {
        const statsSnapshot = await db.collection('gameStats')
            .where('gameId', '==', gameId)
            .get();

        const stats = [];
        const playerCache = {};

        // Collect all stats with player names
        for (const statDoc of statsSnapshot.docs) {
            const stat = statDoc.data();

            // Get player name (with caching)
            if (!playerCache[stat.playerId]) {
                const playerDoc = await db.collection('players').doc(stat.playerId).get();
                if (playerDoc.exists) {
                    playerCache[stat.playerId] = playerDoc.data().name;
                } else {
                    playerCache[stat.playerId] = 'Unknown Player';
                }
            }

            stat.playerName = playerCache[stat.playerId];
            stats.push(stat);
        }

        // Find leaders in each category
        const leaders = {
            points: getTopPlayer(stats, 'points'),
            rebounds: getTopPlayer(stats, 'rebounds'),
            blocks: getTopPlayer(stats, 'blocks'),
            steals: getTopPlayer(stats, 'steals')
        };

        return leaders;

    } catch (error) {
        console.error('Error getting game leaders:', error);
        return {
            points: { playerName: 'N/A', value: 0 },
            rebounds: { playerName: 'N/A', value: 0 },
            blocks: { playerName: 'N/A', value: 0 },
            steals: { playerName: 'N/A', value: 0 }
        };
    }
}

// Get top player for a specific stat - same as home.js
function getTopPlayer(stats, statName) {
    if (stats.length === 0) {
        return { playerName: 'N/A', value: 0 };
    }

    const topStat = stats.reduce((max, stat) =>
        stat[statName] > max[statName] ? stat : max
    );

    return {
        playerName: topStat.playerName,
        value: topStat[statName]
    };
}

// Create HTML for game card with expandable player stats
function createGameCard(game, team1, team2, leaders) {
    const card = document.createElement('div');
    card.className = 'game-card';

    // Format date
    const gameDate = game.date.toDate();
    const formattedDate = gameDate.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });

    card.innerHTML = `
        <div class="game-card-actions">
            <div>
                <span class="game-date">${formattedDate}</span>
                <span style="color: #888; margin-left: 1rem;">Week ${game.week}</span>
            </div>
            <button class="view-stats-btn" onclick="toggleGamePlayerStats('${game.id}', this)">View Player Stats</button>
        </div>
        <div class="matchup">
            <div class="team">
                <div class="team-name">${team1 ? team1.name : 'Unknown Team'}</div>
                <div class="score">${game.team1Score}</div>
            </div>
            <div class="vs">VS</div>
            <div class="team">
                <div class="team-name">${team2 ? team2.name : 'Unknown Team'}</div>
                <div class="score">${game.team2Score}</div>
            </div>
        </div>
        <div class="game-leaders">
            <h4>Game Leaders</h4>
            <div class="leader-stat">
                <span class="stat-category">Points:</span>
                <span class="player-stat">${leaders.points.playerName} - ${leaders.points.value} pts</span>
            </div>
            <div class="leader-stat">
                <span class="stat-category">Rebounds:</span>
                <span class="player-stat">${leaders.rebounds.playerName} - ${leaders.rebounds.value} reb</span>
            </div>
            <div class="leader-stat">
                <span class="stat-category">Blocks:</span>
                <span class="player-stat">${leaders.blocks.playerName} - ${leaders.blocks.value} blk</span>
            </div>
            <div class="leader-stat">
                <span class="stat-category">Steals:</span>
                <span class="player-stat">${leaders.steals.playerName} - ${leaders.steals.value} stl</span>
            </div>
        </div>
        <div class="game-player-stats" id="game-stats-${game.id}">
            <h5>Loading player statistics...</h5>
        </div>
    `;

    return card;
}

// Toggle player stats for a specific game
async function toggleGamePlayerStats(gameId, button) {
    const statsContainer = document.getElementById(`game-stats-${gameId}`);
    const gameCard = button.closest('.game-card');

    if (statsContainer.classList.contains('show')) {
        // Hide stats
        statsContainer.classList.remove('show');
        button.textContent = 'View Player Stats';
    } else {
        // Show stats (load if not already loaded)
        if (statsContainer.querySelector('h5').textContent === 'Loading player statistics...') {
            await loadGamePlayerStats(gameId, statsContainer);
        }
        statsContainer.classList.add('show');
        button.textContent = 'Hide Player Stats';
    }
}

// Load and display player stats for a specific game
async function loadGamePlayerStats(gameId, container) {
    try {
        // Get all player stats for this game
        const statsSnapshot = await db.collection('gameStats')
            .where('gameId', '==', gameId)
            .get();

        if (statsSnapshot.empty) {
            container.innerHTML = '<h5>No player statistics recorded for this game</h5>';
            return;
        }

        let statsHtml = '<h5>Player Statistics</h5>';

        for (const statDoc of statsSnapshot.docs) {
            const stat = statDoc.data();

            // Get player name
            const playerDoc = await db.collection('players').doc(stat.playerId).get();
            const playerName = playerDoc.exists ? playerDoc.data().name : 'Unknown Player';

            // Format stats summary
            const statsSummary = `${stat.points} pts, ${stat.rebounds} reb, ${stat.assists} ast`;

            statsHtml += `
                <div class="player-stat-item">
                    <span class="player-name">${playerName}</span>
                    <span class="player-stats-summary">${statsSummary}</span>
                </div>
            `;
        }

        container.innerHTML = statsHtml;

    } catch (error) {
        console.error('Error loading game player stats:', error);
        container.innerHTML = '<h5>Error loading player statistics</h5>';
    }
}
