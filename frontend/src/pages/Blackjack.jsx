import React, { useState } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { useBlackjack } from '../hooks/useBlackjack';
import { Coins, Users, Play, RefreshCcw, Plus, Minus, Check } from 'lucide-react';

const Blackjack = () => {
  const { account } = useWeb3();
  const {
    currentGame,
    playerCards,
    dealerCards,
    playerTotal,
    dealerTotal,
    dealerRevealed,
    gameState,
    betAmount,
    loading,
    startGame,
    takeAction
  } = useBlackjack();

  const [betAmountInput, setBetAmountInput] = useState('0.01');

  const handleStartGame = async () => {
    try {
      await startGame(parseFloat(betAmountInput));
    } catch (error) {
      alert('Error starting game: ' + error.message);
    }
  };

  const handleHit = async () => {
    try {
      await takeAction(0); // HIT
    } catch (error) {
      alert('Error taking action: ' + error.message);
    }
  };

  const handleStand = async () => {
    try {
      await takeAction(1); // STAND
    } catch (error) {
      alert('Error taking action: ' + error.message);
    }
  };

  const handleDouble = async () => {
    try {
      await takeAction(2); // DOUBLE
    } catch (error) {
      alert('Error taking action: ' + error.message);
    }
  };

  const getGameMessage = () => {
    if (gameState === 'completed') {
      if (playerTotal > 21) return { message: 'BUST! You lose.', type: 'loss' };
      if (dealerTotal > 21) return { message: 'Dealer busts! You win!', type: 'win' };
      if (playerTotal > dealerTotal) return { message: 'You win!', type: 'win' };
      if (playerTotal < dealerTotal) return { message: 'You lose.', type: 'loss' };
      return { message: 'Push! Bet returned.', type: 'push' };
    }
    
    if (playerTotal === 21 && playerCards.length === 2) {
      return { message: 'BLACKJACK!', type: 'blackjack' };
    }
    
    if (playerTotal > 21) {
      return { message: 'BUST!', type: 'bust' };
    }
    
    return null;
  };

  const gameMessage = getGameMessage();

  if (!account) {
    return (
      <div className="game-page">
        <div className="connect-prompt">
          <h2>Connect to Play Blackjack</h2>
          <p>Connect your wallet to beat the dealer</p>
        </div>
      </div>
    );
  }

  return (
    <div className="game-page">
      <div className="container">
        {/* Game Header */}
        <div className="game-header">
          <div className="game-title">
            <h1>Blackjack</h1>
            <p>Beat the dealer without going over 21</p>
          </div>
          <div className="game-stats">
            <div className="stat">
              <Users size={20} />
              <span>89 Players Online</span>
            </div>
          </div>
        </div>

        {!currentGame ? (
          // Game Lobby
          <div className="game-lobby">
            <div className="lobby-content">
              <h2>Start New Blackjack Game</h2>
              <div className="bet-selection">
                <label>Bet Amount (MATIC)</label>
                <div className="bet-amounts">
                  {['0.001', '0.005', '0.01', '0.05', '0.1'].map(amount => (
                    <button
                      key={amount}
                      className={`bet-option ${betAmountInput === amount ? 'active' : ''}`}
                      onClick={() => setBetAmountInput(amount)}
                    >
                      {amount}
                    </button>
                  ))}
                </div>
                <div className="custom-bet">
                  <input
                    type="number"
                    step="0.001"
                    min="0.001"
                    max="1"
                    value={betAmountInput}
                    onChange={(e) => setBetAmountInput(e.target.value)}
                    placeholder="Custom amount"
                  />
                </div>
              </div>
              
              <button 
                className="start-game-btn"
                onClick={handleStartGame}
                disabled={loading}
              >
                <Play size={20} />
                {loading ? 'Starting...' : `Start Game (${betAmountInput} MATIC)`}
              </button>

              <div className="game-rules">
                <h3>Blackjack Rules</h3>
                <ul>
                  <li>Beat the dealer by having a hand value closer to 21</li>
                  <li>Blackjack (Ace + 10-value card) pays 3:2</li>
                  <li>Dealer must hit on 16 and stand on 17</li>
                  <li>Double down available on first two cards</li>
                  <li>Push (tie) returns your bet</li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          // Active Game
          <div className="blackjack-game">
            {/* Game Info */}
            <div className="game-info-panel">
              <div className="info-item">
                <span>Current Bet:</span>
                <span className="highlight">{betAmount} MATIC</span>
              </div>
              <div className="info-item">
                <span>Game State:</span>
                <span className={`state ${gameState}`}>{gameState}</span>
              </div>
            </div>

            {/* Game Message */}
            {gameMessage && (
              <div className={`game-message ${gameMessage.type}`}>
                {gameMessage.message}
              </div>
            )}

            <div className="game-table">
              {/* Dealer Section */}
              <div className="dealer-section">
                <h3>Dealer's Hand {dealerRevealed && `(${dealerTotal})`}</h3>
                <div className="cards-container">
                  {dealerCards.map((card, index) => (
                    <div key={index} className={`playing-card dealer ${index === 1 && !dealerRevealed ? 'hidden' : ''}`}>
                      {index === 1 && !dealerRevealed ? '?' : card}
                    </div>
                  ))}
                </div>
              </div>

              {/* Player Section */}
              <div className="player-section">
                <h3>Your Hand ({playerTotal})</h3>
 
<div className="cards-container">
  {playerCards.map((card, index) => {
    const [value, suit] = card.split('-');
    return (
      <div key={index} className="playing-card player">
        <div className="card-value">{value}</div>
        <div className="card-suit">{suit}</div>
      </div>
    );
  })}
</div>
                
                {gameState === 'active' && (
                  <div className="player-actions">
                    <button 
                      className="game-btn hit"
                      onClick={handleHit}
                      disabled={loading || playerTotal >= 21}
                    >
                      <Plus size={16} />
                      Hit
                    </button>
                    <button 
                      className="game-btn stand"
                      onClick={handleStand}
                      disabled={loading}
                    >
                      <Check size={16} />
                      Stand
                    </button>
                    <button 
                      className="game-btn double"
                      onClick={handleDouble}
                      disabled={loading || playerCards.length !== 2}
                    >
                      <Coins size={16} />
                      Double
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Game Controls */}
            {gameState === 'completed' && (
              <div className="game-controls">
                <button 
                  className="new-game-btn"
                  onClick={() => window.location.reload()}
                >
                  <RefreshCcw size={16} />
                  New Game
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Blackjack;