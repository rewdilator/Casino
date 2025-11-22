import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useWeb3 } from '../../contexts/Web3Context';
import { 
  Wallet, 
  User, 
  Trophy, 
  Home, 
  Dice5, 
  Heart,
  CircleDollarSign,
  Menu,
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const Header = () => {
  const { account, balance, isConnected, isConnecting, connectWallet } = useWeb3();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Casino', href: '/casino', icon: Dice5 },
    { name: 'Poker', href: '/poker', icon: Heart },
    { name: 'Blackjack', href: '/blackjack', icon: CircleDollarSign },
    { name: 'Slots', href: '/slots', icon: Dice5 },
    { name: 'Leaderboard', href: '/leaderboard', icon: Trophy },
  ];

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const getNetworkStatus = () => {
    if (!isConnected) return null;
    
    return (
      <div className="network-status connected">
        <CheckCircle size={12} />
        <span>Connected</span>
      </div>
    );
  };

  // Auto-close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  return (
    <header className="header">
      <div className="header-container">
        {/* Logo */}
        <Link to="/" className="logo">
          <div className="logo-icon">🎰</div>
          <div className="logo-text">
            <span className="logo-main">BETFIN</span>
            <span className="logo-sub">CASINO</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="desktop-nav">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`nav-link ${location.pathname === item.href ? 'active' : ''}`}
              >
                <Icon size={18} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Wallet Section */}
        <div className="wallet-section">
          {isConnected && account ? (
            <div className="wallet-connected">
              {getNetworkStatus()}
              <div className="balance-display">
                <Wallet size={16} />
                <span>{parseFloat(balance).toFixed(4)} MATIC</span>
              </div>
              <div className="profile-actions">
                <Link to="/profile" className="profile-btn" title="View Profile">
                  <User size={16} />
                </Link>
              </div>
            </div>
          ) : (
            <button 
              onClick={() => connectWallet(true)} 
              className="connect-wallet-btn"
              disabled={isConnecting}
            >
              {isConnecting ? (
                <>
                  <div className="loading-spinner-small"></div>
                  Connecting...
                </>
              ) : (
                <>
                  <Wallet size={18} />
                  <span>Connect Wallet</span>
                </>
              )}
            </button>
          )}

          {/* Mobile Menu Button */}
          <button 
            className="mobile-menu-btn"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="mobile-menu">
            <nav className="mobile-nav">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`mobile-nav-link ${location.pathname === item.href ? 'active' : ''}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Icon size={20} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
              
              {/* Mobile Wallet Info */}
              {isConnected && account && (
                <div className="mobile-wallet-info">
                  <div className="wallet-address-mobile">
                    <Wallet size={16} />
                    <span>{formatAddress(account)}</span>
                  </div>
                  <div className="balance-mobile">
                    Balance: {parseFloat(balance).toFixed(4)} MATIC
                  </div>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;