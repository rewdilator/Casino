import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <div className="logo">
            <div className="logo-icon">🎰</div>
            <div className="logo-text">
              <span className="logo-main">BETFIN</span>
              <span className="logo-sub">CASINO</span>
            </div>
          </div>
          <p>
            The premier Web3 casino experience on Polygon. 
            Provably fair games, instant payouts, and true digital ownership.
          </p>
        </div>
        
        <div className="footer-section">
          <h3>Games</h3>
          <ul className="footer-links">
            <li><Link to="/poker">Texas Hold'em</Link></li>
            <li><Link to="/blackjack">Blackjack</Link></li>
            <li><Link to="/slots">Slots</Link></li>
            <li><Link to="/casino">All Games</Link></li>
          </ul>
        </div>
        
        <div className="footer-section">
          <h3>Company</h3>
          <ul className="footer-links">
            <li><Link to="/about">About</Link></li>
            <li><Link to="/security">Security</Link></li>
            <li><Link to="/fairness">Provable Fairness</Link></li>
            <li><Link to="/contact">Contact</Link></li>
          </ul>
        </div>
        
        <div className="footer-section">
          <h3>Support</h3>
          <ul className="footer-links">
            <li><Link to="/help">Help Center</Link></li>
            <li><Link to="/faq">FAQ</Link></li>
            <li><Link to="/terms">Terms of Service</Link></li>
            <li><Link to="/privacy">Privacy Policy</Link></li>
          </ul>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>&copy; 2024 Betfin Casino. All rights reserved. Built on Polygon.</p>
      </div>
    </footer>
  );
};

// Add default export
export default Footer;