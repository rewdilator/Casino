import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Web3Provider from './contexts/Web3Context';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import Home from './pages/Home';
import Casino from './pages/Casino';
import Poker from './pages/Poker';
import Blackjack from './pages/Blackjack';
import Slots from './pages/Slots';
import Profile from './pages/Profile';
import Leaderboard from './pages/Leaderboard';
import './App.css';

function App() {
  return (
    <Web3Provider>
      <Router>
        <div className="app">
          <Header />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/casino" element={<Casino />} />
              <Route path="/poker" element={<Poker />} />
              <Route path="/blackjack" element={<Blackjack />} />
              <Route path="/slots" element={<Slots />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </Web3Provider>
  );
}

export default App;