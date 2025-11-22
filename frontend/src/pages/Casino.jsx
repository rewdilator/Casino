import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useWeb3 } from '../contexts/Web3Context';
import { 
  Users, 
  Clock, 
  TrendingUp, 
  Search,
  Filter,
  Crown
} from 'lucide-react';

const Casino = () => {
  const { account } = useWeb3();
  const [activeCategory, setActiveCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'All Games' },
    { id: 'poker', name: 'Poker' },
    { id: 'blackjack', name: 'Blackjack' },
    { id: 'slots', name: 'Slots' },
    { id: 'live', name: 'Live Games' }
  ];

  const activeGames = [
    {
      id: 1,
      name: 'Texas Hold\'em High Stakes',
      type: 'poker',
      players: 6,
      maxPlayers: 8,
      buyIn: '0.1',
      pot: '0.6',
      speed: 'Normal',
      variant: 'featured'
    },
    {
      id: 2,
      name: 'Blackjack Classic',
      type: 'blackjack',
      players: 3,
      maxPlayers: 7,
      buyIn: '0.05',
      pot: '0.15',
      speed: 'Fast',
      variant: 'normal'
    },
    {
      id: 3,
      name: 'Mega Fortune Slots',
      type: 'slots',
      players: 1,
      maxPlayers: 1,
      buyIn: '0.01',
      pot: '2.5',
      speed: 'Instant',
      variant: 'jackpot'
    },
    {
      id: 4,
      name: 'Texas Hold\'em Turbo',
      type: 'poker',
      players: 4,
      maxPlayers: 6,
      buyIn: '0.02',
      pot: '0.08',
      speed: 'Turbo',
      variant: 'normal'
    }
  ];

  const filteredGames = activeCategory === 'all' 
    ? activeGames 
    : activeGames.filter(game => game.type === activeCategory);

  if (!account) {
    return (
      <div className="casino-page">
        <div className="container">
          <div className="connect-prompt">
            <h2>Connect Your Wallet</h2>
            <p>Please connect your wallet to access the casino games</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="casino-page">
      <div className="container">
        {/* Header */}
        <div className="casino-header">
          <div className="casino-title">
            <h1>Casino Lobby</h1>
            <p>Join active games or start your own</p>
          </div>
          <div className="casino-actions">
            <div className="search-box">
              <Search size={20} />
              <input type="text" placeholder="Search games..." />
            </div>
            <button className="filter-btn">
              <Filter size={20} />
              Filters
            </button>
          </div>
        </div>

        {/* Categories */}
        <div className="categories-section">
          <div className="categories">
            {categories.map(category => (
              <button
                key={category.id}
                className={`category-btn ${activeCategory === category.id ? 'active' : ''}`}
                onClick={() => setActiveCategory(category.id)}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="quick-stats">
          <div className="stat-card">
            <Users size={24} />
            <div>
              <span className="stat-number">1,247</span>
              <span className="stat-label">Online Players</span>
            </div>
          </div>
          <div className="stat-card">
            <Clock size={24} />
            <div>
              <span className="stat-number">84</span>
              <span className="stat-label">Active Games</span>
            </div>
          </div>
          <div className="stat-card">
            <TrendingUp size={24} />
            <div>
              <span className="stat-number">12.5K</span>
              <span className="stat-label">MATIC in Play</span>
            </div>
          </div>
        </div>

        {/* Games Grid */}
        <div className="games-lobby">
          <div className="games-header">
            <h2>Active Games</h2>
            <span className="games-count">{filteredGames.length} games available</span>
          </div>
          
          <div className="games-grid">
            {filteredGames.map(game => (
              <div key={game.id} className={`game-lobby-card ${game.variant}`}>
                {game.variant === 'featured' && (
                  <div className="game-badge">
                    <Crown size={16} />
                    Featured
                  </div>
                )}
                {game.variant === 'jackpot' && (
                  <div className="game-badge jackpot">
                    💎 Jackpot
                  </div>
                )}
                
                <div className="game-header">
                  <h3>{game.name}</h3>
                  <span className="game-type">{game.type}</span>
                </div>

                <div className="game-stats">
                  <div className="stat">
                    <Users size={16} />
                    <span>{game.players}/{game.maxPlayers} Players</span>
                  </div>
                  <div className="stat">
                    <Clock size={16} />
                    <span>{game.speed}</span>
                  </div>
                </div>

                <div className="game-pots">
                  <div className="pot-info">
                    <span className="pot-label">Buy-in</span>
                    <span className="pot-amount">{game.buyIn} MATIC</span>
                  </div>
                  <div className="pot-info">
                    <span className="pot-label">Current Pot</span>
                    <span className="pot-amount highlight">{game.pot} MATIC</span>
                  </div>
                </div>

                <div className="game-actions">
                  <button className="join-btn">
                    Join Game
                  </button>
                  <button className="watch-btn">
                    Watch
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Start */}
          <div className="quick-start-section">
            <h3>Can't find a game? Start your own!</h3>
            <div className="quick-start-options">
              <Link to="/poker" className="quick-start-btn primary">
                🎯 Start Poker Game
              </Link>
              <Link to="/blackjack" className="quick-start-btn">
                🃏 Play Blackjack
              </Link>
              <Link to="/slots" className="quick-start-btn">
                🎰 Spin Slots
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Casino;