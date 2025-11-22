import React, { useState } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { useSlotMachine } from '../hooks/useSlotMachine';
import { Coins, Zap, Trophy, RotateCcw, TrendingUp, BarChart3 } from 'lucide-react';

const Slots = () => {
  const { account } = useWeb3();
  const {
    reels,
    isSpinning,
    lastPayout,
    playerStats,
    jackpot,
    spin,
    getSymbolDisplay,
    calculatePayout
  } = useSlotMachine();

  const [betAmount, setBetAmount] = useState('0.01');
  const [autoSpin, setAutoSpin] = useState(false);
  const [spinCount, setSpinCount] = useState(0);

  const handleSpin = async () => {
    if (!account) return;
    
    try {
      await spin(parseFloat(betAmount));
      setSpinCount(prev => prev + 1);
      
      // Continue auto-spin if enabled
      if (autoSpin && playerStats.winnings < parseFloat(betAmount) * 100) {
        setTimeout(handleSpin, 1000);
      }
    } catch (error) {
      console.error('Spin error:', error);
      setAutoSpin(false);
    }
  };

  const handleAutoSpin = () => {
    setAutoSpin(!autoSpin);
    if (!autoSpin && account) {
      handleSpin();
    }
  };

  const getPayoutMessage = () => {
    if (lastPayout === 0) return null;
    
    if (lastPayout >= parseFloat(betAmount) * 1000) {
      return { message: 'JACKPOT! 🎉', type: 'jackpot' };
    } else if (lastPayout >= parseFloat(betAmount) * 100) {
      return { message: 'BIG WIN! 🎊', type: 'big-win' };
    } else if (lastPayout > 0) {
      return { message: 'WIN! 🎰', type: 'win' };
    }
    return null;
  };

  const payoutMessage = getPayoutMessage();

  if (!account) {
    return (
      <div className="game-page">
        <div className="connect-prompt">
          <h2>Connect to Play Slots</h2>
          <p>Connect your wallet to spin and win</p>
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
            <h1>Slot Machine</h1>
            <p>Spin the reels and hit the jackpot!</p>
          </div>
          <div className="game-stats">
            <div className="stat">
              <Trophy size={20} />
              <span>Jackpot: {jackpot.toFixed(4)} MATIC</span>
            </div>
          </div>
        </div>

        <div className="slots-interface">
          <div className="slot-machine">
            {/* Reels Display */}
            <div className={`reels-container ${isSpinning ? 'spinning' : ''}`}>
              {reels.map((symbol, index) => (
                <div key={index} className="reel">
                  <div className="reel-symbol">
                    {getSymbolDisplay(symbol)}
                  </div>
                </div>
              ))}
            </div>

            {/* Win Display */}
            {payoutMessage && (
              <div className={`win-display ${payoutMessage.type}`}>
                <div className="win-message">
                  {payoutMessage.message}
                </div>
                <div className="win-amount">
                  +{lastPayout.toFixed(4)} MATIC
                </div>
              </div>
            )}

            {/* Control Panel */}
            <div className="slots-controls">
              <div className="bet-controls">
                <label>Bet Amount (MATIC)</label>
                <div className="bet-amounts">
                  {['0.001', '0.005', '0.01', '0.05', '0.1'].map(amount => (
                    <button
                      key={amount}
                      className={`bet-option ${betAmount === amount ? 'active' : ''}`}
                      onClick={() => setBetAmount(amount)}
                      disabled={isSpinning}
                    >
                      {amount}
                    </button>
                  ))}
                </div>
              </div>

              <div className="spin-controls">
                <button 
                  className={`spin-button ${isSpinning ? 'spinning' : ''}`}
                  onClick={handleSpin}
                  disabled={isSpinning}
                >
                  {isSpinning ? (
                    <>
                      <Zap size={20} />
                      Spinning...
                    </>
                  ) : (
                    <>
                      <RotateCcw size={20} />
                      SPIN ({betAmount} MATIC)
                    </>
                  )}
                </button>

                <button 
                  className={`auto-spin-btn ${autoSpin ? 'active' : ''}`}
                  onClick={handleAutoSpin}
                  disabled={isSpinning}
                >
                  <TrendingUp size={16} />
                  {autoSpin ? 'Stop Auto' : 'Auto Spin'}
                </button>
              </div>
            </div>
          </div>

          {/* Player Stats */}
          <div className="player-stats-panel">
            <h3>
              <BarChart3 size={20} />
              Your Stats
            </h3>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">Total Spins</span>
                <span className="stat-value">{playerStats.spins}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Total Winnings</span>
                <span className="stat-value">{playerStats.winnings.toFixed(4)} MATIC</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Net Profit</span>
                <span className={`stat-value ${playerStats.profit >= 0 ? 'positive' : 'negative'}`}>
                  {playerStats.profit >= 0 ? '+' : ''}{playerStats.profit.toFixed(4)} MATIC
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Win Rate</span>
                <span className="stat-value">
                  {playerStats.spins > 0 ? ((playerStats.winnings / (playerStats.spins * 0.01)) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Payout Table */}
        <div className="payout-section">
          <h3>Payout Table</h3>
          <div className="payout-grid">
            <div className="payout-item jackpot">
              <span>7️⃣7️⃣7️⃣</span>
              <span>1000x</span>
            </div>
            <div className="payout-item">
              <span>💎💎💎</span>
              <span>250x</span>
            </div>
            <div className="payout-item">
              <span>⭐⭐⭐</span>
              <span>100x</span>
            </div>
            <div className="payout-item">
              <span>🔔🔔🔔</span>
              <span>50x</span>
            </div>
            <div className="payout-item">
              <span>🍊🍊🍊</span>
              <span>15x</span>
            </div>
            <div className="payout-item">
              <span>🍋🍋🍋</span>
              <span>10x</span>
            </div>
            <div className="payout-item">
              <span>🍒🍒🍒</span>
              <span>5x</span>
            </div>
            <div className="payout-item">
              <span>🍒🍒❌</span>
              <span>2x</span>
            </div>
            <div className="payout-item">
              <span>7️⃣❌❌</span>
              <span>1x</span>
            </div>
          </div>
        </div>

        {/* Game Instructions */}
        <div className="game-instructions">
          <h3>How to Play</h3>
          <ul>
            <li>Select your bet amount and click SPIN</li>
            <li>Match 3 symbols for big wins</li>
            <li>Match 2 cherries for 2x payout</li>
            <li>Get any seven for 1x payout</li>
            <li>Hit three 7s for the JACKPOT!</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Slots;