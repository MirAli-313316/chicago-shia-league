// admin.js - Admin dashboard functionality

let currentGameId = null;

// Check authentication status on page load
firebase.auth().onAuthStateChanged(user => {
    const loginSection = document.getElementById('loginSection');
    const adminDashboard = document.getElementById('adminDashboard');
    
    if (user) {
        // User is logged in
        loginSection.style.display = 'none';
        adminDashboard.style.display = 'block';
        loadTeams();
    } else {
        // User is not logged in
        loginSection.style.display = 'block';
        adminDashboard.style.display = 'none';
    }
});

// Login form handler
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');
    
    try {
        await firebase.auth().signInWithEmailAndPassword(email, password);
        errorMessage.classList.add('hidden');
    } catch (error) {
        errorMessage.textContent = 'Login failed: ' + error.message;
        errorMessage.classList.remove('hidden');
    }
});

// Logout function
function logout() {
    firebase.auth().signOut();
}

// Switch between tabs
function switchTab(tabName) {
    console.log('Switching to tab:', tabName);

    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    // Remove active class from all buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected tab
    if (tabName === 'addGame') {
        document.getElementById('addGameTab').classList.add('active');
        document.querySelectorAll('.tab-btn')[0].classList.add('active');
    } else if (tabName === 'addPlayer') {
        document.getElementById('addPlayerTab').classList.add('active');
        document.querySelectorAll('.tab-btn')[1].classList.add('active');
    } else if (tabName === 'addTeam') {
        document.getElementById('addTeamTab').classList.add('active');
        document.querySelectorAll('.tab-btn')[2].classList.add('active');
    } else if (tabName === 'manageGames') {
        document.getElementById('manageGamesTab').classList.add('active');
        document.querySelectorAll('.tab-btn')[3].classList.add('active');
        loadExistingGames(); // Load games when switching to this tab
    } else if (tabName === 'manageData') {
        console.log('Activating manageData tab');
        const manageDataTab = document.getElementById('manageDataTab');
        if (manageDataTab) {
            console.log('manageDataTab element found, current classes:', manageDataTab.className);
            manageDataTab.classList.add('active');
            document.querySelectorAll('.tab-btn')[4].classList.add('active');
            console.log('Tab activated, new classes:', manageDataTab.className);
            console.log('Tab visible?', manageDataTab.style.display !== 'none' && getComputedStyle(manageDataTab).display !== 'none');
            console.log('Tab calling loadManagementData()');
            loadManagementData(); // Load data when switching to this tab
        } else {
            console.error('manageDataTab element not found!');
        }
    }
}

// Load teams into dropdown menus
async function loadTeams() {
    try {
        const teamsSnapshot = await db.collection('teams').get();
        const teams = [];
        
        teamsSnapshot.forEach(doc => {
            teams.push({ id: doc.id, ...doc.data() });
        });
        
        // Populate all team dropdowns
        const team1Select = document.getElementById('team1');
        const team2Select = document.getElementById('team2');
        const playerTeamSelect = document.getElementById('playerTeam');
        
        [team1Select, team2Select, playerTeamSelect].forEach(select => {
            select.innerHTML = '<option value="">Select Team</option>';
            teams.forEach(team => {
                const option = document.createElement('option');
                option.value = team.id;
                option.textContent = team.name;
                select.appendChild(option);
            });
        });
        
    } catch (error) {
        console.error('Error loading teams:', error);
    }
}

// Add Game Form Handler
document.getElementById('addGameForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const successMessage = document.getElementById('gameSuccessMessage');
    
    try {
        const settingsDoc = await db.collection('settings').doc('league').get();
        const currentSeason = settingsDoc.data().currentSeason;
        
        const gameData = {
            week: parseInt(document.getElementById('gameWeek').value),
            season: currentSeason,
            date: firebase.firestore.Timestamp.fromDate(new Date(document.getElementById('gameDate').value)),
            team1Id: document.getElementById('team1').value,
            team2Id: document.getElementById('team2').value,
            team1Score: parseInt(document.getElementById('team1Score').value),
            team2Score: parseInt(document.getElementById('team2Score').value),
            status: 'completed',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        const gameRef = await db.collection('games').add(gameData);
        currentGameId = gameRef.id;
        
        successMessage.textContent = 'Game created successfully! Now add player stats below.';
        successMessage.classList.remove('hidden');
        
        // Show player stats section
        document.getElementById('playerStatsSection').classList.remove('hidden');
        
        // Load players from both teams
        await loadPlayersForGame(gameData.team1Id, gameData.team2Id);
        
        // Reset form
        document.getElementById('addGameForm').reset();
        
        setTimeout(() => {
            successMessage.classList.add('hidden');
        }, 3000);
        
    } catch (error) {
        console.error('Error adding game:', error);
        alert('Error adding game: ' + error.message);
    }
});

// Load players from selected teams for stats entry
async function loadPlayersForGame(team1Id, team2Id) {
    try {
        const playersSnapshot = await db.collection('players')
            .where('teamId', 'in', [team1Id, team2Id])
            .get();
        
        const statPlayerSelect = document.getElementById('statPlayer');
        statPlayerSelect.innerHTML = '<option value="">Select Player</option>';
        
        playersSnapshot.forEach(doc => {
            const player = doc.data();
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = `${player.name} (#${player.number})`;
            statPlayerSelect.appendChild(option);
        });
        
    } catch (error) {
        console.error('Error loading players:', error);
    }
}

// Add Player Stats Form Handler
document.getElementById('addPlayerStatsForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!currentGameId) {
        alert('Please create a game first!');
        return;
    }
    
    try {
        const statData = {
            gameId: currentGameId,
            playerId: document.getElementById('statPlayer').value,
            points: parseInt(document.getElementById('points').value),
            rebounds: parseInt(document.getElementById('rebounds').value),
            assists: parseInt(document.getElementById('assists').value),
            steals: parseInt(document.getElementById('steals').value),
            blocks: parseInt(document.getElementById('blocks').value),
            fgMade: parseInt(document.getElementById('fgMade').value),
            fgAtt: parseInt(document.getElementById('fgAtt').value),
            twoMade: parseInt(document.getElementById('twoMade').value),
            twoAtt: parseInt(document.getElementById('twoAtt').value),
            threeMade: parseInt(document.getElementById('threeMade').value),
            threeAtt: parseInt(document.getElementById('threeAtt').value),
            ftMade: parseInt(document.getElementById('ftMade').value),
            ftAtt: parseInt(document.getElementById('ftAtt').value),
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        await db.collection('gameStats').add(statData);
        
        const successMessage = document.getElementById('gameSuccessMessage');
        successMessage.textContent = 'Player stats added successfully! Add more players or start a new game.';
        successMessage.classList.remove('hidden');
        
        // Reset stats form but keep player selection dropdown
        document.getElementById('addPlayerStatsForm').reset();
        
        setTimeout(() => {
            successMessage.classList.add('hidden');
        }, 3000);
        
    } catch (error) {
        console.error('Error adding player stats:', error);
        alert('Error adding player stats: ' + error.message);
    }
});

// Add Player Form Handler
document.getElementById('addPlayerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const successMessage = document.getElementById('playerSuccessMessage');
    
    try {
        const playerData = {
            name: document.getElementById('playerName').value,
            number: parseInt(document.getElementById('playerNumber').value),
            teamId: document.getElementById('playerTeam').value,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        await db.collection('players').add(playerData);
        
        successMessage.textContent = 'Player added successfully!';
        successMessage.classList.remove('hidden');
        
        // Reset form
        document.getElementById('addPlayerForm').reset();
        
        setTimeout(() => {
            successMessage.classList.add('hidden');
        }, 3000);
        
    } catch (error) {
        console.error('Error adding player:', error);
        alert('Error adding player: ' + error.message);
    }
});

// Add Team Form Handler
document.getElementById('addTeamForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const successMessage = document.getElementById('teamSuccessMessage');
    
    try {
        const teamData = {
            name: document.getElementById('teamName').value,
            color: document.getElementById('teamColor').value,
            logoUrl: document.getElementById('teamLogo').value || '',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        await db.collection('teams').add(teamData);
        
        successMessage.textContent = 'Team added successfully!';
        successMessage.classList.remove('hidden');
        
        // Reset form
        document.getElementById('addTeamForm').reset();
        
        // Reload teams in dropdowns
        await loadTeams();
        
        setTimeout(() => {
            successMessage.classList.add('hidden');
        }, 3000);
        
    } catch (error) {
        console.error('Error adding team:', error);
        alert('Error adding team: ' + error.message);
    }
});

// Load existing games for the manage games tab
async function loadExistingGames() {
    try {
        const gamesSnapshot = await db.collection('games')
            .orderBy('date', 'desc')
            .get();

        const existingGameSelect = document.getElementById('existingGame');
        existingGameSelect.innerHTML = '<option value="">Select a game to add stats to...</option>';

        for (const doc of gamesSnapshot.docs) {
            const game = doc.data();

            // Get team names
            const team1Doc = await db.collection('teams').doc(game.team1Id).get();
            const team2Doc = await db.collection('teams').doc(game.team2Id).get();

            const team1Name = team1Doc.exists ? team1Doc.data().name : 'Unknown Team';
            const team2Name = team2Doc.exists ? team2Doc.data().name : 'Unknown Team';

            // Format date
            const gameDate = game.date.toDate();
            const formattedDate = gameDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });

            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = `${formattedDate} - ${team1Name} vs ${team2Name} (${game.team1Score}-${game.team2Score})`;
            existingGameSelect.appendChild(option);
        }

    } catch (error) {
        console.error('Error loading existing games:', error);
        alert('Error loading games: ' + error.message);
    }
}

// Handle game selection form
document.getElementById('selectGameForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const selectedGameId = document.getElementById('existingGame').value;
    if (!selectedGameId) {
        alert('Please select a game');
        return;
    }

    await loadSelectedGame(selectedGameId);
});

// Load selected game details and show form
async function loadSelectedGame(gameId) {
    try {
        const gameDoc = await db.collection('games').doc(gameId).get();
        const game = gameDoc.data();

        if (!gameDoc.exists) {
            alert('Game not found');
            return;
        }

        // Get team names
        const team1Doc = await db.collection('teams').doc(game.team1Id).get();
        const team2Doc = await db.collection('teams').doc(game.team2Id).get();

        const team1Name = team1Doc.exists ? team1Doc.data().name : 'Unknown Team';
        const team2Name = team2Doc.exists ? team2Doc.data().name : 'Unknown Team';

        // Format date
        const gameDate = game.date.toDate();
        const formattedDate = gameDate.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });

        // Show game info
        const gameInfoDiv = document.getElementById('existingGameInfo');
        gameInfoDiv.innerHTML = `
            <strong>Game Details:</strong><br>
            Date: ${formattedDate}<br>
            Teams: ${team1Name} vs ${team2Name}<br>
            Score: ${game.team1Score} - ${game.team2Score}<br>
            Week ${game.week}, Season ${game.season}
        `;

        // Show the stats form section
        document.getElementById('existingGameStatsSection').classList.remove('hidden');

        // Load players for this game
        await loadPlayersForExistingGame(game.team1Id, game.team2Id);

    } catch (error) {
        console.error('Error loading selected game:', error);
        alert('Error loading game: ' + error.message);
    }
}

// Load players for existing game
async function loadPlayersForExistingGame(team1Id, team2Id) {
    try {
        const playersSnapshot = await db.collection('players')
            .where('teamId', 'in', [team1Id, team2Id])
            .get();

        const existingStatPlayerSelect = document.getElementById('existingStatPlayer');
        existingStatPlayerSelect.innerHTML = '<option value="">Select Player</option>';

        playersSnapshot.forEach(doc => {
            const player = doc.data();
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = `${player.name} (#${player.number})`;
            existingStatPlayerSelect.appendChild(option);
        });

    } catch (error) {
        console.error('Error loading players for existing game:', error);
    }
}

// Add stats to existing game form handler
document.getElementById('addExistingGamePlayerStatsForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const selectedGameId = document.getElementById('existingGame').value;
    if (!selectedGameId) {
        alert('Please select a game first');
        return;
    }

    try {
        const statData = {
            gameId: selectedGameId,
            playerId: document.getElementById('existingStatPlayer').value,
            points: parseInt(document.getElementById('existingPoints').value),
            rebounds: parseInt(document.getElementById('existingRebounds').value),
            assists: parseInt(document.getElementById('existingAssists').value),
            steals: parseInt(document.getElementById('existingSteals').value),
            blocks: parseInt(document.getElementById('existingBlocks').value),
            fgMade: parseInt(document.getElementById('existingFgMade').value),
            fgAtt: parseInt(document.getElementById('existingFgAtt').value),
            twoMade: parseInt(document.getElementById('existingTwoMade').value),
            twoAtt: parseInt(document.getElementById('existingTwoAtt').value),
            threeMade: parseInt(document.getElementById('existingThreeMade').value),
            threeAtt: parseInt(document.getElementById('existingThreeAtt').value),
            ftMade: parseInt(document.getElementById('existingFtMade').value),
            ftAtt: parseInt(document.getElementById('existingFtAtt').value),
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        await db.collection('gameStats').add(statData);

        const successMessage = document.getElementById('manageGameSuccessMessage');
        successMessage.textContent = 'Player stats added to game successfully! You can add more players or select a different game.';
        successMessage.classList.remove('hidden');

        // Reset form but keep game selection
        document.getElementById('addExistingGamePlayerStatsForm').reset();

        setTimeout(() => {
            successMessage.classList.add('hidden');
        }, 4000);

    } catch (error) {
        console.error('Error adding player stats to existing game:', error);
        alert('Error adding player stats: ' + error.message);
    }
});

// ===== MANAGE EXISTING DATA FUNCTIONS =====

// Load all data for management tab
async function loadManagementData() {
    try {
        console.log('Loading management data...');
        console.log('Current user authenticated:', !!firebase.auth().currentUser);

        // Check if elements exist
        const elements = ['gamesList', 'playerStatsList', 'teamsList', 'playersList'];
        elements.forEach(id => {
            const element = document.getElementById(id);
            console.log(`${id} element found:`, !!element);
        });

        await Promise.all([
            loadGamesForManagement(),
            loadPlayerStatsForManagement(),
            loadTeamsForManagement(),
            loadPlayersForManagement()
        ]);
        console.log('Management data loaded successfully');
    } catch (error) {
        console.error('Error loading management data:', error);
        showManagementError('Error loading management data. Please check console for details.');
    }
}

// Show error message in management tab
function showManagementError(message) {
    const container = document.getElementById('manageDataTab');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    errorDiv.style.marginTop = '1rem';

    // Remove any existing error messages
    const existingError = container.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }

    container.appendChild(errorDiv);
}

// Load games for management dropdown
async function loadGamesForManagement() {
    try {
        console.log('Loading games for management...');
        const gamesSnapshot = await db.collection('games')
            .orderBy('date', 'desc')
            .get();

        console.log('Games snapshot size:', gamesSnapshot.size);
        console.log('Games snapshot empty:', gamesSnapshot.empty);

        const gamesList = document.getElementById('gamesList');
        if (!gamesList) {
            console.error('gamesList element not found!');
            return;
        }

        gamesList.innerHTML = '<option value="">Select a game...</option>';

        if (gamesSnapshot.empty) {
            console.log('No games found in database');
            gamesList.innerHTML += '<option value="" disabled>No games found - create some games first</option>';
            return;
        }

        console.log('Processing', gamesSnapshot.docs.length, 'games');
        for (const doc of gamesSnapshot.docs) {
            const game = doc.data();
            console.log('Processing game:', game);

            // Get team names
            const team1Doc = await db.collection('teams').doc(game.team1Id).get();
            const team2Doc = await db.collection('teams').doc(game.team2Id).get();

            const team1Name = team1Doc.exists ? team1Doc.data().name : 'Unknown Team';
            const team2Name = team2Doc.exists ? team2Doc.data().name : 'Unknown Team';

            // Format date
            const gameDate = game.date.toDate();
            const formattedDate = gameDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });

            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = `${formattedDate} - ${team1Name} vs ${team2Name} (${game.team1Score}-${game.team2Score}) - Week ${game.week}`;
            gamesList.appendChild(option);
        }
        console.log('Games loaded successfully');

    } catch (error) {
        console.error('Error loading games for management:', error);
        const gamesList = document.getElementById('gamesList');
        if (gamesList) {
            gamesList.innerHTML = '<option value="">Error loading games</option>';
        }
    }
}

// Load player stats for management dropdown
async function loadPlayerStatsForManagement() {
    try {
        console.log('Loading player stats for management...');
        const statsSnapshot = await db.collection('gameStats')
            .orderBy('createdAt', 'desc')
            .limit(100)
            .get();

        console.log('Stats snapshot size:', statsSnapshot.size);
        console.log('Stats snapshot empty:', statsSnapshot.empty);

        const statsList = document.getElementById('playerStatsList');
        if (!statsList) {
            console.error('playerStatsList element not found!');
            return;
        }

        statsList.innerHTML = '<option value="">Select player stats...</option>';

        if (statsSnapshot.empty) {
            console.log('No player stats found in database');
            statsList.innerHTML += '<option value="" disabled>No player stats found - add some game stats first</option>';
            return;
        }

        console.log('Processing', statsSnapshot.docs.length, 'player stats');
        for (const doc of statsSnapshot.docs) {
            const stat = doc.data();
            console.log('Processing stat:', stat);

            // Get player name
            const playerDoc = await db.collection('players').doc(stat.playerId).get();
            const playerName = playerDoc.exists ? playerDoc.data().name : 'Unknown Player';

            // Get game info
            const gameDoc = await db.collection('games').doc(stat.gameId).get();
            let gameInfo = 'Unknown Game';
            if (gameDoc.exists) {
                const game = gameDoc.data();
                const team1Doc = await db.collection('teams').doc(game.team1Id).get();
                const team2Doc = await db.collection('teams').doc(game.team2Id).get();
                const team1Name = team1Doc.exists ? team1Doc.data().name : 'Unknown';
                const team2Name = team2Doc.exists ? team2Doc.data().name : 'Unknown';
                gameInfo = `${team1Name} vs ${team2Name} (${game.team1Score}-${game.team2Score})`;
            }

            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = `${playerName} - ${stat.points} pts, ${stat.rebounds} reb - ${gameInfo}`;
            statsList.appendChild(option);
        }
        console.log('Player stats loaded successfully');

    } catch (error) {
        console.error('Error loading player stats for management:', error);
        const statsList = document.getElementById('playerStatsList');
        if (statsList) {
            statsList.innerHTML = '<option value="">Error loading player stats</option>';
        }
    }
}

// Load teams for management dropdown
async function loadTeamsForManagement() {
    try {
        const teamsSnapshot = await db.collection('teams').orderBy('name').get();

        const teamsList = document.getElementById('teamsList');
        teamsList.innerHTML = '<option value="">Select a team...</option>';

        if (teamsSnapshot.empty) {
            teamsList.innerHTML += '<option value="" disabled>No teams found - create some teams first</option>';
            return;
        }

        teamsSnapshot.forEach(doc => {
            const team = doc.data();
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = team.name;
            teamsList.appendChild(option);
        });

    } catch (error) {
        console.error('Error loading teams for management:', error);
        const teamsList = document.getElementById('teamsList');
        teamsList.innerHTML = '<option value="">Error loading teams</option>';
    }
}

// Load players for management dropdown
async function loadPlayersForManagement() {
    try {
        const playersSnapshot = await db.collection('players').orderBy('name').get();

        const playersList = document.getElementById('playersList');
        playersList.innerHTML = '<option value="">Select a player...</option>';

        if (playersSnapshot.empty) {
            playersList.innerHTML += '<option value="" disabled>No players found - create some players first</option>';
            return;
        }

        for (const doc of playersSnapshot.docs) {
            const player = doc.data();

            // Get team name
            const teamDoc = await db.collection('teams').doc(player.teamId).get();
            const teamName = teamDoc.exists ? teamDoc.data().name : 'Unknown Team';

            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = `${player.name} (#${player.number}) - ${teamName}`;
            playersList.appendChild(option);
        }

    } catch (error) {
        console.error('Error loading players for management:', error);
        const playersList = document.getElementById('playersList');
        playersList.innerHTML = '<option value="">Error loading players</option>';
    }
}

// Load game for editing
async function loadGameForEditing() {
    const gamesList = document.getElementById('gamesList');
    const selectedGameId = gamesList.value;

    if (!selectedGameId) {
        document.getElementById('gameEditForm').classList.add('hidden');
        return;
    }

    try {
        const gameDoc = await db.collection('games').doc(selectedGameId).get();
        const game = gameDoc.data();

        // Populate form fields
        document.getElementById('editGameWeek').value = game.week;
        document.getElementById('editGameDate').value = game.date.toDate().toISOString().split('T')[0];
        document.getElementById('editTeam1Score').value = game.team1Score;
        document.getElementById('editTeam2Score').value = game.team2Score;

        // Load teams and select the correct ones
        await loadTeamsForEdit('editTeam1', 'editTeam2', game.team1Id, game.team2Id);

        document.getElementById('gameEditForm').classList.remove('hidden');

    } catch (error) {
        console.error('Error loading game for editing:', error);
        alert('Error loading game: ' + error.message);
    }
}

// Load teams for edit forms
async function loadTeamsForEdit(team1SelectId, team2SelectId, selectedTeam1Id, selectedTeam2Id) {
    try {
        const teamsSnapshot = await db.collection('teams').get();
        const teams = [];

        teamsSnapshot.forEach(doc => {
            teams.push({ id: doc.id, ...doc.data() });
        });

        // Populate both team dropdowns
        const team1Select = document.getElementById(team1SelectId);
        const team2Select = document.getElementById(team2SelectId);

        [team1Select, team2Select].forEach(select => {
            select.innerHTML = '<option value="">Select Team</option>';
            teams.forEach(team => {
                const option = document.createElement('option');
                option.value = team.id;
                option.textContent = team.name;
                select.appendChild(option);
            });
        });

        // Set selected values
        if (selectedTeam1Id) document.getElementById(team1SelectId).value = selectedTeam1Id;
        if (selectedTeam2Id) document.getElementById(team2SelectId).value = selectedTeam2Id;

    } catch (error) {
        console.error('Error loading teams for edit:', error);
    }
}

// Edit Game Form Handler
document.getElementById('editGameForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const gameId = document.getElementById('gamesList').value;
    if (!gameId) return;

    try {
        const gameData = {
            week: parseInt(document.getElementById('editGameWeek').value),
            date: firebase.firestore.Timestamp.fromDate(new Date(document.getElementById('editGameDate').value)),
            team1Id: document.getElementById('editTeam1').value,
            team2Id: document.getElementById('editTeam2').value,
            team1Score: parseInt(document.getElementById('editTeam1Score').value),
            team2Score: parseInt(document.getElementById('editTeam2Score').value),
        };

        await db.collection('games').doc(gameId).update(gameData);

        const successMessage = document.getElementById('manageDataSuccessMessage');
        successMessage.textContent = 'Game updated successfully!';
        successMessage.classList.remove('hidden');

        // Reload data
        await loadGamesForManagement();

        setTimeout(() => {
            successMessage.classList.add('hidden');
        }, 3000);

    } catch (error) {
        console.error('Error updating game:', error);
        alert('Error updating game: ' + error.message);
    }
});

// Delete game
async function deleteGame() {
    if (!confirm('Are you sure you want to delete this game? This will also delete all associated player stats. This action cannot be undone.')) {
        return;
    }

    const gameId = document.getElementById('gamesList').value;
    if (!gameId) return;

    try {
        // Delete all player stats for this game first
        const statsSnapshot = await db.collection('gameStats')
            .where('gameId', '==', gameId)
            .get();

        const deletePromises = [];
        statsSnapshot.forEach(doc => {
            deletePromises.push(db.collection('gameStats').doc(doc.id).delete());
        });

        await Promise.all(deletePromises);

        // Delete the game
        await db.collection('games').doc(gameId).delete();

        const successMessage = document.getElementById('manageDataSuccessMessage');
        successMessage.textContent = 'Game and all associated stats deleted successfully!';
        successMessage.classList.remove('hidden');

        // Reset form and reload data
        cancelGameEdit();
        await loadGamesForManagement();

        setTimeout(() => {
            successMessage.classList.add('hidden');
        }, 3000);

    } catch (error) {
        console.error('Error deleting game:', error);
        alert('Error deleting game: ' + error.message);
    }
}

// Cancel game edit
function cancelGameEdit() {
    document.getElementById('gameEditForm').classList.add('hidden');
    document.getElementById('gamesList').value = '';
}

// Load player stats for editing
async function loadPlayerStatsForEditing() {
    const statsList = document.getElementById('playerStatsList');
    const selectedStatsId = statsList.value;

    if (!selectedStatsId) {
        document.getElementById('playerStatsEditForm').classList.add('hidden');
        return;
    }

    try {
        const statDoc = await db.collection('gameStats').doc(selectedStatsId).get();
        const stat = statDoc.data();

        // Populate form fields
        document.getElementById('editPoints').value = stat.points || 0;
        document.getElementById('editRebounds').value = stat.rebounds || 0;
        document.getElementById('editAssists').value = stat.assists || 0;
        document.getElementById('editSteals').value = stat.steals || 0;
        document.getElementById('editBlocks').value = stat.blocks || 0;
        document.getElementById('editFgMade').value = stat.fgMade || 0;
        document.getElementById('editFgAtt').value = stat.fgAtt || 0;
        document.getElementById('editTwoMade').value = stat.twoMade || 0;
        document.getElementById('editTwoAtt').value = stat.twoAtt || 0;
        document.getElementById('editThreeMade').value = stat.threeMade || 0;
        document.getElementById('editThreeAtt').value = stat.threeAtt || 0;
        document.getElementById('editFtMade').value = stat.ftMade || 0;
        document.getElementById('editFtAtt').value = stat.ftAtt || 0;

        // Load players and games for dropdowns
        await loadPlayersForStatsEdit(stat.playerId);
        await loadGamesForStatsEdit(stat.gameId);

        document.getElementById('playerStatsEditForm').classList.remove('hidden');

    } catch (error) {
        console.error('Error loading player stats for editing:', error);
        alert('Error loading player stats: ' + error.message);
    }
}

// Load players for stats edit dropdown
async function loadPlayersForStatsEdit(selectedPlayerId) {
    try {
        const playersSnapshot = await db.collection('players').orderBy('name').get();

        const playerSelect = document.getElementById('editStatsPlayer');
        playerSelect.innerHTML = '<option value="">Select Player</option>';

        playersSnapshot.forEach(doc => {
            const player = doc.data();
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = `${player.name} (#${player.number})`;
            playerSelect.appendChild(option);
        });

        if (selectedPlayerId) playerSelect.value = selectedPlayerId;

    } catch (error) {
        console.error('Error loading players for stats edit:', error);
    }
}

// Load games for stats edit dropdown
async function loadGamesForStatsEdit(selectedGameId) {
    try {
        const gamesSnapshot = await db.collection('games').orderBy('date', 'desc').get();

        const gameSelect = document.getElementById('editStatsGame');
        gameSelect.innerHTML = '<option value="">Select Game</option>';

        for (const doc of gamesSnapshot.docs) {
            const game = doc.data();

            // Get team names
            const team1Doc = await db.collection('teams').doc(game.team1Id).get();
            const team2Doc = await db.collection('teams').doc(game.team2Id).get();

            const team1Name = team1Doc.exists ? team1Doc.data().name : 'Unknown';
            const team2Name = team2Doc.exists ? team2Doc.data().name : 'Unknown';

            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = `${team1Name} vs ${team2Name} (${game.team1Score}-${game.team2Score}) - Week ${game.week}`;
            gameSelect.appendChild(option);
        }

        if (selectedGameId) gameSelect.value = selectedGameId;

    } catch (error) {
        console.error('Error loading games for stats edit:', error);
    }
}

// Edit Player Stats Form Handler
document.getElementById('editPlayerStatsForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const statsId = document.getElementById('playerStatsList').value;
    if (!statsId) return;

    try {
        const statData = {
            playerId: document.getElementById('editStatsPlayer').value,
            gameId: document.getElementById('editStatsGame').value,
            points: parseInt(document.getElementById('editPoints').value),
            rebounds: parseInt(document.getElementById('editRebounds').value),
            assists: parseInt(document.getElementById('editAssists').value),
            steals: parseInt(document.getElementById('editSteals').value),
            blocks: parseInt(document.getElementById('editBlocks').value),
            fgMade: parseInt(document.getElementById('editFgMade').value),
            fgAtt: parseInt(document.getElementById('editFgAtt').value),
            twoMade: parseInt(document.getElementById('editTwoMade').value),
            twoAtt: parseInt(document.getElementById('editTwoAtt').value),
            threeMade: parseInt(document.getElementById('editThreeMade').value),
            threeAtt: parseInt(document.getElementById('editThreeAtt').value),
            ftMade: parseInt(document.getElementById('editFtMade').value),
            ftAtt: parseInt(document.getElementById('editFtAtt').value),
        };

        await db.collection('gameStats').doc(statsId).update(statData);

        const successMessage = document.getElementById('manageDataSuccessMessage');
        successMessage.textContent = 'Player stats updated successfully!';
        successMessage.classList.remove('hidden');

        // Reload data
        await loadPlayerStatsForManagement();

        setTimeout(() => {
            successMessage.classList.add('hidden');
        }, 3000);

    } catch (error) {
        console.error('Error updating player stats:', error);
        alert('Error updating player stats: ' + error.message);
    }
});

// Delete player stats
async function deletePlayerStats() {
    if (!confirm('Are you sure you want to delete these player stats? This action cannot be undone.')) {
        return;
    }

    const statsId = document.getElementById('playerStatsList').value;
    if (!statsId) return;

    try {
        await db.collection('gameStats').doc(statsId).delete();

        const successMessage = document.getElementById('manageDataSuccessMessage');
        successMessage.textContent = 'Player stats deleted successfully!';
        successMessage.classList.remove('hidden');

        // Reset form and reload data
        cancelPlayerStatsEdit();
        await loadPlayerStatsForManagement();

        setTimeout(() => {
            successMessage.classList.add('hidden');
        }, 3000);

    } catch (error) {
        console.error('Error deleting player stats:', error);
        alert('Error deleting player stats: ' + error.message);
    }
}

// Cancel player stats edit
function cancelPlayerStatsEdit() {
    document.getElementById('playerStatsEditForm').classList.add('hidden');
    document.getElementById('playerStatsList').value = '';
}

// Load team for editing
async function loadTeamForEditing() {
    const teamsList = document.getElementById('teamsList');
    const selectedTeamId = teamsList.value;

    if (!selectedTeamId) {
        document.getElementById('teamEditForm').classList.add('hidden');
        return;
    }

    try {
        const teamDoc = await db.collection('teams').doc(selectedTeamId).get();
        const team = teamDoc.data();

        // Populate form fields
        document.getElementById('editTeamName').value = team.name;
        document.getElementById('editTeamColor').value = team.color;
        document.getElementById('editTeamLogo').value = team.logoUrl || '';

        document.getElementById('teamEditForm').classList.remove('hidden');

    } catch (error) {
        console.error('Error loading team for editing:', error);
        alert('Error loading team: ' + error.message);
    }
}

// Edit Team Form Handler
document.getElementById('editTeamForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const teamId = document.getElementById('teamsList').value;
    if (!teamId) return;

    try {
        const teamData = {
            name: document.getElementById('editTeamName').value,
            color: document.getElementById('editTeamColor').value,
            logoUrl: document.getElementById('editTeamLogo').value || '',
        };

        await db.collection('teams').doc(teamId).update(teamData);

        const successMessage = document.getElementById('manageDataSuccessMessage');
        successMessage.textContent = 'Team updated successfully!';
        successMessage.classList.remove('hidden');

        // Reload data
        await loadTeamsForManagement();
        await loadTeams(); // Reload for other forms too

        setTimeout(() => {
            successMessage.classList.add('hidden');
        }, 3000);

    } catch (error) {
        console.error('Error updating team:', error);
        alert('Error updating team: ' + error.message);
    }
});

// Delete team
async function deleteTeam() {
    if (!confirm('Are you sure you want to delete this team? This will also delete all associated players and game records. This action cannot be undone.')) {
        return;
    }

    const teamId = document.getElementById('teamsList').value;
    if (!teamId) return;

    try {
        // Delete all players for this team first
        const playersSnapshot = await db.collection('players')
            .where('teamId', '==', teamId)
            .get();

        const deletePromises = [];
        playersSnapshot.forEach(doc => {
            deletePromises.push(db.collection('players').doc(doc.id).delete());
        });

        await Promise.all(deletePromises);

        // Delete the team
        await db.collection('teams').doc(teamId).delete();

        const successMessage = document.getElementById('manageDataSuccessMessage');
        successMessage.textContent = 'Team and all associated players deleted successfully!';
        successMessage.classList.remove('hidden');

        // Reset form and reload data
        cancelTeamEdit();
        await loadTeamsForManagement();
        await loadTeams(); // Reload for other forms too

        setTimeout(() => {
            successMessage.classList.add('hidden');
        }, 3000);

    } catch (error) {
        console.error('Error deleting team:', error);
        alert('Error deleting team: ' + error.message);
    }
}

// Cancel team edit
function cancelTeamEdit() {
    document.getElementById('teamEditForm').classList.add('hidden');
    document.getElementById('teamsList').value = '';
}

// Load player for editing
async function loadPlayerForEditing() {
    const playersList = document.getElementById('playersList');
    const selectedPlayerId = playersList.value;

    if (!selectedPlayerId) {
        document.getElementById('playerEditForm').classList.add('hidden');
        return;
    }

    try {
        const playerDoc = await db.collection('players').doc(selectedPlayerId).get();
        const player = playerDoc.data();

        // Populate form fields
        document.getElementById('editPlayerName').value = player.name;
        document.getElementById('editPlayerNumber').value = player.number;

        // Load teams and select the correct one
        await loadTeamsForPlayerEdit(player.teamId);

        document.getElementById('playerEditForm').classList.remove('hidden');

    } catch (error) {
        console.error('Error loading player for editing:', error);
        alert('Error loading player: ' + error.message);
    }
}

// Load teams for player edit dropdown
async function loadTeamsForPlayerEdit(selectedTeamId) {
    try {
        const teamsSnapshot = await db.collection('teams').orderBy('name').get();

        const teamSelect = document.getElementById('editPlayerTeam');
        teamSelect.innerHTML = '<option value="">Select Team</option>';

        teamsSnapshot.forEach(doc => {
            const team = doc.data();
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = team.name;
            teamSelect.appendChild(option);
        });

        if (selectedTeamId) teamSelect.value = selectedTeamId;

    } catch (error) {
        console.error('Error loading teams for player edit:', error);
    }
}

// Edit Player Form Handler
document.getElementById('editPlayerForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const playerId = document.getElementById('playersList').value;
    if (!playerId) return;

    try {
        const playerData = {
            name: document.getElementById('editPlayerName').value,
            number: parseInt(document.getElementById('editPlayerNumber').value),
            teamId: document.getElementById('editPlayerTeam').value,
        };

        await db.collection('players').doc(playerId).update(playerData);

        const successMessage = document.getElementById('manageDataSuccessMessage');
        successMessage.textContent = 'Player updated successfully!';
        successMessage.classList.remove('hidden');

        // Reload data
        await loadPlayersForManagement();

        setTimeout(() => {
            successMessage.classList.add('hidden');
        }, 3000);

    } catch (error) {
        console.error('Error updating player:', error);
        alert('Error updating player: ' + error.message);
    }
});

// Delete player
async function deletePlayer() {
    if (!confirm('Are you sure you want to delete this player? This will also delete all associated stats. This action cannot be undone.')) {
        return;
    }

    const playerId = document.getElementById('playersList').value;
    if (!playerId) return;

    try {
        // Delete all stats for this player first
        const statsSnapshot = await db.collection('gameStats')
            .where('playerId', '==', playerId)
            .get();

        const deletePromises = [];
        statsSnapshot.forEach(doc => {
            deletePromises.push(db.collection('gameStats').doc(doc.id).delete());
        });

        await Promise.all(deletePromises);

        // Delete the player
        await db.collection('players').doc(playerId).delete();

        const successMessage = document.getElementById('manageDataSuccessMessage');
        successMessage.textContent = 'Player and all associated stats deleted successfully!';
        successMessage.classList.remove('hidden');

        // Reset form and reload data
        cancelPlayerEdit();
        await loadPlayersForManagement();

        setTimeout(() => {
            successMessage.classList.add('hidden');
        }, 3000);

    } catch (error) {
        console.error('Error deleting player:', error);
        alert('Error deleting player: ' + error.message);
    }
}

// Cancel player edit
function cancelPlayerEdit() {
    document.getElementById('playerEditForm').classList.add('hidden');
    document.getElementById('playersList').value = '';
}

// ===== AUTO-CALCULATION FUNCTIONS =====

// Auto-calculate basketball stats for add game stats form
function calculateStats() {
    const twoMade = parseInt(document.getElementById('twoMade').value) || 0;
    const threeMade = parseInt(document.getElementById('threeMade').value) || 0;
    const ftMade = parseInt(document.getElementById('ftMade').value) || 0;

    // Auto-calculate FG Made
    const fgMade = twoMade + threeMade;
    document.getElementById('fgMade').value = fgMade;

    // Auto-calculate Points
    const points = (twoMade * 2) + (threeMade * 3) + ftMade;
    document.getElementById('points').value = points;
}

// Auto-calculate basketball stats for existing game stats form
function calculateExistingStats() {
    const twoMade = parseInt(document.getElementById('existingTwoMade').value) || 0;
    const threeMade = parseInt(document.getElementById('existingThreeMade').value) || 0;
    const ftMade = parseInt(document.getElementById('existingFtMade').value) || 0;

    // Auto-calculate FG Made
    const fgMade = twoMade + threeMade;
    document.getElementById('existingFgMade').value = fgMade;

    // Auto-calculate Points
    const points = (twoMade * 2) + (threeMade * 3) + ftMade;
    document.getElementById('existingPoints').value = points;
}

// Initialize auto-calculation event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Add event listeners for auto-calculation in add game stats form
    const twoMadeInput = document.getElementById('twoMade');
    const threeMadeInput = document.getElementById('threeMade');
    const ftMadeInput = document.getElementById('ftMade');

    if (twoMadeInput) twoMadeInput.addEventListener('input', calculateStats);
    if (threeMadeInput) threeMadeInput.addEventListener('input', calculateStats);
    if (ftMadeInput) ftMadeInput.addEventListener('input', calculateStats);

    // Add event listeners for auto-calculation in existing game stats form
    const existingTwoMadeInput = document.getElementById('existingTwoMade');
    const existingThreeMadeInput = document.getElementById('existingThreeMade');
    const existingFtMadeInput = document.getElementById('existingFtMade');

    if (existingTwoMadeInput) existingTwoMadeInput.addEventListener('input', calculateExistingStats);
    if (existingThreeMadeInput) existingThreeMadeInput.addEventListener('input', calculateExistingStats);
    if (existingFtMadeInput) existingFtMadeInput.addEventListener('input', calculateExistingStats);
});
