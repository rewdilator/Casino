import React, { useState } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { Trophy, Crown, TrendingUp, Star, Coins, Users } from 'lucide-react';

const Leaderboard = () => {
  const { account } = useWeb3();
  const [timeframe, setTimeframe] = useState('all-time');
  const [category, setCategory] = useState('profit');

  const leaderboardData = {
    'all-time': [
      { rank: 1, address: '0x742...d35e', profit: '245.67', games: 1247, favorite: 'Poker', isUser: false },
      { rank: 2, address: '0x8a3...f92a', profit: '198.45', games: 892, favorite: 'Blackjack', isUser: false },
      { rank: 3, address: '0x5D9...fFE2', profit: '156.23', games: 567, favorite: 'Poker', isUser: true },
      { rank: 4, address: '0xb27...c83d', profit: '134.78', games: 723, favorite: 'Slots', isUser: false },
      { rank: 5, address: '0x3e8...a91f', profit: '112.34', games: 456, favorite: 'Blackjack', isUser: false }
    ],
    'weekly': [
      { rank: 1, address: '0x3e8...a91f', profit: '45.67', games: 89, favorite: 'Blackjack', isUser: false },
      { rank: 2, address: '0x5D9...fFE2', profit: '38.92', games: 67, favorite: 'Poker', isUser: true },
      { rank: 3, address: '0x8a3...f92a', profit: '34.15', games: 78, favorite: 'Blackjack', isUser: false },
      { rank: 4, address: '0xb27...c83d', profit: '28.76', games: 92, favorite: 'Slots', isUser: false },
      { rank: 5, address: '0x742...d35e', profit: '25.43', games: 45, favorite: 'Poker', isUser: false }
    ],
    'daily': [
      { rank: 1, address: '0x5D9...fFE2', profit: '12.45', games: 23, favorite: 'Poker', isUser: true },
      { rank: 2, address: '0x8a3...f92a', profit: '8.67', games: 18, favorite: 'Blackjack', isUser: false },
      { rank: 3, address: '0xb27...c83d', profit: '7.89', games: 25, favorite: 'Slots', isUser: false },
      { rank: 4, address: '0x3e8...a91f', profit: '6.54', games: 15, favorite: 'Blackjack', isUser: false },
      { rank: 5, address: '0x742...d35e', profit: '5.32', games: 12, favorite: 'Poker', isUser: false }
    ]
  };

  const currentData = leaderboardData[timeframe];

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1: return <Crown className="gold" />;
      case 2: return <Trophy className="silver" />;
      case 3: return <Trophy className="bronze" />;
      default: return <span className="rank-number">{rank}</span>;
    }
  };

  return (
    <div className="leaderboard-page">
      <div className="container">
        {/* Header */}
        <div className="leaderboard-header">
          <div className="header-content">
            <h1>
              <Trophy size={32} />
              Leaderboard
            </h1>
            <p>Top players by profits and performance</p>
          </div>
          
          <div className="leaderboard-stats">
            <div className="stat-card">
              <Users size={24} />
              <div>
                <span className="stat-number">15,247</span>
                <span className="stat-label">Total Players</span>
              </div>
            </div>
            <div className="stat-card">
              <Coins size={24} />
              <div>
                <span className="stat-number">2,458.9</span>
                <span className="stat-label">MATIC in Prizes</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="leaderboard-filters">
          <div className="filter-group">
            <label>Timeframe:</label>
            <select value={timeframe} onChange={(e) => setTimeframe(e.target.value)}>
              <option value="daily">Today</option>
              <option value="weekly">This Week</option>
              <option value="all-time">All Time</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Category:</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="profit">Total Profit</option>
              <option value="games">Games Played</option>
              <option value="winrate">Win Rate</option>
            </select>
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="leaderboard-table">
          <div className="table-header">
            <span>Rank</span>
            <span>Player</span>
            <span>Profit (MATIC)</span>
            <span>Games</span>
            <span>Favorite Game</span>
          </div>

          {currentData.map((player) => (
            <div 
              key={player.rank} 
              className={`table-row ${player.isUser ? 'user-row' : ''} ${player.rank <= 3 ? 'top-three' : ''}`}
            >
              <div className="rank-cell">
                {getRankIcon(player.rank)}
              </div>
              
              <div className="player-cell">
                <div className="player-address">
                  {player.address}
                  {player.isUser && <span className="you-badge">You</span>}
                </div>
              </div>
              
              <div className="profit-cell">
                <TrendingUp size={16} />
                <span className={parseFloat(player.profit) > 0 ? 'positive' : 'negative'}>
                  +{player.profit}
                </span>
              </div>
              
              <div className="games-cell">
                {player.games}
              </div>
              
              <div className="game-cell">
                <span className="game-badge">{player.favorite}</span>
              </div>
            </div>
          ))}
        </div>

        {/* User Position (if not in top 5) */}
        {!currentData.find(p => p.isUser) && account && (
          <div className="user-position">
            <h3>Your Position</h3>
            <div className="position-card">
              <div className="position-rank">
                <span className="rank">#247</span>
                <span className="label">Rank</span>
              </div>
              <div className="position-stats">
                <div className="stat">
                  <span className="value">+15.67 MATIC</span>
                  <span className="label">Total Profit</span>
                </div>
                <div className="stat">
                  <span className="value">47 Games</span>
                  <span className="label">Games Played</span>
                </div>
                <div className="stat">
                  <span className="value">59.6%</span>
                  <span className="label">Win Rate</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Prize Pool Information */}
        <div className="prize-pool-section">
          <h3>Weekly Prize Pool</h3>
          <div className="prize-cards">
            <div className="prize-card first">
              <Crown size={24} />
              <div className="prize-info">
                <span className="prize-amount">50 MATIC</span>
                <span className="prize-rank">1st Place</span>
              </div>
            </div>
            <div className="prize-card second">
              <Trophy size={24} />
              <div className="prize-info">
                <span className="prize-amount">25 MATIC</span>
                <span className="prize-rank">2nd Place</span>
              </div>
            </div>
            <div className="prize-card third">
              <Trophy size={24} />
              <div className="prize-info">
                <span className="prize-amount">10 MATIC</span>
                <span className="prize-rank">3rd Place</span>
              </div>
            </div>
            <div className="prize-card">
              <Star size={24} />
              <div className="prize-info">
                <span className="prize-amount">5 MATIC</span>
                <span className="prize-rank">4th-10th</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;