import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWeb3 } from '../contexts/Web3Context';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Zap, 
  Users, 
  Star,
  ArrowRight,
  Trophy,
  Coins,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const Home = () => {
  const { account, isConnected, isConnecting, connectWallet, lastWallet } = useWeb3();

  // Auto-reconnect if we have a saved wallet
  useEffect(() => {
    if (lastWallet && !isConnected && !isConnecting) {
      const timer = setTimeout(() => {
        connectWallet(false);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [lastWallet, isConnected, isConnecting, connectWallet]);

  const features = [
    {
      icon: Shield,
      title: 'Provably Fair',
      description: 'All games are transparent and verifiable on-chain'
    },
    {
      icon: Zap,
      title: 'Instant Payouts',
      description: 'Get your winnings instantly with Polygon'
    },
    {
      icon: Users,
      title: 'Live Multiplayer',
      description: 'Play against real players worldwide'
    },
    {
      icon: Star,
      title: 'Soulbound Rewards',
      description: 'Earn permanent achievements and reputation'
    }
  ];

  const games = [
    {
      name: 'Texas Hold\'em',
      description: 'Classic poker with real players',
      image: '♠️',
      path: '/poker',
      players: '2-8 Players',
      variant: 'purple'
    },
    {
      name: 'Blackjack',
      description: 'Beat the dealer to 21',
      image: '🃏',
      path: '/blackjack',
      players: '1-7 Players',
      variant: 'green'
    },
    {
      name: 'Slots',
      description: 'Spin to win big jackpots',
      image: '🎰',
      path: '/slots',
      players: 'Single Player',
      variant: 'blue'
    }
  ];

  const ConnectionStatus = () => {
    if (isConnecting) {
      return (
        <div className="connection-status connecting">
          <div className="loading-spinner"></div>
          <span>Reconnecting to your wallet...</span>
        </div>
      );
    }

    if (lastWallet && !isConnected) {
      return (
        <div className="connection-status disconnected">
          <AlertCircle size={20} />
          <span>Wallet disconnected. </span>
          <button 
            onClick={() => connectWallet(true)} 
            className="reconnect-btn"
          >
            Reconnect
          </button>
        </div>
      );
    }

    if (isConnected) {
      return (
        <div className="connection-status connected">
          <CheckCircle size={20} />
          <span>Wallet connected! Ready to play.</span>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="home-page">
      {/* Connection Status Banner */}
      <ConnectionStatus />

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="hero-text"
          >
            <h1 className="hero-title">
              The Ultimate
              <span className="gradient-text"> Web3 Casino</span>
              Experience
            </h1>
            <p className="hero-description">
              Play provably fair casino games on Polygon. Enjoy instant payouts, 
              true ownership of assets, and verifiable game integrity.
              {lastWallet && !isConnected && (
                <span className="reconnect-hint">
                  <br />Your previous wallet will auto-reconnect...
                </span>
              )}
            </p>
            <div className="hero-actions">
              {isConnected ? (
                <Link to="/casino" className="btn-primary">
                  Enter Casino <ArrowRight size={20} />
                </Link>
              ) : (
                <button 
                  className="btn-primary" 
                  onClick={() => connectWallet(true)}
                  disabled={isConnecting}
                >
                  {isConnecting ? (
                    <>
                      <div className="loading-spinner-small"></div>
                      Connecting...
                    </>
                  ) : (
                    'Connect to Play'
                  )}
                </button>
              )}
              <Link to="/leaderboard" className="btn-secondary">
                <Trophy size={20} />
                View Leaderboard
              </Link>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="hero-visual"
          >
            <div className="floating-cards">
              <div className="card card-1">♠️</div>
              <div className="card card-2">♥️</div>
              <div className="card card-3">♦️</div>
              <div className="card card-4">♣️</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Rest of the home page content remains the same */}
      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <h2>Why Choose Betfin?</h2>
            <p>Experience the future of online gaming with blockchain technology</p>
          </div>
          <div className="features-grid">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="feature-card"
              >
                <div className="feature-icon">
                  <feature.icon size={32} />
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="games-section">
        <div className="container">
          <div className="section-header">
            <h2>Featured Games</h2>
            <p>Choose from our selection of provably fair games</p>
          </div>
          <div className="games-grid">
            {games.map((game, index) => (
              <motion.div
                key={game.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`game-card ${game.variant}`}
              >
                <div className="game-image">
                  <span>{game.image}</span>
                </div>
                <div className="game-content">
                  <h3>{game.name}</h3>
                  <p>{game.description}</p>
                  <div className="game-meta">
                    <Users size={16} />
                    <span>{game.players}</span>
                  </div>
                  <Link to={game.path} className="game-play-btn">
                    Play Now <ArrowRight size={16} />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-item">
              <Coins size={32} />
              <div className="stat-content">
                <span className="stat-number">$2.4M+</span>
                <span className="stat-label">Total Winnings</span>
              </div>
            </div>
            <div className="stat-item">
              <Users size={32} />
              <div className="stat-content">
                <span className="stat-number">15K+</span>
                <span className="stat-label">Active Players</span>
              </div>
            </div>
            <div className="stat-item">
              <Zap size={32} />
              <div className="stat-content">
                <span className="stat-number">&lt;2s</span>
                <span className="stat-label">Avg. Payout Time</span>
              </div>
            </div>
            <div className="stat-item">
              <Shield size={32} />
              <div className="stat-content">
                <span className="stat-number">100%</span>
                <span className="stat-label">Provably Fair</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;