import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../contexts/Web3Context';

export const useBlackjack = () => {
  const { signer, account, contractAddresses } = useWeb3();
  const [currentGame, setCurrentGame] = useState(null);
  const [playerCards, setPlayerCards] = useState([]);
  const [dealerCards, setDealerCards] = useState([]);
  const [playerTotal, setPlayerTotal] = useState(0);
  const [dealerTotal, setDealerTotal] = useState(0);
  const [dealerRevealed, setDealerRevealed] = useState(false);
  const [gameState, setGameState] = useState('waiting');
  const [betAmount, setBetAmount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Blackjack ABI - Updated with new functions
  const BLACKJACK_ABI = [
    "function startGame() external payable",
    "function takeAction(uint8 action) external",
    "function getGameState(address player) external view returns (uint256 betAmount, uint256 playerTotal, uint256 dealerTotal, bool dealerRevealed, uint8 playerCardCount, uint8 dealerCardCount, uint8 state)",
    "function getCardDisplay(bytes32 card) external pure returns (string memory)",
    "function getPlayerCards(address player) external view returns (bytes32[] memory)",
    "function getDealerCards(address player) external view returns (bytes32[] memory)",
    "function calculateHandValue(bytes32[] memory cards) external pure returns (uint256)",
    "event GameStarted(address indexed player, uint256 betAmount, uint256 gameId)",
    "event CardDealt(address indexed player, bytes32 card, bool isPlayerCard)",
    "event GameCompleted(address indexed player, bool playerWon, uint256 payout, uint256 dealerTotal, uint256 playerTotal)",
    "event ActionTaken(address indexed player, uint8 action)"
  ];

  const suitSymbols = {
    'S': '♠',
    'H': '♥', 
    'D': '♦',
    'C': '♣'
  };

  const startGame = async (betAmount) => {
    if (!signer) throw new Error('Wallet not connected');

    setLoading(true);
    try {
      const blackjack = new ethers.Contract(contractAddresses.blackjack, BLACKJACK_ABI, signer);
      const betAmountWei = ethers.utils.parseEther(betAmount.toString());

      console.log('Starting blackjack game with bet:', betAmountWei.toString());

      const tx = await blackjack.startGame({ 
        value: betAmountWei,
        gasLimit: 400000 
      });

      console.log('Start game transaction sent:', tx.hash);
      const receipt = await tx.wait();
      console.log('Start game transaction confirmed:', receipt);

      setCurrentGame(account);
      setBetAmount(parseFloat(betAmount));
      await loadGameState();

      return receipt;
    } catch (error) {
      console.error('Error starting blackjack game:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const takeAction = async (action) => {
    if (!signer || !currentGame) throw new Error('No active game');

    setLoading(true);
    try {
      const blackjack = new ethers.Contract(contractAddresses.blackjack, BLACKJACK_ABI, signer);

      console.log('Taking blackjack action:', action);

      const tx = await blackjack.takeAction(action, { gasLimit: 300000 });
      await tx.wait();
      
      await loadGameState();

    } catch (error) {
      console.error('Error taking blackjack action:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loadGameState = async () => {
    if (!signer || !account) return;

    try {
      const blackjack = new ethers.Contract(contractAddresses.blackjack, BLACKJACK_ABI, signer);
      const gameState = await blackjack.getGameState(account);

      console.log('Blackjack game state:', gameState);

      setBetAmount(parseFloat(ethers.utils.formatEther(gameState.betAmount)));
      setPlayerTotal(gameState.playerTotal.toNumber());
      setDealerTotal(gameState.dealerRevealed ? gameState.dealerTotal.toNumber() : 0);
      setDealerRevealed(gameState.dealerRevealed);

      // Load actual cards from blockchain
      const playerCardData = await blackjack.getPlayerCards(account);
      const dealerCardData = await blackjack.getDealerCards(account);

      // Convert card data to display format
      const playerCardsFormatted = await Promise.all(
        playerCardData.map(async (card) => {
          if (card === '0x0000000000000000000000000000000000000000000000000000000000000000') {
            return '?';
          }
          const display = await blackjack.getCardDisplay(card);
          return formatCardDisplay(display);
        })
      );

      const dealerCardsFormatted = await Promise.all(
        dealerCardData.map(async (card, index) => {
          if (card === '0x0000000000000000000000000000000000000000000000000000000000000000') {
            return index === 1 && !gameState.dealerRevealed ? '?' : '?';
          }
          if (index === 1 && !gameState.dealerRevealed) {
            return '?';
          }
          const display = await blackjack.getCardDisplay(card);
          return formatCardDisplay(display);
        })
      );

      setPlayerCards(playerCardsFormatted);
      setDealerCards(dealerCardsFormatted);

      // Convert state
      const states = ['waiting', 'active', 'completed'];
      setGameState(states[gameState.state] || 'unknown');

      // If game is completed, reset after a delay
      if (gameState.state === 2) {
        setTimeout(() => {
          setCurrentGame(null);
          setPlayerCards([]);
          setDealerCards([]);
        }, 5000);
      }

    } catch (error) {
      console.error('Error loading blackjack game state:', error);
      // If no active game, reset state
      if (error.message.includes("No active game")) {
        setCurrentGame(null);
        setGameState('waiting');
      }
    }
  };

  const formatCardDisplay = (cardDisplay) => {
    if (cardDisplay === 'HIDDEN') return '?';
    
    // Convert "AS" to "A♠", "10H" to "10♥", etc.
    const value = cardDisplay.slice(0, -1);
    const suitAbbr = cardDisplay.slice(-1);
    const suitSymbol = suitSymbols[suitAbbr] || suitAbbr;
    
    return value + suitSymbol;
  };

  // Initialize
  useEffect(() => {
    if (signer && account) {
      loadGameState();
      
      // Poll for game state updates
      const interval = setInterval(() => {
        if (currentGame) {
          loadGameState();
        }
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [signer, account, currentGame]);

  return {
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
    takeAction,
    loadGameState
  };
};
