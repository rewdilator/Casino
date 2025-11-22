import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { usePokerGame } from '../hooks/usePokerGame';
import { 
  Users, 
  Clock, 
  Coins, 
  Trophy,
  User,
  Crown,
  Play,
  Zap,
  X, // For Fold
  Check,
  CircleDollarSign,
  TrendingUp, // For All-in
  Loader
} from 'lucide-react';

const Poker = () => {
  const { account } = useWeb3();
  const {
    currentGame,
    playerHand,
    communityCards,
    gameState,
    currentBet,
    playerBalance,
    activeGames,
    loading,
    createGame,
    joinGame,
    takeAction,
    loadGameState,
    claimWinnings,
    discoverActiveGames
  } = usePokerGame();

  const [activeTab, setActiveTab] = useState('lobby');
  const [createGameForm, setCreateGameForm] = useState({
    name: '',
    buyIn: '0.01',
    maxPlayers: 6,
    smallBlind: '0.001',
    bigBlind: '0.002'
  });
  const [raiseAmount, setRaiseAmount] = useState('0.005');

  useEffect(() => {
    if (activeTab === 'lobby') {
      discoverActiveGames();
    }
  }, [activeTab]);

  useEffect(() => {
    if (currentGame) {
      // Refresh game state every 10 seconds
      const interval = setInterval(() => {
        loadGameState(currentGame);
      }, 10000);
      
      return () => clearInterval(interval);
    }
  }, [currentGame]);

  const handleCreateGame = async () => {
    if (!createGameForm.name.trim()) {
      alert('Please enter a game name');
      return;
    }

    try {
      await createGame(
        createGameForm.name,
        createGameForm.buyIn,
        createGameForm.maxPlayers,
        createGameForm.smallBlind,
        createGameForm.bigBlind
      );
      setActiveTab('playing');
    } catch (error) {
      alert('Error creating game: ' + error.message);
    }
  };

  const handleJoinGame = async (game) => {
    try {
      await joinGame(game.id, game.buyIn);
      setActiveTab('playing');
    } catch (error) {
      alert('Error joining game: ' + error.message);
    }
  };

  const handleAction = async (action) => {
    try {
      if (action === 3) { // RAISE
        if (!raiseAmount || parseFloat(raiseAmount) <= currentBet) {
          alert(`Raise amount must be greater than current bet (${currentBet} MATIC)`);
          return;
        }
        await takeAction(action, raiseAmount);
      } else {
        await takeAction(action);
      }
    } catch (error) {
      alert('Error taking action: ' + error.message);
    }
  };

  const formatGameId = (gameId) => {
    if (!gameId) return 'Unknown';
    return `${gameId.substring(0, 10)}...${gameId.substring(58)}`;
  };

  if (!account) {
    return (
      <div className="poker-page">
        <div className="connect-prompt">
          <h2>Connect to Play Poker</h2>
          <p>Connect your wallet to join Texas Hold'em games</p>
        </div>
      </div>
    );
  }

  return (
    <div className="poker-page">
      <div className="container">
        {/* Poker Header */}
        <div className="poker-header">
          <div className="poker-title">
            <h1>Texas Hold'em Poker</h1>
            <p>Play against real players with instant MATIC payouts</p>
          </div>
          <div className="poker-stats">
            <div className="stat">
              <Users size={20} />
              <span>{activeGames.length} Active Tables</span>
            </div>
            {currentGame && (
              <div className="stat">
                <Coins size={20} />
                <span>Balance: {playerBalance.toFixed(4)} MATIC</span>
              </div>
            )}
          </div>
        </div>

        {/* Loading Overlay */}
        {loading && (
          <div className="loading-overlay">
            <div className="loading-spinner">
              <Loader size={32} className="spinning" />
              <p>Processing transaction...</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="poker-tabs">
          <button 
            className={`tab ${activeTab === 'lobby' ? 'active' : ''}`}
            onClick={() => setActiveTab('lobby')}
          >
            Game Lobby
          </button>
          <button 
            className={`tab ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => setActiveTab('create')}
          >
            Create Game
          </button>
          <button 
            className={`tab ${activeTab === 'playing' ? 'active' : ''}`}
            onClick={() => setActiveTab('playing')}
            disabled={!currentGame}
          >
            {currentGame ? `Game: ${formatGameId(currentGame)}` : 'Current Game'}
          </button>
        </div>

        {/* Lobby Content */}
        {activeTab === 'lobby' && (
          <div className="poker-lobby">
            <div className="tables-header">
              <h2>Active Poker Tables</h2>
              <button 
                className="refresh-btn"
                onClick={discoverActiveGames}
                disabled={loading}
              >
                <Loader size={16} className={loading ? 'spinning' : ''} />
                Refresh
              </button>
            </div>

            {activeGames.length === 0 ? (
              <div className="no-games">
                <p>No active games found. Create one to get started!</p>
              </div>
            ) : (
              <div className="poker-tables">
                {activeGames.map((game, index) => (
                  <div key={index} className="poker-table-card">
                    <div className="table-header">
                      <h3>{game.name}</h3>
                      <span className="table-type">Texas Hold'em</span>
                    </div>
                    
                    <div className="table-info">
                      <div className="info-row">
                        <span>Buy-in</span>
                        <span className="buy-in">{game.buyIn} MATIC</span>
                      </div>
                      <div className="info-row">
                        <span>Blinds</span>
                        <span className="blinds">{game.smallBlind}/{game.bigBlind} MATIC</span>
                      </div>
                      <div className="info-row">
                        <span>Players</span>
                        <span className="players">
                          <Users size={16} />
                          {game.players}/{game.maxPlayers}
                        </span>
                      </div>
                      <div className="info-row">
                        <span>Current Pot</span>
                        <span className="pot">{game.pot} MATIC</span>
                      </div>
                    </div>

                    <div className="table-actions">
                      <button 
                        className="join-table-btn"
                        onClick={() => handleJoinGame(game)}
                        disabled={loading}
                      >
                        {loading ? 'Joining...' : 'Join Table'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Create Game Content */}
        {activeTab === 'create' && (
          <div className="create-game">
            <h2>Create New Poker Game</h2>
            <div className="create-form">
              <div className="form-group">
                <label>Game Name *</label>
                <input 
                  type="text" 
                  placeholder="e.g., Friday Night Poker"
                  value={createGameForm.name}
                  onChange={(e) => setCreateGameForm({...createGameForm, name: e.target.value})}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Buy-in Amount (MATIC) *</label>
                <input 
                  type="number" 
                  step="0.001" 
                  min="0.001"
                  value={createGameForm.buyIn}
                  onChange={(e) => setCreateGameForm({...createGameForm, buyIn: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Max Players</label>
                <select
                  value={createGameForm.maxPlayers}
                  onChange={(e) => setCreateGameForm({...createGameForm, maxPlayers: parseInt(e.target.value)})}
                >
                  <option value={2}>Heads-up (2 players)</option>
                  <option value={6}>6 Players</option>
                  <option value={8}>8 Players</option>
                  <option value={9}>9 Players</option>
                </select>
              </div>

              <div className="form-group">
                <label>Small Blind (MATIC) *</label>
                <input 
                  type="number" 
                  step="0.001" 
                  min="0.001"
                  value={createGameForm.smallBlind}
                  onChange={(e) => setCreateGameForm({...createGameForm, smallBlind: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Big Blind (MATIC) *</label>
                <input 
                  type="number" 
                  step="0.001" 
                  min="0.001"
                  value={createGameForm.bigBlind}
                  onChange={(e) => setCreateGameForm({...createGameForm, bigBlind: e.target.value})}
                  required
                />
              </div>

              <button 
                className="create-game-btn" 
                onClick={handleCreateGame}
                disabled={loading || !createGameForm.name.trim()}
              >
                {loading ? 'Creating...' : `Create Poker Table (${createGameForm.buyIn} MATIC)`}
              </button>
            </div>
          </div>
        )}

        {/* Playing Game Content */}
        {activeTab === 'playing' && currentGame && (
          <div className="playing-game">
            <div className="game-header-info">
              <h3>Game: {formatGameId(currentGame)}</h3>
              <span className={`game-status ${gameState}`}>{gameState.toUpperCase()}</span>
            </div>

            <div className="game-table">
              {/* Community Cards */}
              <div className="community-cards-section">
                <h3>Community Cards</h3>
                <div className="cards-container">
                  {communityCards.map((card, index) => (
                    <div key={index} className="playing-card community">
                      {card.display || card}
                    </div>
                  ))}
                  {communityCards.length === 0 && (
                    <div className="no-cards">Waiting for flop...</div>
                  )}
                </div>
              </div>

              {/* Player Hand */}
              <div className="player-hand-section">
                <h3>Your Hand</h3>
                <div className="cards-container">
                  {playerHand.map((card, index) => (
                    <div key={index} className="playing-card player">
                      {card.display || card}
                    </div>
                  ))}
                  {playerHand.length === 0 && (
                    <div className="no-cards">Waiting for deal...</div>
                  )}
                </div>
              </div>

              {/* Game Info */}
              <div className="game-info-panel">
                <div className="info-item">
                  <span>Current Bet:</span>
                  <span className="highlight">{currentBet} MATIC</span>
                </div>
                <div className="info-item">
                  <span>Your Balance:</span>
                  <span>{playerBalance.toFixed(4)} MATIC</span>
                </div>
                <div className="info-item">
                  <span>Game State:</span>
                  <span className={`state ${gameState}`}>{gameState}</span>
                </div>
              </div>

              {/* Player Actions */}
              {gameState === 'playing' && (
                <div className="player-actions-panel">
                  <h4>Your Turn - Choose Action</h4>
                  <div className="action-buttons">
                    <button 
                      className="action-btn fold"
                      onClick={() => handleAction(0)} // FOLD
                      disabled={loading}
                    >
                      <X size={16} />
                      Fold
                    </button>
                    <button 
                      className="action-btn check"
                      onClick={() => handleAction(1)} // CHECK
                      disabled={loading}
                    >
                      <Check size={16} />
                      Check
                    </button>
                    <button 
                      className="action-btn call"
                      onClick={() => handleAction(2)} // CALL
                      disabled={loading || playerBalance < currentBet}
                    >
                      <CircleDollarSign size={16} />
                      Call {currentBet} MATIC
                    </button>
                    <div className="raise-action">
                      <input
                        type="number"
                        step="0.001"
                        min={currentBet + 0.001}
                        value={raiseAmount}
                        onChange={(e) => setRaiseAmount(e.target.value)}
                        placeholder={`Min: ${(currentBet + 0.001).toFixed(3)}`}
                        disabled={loading}
                      />
                      <button 
                        className="action-btn raise"
                        onClick={() => handleAction(3)} // RAISE
                        disabled={loading || !raiseAmount || parseFloat(raiseAmount) <= currentBet || playerBalance < parseFloat(raiseAmount)}
                      >
                        <Zap size={16} />
                        Raise
                      </button>
                    </div>
                    <button 
                      className="action-btn all-in"
                      onClick={() => handleAction(4)} // ALL_IN
                      disabled={loading || playerBalance === 0}
                    >
                      <TrendingUp size={16} />
                      All In ({playerBalance.toFixed(4)} MATIC)
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="quick-actions">
          <div className="action-card">
            <Trophy size={24} />
            <h3>Need Help?</h3>
            <p>Make sure you have test MATIC from Polygon Amoy faucet</p>
            <a 
              href="https://faucet.polygon.technology/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="action-btn"
            >
              Get Test MATIC
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Poker;