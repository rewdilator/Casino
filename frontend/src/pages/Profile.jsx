import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { getPlayerStats } from '../utils/playerStats';
import { User, Trophy, Coins, Star, Award, TrendingUp, Clock, Zap, LogOut } from 'lucide-react';

const Profile = () => {
  const { account, balance, isConnected, disconnectWallet } = useWeb3();
  const [activeTab, setActiveTab] = useState('overview');
  const [playerStats, setPlayerStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlayerData = async () => {
      if (!account || !isConnected) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const stats = getPlayerStats(account);
        setPlayerStats(stats);
      } catch (error) {
        console.error('Error fetching player data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayerData();
  }, [account, isConnected]);

  const calculateWinRate = () => {
    if (!playerStats || playerStats.totalGames === 0) return 0;
    return ((playerStats.gamesWon / playerStats.totalGames) * 100).toFixed(1);
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const handleDisconnect = () => {
    disconnectWallet();
  };

  if (!account || !isConnected) {
    return (
      <div className="profile-page">
        <div className="connect-prompt">
          <h2>Connect Your Wallet</h2>
          <p>Connect your wallet to view your profile</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="profile-page">
        <div className="container">
          <div className="loading-spinner">
            <Zap size={32} className="spinning" />
            <p>Loading profile data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="container">
        {/* Profile Header */}
        <div className="profile-header">
          <div className="profile-avatar">
            <User size={48} />
          </div>
          <div className="profile-info">
            <h1>Player Profile</h1>
            <p className="wallet-address">{formatAddress(account)}</p>
            <div className="profile-stats">
              <div className="stat">
                <Coins size={20} />
                <span>{parseFloat(balance).toFixed(4)} MATIC</span>
              </div>
              <div className="stat">
                <Trophy size={20} />
                <span>Games: {playerStats?.totalGames || 0}</span>
              </div>
              <div className="stat">
                <TrendingUp size={20} />
                <span>Win Rate: {calculateWinRate()}%</span>
              </div>
            </div>
            <button 
              onClick={handleDisconnect}
              className="disconnect-profile-btn"
            >
              <LogOut size={16} />
              Disconnect Wallet
            </button>
          </div>
        </div>

        {/* Profile Tabs */}
        <div className="profile-tabs">
          <button 
            className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={`tab ${activeTab === 'achievements' ? 'active' : ''}`}
            onClick={() => setActiveTab('achievements')}
          >
            Achievements
          </button>
          <button 
            className={`tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            Game History
          </button>
          <button 
            className={`tab ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            Statistics
          </button>
        </div>

        {/* Tab Content */}
        <div className="profile-content">
          {activeTab === 'overview' && playerStats && (
            <div className="overview-grid">
              <div className="stat-card large">
                <TrendingUp size={32} />
                <div className="stat-content">
                  <span className={`stat-number ${parseFloat(playerStats.netProfit) >= 0 ? 'positive' : 'negative'}`}>
                    {parseFloat(playerStats.netProfit) >= 0 ? '+' : ''}{playerStats.netProfit} MATIC
                  </span>
                  <span className="stat-label">Net Profit</span>
                </div>
              </div>

              <div className="stat-card">
                <Trophy size={24} />
                <div className="stat-content">
                  <span className="stat-number">{playerStats.gamesWon}/{playerStats.totalGames}</span>
                  <span className="stat-label">Wins / Total</span>
                </div>
              </div>

              <div className="stat-card">
                <Coins size={24} />
                <div className="stat-content">
                  <span className="stat-number">{playerStats.totalWagered} MATIC</span>
                  <span className="stat-label">Total Wagered</span>
                </div>
              </div>

              <div className="stat-card">
                <Star size={24} />
                <div className="stat-content">
                  <span className="stat-number">{playerStats.favoriteGame}</span>
                  <span className="stat-label">Favorite Game</span>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="recent-activity">
                <h3>Recent Activity</h3>
                {playerStats.recentGames.length === 0 ? (
                  <p className="no-activity">No games played yet. Start playing to see your activity!</p>
                ) : (
                  <div className="activity-list">
                    {playerStats.recentGames.slice(0, 5).map((game, index) => (
                      <div key={index} className="activity-item">
                        <div className="activity-game">{game.game}</div>
                        <div className={`activity-result ${game.result.toLowerCase()}`}>
                          {game.result}
                        </div>
                        <div className="activity-amount">
                          {game.result === 'Win' ? `+${game.winnings}` : `-${game.amount}`} MATIC
                        </div>
                        <div className="activity-date">
                          <Clock size={14} />
                          {game.date}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'achievements' && playerStats && (
            <div className="achievements-grid">
              {playerStats.achievements.length === 0 ? (
                <div className="no-achievements">
                  <Award size={48} />
                  <h3>No Achievements Yet</h3>
                  <p>Play games to unlock achievements!</p>
                </div>
              ) : (
                playerStats.achievements.map((achievement, index) => (
                  <div key={index} className="achievement-card">
                    <div className="achievement-icon">{achievement.icon}</div>
                    <div className="achievement-info">
                      <h4>{achievement.name}</h4>
                      <p>{achievement.description}</p>
                      <span className="achievement-date">Earned on {achievement.date}</span>
                    </div>
                    <Award size={20} className="achievement-badge" />
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'history' && playerStats && (
            <div className="game-history">
              <div className="history-header">
                <h3>Game History</h3>
                <div className="history-stats">
                  <span>Total Games: {playerStats.totalGames}</span>
                </div>
              </div>
              {playerStats.recentGames.length === 0 ? (
                <div className="no-history">
                  <p>No game history yet. Start playing to see your results!</p>
                </div>
              ) : (
                <div className="history-table">
                  <div className="table-header">
                    <span>Game</span>
                    <span>Result</span>
                    <span>Bet Amount</span>
                    <span>Payout</span>
                    <span>Date</span>
                  </div>
                  {playerStats.recentGames.map((game, index) => (
                    <div key={index} className="table-row">
                      <span>{game.game}</span>
                      <span className={`result ${game.result.toLowerCase()}`}>
                        {game.result}
                      </span>
                      <span>{game.amount} MATIC</span>
                      <span className={game.result === 'Win' ? 'positive' : 'negative'}>
                        {game.result === 'Win' ? `+${game.winnings}` : '-'} MATIC
                      </span>
                      <span>{game.date}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'stats' && playerStats && (
            <div className="stats-grid">
              <div className="stat-card wide">
                <h4>Game Performance</h4>
                <div className="performance-stats">
                  {Object.entries(playerStats.gameStats).map(([game, stats]) => (
                    <div key={game} className="performance-item">
                      <span>{game.charAt(0).toUpperCase() + game.slice(1)}</span>
                      <div className="performance-bar">
                        <div 
                          className="performance-fill" 
                          style={{
                            width: stats.played > 0 ? `${(stats.won / stats.played) * 100}%` : '0%',
                            backgroundColor: stats.played > 0 ? 
                              (stats.won / stats.played) >= 0.5 ? '#10B981' : 
                              (stats.won / stats.played) >= 0.3 ? '#F59E0B' : '#EF4444' : '#6B7280'
                          }}
                        ></div>
                      </div>
                      <span>
                        {stats.played > 0 ? `${((stats.won / stats.played) * 100).toFixed(1)}%` : '0%'} Win Rate
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="stat-card">
                <h4>Session Stats</h4>
                <div className="session-stats">
                  <div className="session-item">
                    <span>Total Wagered</span>
                    <span>{playerStats.totalWagered} MATIC</span>
                  </div>
                  <div className="session-item">
                    <span>Total Won</span>
                    <span>{playerStats.totalWon} MATIC</span>
                  </div>
                  <div className="session-item">
                    <span>Net Profit</span>
                    <span className={parseFloat(playerStats.netProfit) >= 0 ? 'positive' : 'negative'}>
                      {playerStats.netProfit} MATIC
                    </span>
                  </div>
                  <div className="session-item">
                    <span>Member Since</span>
                    <span>{playerStats.memberSince}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;