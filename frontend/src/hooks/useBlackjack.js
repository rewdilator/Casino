import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../contexts/Web3Context';

export const useBlackjack = () => {
  const { signer, account, contractAddresses } = useWeb3();
  const [currentGame, setCurrentGame] = useState(null);
  const [playerTotal, setPlayerTotal] = useState(0);
  const [dealerTotal, setDealerTotal] = useState(0);
  const [dealerRevealed, setDealerRevealed] = useState(false);
  const [gameState, setGameState] = useState('waiting');
  const [betAmount, setBetAmount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Simplified Blackjack ABI
  const BLACKJACK_ABI = [
    "function startGame() external payable",
    "function hit() external",
    "function stand() external",
    "function getGameState(address player) external view returns (uint256 betAmount, uint256 playerTotal, uint256 dealerTotal, bool dealerRevealed, uint8 state)",
    "event GameStarted(address indexed player, uint256 betAmount)",
    "event GameCompleted(address indexed player, bool playerWon, uint256 payout)",
    "event ActionTaken(address indexed player, string action)"
  ];

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

  const hit = async () => {
    if (!signer || !currentGame) throw new Error('No active game');

    setLoading(true);
    try {
      const blackjack = new ethers.Contract(contractAddresses.blackjack, BLACKJACK_ABI, signer);

      console.log('Taking HIT action');

      const tx = await blackjack.hit({ gasLimit: 300000 });
      await tx.wait();
      
      await loadGameState();

    } catch (error) {
      console.error('Error taking HIT action:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const stand = async () => {
    if (!signer || !currentGame) throw new Error('No active game');

    setLoading(true);
    try {
      const blackjack = new ethers.Contract(contractAddresses.blackjack, BLACKJACK_ABI, signer);

      console.log('Taking STAND action');

      const tx = await blackjack.stand({ gasLimit: 300000 });
      await tx.wait();
      
      await loadGameState();

    } catch (error) {
      console.error('Error taking STAND action:', error);
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

      // Convert state
      const states = ['waiting', 'active', 'completed'];
      setGameState(states[gameState.state] || 'unknown');

      // If game is completed, reset after a delay
      if (gameState.state === 2) {
        setTimeout(() => {
          setCurrentGame(null);
        }, 5000);
      }

    } catch (error) {
      console.error('Error loading blackjack game state:', error);
      // If no active game, reset state
      setCurrentGame(null);
      setGameState('waiting');
    }
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
    playerTotal,
    dealerTotal,
    dealerRevealed,
    gameState,
    betAmount,
    loading,
    startGame,
    hit,
    stand,
    loadGameState
  };
};