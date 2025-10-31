// home.js - Loads and displays latest week's games

// Wait for DOM and Firebase to be ready
document.addEventListener('DOMContentLoaded', async function() {
    initHeroSlideshow();
    await loadLatestWeekGames();
    updateSeasonInfo();
});

const HERO_SLIDE_INTERVAL_MS = 6500;
const HERO_IMAGE_PATHS = [
    'slide-show/IMG_3325.jpg',
    'slide-show/IMG_3586.jpg',
    'slide-show/IMG_3706.jpg',
    'slide-show/IMG_3722.jpg',
    'slide-show/IMG_3902.jpg',
    'slide-show/IMG_3919.jpg',
    'slide-show/IMG_4158.jpg',
    'slide-show/IMG_4250.jpg',
    'slide-show/IMG_5122.jpg',
    'slide-show/IMG_5155.JPG',
    'slide-show/IMG_5455.jpg'
];

// Load latest week's games
async function loadLatestWeekGames() {
    const gamesContainer = document.getElementById('gamesContainer');

    try {
        // Get current season from settings
        const settingsDoc = await db.collection('settings').doc('league').get();
        const settings = settingsDoc.data();
        const currentSeason = settings.currentSeason;

        // First, find the latest week by getting all games for the season
        const allGamesSnapshot = await db.collection('games')
            .where('season', '==', currentSeason)
            .orderBy('week', 'desc')
            .limit(1)
            .get();

        if (allGamesSnapshot.empty) {
            gamesContainer.innerHTML = '<div class="loading">No games scheduled yet. Check back later or contact your league admin.</div>';
            return;
        }

        // Get the latest week
        const latestGame = allGamesSnapshot.docs[0].data();
        const latestWeek = latestGame.week;

        // Query games for the latest week
        const gamesSnapshot = await db.collection('games')
            .where('season', '==', currentSeason)
            .where('week', '==', latestWeek)
            .orderBy('date', 'desc')
            .get();

        // Clear loading state
        gamesContainer.innerHTML = '';

        if (gamesSnapshot.empty) {
            gamesContainer.innerHTML = '<div class="loading">No games scheduled for the latest week yet. Check back later or contact your league admin.</div>';
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
        console.error('Error loading games:', error);
        gamesContainer.innerHTML = '<div class="loading">Error loading games. Please check your connection and try refreshing the page.</div>';
    }
}

// Get game leaders (top performers)
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
                playerCache[stat.playerId] = playerDoc.data().name;
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

// Get top player for a specific stat
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

function initHeroSlideshow() {
    const slider = document.getElementById('heroSlider');

    if (!slider || HERO_IMAGE_PATHS.length === 0) {
        return;
    }

    if (slider.dataset.initialized === 'true') {
        return;
    }

    const fragment = document.createDocumentFragment();

    HERO_IMAGE_PATHS.forEach((src, index) => {
        const slide = document.createElement('div');
        slide.className = 'hero-slide';

        if (index === 0) {
            slide.classList.add('active');
        }

        slide.style.backgroundImage = `url('${src}')`;
        slide.setAttribute('role', 'presentation');
        fragment.appendChild(slide);

        const img = new Image();
        img.src = src;
    });

    slider.appendChild(fragment);
    slider.dataset.initialized = 'true';

    const slides = slider.querySelectorAll('.hero-slide');

    if (slides.length <= 1) {
        slides.forEach(slide => slide.classList.add('active'));
        return;
    }

    let currentIndex = 0;

    setInterval(() => {
        const nextIndex = (currentIndex + 1) % slides.length;

        slides[currentIndex].classList.remove('active');
        slides[nextIndex].classList.add('active');

        currentIndex = nextIndex;
    }, HERO_SLIDE_INTERVAL_MS);
}

// Create HTML for game card
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
        <div class="game-header">
            <span class="game-date">${formattedDate}</span>
            <span style="color: #888;">Week ${game.week}</span>
        </div>
        <div class="matchup">
            <div class="team">
                <div class="team-name">${team1.name}</div>
                <div class="score">${game.team1Score}</div>
            </div>
            <div class="vs">VS</div>
            <div class="team">
                <div class="team-name">${team2.name}</div>
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
    `;
    
    return card;
}

// Update season info in hero section
async function updateSeasonInfo() {
    try {
        const settingsDoc = await db.collection('settings').doc('league').get();
        const settings = settingsDoc.data();

        document.querySelector('.season-badge').textContent = `⛹️ SEASON ${settings.currentSeason}`;

        // Find the latest week
        const currentSeason = settings.currentSeason;
        const allGamesSnapshot = await db.collection('games')
            .where('season', '==', currentSeason)
            .orderBy('week', 'desc')
            .limit(1)
            .get();

        if (!allGamesSnapshot.empty) {
            const latestGame = allGamesSnapshot.docs[0].data();
            const latestWeek = latestGame.week;
            document.querySelector('.week-info').textContent = `Latest Week ${latestWeek}`;
        } else {
            document.querySelector('.week-info').textContent = `No Games Yet`;
        }

        document.querySelector('.league-name').textContent = settings.leagueName;

    } catch (error) {
        console.error('Error updating season info:', error);
    }
}
