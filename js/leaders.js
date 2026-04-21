const MIN_GAMES_FOR_LEADERS = 3;

function roundToOne(value) {
    return Number((value || 0).toFixed(1));
}

function formatValue(value) {
    return roundToOne(value).toFixed(1);
}

function getPlayerSortName(player) {
    return (player.name || '').toLowerCase();
}

function byMetricThenName(metricKey) {
    return (a, b) => {
        const metricDiff = (b[metricKey] || 0) - (a[metricKey] || 0);
        if (Math.abs(metricDiff) > 0.0001) {
            return metricDiff;
        }
        return getPlayerSortName(a).localeCompare(getPlayerSortName(b));
    };
}

function renderCategory(container, title, statKey, suffix, players) {
    const sorted = [...players].sort(byMetricThenName(statKey)).slice(0, 3);

    const listMarkup = sorted.length > 0
        ? sorted.map((player, index) => `
            <li class="leader-item">
                <span class="leader-rank">#${index + 1}</span>
                <div class="leader-main">
                    <div class="leader-name">${player.name}</div>
                    <div class="leader-team">${player.teamName || 'No Team'}</div>
                </div>
                <span class="leader-value">${formatValue(player[statKey])} ${suffix}</span>
            </li>
        `).join('')
        : `<li class="empty">No qualified players yet</li>`;

    container.innerHTML += `
        <section class="leader-card">
            <h2>${title}</h2>
            <ul class="leader-list">${listMarkup}</ul>
        </section>
    `;
}

function calculatePerGameStats(statDocs) {
    const totals = { games: 0, points: 0, rebounds: 0, blocks: 0, threeMade: 0 };
    statDocs.forEach(stat => {
        totals.games += 1;
        totals.points += stat.points || 0;
        totals.rebounds += stat.rebounds || 0;
        totals.blocks += stat.blocks || 0;
        totals.threeMade += stat.threeMade || 0;
    });

    const perGame = (total) => totals.games > 0 ? total / totals.games : 0;
    return {
        gamesPlayed: totals.games,
        ppg: roundToOne(perGame(totals.points)),
        rpg: roundToOne(perGame(totals.rebounds)),
        bpg: roundToOne(perGame(totals.blocks)),
        threePg: roundToOne(perGame(totals.threeMade))
    };
}

async function loadSeasonLeaders() {
    const seasonInfo = document.getElementById('seasonInfo');
    const leadersContainer = document.getElementById('leadersContainer');

    try {
        const settingsDoc = await db.collection('settings').doc('league').get();
        const settings = settingsDoc.data() || {};
        const currentSeason = settings.currentSeason || 1;
        seasonInfo.textContent = `Season ${currentSeason} leaders (min ${MIN_GAMES_FOR_LEADERS} games)`;

        const [teamsSnapshot, playersSnapshot, seasonGamesSnapshot] = await Promise.all([
            db.collection('teams').get(),
            db.collection('players').get(),
            db.collection('games').where('season', '==', currentSeason).get()
        ]);

        const teamById = {};
        teamsSnapshot.forEach(doc => {
            teamById[doc.id] = doc.data().name;
        });

        const seasonGameIds = new Set();
        seasonGamesSnapshot.forEach(doc => seasonGameIds.add(doc.id));

        if (seasonGameIds.size === 0) {
            leadersContainer.innerHTML = '<div class="empty">No games found for current season.</div>';
            return;
        }

        const playersWithStats = [];
        for (const playerDoc of playersSnapshot.docs) {
            const player = playerDoc.data();
            const statsSnapshot = await db.collection('gameStats')
                .where('playerId', '==', playerDoc.id)
                .get();

            const seasonStats = statsSnapshot.docs
                .map(doc => doc.data())
                .filter(stat => stat.gameId && seasonGameIds.has(stat.gameId));

            const perGameStats = calculatePerGameStats(seasonStats);
            if (perGameStats.gamesPlayed < MIN_GAMES_FOR_LEADERS) {
                continue;
            }

            playersWithStats.push({
                name: player.name || 'Unknown Player',
                teamName: teamById[player.teamId] || 'Unknown Team',
                ...perGameStats
            });
        }

        leadersContainer.innerHTML = '';
        renderCategory(leadersContainer, 'Points Per Game', 'ppg', 'PPG', playersWithStats);
        renderCategory(leadersContainer, 'Rebounds Per Game', 'rpg', 'RPG', playersWithStats);
        renderCategory(leadersContainer, 'Blocks Per Game', 'bpg', 'BPG', playersWithStats);
        renderCategory(leadersContainer, '3s Made Per Game', 'threePg', '3PM/G', playersWithStats);
    } catch (error) {
        console.error('Failed to load season leaders:', error);
        seasonInfo.textContent = 'Unable to load season leaders';
        leadersContainer.innerHTML = '<div class="error">Error loading leaders data.</div>';
    }
}

document.addEventListener('DOMContentLoaded', loadSeasonLeaders);
