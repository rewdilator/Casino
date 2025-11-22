// src/utils/playerStats.js

// Function to update stats when games are played
export const updatePlayerStats = (account, gameType, result, amount, winnings = 0) => {
  if (!account) return null;

  try {
    // Get current stats from localStorage
    const storedStats = localStorage.getItem(`playerStats_${account}`);
    let playerStats = storedStats ? JSON.parse(storedStats) : getInitialStats();

    // Update game-specific stats
    const gameStats = playerStats.gameStats[gameType];
    
    gameStats.played += 1;
    gameStats.wagered = (parseFloat(gameStats.wagered) + parseFloat(amount)).toFixed(4);
    
    if (result === 'win') {
      gameStats.won += 1;
      gameStats.wonAmount = (parseFloat(gameStats.wonAmount) + winnings).toFixed(4);
    }

    // Update overall stats
    playerStats.totalGames += 1;
    playerStats.totalWagered = (parseFloat(playerStats.totalWagered) + parseFloat(amount)).toFixed(4);
    
    if (result === 'win') {
      playerStats.gamesWon += 1;
      playerStats.totalWon = (parseFloat(playerStats.totalWon) + winnings).toFixed(4);
    }
    
    playerStats.netProfit = (parseFloat(playerStats.totalWon) - parseFloat(playerStats.totalWagered)).toFixed(4);

    // Determine favorite game
    const games = Object.entries(playerStats.gameStats);
    const favoriteGame = games.reduce((prev, current) => 
      prev[1].played > current[1].played ? prev : current
    );
    playerStats.favoriteGame = favoriteGame[0].charAt(0).toUpperCase() + favoriteGame[0].slice(1);

    // Add to recent games
    playerStats.recentGames.unshift({
      game: gameType.charAt(0).toUpperCase() + gameType.slice(1),
      result: result.charAt(0).toUpperCase() + result.slice(1),
      amount: amount,
      winnings: winnings.toFixed(4),
      date: new Date().toISOString().split('T')[0],
      timestamp: Date.now()
    });

    // Keep only last 10 games
    playerStats.recentGames = playerStats.recentGames.slice(0, 10);

    // Check for achievements
    checkAchievements(playerStats);

    // Save to localStorage
    localStorage.setItem(`playerStats_${account}`, JSON.stringify(playerStats));

    return playerStats;
  } catch (error) {
    console.error('Error updating player stats:', error);
    return null;
  }
};

// Function to get initial stats for new players
export const getInitialStats = () => {
  return {
    totalGames: 0,
    gamesWon: 0,
    totalWagered: '0.00',
    totalWon: '0.00',
    netProfit: '0.00',
    favoriteGame: 'None',
    memberSince: new Date().toISOString().split('T')[0],
    achievements: [],
    recentGames: [],
    gameStats: {
      poker: { played: 0, won: 0, wagered: '0.00', wonAmount: '0.00' },
      blackjack: { played: 0, won: 0, wagered: '0.00', wonAmount: '0.00' },
      slots: { played: 0, won: 0, wagered: '0.00', wonAmount: '0.00' }
    }
  };
};

// Function to get player stats
export const getPlayerStats = (account) => {
  if (!account) return getInitialStats();
  
  try {
    const storedStats = localStorage.getItem(`playerStats_${account}`);
    return storedStats ? JSON.parse(storedStats) : getInitialStats();
  } catch (error) {
    console.error('Error getting player stats:', error);
    return getInitialStats();
  }
};

// Function to check and update achievements
const checkAchievements = (stats) => {
  const achievements = [...stats.achievements];
  const newAchievements = [];

  // First Win
  if (stats.gamesWon >= 1 && !achievements.find(a => a.name === 'First Win')) {
    newAchievements.push({ 
      name: 'First Win', 
      icon: '🏆', 
      date: new Date().toISOString().split('T')[0],
      description: 'Win your first game'
    });
  }

  // High Roller - wagered 10 MATIC
  if (parseFloat(stats.totalWagered) >= 10 && !achievements.find(a => a.name === 'High Roller')) {
    newAchievements.push({ 
      name: 'High Roller', 
      icon: '💎', 
      date: new Date().toISOString().split('T')[0],
      description: 'Wager 10 MATIC total'
    });
  }

  // Poker Pro - play 10 poker games
  if (stats.gameStats.poker.played >= 10 && !achievements.find(a => a.name === 'Poker Pro')) {
    newAchievements.push({ 
      name: 'Poker Pro', 
      icon: '♠️', 
      date: new Date().toISOString().split('T')[0],
      description: 'Play 10 poker games'
    });
  }

  // Lucky Spin - win on slots
  if (stats.gameStats.slots.won >= 1 && !achievements.find(a => a.name === 'Lucky Spin')) {
    newAchievements.push({ 
      name: 'Lucky Spin', 
      icon: '🎰', 
      date: new Date().toISOString().split('T')[0],
      description: 'Hit a win on slots'
    });
  }

  // Blackjack Master - win 5 blackjack games
  if (stats.gameStats.blackjack.won >= 5 && !achievements.find(a => a.name === 'Blackjack Master')) {
    newAchievements.push({ 
      name: 'Blackjack Master', 
      icon: '🃏', 
      date: new Date().toISOString().split('T')[0],
      description: 'Win 5 blackjack games'
    });
  }

  if (newAchievements.length > 0) {
    stats.achievements = [...achievements, ...newAchievements];
  }
};