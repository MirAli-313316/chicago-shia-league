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
